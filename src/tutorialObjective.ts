import { WORLD_RESOURCES, WorldResource } from './shared/worldLayout'

// The resource the tutorial points at. The objective camera and the world highlight share it, so the glowing resource is
// always the one the camera showed. A new one is picked only when the step changes or the current one is used up.
let current: WorldResource | undefined
export function tutorialObjective(kind: WorldResource['kind'], from: { x: number; z: number }, available: (id: string) => boolean) {
 if (current && current.kind === kind && available(current.id)) return current
 current = WORLD_RESOURCES.filter(n => n.kind === kind && available(n.id))
  .sort((a, b) => (Math.hypot(a.position.x - from.x, a.position.z - from.z) + a.hitsRequired * 4) - (Math.hypot(b.position.x - from.x, b.position.z - from.z) + b.hitsRequired * 4))[0]
 return current
}
