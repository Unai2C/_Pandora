import { Animator, engine, Entity, GltfContainer, Transform } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'

// A Turquoise Tweet bird that keeps going round for as long as the scene runs: it flies a lap in the air, comes back
// down over its spot, lands, pecks around for a while, takes off and flies again. It is never hidden; the clips hand
// over at the same height (TakeOff ends and Land starts half a metre above the spot, where the flight joins them).
// A bird that is scared while perched takes off at once, and keeps flying laps until its spot is free again.
const HANDOVER = .5, LAND_SECONDS = 2, TAKEOFF_SECONDS = 2
type Phase = 'fly' | 'land' | 'perch' | 'takeoff'
export interface BirdLoop { entity: Entity; spot: Vector3; yaw: number; radius: number; height: number; lap: number; phase: Phase; timer: number; seed: number }
const play = (entity: Entity, clip: string, loop: boolean, speed = 1) => Animator.createOrReplace(entity, { states: [{ clip, playing: true, loop, speed, shouldReset: true }] })
const random = (bird: BirdLoop) => { bird.seed = (bird.seed * 16807) % 2147483647; return bird.seed / 2147483647 }
export function createBirdLoop(spot: Vector3, yaw: number, seed: number, radius = 6, height = 4) {
 const entity = engine.addEntity()
 Transform.create(entity, { position: { ...spot }, rotation: Quaternion.fromEulerDegrees(0, yaw, 0) })
 GltfContainer.create(entity, { src: 'assets/scene/modelos/fx/Bird_Perch_Tweet.glb', visibleMeshesCollisionMask: 0, invisibleMeshesCollisionMask: 0 })
 const bird: BirdLoop = { entity, spot: { ...spot }, yaw, radius, height, lap: 7, phase: 'perch', timer: 0, seed: Math.max(1, Math.floor(seed) % 2147483646 + 1) }
 bird.timer = 2 + random(bird) * 8
 play(entity, 'Perch', true, .9 + random(bird) * .2)
 return bird
}
// The lap: a circle through the spot, turning to the bird's right, rising to `height` halfway round and coming back
// down to the handover height over the spot, facing the way it set off.
function lapPose(bird: BirdLoop, u: number) {
 const angle = u * 2 * Math.PI, yaw = bird.yaw * Math.PI / 180
 const forward = { x: Math.sin(yaw), z: Math.cos(yaw) }, right = { x: forward.z, z: -forward.x }
 const x = bird.spot.x + bird.radius * (right.x * (1 - Math.cos(angle)) + forward.x * Math.sin(angle))
 const z = bird.spot.z + bird.radius * (right.z * (1 - Math.cos(angle)) + forward.z * Math.sin(angle))
 const y = bird.spot.y + HANDOVER + bird.height * Math.sin(Math.PI * u)
 const dx = right.x * Math.sin(angle) + forward.x * Math.cos(angle), dz = right.z * Math.sin(angle) + forward.z * Math.cos(angle)
 return { position: Vector3.create(x, y, z), rotation: Quaternion.fromEulerDegrees(0, Math.atan2(dx, dz) * 180 / Math.PI, 0) }
}
export function updateBirdLoop(bird: BirdLoop, dt: number, scared: boolean) {
 bird.timer -= Math.max(0, dt)
 if (bird.phase === 'perch') {
  if (bird.timer <= 0 || scared) { bird.phase = 'takeoff'; bird.timer = TAKEOFF_SECONDS; play(bird.entity, 'TakeOff', false) }
  return
 }
 if (bird.phase === 'takeoff') {
  if (bird.timer <= 0) { bird.phase = 'fly'; bird.lap = 6 + random(bird) * 3; bird.timer = bird.lap; play(bird.entity, 'Fly', true, .9 + random(bird) * .25) }
  return
 }
 if (bird.phase === 'fly') {
  const transform = Transform.getMutable(bird.entity), pose = lapPose(bird, Math.min(1, 1 - bird.timer / bird.lap))
  transform.position = pose.position; transform.rotation = pose.rotation
  if (bird.timer > 0) return
  // Back over the spot: land, unless someone is standing there, then fly another lap.
  if (scared) { bird.lap = 6 + random(bird) * 3; bird.timer = bird.lap; return }
  transform.position = { ...bird.spot }; transform.rotation = Quaternion.fromEulerDegrees(0, bird.yaw, 0)
  bird.phase = 'land'; bird.timer = LAND_SECONDS; play(bird.entity, 'Land', false)
  return
 }
 if (bird.timer <= 0) { bird.phase = 'perch'; bird.timer = 8 + random(bird) * 8; play(bird.entity, 'Perch', true, .9 + random(bird) * .2) }
}
export function birdLoopPhase(bird: BirdLoop) { return bird.phase }
