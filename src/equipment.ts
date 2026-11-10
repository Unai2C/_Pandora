import { playerAttackRange } from './shared/testEnemy'
import { isCinematicLocked } from './cinematicLock'
import { getTutorialStage, isIntroActive } from './tutorial'
import { toolUnlocked } from './shared/tutorial'
import { TOOL_RULES } from './shared/tools'
import { equipAvatarTool } from './avatarTools'
import { engine, InputAction, inputSystem, PointerEventType, Transform } from '@dcl/sdk/ecs'
import { attackEnemy, gather, showLocalMessage, getEnemies, isResourceAvailable } from './gameState'
import { playGatherAnimation } from './punchAnimation'
export type EquippedTool = 'sword' | 'axe' | 'pickaxe'
let equipped: EquippedTool | null = null
let nextUse = 0
const woodNodes: { id: string; x: number; z: number; y?: number }[] = []
const stoneNodes: { id: string; x: number; z: number; y?: number }[] = []
export function getEquippedTool() { return equipped }
export function getResourceNode(id: string) { return woodNodes.concat(stoneNodes).find(n => n.id === id) }
export function equipTool(tool: EquippedTool) { if (isIntroActive() || !toolUnlocked(getTutorialStage(), tool)) { showLocalMessage('Complete the tutorial objective to unlock this tool.'); return } equipped = tool; equipAvatarTool(tool); showLocalMessage(tool === 'sword' ? 'Sword equipped · E to attack' : tool === 'axe' ? 'Axe equipped · E to chop wood' : 'Pickaxe equipped · E to mine stone') }
export function registerWoodNode(id: string, x: number, z: number, y = 1.9) { if (!woodNodes.some(n => n.id === id)) woodNodes.push({ id, x, z, y }) }
export function registerStoneNode(id: string, x: number, z: number, y = 1.9) { if (!stoneNodes.some(n => n.id === id)) stoneNodes.push({ id, x, z, y }) }
export function useEquippedTool() {
  if (!equipped || isCinematicLocked() || isIntroActive() || Date.now() < nextUse) return
  nextUse = Date.now() + TOOL_RULES[equipped].cooldown
  const position = Transform.getOrNull(engine.PlayerEntity)?.position
  const enemy = position ? getEnemies().find(e => e.health > 0 && !e.respawnAt && Math.hypot(position.x - e.position.x, position.z - e.position.z) <= playerAttackRange(e.id)) : undefined
  if (equipped === 'sword' || enemy) { attackEnemy(enemy?.id); return }
  const kind = equipped === 'axe' ? 'wood' : 'stone'
  const nearby = position ? (kind === 'wood' ? woodNodes : stoneNodes).filter(n => isResourceAvailable(n.id) && Math.hypot(position.x - n.x, position.z - n.z) <= 3.5 && Math.abs(position.y - (n.y ?? 1.9)) <= 5).sort((a, b) => Math.hypot(position.x - a.x, position.z - a.z) - Math.hypot(position.x - b.x, position.z - b.z))[0] : undefined
  if (nearby) gather(kind, nearby.id)
  else { playGatherAnimation(kind); showLocalMessage(kind === 'wood' ? 'Move closer to a wood resource to chop it.' : 'Move closer to a stone resource to mine it.') }
}
export function setupEquipmentControls() {
  let lastStage = -2
  const refresh = () => {
   const stage = getTutorialStage()
   if (stage === lastStage) return
   lastStage = stage
   if (stage < 2) { equipped = null; equipAvatarTool(null) }
   else equipTool(stage >= 4 ? 'sword' : stage >= 3 ? 'pickaxe' : 'axe')
  }
  refresh()
  engine.addSystem(() => {
    refresh()
    if (isIntroActive() || isCinematicLocked()) return
    const tools = ['sword', 'axe', 'pickaxe'] as const
    const keys = [InputAction.IA_ACTION_3, InputAction.IA_ACTION_4, InputAction.IA_ACTION_5]
    keys.forEach((key, index) => { if (inputSystem.isTriggered(key, PointerEventType.PET_DOWN)) equipTool(tools[index]) })
    if (inputSystem.isTriggered(InputAction.IA_PRIMARY, PointerEventType.PET_DOWN)) useEquippedTool() }, undefined, 'pandora-equipment-controls')
}
