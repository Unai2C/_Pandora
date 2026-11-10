import { setupHealingBeam } from './healingBeam'
import { Animator, engine, Entity, GltfContainer, Transform } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'
import { getVillage, subscribeVillageSnapshots } from './gameState'
import { HEALING_TREE } from './shared/recovery'
import { createBirdLoop, updateBirdLoop } from './birdLoop'

const FIREFLIES = [[70, 1.1, 100], [92, 1.2, 100], [60, 1.6, 75], [100, 1.2, 70], [45, 1.4, 90], [118, 1.4, 90], [75, 1.7, 45], [95, 1.4, 120]]
const BUTTERFLIES = [[74, 1.8, 90], [90, 1.6, 90], [70, 1.4, 70], [95, 1.6, 72], [60, 1.2, 95], [102, 0.8, 98]]
const FLOWERS = [[76, 2, 90], [87, 1.7, 91], [92, 1.8, 84], [70, 1.65, 84], [73, 3, 75], [90, 1.6, 74], [81, 1.35, 96], [86, 1, 104], [84, 1, 118], [64, 1.8, 84], [98, 2.1, 84], [81, 1.95, 66]]
const PERCHES = [[86.21, 2.53, 27.75], [71.98, 4.10, 27.69], [51.13, 3.37, 133.6], [28.36, 3.6, 116.84], [92.12, 4.91, 150.15], [136.17, 3.37, 129.81]]
const CRYSTALS = 8, DELIVER_TIME = 4.344, AMBIENT_RANGE = 60

const addModel = (asset: string, position: Vector3, rotation = 0, parent?: Entity) => {
  const entity = engine.addEntity()
  Transform.create(entity, { parent, position, rotation: Quaternion.fromEulerDegrees(0, rotation, 0) })
  GltfContainer.create(entity, { src: 'assets/scene/modelos/fx/' + asset + '.glb', visibleMeshesCollisionMask: 0, invisibleMeshesCollisionMask: 0 })
  return entity
}
const play = (entity: Entity, clip: string, loop: boolean, speed = 1) => Animator.createOrReplace(entity, { states: [{ clip, playing: true, loop, speed, shouldReset: true }] })
const at = ([x, y, z]: number[]) => Vector3.create(x, y, z)

function villageProgress() {
  const { stock, targets } = getVillage(), kinds = ['wood', 'stone', 'fruit', 'coins'] as const
  const active = kinds.filter(kind => targets[kind] > 0)
  return active.length ? active.reduce((sum, kind) => sum + Math.min(stock[kind], targets[kind]) / targets[kind], 0) / active.length : 0
}

export function setupAmbientLife(altar: Entity | Entity[]) {
  const altars=Array.isArray(altar)?altar:[altar]
  altars.forEach(entity=>play(entity,'Idle',true))
  const crystals = altars.flatMap(altar=>Array.from({ length: CRYSTALS }, (_, index) => {
    const crystal = addModel('Altar_Crystal', Vector3.Zero(), index * 360 / CRYSTALS, altar)
    Transform.getMutable(crystal).scale = Vector3.Zero()
    play(crystal, 'Orbit', true)
    return crystal
  }))
  setupHealingBeam()
  let deliveredStock: number | null = null, deliveredLevel=getVillage().level, altarBurst = 0
  const showProgress = () => {
    const village = getVillage(), lit = Math.floor(villageProgress() * CRYSTALS)
    crystals.forEach((crystal, index) => { Transform.getMutable(crystal).scale = index % CRYSTALS < lit ? Vector3.One() : Vector3.Zero() })
    const stock = village.stock.wood + village.stock.stone + village.stock.fruit + village.stock.coins
    if (deliveredStock !== null && (stock > deliveredStock || village.level!==deliveredLevel)) { altars.forEach(entity=>play(entity,'Deliver',false,2.5/DELIVER_TIME)); altarBurst = DELIVER_TIME }
    deliveredStock = stock;deliveredLevel=village.level
  }
  showProgress()
  subscribeVillageSnapshots(showProgress)

  const swarms = [...FIREFLIES.map(spot => ({ entity: addModel('Fireflies', at(spot)), clip: 'Glow' })), ...BUTTERFLIES.map((spot, index) => ({ entity: addModel('Butterfly_Swarm', at(spot), index * 60), clip: 'Flutter' }))]
    .map((swarm, index) => { play(swarm.entity, swarm.clip, true, .85 + index * .03); return { ...swarm, active: true } })
  const flowers = FLOWERS.map((spot, index) => { const entity = addModel('Crystal_Flowers', at(spot), index * 47); play(entity, 'Bud', true); return { entity, spot, open: false, timer: 0 } })
  // Birds on the rock tops go round the same loop as the ground birds; one that someone walks up to flies off and circles
  // until its rock is free.
  const birds = PERCHES.map((spot, index) => createBirdLoop(at(spot), index * 73, index * 104729 + 13, 6, 4))

  let nextCheck = 0
  engine.addSystem(dt => {
    if (altarBurst > 0 && (altarBurst -= dt) <= 0) altars.forEach(entity=>play(entity,'Idle',true))
    for (const flower of flowers) if (flower.timer > 0 && (flower.timer -= dt) <= 0) play(flower.entity, flower.open ? 'Bloom' : 'Bud', true)
    // Birds fly every frame; someone within 7 m of a bird's rock keeps it in the air.
    const here = Transform.getOrNull(engine.PlayerEntity)?.position
    for (const bird of birds) updateBirdLoop(bird, dt, !!here && Math.hypot(here.x - bird.spot.x, here.z - bird.spot.z) < 7)
    if ((nextCheck -= dt) > 0) return
    nextCheck = .25
    const player = Transform.getOrNull(engine.PlayerEntity)?.position
    if (!player) return
    const distance = ([x, , z]: number[]) => Math.hypot(player.x - x, player.z - z)
    for (const swarm of swarms) {
      const active = Vector3.distance(player, Transform.get(swarm.entity).position) <= AMBIENT_RANGE
      if (active === swarm.active) continue
      swarm.active = active
      Animator.getMutable(swarm.entity).states[0].playing = active
      Transform.getMutable(swarm.entity).scale = active ? Vector3.One() : Vector3.Zero()
    }
    for (const flower of flowers) {
      const away = distance(flower.spot)
      if (flower.timer > 0 || (flower.open ? away < 8 : away > 5)) continue
      flower.open = !flower.open
      flower.timer = 1
      play(flower.entity, flower.open ? 'Open' : 'Close', false)
    }
  }, undefined, 'pandora-ambient-life')
}
