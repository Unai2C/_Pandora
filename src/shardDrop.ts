import { Animator, engine, Entity, GltfContainer, Transform } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { playInteractionSound } from './audio'
import { spawnImpact } from './impactEffects'

type Point = { x: number; y: number; z: number }
type Drop = { entity: Entity; origin: Point; top: Point; age: number; stage: Stage }
type Stage = 'idle' | 'waiting' | 'rising' | 'hovering' | 'flying'

// The wait lands the shard on the burst of the agent's 0.9s Disappear clip.
const WAIT = 0.35
const RISE = 1.2
const HOVER = 0.7
const FLY = 0.6
const HEIGHT = 0.9
const SCALE = 0.6
const POOL_SIZE = 3
const CHEST = 1.1
const pool: Drop[] = []

const hidden = () => Vector3.create(0, -10, 0)
const size = () => Vector3.create(SCALE, SCALE, SCALE)
const lerp = (from: Point, to: Point, t: number) => Vector3.create(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, from.z + (to.z - from.z) * t)
const playerChest = () => {
  const position = Transform.getOrNull(engine.PlayerEntity)?.position
  return position && Vector3.create(position.x, position.y + CHEST, position.z)
}

// The models load with the scene, so the first kill does not wait for a download.
export function setupShardDrops() {
  if (pool.length) return
  for (let index = 0; index < POOL_SIZE; index++) {
    const entity = engine.addEntity()
    Transform.create(entity, { position: hidden(), scale: Vector3.Zero() })
    GltfContainer.create(entity, { src: 'assets/scene/modelos/Agentes/Memory_Shard_anim.glb', visibleMeshesCollisionMask: 0, invisibleMeshesCollisionMask: 0 })
    Animator.create(entity, { states: ['Drop', 'Float', 'Collect'].map(clip => ({ clip, playing: false, loop: clip === 'Float', shouldReset: false, speed: 1, weight: 1 })) })
    pool.push({ entity, origin: { x: 0, y: 0, z: 0 }, top: { x: 0, y: 0, z: 0 }, age: 0, stage: 'idle' })
  }
  engine.addSystem(updateShardDrops, undefined, 'pandora-shard-drops')
}

function enter(drop: Drop, stage: Stage, clip: string) {
  drop.stage = stage
  drop.age = 0
  Animator.playSingleAnimation(drop.entity, clip, true)
}

function finish(drop: Drop) {
  drop.stage = 'idle'
  const transform = Transform.getMutable(drop.entity)
  transform.position = hidden()
  transform.scale = Vector3.Zero()
  spawnImpact('shard', 0, playerChest)
  playInteractionSound()
}

function updateShardDrops(dt: number) {
  for (const drop of pool) {
    if (drop.stage === 'idle') continue
    drop.age += dt
    const transform = Transform.getMutable(drop.entity)
    if (drop.stage === 'waiting') {
      if (drop.age < WAIT) continue
      transform.position = Vector3.create(drop.origin.x, drop.origin.y, drop.origin.z)
      transform.scale = size()
      enter(drop, 'rising', 'Drop')
    } else if (drop.stage === 'rising') {
      const left = 1 - Math.min(1, drop.age / RISE)
      transform.position = lerp(drop.origin, drop.top, 1 - left * left)
      if (!left) enter(drop, 'hovering', 'Float')
    } else if (drop.stage === 'hovering') {
      if (drop.age >= HOVER) { drop.origin = drop.top; enter(drop, 'flying', 'Collect') }
    } else {
      const chest = playerChest(), t = Math.min(1, drop.age / FLY)
      if (chest) transform.position = lerp(drop.origin, chest, t * t)
      if (t >= 1) finish(drop)
    }
  }
}

// Only the winner receives this, so nobody sees a reward that is not theirs.
export function dropShard(point: Point) {
  const drop = pool.find(item => item.stage === 'idle') ?? pool[0]
  if (!drop) return
  drop.origin = { ...point }
  drop.top = { x: point.x, y: point.y + HEIGHT, z: point.z }
  drop.age = 0
  drop.stage = 'waiting'
}
