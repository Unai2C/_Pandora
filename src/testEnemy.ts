import { createAgentHalo, setAgentHaloStrength } from './agentIdentity'
import { playActionSound } from './audio'
import { AGENT_CLIPS, canInterruptAgentClip, agentPersonality } from './shared/visualRules'
import { Billboard, BillboardMode, Animator, ColliderLayer, engine, Entity, GltfContainer, InputAction, Material, MeshCollider, MeshRenderer, pointerEventsSystem, TextShape, Transform, VisibilityComponent } from '@dcl/sdk/ecs'
import { Color4, Quaternion, Vector3 } from '@dcl/sdk/math'
import { attackEnemy, getEnemies, getPlayer } from './gameState'
import { agentDanger } from './shared/agentLevels'

const models = new Map<string, Entity>()
export function getAgentModel(id: string) { return models.get(id) }
const DANGER_COLORS = { weaker: Color4.create(.55, 1, .6, 1), even: Color4.create(1, .9, .45, 1), dangerous: Color4.create(1, .3, .25, 1) }
import { SENTINELS, playerAttackRange } from './shared/testEnemy'

export function setupTestEnemy() {
 for (const config of SENTINELS) {
  const personality=agentPersonality(config.id)
  let idleStart=personality.idleDelay,time=personality.seed%100/10
  const model = engine.addEntity()
  Transform.create(model, { position: { ...config.route[0] }, scale: Vector3.create(config.scale, config.scale, config.scale) })
  // The model itself takes the pointer so the Explorer outlines the agent on hover; the box below only blocks movement.
  GltfContainer.create(model, { src: 'assets/scene/modelos/Agentes/' + config.id + '_anim.glb', visibleMeshesCollisionMask: ColliderLayer.CL_POINTER, invisibleMeshesCollisionMask: 0 })
  VisibilityComponent.create(model, { visible: true })
  models.set(config.id, model)
  Animator.create(model, { states: AGENT_CLIPS.map(clip => ({ clip, playing: false, loop: clip === 'Idle', shouldReset: false, speed: clip==='Idle'?personality.idleSpeed:1, weight: 1 })) })
  const corruption=createAgentHalo(model,false)
  const target = engine.addEntity()
  Transform.create(target, { position: { ...config.route[0] }, scale: Vector3.create(config.bodyWidth,config.bodyWidth,config.bodyWidth) })
  MeshCollider.setBox(target, ColliderLayer.CL_PHYSICS)
  pointerEventsSystem.onPointerDown({ entity: model, opts: { button: InputAction.IA_POINTER, hoverText: 'Attack ' + config.name + (config.combatStyle === 'ranged' ? ' · RANGED' : ' · MELEE'), maxDistance: 20, maxPlayerDistance: Math.hypot(playerAttackRange(config.id), 4) } }, () => { if (getEnemies().find(e => e.id === config.id)?.health) attackEnemy(config.id) })
  const bar = engine.addEntity()
  Transform.create(bar, { position: { ...config.route[0] }, scale: Vector3.Zero() })
  MeshRenderer.setBox(bar)
  Billboard.create(bar, { billboardMode: BillboardMode.BM_ALL })
  Material.setPbrMaterial(bar, { albedoColor: Color4.create(0.85, 0.15, 0.2, 1), emissiveColor: { r: .85, g: .15, b: .2 }, emissiveIntensity: 1 })
  // Level tag: green below the player's level, gold at the same level, red above it (dangerous).
  const levelTag = engine.addEntity()
  // Created at its real size and hidden with visibility: a text first laid out at scale 0 is not redrawn by the desktop
  // Explorer when it grows, so the tag stayed invisible there.
  Transform.create(levelTag, { position: { ...config.route[0] }, scale: Vector3.create(.6, .6, .6) })
  VisibilityComponent.create(levelTag, { visible: false })
  TextShape.create(levelTag, { text: 'LV 1 · ' + config.name, fontSize: 5, textColor: DANGER_COLORS.even, outlineColor: { r: 0, g: 0, b: 0 }, outlineWidth: .25 })
  Billboard.create(levelTag, { billboardMode: BillboardMode.BM_ALL })
  // Brief energy beam reaches the aimed point when the authored muzzle flash fires at 0.4s.
  // Only ranged agents fire it, so melee agents never load the effect (its geometry counts even while hidden).
  let shot: Entity | undefined
  if (config.combatStyle === 'ranged') {
   shot = engine.addEntity()
   Transform.create(shot, { position: { ...config.route[0] }, scale: Vector3.Zero() })
   GltfContainer.create(shot,{src:'assets/scene/modelos/fx/Heal_Rings.glb',visibleMeshesCollisionMask:0,invisibleMeshesCollisionMask:0})
   Animator.create(shot,{states:[{clip:'Pulse',playing:false,loop:false}]})
  }
  let pendingShot: { time: number; x: number; z: number } | null = null
  let shotRemaining = 0
  let alive = true, clip = 'Idle', remaining = 0, lastAttack = 0
  let lastHealth: number | undefined, lastMode = 'patrol', stillTime = 0, personalityCooldown = 5 + Math.random()*10
  const play = (next: string, duration = 0) => {
   if (!canInterruptAgentClip(clip,next,remaining)) return
   for (const state of Animator.getMutable(model).states) { state.playing = state.clip === next; state.shouldReset = next !== 'Disappear' && state.clip === next }
   for(const state of Animator.getMutable(model).states)state.speed=state.clip==='Idle'?personality.idleSpeed:1
   idleStart=0;clip = next; remaining = duration
  }
  engine.addSystem(dt => {
   const enemy = getEnemies().find(e => e.id === config.id)
   if (!enemy) {if(VisibilityComponent.get(levelTag).visible)VisibilityComponent.getMutable(levelTag).visible=false;Transform.getMutable(model).scale=Vector3.Zero();Transform.getMutable(target).scale=Vector3.Zero();Transform.getMutable(bar).scale=Vector3.Zero();if(shot!==undefined)Transform.getMutable(shot).scale=Vector3.Zero();pendingShot=null;shotRemaining=0;return}
   Transform.getMutable(model).scale=Vector3.create(config.scale,config.scale,config.scale)
   const seconds = Math.max(0, dt), transform = Transform.getMutable(model)
   time+=seconds
   if(idleStart>0){idleStart-=seconds;if(idleStart<=0&&clip==='Idle')play('Idle')}
   // The lift stays on through hits, attacks and the appear clip; it only goes with the body once it has vanished.
   setAgentHaloStrength(corruption,VisibilityComponent.get(model).visible?1:0)
   shotRemaining = Math.max(0, shotRemaining - seconds)
   if (enemy.health <= 0) { pendingShot = null; shotRemaining = 0 }
   if (shot !== undefined && pendingShot && Date.now() >= pendingShot.time && enemy.health > 0) {
    const beam = Transform.getMutable(shot), dx = pendingShot.x - transform.position.x, dz = pendingShot.z - transform.position.z
    beam.position = Vector3.create(pendingShot.x, transform.position.y-.7, pendingShot.z)
    beam.rotation = Quaternion.fromEulerDegrees(0, Math.atan2(dx, dz) * 180 / Math.PI, 0)
    beam.scale = Vector3.create(.7,.7,.7)
    Animator.createOrReplace(shot,{states:[{clip:'Pulse',playing:true,loop:false,shouldReset:true}]})
    shotRemaining = .5; pendingShot = null
   }
   if (!shotRemaining && shot !== undefined) Transform.getMutable(shot).scale = Vector3.Zero()
   if (remaining > 0) {
    remaining = Math.max(0, remaining - seconds)
    if (!remaining) {
     if (clip === 'Disappear') { VisibilityComponent.getMutable(model).visible = false; for (const state of Animator.getMutable(model).states) state.playing = false }
     else play('Idle')
    }
   }
   const isAlive = enemy.health > 0
   if (!isAlive && alive) { play('Disappear', 0.9); alive = false }
   if (isAlive && !alive) {
    transform.position = { ...enemy.position }
    VisibilityComponent.getMutable(model).visible = true
    play('Appear', 0.9); alive = true; lastAttack = 0
   }
   if (isAlive) {
    const moving = Math.hypot(enemy.position.x-transform.position.x,enemy.position.z-transform.position.z)>0.03
    personalityCooldown=Math.max(0,personalityCooldown-seconds)
    stillTime=enemy.mode==='patrol'&&!moving?stillTime+seconds:0
    if(lastHealth!==undefined&&enemy.health<lastHealth)play('Hit',0.6)
    if((lastMode==='patrol'||lastMode==='return')&&(enemy.mode==='chase'||enemy.mode==='attack'))play('Alert',0.8)
    if(stillTime>0.25&&personalityCooldown===0&&clip==='Idle'){
     const doze=Math.random()<0.08;play(doze?'Doze':'Look',doze?3:2.4);personalityCooldown=12+Math.random()*12
    }
    const dx = enemy.position.x - transform.position.x, dz = enemy.position.z - transform.position.z
    transform.position.x += dx * Math.min(1, seconds * 15)
    transform.position.z += dz * Math.min(1, seconds * 15)
    transform.position.y = enemy.position.y
    const telegraph = enemy.telegraph
    if (telegraph && telegraph.endsAt !== lastAttack && clip !== 'Appear') {
     lastAttack = telegraph.endsAt
     const player=Transform.getOrNull(engine.PlayerEntity)?.position
     if(player&&Math.hypot(player.x-transform.position.x,player.z-transform.position.z)<20)playActionSound(config.combatStyle==='ranged'?'agentRanged':'agentMelee')
     if (config.combatStyle === 'ranged') pendingShot = { time: telegraph.endsAt, x: telegraph.x ?? transform.position.x, z: telegraph.z ?? transform.position.z }
     transform.rotation = Quaternion.fromEulerDegrees(0, Math.atan2((telegraph.x ?? transform.position.x) - transform.position.x, (telegraph.z ?? transform.position.z + 1) - transform.position.z) * 180 / Math.PI, 0)
     if (clip !== 'Appear') play('Attack', 1.3)
    } else if (clip === 'Idle' && Math.hypot(dx, dz) > 0.01) transform.rotation = Quaternion.fromEulerDegrees(0, Math.atan2(dx, dz) * 180 / Math.PI, 0)
   }
   lastHealth=enemy.health;lastMode=enemy.mode ?? 'patrol'
   Transform.getMutable(target).position = { ...transform.position }
   Transform.getMutable(target).scale = isAlive && clip !== 'Appear' ? Vector3.create(config.bodyWidth,config.bodyWidth,config.bodyWidth) : Vector3.Zero()
   Transform.getMutable(bar).position = Vector3.create(transform.position.x, transform.position.y + config.bodyTop + .18, transform.position.z)
   Transform.getMutable(bar).scale = isAlive && clip !== 'Appear' && (enemy.health < enemy.maxHealth || enemy.mode === 'chase' || enemy.mode === 'attack') ? Vector3.create(1.5 * enemy.health / enemy.maxHealth, 0.1, 0.06) : Vector3.Zero()
   const level = enemy.level ?? 1, tag = TextShape.get(levelTag)
   const label = 'LV ' + level + ' · ' + config.name, color = DANGER_COLORS[agentDanger(level, getPlayer().level)]
   if (tag.text !== label || tag.textColor !== color) { const mutable = TextShape.getMutable(levelTag); mutable.text = label; mutable.textColor = color }
   // Readable from a few metres on a large desktop screen too (about 0.3 m tall), just above the health bar.
   Transform.getMutable(levelTag).position = Vector3.create(transform.position.x, transform.position.y + config.bodyTop + .65, transform.position.z)
   const shown = isAlive && clip !== 'Appear'
   if (VisibilityComponent.get(levelTag).visible !== shown) VisibilityComponent.getMutable(levelTag).visible = shown
  }, undefined, 'agent-enemy-' + config.id)
 }
}
