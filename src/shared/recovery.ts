import { treeStageForLevel } from './visualRules'
// Village recovery point retained when replacing the base environment.
export const HEALING_TREE = { x: 80, y: 2.7, z: 79.8, radius: 5.5 }

// Authored Root positions in the four tree GLBs, transformed with their scene origin and scale.
const TREE_ROOTS = [
 {x:-.70620197057724,y:1.6245012283325195,z:-.13632047176361084},
 {x:-.03294026106595993,y:1.7156212329864502,z:-1.4084560871124268},
 {x:-1.4991445541381836,y:2.0154078006744385,z:.9307258129119873},
 {x:-1.4254231452941895,y:1.6461341381072998,z:.41213348507881165}
]
// Where each tree stage's trunk actually stands: transformation effects and the camera orbit centre on it.
export function treeRootForLevel(level:number) {
 const root=TREE_ROOTS[treeStageForLevel(level)]
 return {x:81.55+root.x*.94,y:1.3+root.y*.94,z:79.94+root.z*.94}
}
// The whole raised platform around the tree heals, measured from the terrain (top x 73-88, z 72-88), whatever the stage.
export const HEALING_ZONE = { minX: 72.6, maxX: 88.4, minZ: 71.6, maxZ: 88.4, minY: 2, maxY: 9 }
const ZONE_CENTRE = { x: (HEALING_ZONE.minX + HEALING_ZONE.maxX) / 2, y: 2.7, z: (HEALING_ZONE.minZ + HEALING_ZONE.maxZ) / 2 }
// Centre and radius of the visible healing column that covers the platform.
export function healingTreeForLevel(_level:number) {
 return {...ZONE_CENTRE,radius:(HEALING_ZONE.maxX-HEALING_ZONE.minX)/2+.3}
}

export function nearHealingTree(position: { x: number; y: number; z: number } | null, _level=1) {
  return !!position && position.x >= HEALING_ZONE.minX && position.x <= HEALING_ZONE.maxX && position.z >= HEALING_ZONE.minZ && position.z <= HEALING_ZONE.maxZ && position.y >= HEALING_ZONE.minY && position.y <= HEALING_ZONE.maxY
}

export function recoverVitals(health: number, aura: number, maxHealth: number, maxAura: number, seconds: number, nearTree: boolean, inCombat: boolean, auraRank: number, treeRank: number) {
  const elapsed = Math.max(0, Math.min(0.5, seconds))
  return {
    // Exponential decay of missing health, normalized by maximum health.
    // Snap the last 1% so recovery always finishes rather than approaching full forever.
    health: nearTree && health < maxHealth
      ? (()=>{const next=maxHealth-(maxHealth-health)*Math.exp(-.65*elapsed*(1+Math.min(3,treeRank)*.1));return maxHealth-next<=maxHealth*.01?maxHealth:next})()
      : Math.min(maxHealth,health),
    aura: Math.min(maxAura, aura + (inCombat ? 2 : 5) * elapsed * (1 + Math.min(3, auraRank) * 0.1))
  }
}
