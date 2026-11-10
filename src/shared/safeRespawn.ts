import { treeRootForLevel } from './recovery'
import { treePlacementForLevel } from './treeGrowth'
import { treeStageForLevel } from './visualRules'
import { TREE_REACH } from './treeReach'
import { groundHeight, groundKind } from './terrainGrid'
import { DELIVERY_POINTS, ARRIVAL_POINT } from './tutorial'
import { WORLD_RESOURCES } from './worldLayout'

// Where a fallen explorer gets back up: beside the central tree, on the side they fell, just outside the reach of the
// tree's roots and collider at its current size (it grows with the level), on open level ground clear of altars and
// resources. If no side qualifies, the arrival path, which is always clear.
const MARGIN = 1.8
function clear(x: number, z: number) {
 if (x < 12 || x > 148 || z < 12 || z > 148 || groundKind(x, z) !== 0) return false
 const y = groundHeight(x, z)
 for (const [dx, dz] of [[1.5, 0], [-1.5, 0], [0, 1.5], [0, -1.5]]) if (groundKind(x + dx, z + dz) !== 0 || Math.abs(groundHeight(x + dx, z + dz) - y) > 1) return false
 if (DELIVERY_POINTS.some(p => Math.hypot(p.x - x, p.z - z) < 2.5)) return false
 return !WORLD_RESOURCES.some(r => Math.hypot(r.position.x - x, r.position.z - z) < Math.max(r.collider.x, r.collider.z) / 2 + 1.2)
}
export function safeRespawnPoint(level: number, from: { x: number; z: number }) {
 const root = treeRootForLevel(level), size = treePlacementForLevel(level).scale.x, reach = TREE_REACH[treeStageForLevel(level)]
 const facing = Math.atan2(from.z - root.z, from.x - root.x)
 const sides = reach.map((r, k) => ({ angle: k * Math.PI / 8, distance: r * size + MARGIN }))
  .sort((a, b) => Math.abs(Math.atan2(Math.sin(a.angle - facing), Math.cos(a.angle - facing))) - Math.abs(Math.atan2(Math.sin(b.angle - facing), Math.cos(b.angle - facing))))
 for (const side of sides) for (const extra of [0, 1.5, 3]) {
  const x = root.x + Math.cos(side.angle) * (side.distance + extra), z = root.z + Math.sin(side.angle) * (side.distance + extra)
  if (clear(x, z)) return { x, y: groundHeight(x, z) + .3, z }
 }
 return { ...ARRIVAL_POINT }
}
