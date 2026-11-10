import { Billboard, BillboardMode, engine, Entity, Material, MaterialTransparencyMode, MeshRenderer, Transform } from '@dcl/sdk/ecs'
import { Color4, Quaternion, Vector3 } from '@dcl/sdk/math'

export type ImpactKind = 'hit' | 'stone' | 'wood' | 'shard'
type Point = { x: number; y: number; z: number }
type Chip = { entity: Entity; life: number; span: number; velocity: Point; spin: Point; size: Vector3; rotation: Point; floor: number }

const CHIP_COUNT = 24
const GRAVITY = 9
const FLASH_SPAN = 0.22
const STYLES: Record<ImpactKind, { flash: number; count: number; speed: number; size: [number, number]; stretch: number; colors: Color4[] }> = {
  hit: { flash: 1.3, count: 7, speed: 3.4, size: [0.03, 0.06], stretch: 1, colors: [Color4.create(1, 0.85, 0.35, 1), Color4.create(1, 0.97, 0.75, 1)] },
  shard: { flash: 1, count: 9, speed: 2.4, size: [0.03, 0.05], stretch: 1, colors: [Color4.create(0.2, 0.85, 1, 1), Color4.create(1, 0.72, 0.25, 1)] },
  stone: { flash: 0.7, count: 14, speed: 3, size: [0.05, 0.13], stretch: 1, colors: [Color4.create(0.42, 0.47, 0.55, 1), Color4.create(0.3, 0.55, 0.78, 1), Color4.create(0.62, 0.64, 0.68, 1)] },
  // Long thin boxes read as splinters rather than as rock.
  wood: { flash: 0.8, count: 14, speed: 3.2, size: [0.025, 0.045], stretch: 4, colors: [Color4.create(0.78, 0.56, 0.3, 1), Color4.create(0.93, 0.76, 0.5, 1), Color4.create(0.45, 0.28, 0.14, 1)] }
}
const chips: Chip[] = []
const queued: { at: number; kind: ImpactKind; where: () => Point | undefined }[] = []
let flash: Entity | undefined
let flashLife = 0
let flashSize = 0
let cursor = 0

const hidden = () => Vector3.create(0, -10, 0)
const between = (low: number, high: number) => low + Math.random() * (high - low)

// One pooled set of entities: a swing never creates or destroys anything.
export function setupImpactEffects() {
  if (flash !== undefined) return
  flash = engine.addEntity()
  Transform.create(flash, { position: hidden(), scale: Vector3.Zero() })
  MeshRenderer.setPlane(flash)
  Billboard.create(flash, { billboardMode: BillboardMode.BM_ALL })
  const texture = Material.Texture.Common({ src: 'assets/images/fx/impact-flash.png' })
  Material.setPbrMaterial(flash, { texture, emissiveTexture: texture, emissiveColor: Color4.White(), emissiveIntensity: 2, transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND, castShadows: false })
  for (let index = 0; index < CHIP_COUNT; index++) {
    const entity = engine.addEntity()
    Transform.create(entity, { position: hidden(), scale: Vector3.Zero() })
    MeshRenderer.setBox(entity)
    chips.push({ entity, life: 0, span: 1, velocity: { x: 0, y: 0, z: 0 }, spin: { x: 0, y: 0, z: 0 }, size: Vector3.Zero(), rotation: { x: 0, y: 0, z: 0 }, floor: 0 })
  }
  engine.addSystem(updateImpacts, undefined, 'pandora-impact-effects')
}

function burst(kind: ImpactKind, point: Point) {
  const style = STYLES[kind]
  if (flash !== undefined) {
    Transform.getMutable(flash).position = Vector3.create(point.x, point.y, point.z)
    flashLife = FLASH_SPAN
    flashSize = style.flash
  }
  for (let index = 0; index < style.count && chips.length; index++) {
    const chip = chips[cursor]
    cursor = (cursor + 1) % chips.length
    const angle = Math.random() * Math.PI * 2, speed = style.speed * between(0.45, 1), width = between(style.size[0], style.size[1])
    chip.life = chip.span = between(0.45, 0.8)
    chip.velocity = { x: Math.cos(angle) * speed, y: between(1.2, 3.4), z: Math.sin(angle) * speed }
    chip.spin = { x: between(-720, 720), y: between(-720, 720), z: between(-720, 720) }
    chip.size = Vector3.create(width, width * between(0.6, 1), width * style.stretch)
    chip.rotation = { x: Math.random() * 360, y: Math.random() * 360, z: 0 }
    chip.floor = point.y - 1.1
    Transform.getMutable(chip.entity).position = Vector3.create(point.x, point.y, point.z)
    const color = style.colors[index % style.colors.length]
    Material.setPbrMaterial(chip.entity, { albedoColor: color, roughness: 0.9, metallic: 0, ...(kind === 'hit' || kind === 'shard' ? { emissiveColor: color, emissiveIntensity: 3 } : {}) })
  }
}

function updateImpacts(dt: number) {
  const now = Date.now()
  for (let index = queued.length - 1; index >= 0; index--) {
    if (now < queued[index].at) continue
    const [event] = queued.splice(index, 1)
    const point = event.where()
    if (point) burst(event.kind, point)
  }
  if (flash !== undefined && flashLife > 0) {
    flashLife = Math.max(0, flashLife - dt)
    const age = 1 - flashLife / FLASH_SPAN
    // Pops open at once and collapses, so it reads as a blow and not as a light.
    const size = flashLife ? flashSize * Math.min(1, age * 5) * (1 - age * age) : 0
    Transform.getMutable(flash).scale = Vector3.create(size, size, size)
  }
  for (const chip of chips) {
    if (chip.life <= 0) continue
    chip.life = Math.max(0, chip.life - dt)
    const transform = Transform.getMutable(chip.entity)
    chip.velocity.y -= GRAVITY * dt
    const position = transform.position
    position.x += chip.velocity.x * dt
    position.y = Math.max(chip.floor, position.y + chip.velocity.y * dt)
    position.z += chip.velocity.z * dt
    if (position.y === chip.floor) { chip.velocity.x *= 0.6; chip.velocity.z *= 0.6; chip.velocity.y = Math.abs(chip.velocity.y) * 0.25 }
    chip.rotation.x += chip.spin.x * dt; chip.rotation.y += chip.spin.y * dt; chip.rotation.z += chip.spin.z * dt
    transform.rotation = Quaternion.fromEulerDegrees(chip.rotation.x, chip.rotation.y, chip.rotation.z)
    const fade = Math.min(1, chip.life / (chip.span * 0.35))
    transform.scale = chip.life ? Vector3.create(chip.size.x * fade, chip.size.y * fade, chip.size.z * fade) : Vector3.Zero()
  }
}

// `where` is read at the moment of contact because enemies keep moving during the swing.
export function spawnImpact(kind: ImpactKind, delay: number, where: () => Point | undefined) { queued.push({ at: Date.now() + delay, kind, where }) }
