import { AvatarAttach, AvatarAnchorPointType, engine, Entity, GltfContainer, Transform, VisibilityComponent } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'
import { room } from './shared/pandoraMessages'

type Tool = 'axe' | 'sword' | 'pickaxe'
const tools: Partial<Record<Tool, Entity>> = {}
let initialized = false
let hideAt = 0
let equippedTool: Tool | null = null
// While a tutorial tool is still in the air, the newly equipped copy must not already be in the hand.
let presentationHidden = false

const TOOL_SRC: Record<Tool, string> = { axe: 'assets/scene/modelos/Axe.glb', sword: 'assets/scene/modelos/Sword.glb', pickaxe: 'assets/scene/modelos/Pickaxe.glb' }
const HAND_POSITION = Vector3.create(0.023, 0.0848, -0.0084), HAND_ROTATION = Quaternion.create(0.446, -0.5522, -0.4426, 0.548)
// Other explorers' tools: one model per avatar, attached to that avatar's right hand like our own.
const others = new Map<string, Entity>()
function showOtherTool(address: string, tool: string) {
  let model = others.get(address)
  if (!model) {
    const hand = engine.addEntity()
    Transform.create(hand)
    AvatarAttach.create(hand, { avatarId: address, anchorPointId: AvatarAnchorPointType.AAPT_RIGHT_HAND })
    model = engine.addEntity()
    Transform.create(model, { parent: hand, position: HAND_POSITION, rotation: HAND_ROTATION })
    VisibilityComponent.create(model, { visible: false })
    others.set(address, model)
  }
  const src = TOOL_SRC[tool as Tool]
  if (src) GltfContainer.createOrReplace(model, { src, visibleMeshesCollisionMask: 0, invisibleMeshesCollisionMask: 0 })
  VisibilityComponent.createOrReplace(model, { visible: !!src })
}
export function setupAvatarTools() {
  if (initialized) return
  initialized = true
  room.onMessage('playerTool', data => showOtherTool(data.address, data.tool))
  const hand = engine.addEntity()
  Transform.create(hand)
  AvatarAttach.create(hand, { anchorPointId: AvatarAnchorPointType.AAPT_RIGHT_HAND })
  const configs = [
    { kind: 'axe' as const, src: 'assets/scene/modelos/Axe.glb' },
    { kind: 'sword' as const, src: 'assets/scene/modelos/Sword.glb' },
    { kind: 'pickaxe' as const, src: 'assets/scene/modelos/Pickaxe.glb' }
  ]
  for (const config of configs) {
    const model = engine.addEntity()
    Transform.create(model, { parent: hand, position: Vector3.create(0.023, 0.0848, -0.0084), rotation: Quaternion.create(0.446, -0.5522, -0.4426, 0.548) })
    GltfContainer.create(model, { src: config.src, visibleMeshesCollisionMask: 0, invisibleMeshesCollisionMask: 0 })
    VisibilityComponent.create(model, { visible: false })
    tools[config.kind] = model
  }
  engine.addSystem(() => { if (hideAt && Date.now() >= hideAt) hideAvatarTools() }, undefined, 'pandora-avatar-tools')
}

export function hideAvatarTools() {
  hideAt = 0
  for (const model of Object.values(tools)) if (model !== undefined) VisibilityComponent.createOrReplace(model, { visible: !presentationHidden && tools[equippedTool as Tool] === model })
}

export function showAvatarTool(tool: Tool | null, milliseconds: number) {
  setupAvatarTools()
  hideAvatarTools()
  if (equippedTool || !tool) return
  const model = tools[tool]
  if (model === undefined) return
  VisibilityComponent.createOrReplace(model, { visible: true })
  hideAt = Date.now() + milliseconds
}

export function getEquippedAvatarTool() { return equippedTool }

export function isAvatarToolPresentationHidden() { return presentationHidden }

export function setAvatarToolPresentationHidden(hidden: boolean) {
  setupAvatarTools()
  presentationHidden = hidden
  hideAvatarTools()
}

export function equipAvatarTool(tool: Tool | null) {
  setupAvatarTools()
  if (equippedTool !== tool) void room.send('toolEquipped', { tool: tool ?? '' }).catch(error => console.error('[Pandora] Tool sync:', error))
  equippedTool = tool
  hideAvatarTools()
}
