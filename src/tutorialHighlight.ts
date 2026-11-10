import { Animator, engine, Entity, GltfContainer, GltfNodeModifiers, Material, MaterialTransparencyMode, Transform } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

// The Explorer outlines whatever carries pointer events while the cursor rests on it. During the tutorial the current
// objective stays lit without hovering. A world resource glows in its own colours: its material is swapped for the same
// shared texture with a warm emission, so the model itself lights up. Models with embedded textures (agents, Pandora)
// wear a faint glowing shell instead, a slightly larger copy of their own model.
let shell: Entity | undefined, owner: Entity | undefined, ownerSrc = '', grow = 1.05, mirrored = '', time = 0, tinted = false
const GLOW = { r: 1, g: .82, b: .4 }

function clear() {
 if (shell !== undefined) engine.removeEntity(shell)
 if (tinted && owner !== undefined && Transform.getOrNull(owner)) GltfNodeModifiers.deleteFrom(owner)
 shell = owner = undefined; ownerSrc = ''; mirrored = ''; tinted = false
}
export function getTutorialHighlight() { return owner }
// Pass undefined to switch the glow off. With `texture` (the model's shared texture file) the target itself glows;
// without it a shell follows the target's transform and animation.
export function setTutorialHighlight(target: Entity | undefined, scale = 1.05, texture?: string) {
 const src = target === undefined ? '' : GltfContainer.getOrNull(target)?.src ?? ''
 if (target === owner && src === ownerSrc) return
 clear()
 if (target === undefined || !src) return
 owner = target; ownerSrc = src; grow = scale
 if (texture) {
  const map = Material.Texture.Common({ src: texture })
  GltfNodeModifiers.createOrReplace(target, { modifiers: [{ path: '', material: { material: { $case: 'pbr', pbr: {
   texture: map, emissiveTexture: map, emissiveColor: GLOW, emissiveIntensity: .9, metallic: 0, roughness: .6
  } } } }] })
  tinted = true
  return
 }
 shell = engine.addEntity()
 Transform.create(shell, { parent: target, scale: Vector3.create(grow, grow, grow) })
 GltfContainer.create(shell, { src, visibleMeshesCollisionMask: 0, invisibleMeshesCollisionMask: 0 })
 GltfNodeModifiers.create(shell, { modifiers: [{ path: '', castShadows: false, material: { material: { $case: 'pbr', pbr: {
  albedoColor: { ...GLOW, a: .12 }, emissiveColor: GLOW, emissiveIntensity: 1.2, transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND
 } } } }] })
}
export function setupTutorialHighlight() {
 engine.addSystem(dt => {
  if (owner === undefined) return
  if (!Transform.getOrNull(owner)) { clear(); return }
  if (shell === undefined) return
  time += Math.max(0, dt)
  const pulse = grow * (1 + .015 * Math.sin(time * 4))
  Transform.getMutable(shell).scale = Vector3.create(pulse, pulse, pulse)
  // Animated targets (agents) keep their shell in the same pose.
  const animator = Animator.getOrNull(owner)
  if (animator) {
   const states = JSON.stringify(animator.states.map(state => [state.clip, state.playing, state.loop, state.speed]))
   if (states !== mirrored) { mirrored = states; Animator.createOrReplace(shell, { states: animator.states.map(state => ({ ...state, shouldReset: true })) }) }
  }
 }, undefined, 'pandora-tutorial-highlight')
}
