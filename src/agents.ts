import { createAgentHalo } from './agentIdentity'
import { AGENT_CLIPS } from './shared/visualRules'
import { isCinematicLocked } from './cinematicLock'
import { requestTutorialExplanation, isIntroActive } from './tutorial'
import { registerIntroAsset } from './tutorial'
import { setVillageGuideOpen } from './villageGuide'
import { Animator, ColliderLayer, engine, Entity, GltfContainer, InputAction, MeshCollider, pointerEventsSystem, Transform } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'

import { AGENT_CONFIG } from './shared/agents'
export { AGENT_CONFIG } from './shared/agents'

let cinematicGreeting: ((toward: Vector3)=>void) | undefined
let guideEntity: Entity | undefined
export function getGuideEntity() { return guideEntity }
export function greetVillageGuide(toward:Vector3) { cinematicGreeting?.(toward) }
let initialized = false
export function setupPandoraAgents() {
  if (initialized) return
  initialized = true
  let guide: Entity | undefined
  let greetRemaining = 0
  let freeTime = 12 + Math.random()*12
  AGENT_CONFIG.filter(config => config.name === 'Sentinel_Core').forEach(config => {
    const entity = engine.addEntity()
    Transform.create(entity, { position: Vector3.create(config.x, 2.9, config.z), scale: Vector3.create(config.scale, config.scale, config.scale) })
    GltfContainer.create(entity, { src: 'assets/scene/modelos/Agentes/' + config.name + '_anim.glb', visibleMeshesCollisionMask: 0, invisibleMeshesCollisionMask: 0 })
    Animator.create(entity, { states: AGENT_CLIPS.map(clip => ({ clip, playing: clip === 'Idle', loop: clip === 'Idle', shouldReset: false, speed: 1, weight: 1 })) })
    if (config.name === 'Sentinel_Core') {
      guide = entity
      guideEntity = entity
      createAgentHalo(entity,true)
      cinematicGreeting = toward => {
        Transform.getMutable(entity).rotation = Quaternion.fromEulerDegrees(0,Math.atan2(toward.x-config.x,toward.z-config.z)*180/Math.PI,0)
        for(const state of Animator.getMutable(entity).states){state.playing=state.clip==='Greet';state.shouldReset=state.clip==='Greet'}
        greetRemaining=1.5
      }
      registerIntroAsset(entity)
      Transform.getMutable(entity).position.y = 4.7
      MeshCollider.setBox(entity, ColliderLayer.CL_POINTER | ColliderLayer.CL_PHYSICS)
      pointerEventsSystem.onPointerDown({ entity, opts: { button: InputAction.IA_POINTER, hoverText: 'Talk to Pandora', maxDistance: 8, maxPlayerDistance: 4 } }, () => {
        if (isIntroActive() || isCinematicLocked()) return
        if(!requestTutorialExplanation())setVillageGuideOpen(true)
        if (greetRemaining > 0 && Animator.getMutable(entity).states.some(state=>state.clip==='Greet'&&state.playing)) return
        const player = Transform.getOrNull(engine.PlayerEntity)?.position
        if (player) Transform.getMutable(entity).rotation = Quaternion.fromEulerDegrees(0, Math.atan2(player.x - config.x, player.z - config.z) * 180 / Math.PI, 0)
        const states = Animator.getMutable(entity).states
        for (const state of states) { state.playing = state.clip === 'Greet'; state.shouldReset = state.clip === 'Greet' }
        greetRemaining = 1.5
      })
    }
  })
  engine.addSystem(dt => {
    const seconds = Math.max(0, Math.min(dt, 0.1))
    if (guide !== undefined && greetRemaining <= 0 && !isIntroActive() && !isCinematicLocked()) {
      freeTime -= seconds
      if (freeTime <= 0) {
        const doze=Math.random()<0.08, clip=doze?'Doze':'Look'
        for(const state of Animator.getMutable(guide).states){state.playing=state.clip===clip;state.shouldReset=state.clip===clip}
        greetRemaining=doze?3:2.4;freeTime=15+Math.random()*15
      }
    }
    if (guide !== undefined && greetRemaining > 0) {
      greetRemaining -= seconds
      if (greetRemaining <= 0) for (const state of Animator.getMutable(guide).states) { state.playing = state.clip === 'Idle'; state.shouldReset = false }
    }
  }, undefined, 'pandora-village-guide')
}
