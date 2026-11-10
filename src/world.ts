import { setupCentralTree } from './treeCinematic'
import { registerIntroAsset } from './tutorial'
import { setupPandoraAgents } from './agents'
import { registerWoodNode, registerStoneNode } from './equipment'
import { setupTestEnemy } from './testEnemy'
import { Animator, ColliderLayer, engine, Entity, GltfContainer, GltfContainerLoadingState, LoadingState, InputAction, pointerEventsSystem, Transform } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { deliverAll, gather, isResourceAvailable } from './gameState'
import { OFF_MODEL_LIFT } from './shared/resourceLift'
import { WORLD_BASE, WORLD_GRASS, WORLD_WATER, WORLD_RESOURCES, WorldResource } from './shared/worldLayout'
import { DELIVERY_POINTS } from './shared/tutorial'
import { setupAmbientLife } from './ambientLife'

// Chopped trees that leave a fallen log are raised so the log rests on the slope instead of sinking into it.
function resourcePosition(definition: WorldResource, available: boolean) {
  const lift = available ? 0 : OFF_MODEL_LIFT[definition.id] ?? 0
  return Vector3.create(definition.position.x, definition.position.y + lift, definition.position.z)
}

export function setupPandoraWorld() {
  setupPandoraAgents()
  setupTestEnemy()
  const scenePosition = Vector3.create(81.55, 1.3, 79.94)
  const sceneScale = Vector3.create(0.94, 0.94, 0.94)
  // Grass is decoration only: no collider, so it never blocks walking or clicks.
  for (const [src, mask] of [[WORLD_BASE, ColliderLayer.CL_PHYSICS], [WORLD_WATER, 0], ...(WORLD_GRASS ? [[WORLD_GRASS, 0] as const] : [])] as const) {
    const entity = engine.addEntity()
    Transform.create(entity, { position: scenePosition, scale: sceneScale })
    if (src === WORLD_BASE) registerIntroAsset(entity)
    GltfContainer.create(entity, { src, visibleMeshesCollisionMask: mask, invisibleMeshesCollisionMask: 0 })
    // The grass sways in a gust that travels across the meadow (shape keys driven by its 'Wind' clip).
    if (src === WORLD_GRASS) Animator.create(entity, { states: [{ clip: 'Wind', playing: true, loop: true }] })

  }
  const centralTree = setupCentralTree()
  registerIntroAsset(centralTree)
  const altars = DELIVERY_POINTS.map(point=>{
    const altar=engine.addEntity()
    Transform.create(altar,{position:Vector3.create(point.x,point.y,point.z)})
    // Pointer events sit on the altar model itself so the Explorer outlines it on hover, like every clickable.
    GltfContainer.create(altar,{src:'assets/scene/modelos/entrega/Delivery_Altar.glb',visibleMeshesCollisionMask:ColliderLayer.CL_POINTER,invisibleMeshesCollisionMask:ColliderLayer.CL_PHYSICS})
    registerIntroAsset(altar)
    pointerEventsSystem.onPointerDown({entity:altar,opts:{button:InputAction.IA_POINTER,hoverText:'Deliver resources to Novaterra',maxDistance:12,maxPlayerDistance:8}},deliverAll)
    return altar
  })
  setupAmbientLife(altars)

  const nodes = WORLD_RESOURCES.map(definition => {
    const entity = engine.addEntity()
    Transform.create(entity, { position: definition.position, scale: sceneScale })
    if (definition.kind === 'wood') registerWoodNode(definition.id, definition.position.x, definition.position.z, definition.position.y)
    if (definition.kind === 'stone') registerStoneNode(definition.id, definition.position.x, definition.position.z, definition.position.y)
    return { definition, entity, pending: undefined as { entity: Entity; available: boolean } | undefined, available: null as boolean | null }
  })
  // A standing resource is clicked on its own model, so the Explorer outlines it on hover; a used-up one is not clickable.
  const hoverText = (definition: WorldResource) => (definition.kind === 'wood' ? 'Chop wood' : definition.kind === 'stone' ? 'Mine stone' : 'Gather fruit') + ' · ' + definition.hitsRequired + ' hits'
  const showResource = (node: typeof nodes[number], entity: Entity, available: boolean) => {
    const definition = node.definition
    GltfContainer.createOrReplace(entity,{src:available?definition.on:definition.off,visibleMeshesCollisionMask:ColliderLayer.CL_PHYSICS|(available?ColliderLayer.CL_POINTER:0),invisibleMeshesCollisionMask:0})
    if (!available) return
    pointerEventsSystem.onPointerDown({ entity, opts: { button: InputAction.IA_POINTER, hoverText: hoverText(definition), maxDistance: 20, maxPlayerDistance: 8 } }, () => { if (isResourceAvailable(definition.id)) gather(definition.kind, definition.id) })
  }
  engine.addSystem(() => {
    for (const node of nodes) {
      const available = isResourceAvailable(node.definition.id)
      if(node.available===null){
        showResource(node,node.entity,available)
        Transform.getMutable(node.entity).position=resourcePosition(node.definition,available)
        node.available=available
      }
      if(node.pending&&node.pending.available!==available){engine.removeEntity(node.pending.entity);node.pending=undefined}
      if(available!==node.available&&!node.pending){
        const replacement=engine.addEntity()
        Transform.create(replacement,{position:resourcePosition(node.definition,available),scale:Vector3.Zero()})
        showResource(node,replacement,available)
        node.pending={entity:replacement,available}
      }
      if(node.pending&&GltfContainerLoadingState.getOrNull(node.pending.entity)?.currentState===LoadingState.FINISHED){
        Transform.getMutable(node.pending.entity).scale={...sceneScale}
        engine.removeEntity(node.entity)
        node.entity=node.pending.entity;node.available=node.pending.available;node.pending=undefined
      }
    }
  }, undefined, 'pandora-resource-states')
  // The tutorial objective is not highlighted in the world; the objective camera shows the player which one it is.

}
