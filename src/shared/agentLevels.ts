// Agent levels follow the explorers who are playing right now: the weakest agents match the lowest-level player,
// and some match or exceed the highest-level player, so they stay dangerous for everyone.
export const LEVELS_ABOVE_STRONGEST = 2
export function agentLevelRange(playerLevels: number[]) {
 const levels = playerLevels.filter(level => Number.isFinite(level) && level >= 1)
 const min = levels.length ? Math.floor(Math.min(...levels)) : 1, max = levels.length ? Math.floor(Math.max(...levels)) : 1
 return { min, max, top: max + LEVELS_ABOVE_STRONGEST }
}
// One level per agent slot. Slot 0 matches the weakest player, slot 1 the strongest, slot 2 is above the strongest;
// the rest spread evenly across that range.
export function assignAgentLevels(count: number, playerLevels: number[]) {
 const { min, max, top } = agentLevelRange(playerLevels)
 const fixed = [min, max, top]
 return Array.from({ length: Math.max(0, count) }, (_, slot) => {
  if (slot < fixed.length) return fixed[slot]
  const rest = count - fixed.length, t = rest > 1 ? (slot - fixed.length) / (rest - 1) : .5
  return Math.round(min + (top - min) * t)
 })
}
// Grows a little faster than a player (+10 health and +2 damage per level), so higher-level agents hit hard.
export function agentStats(base: { health: number; damage: number }, level: number) {
 const gained = Math.max(0, Math.floor(level) - 1)
 return { health: Math.round(base.health * (1 + .15 * gained)), damage: Math.round(base.damage * (1 + .12 * gained)) }
}
export function agentXpReward(baseXp: number, level: number) { return Math.round(baseXp * (1 + .2 * Math.max(0, Math.floor(level) - 1))) }
export type AgentDanger = 'weaker' | 'even' | 'dangerous'
export function agentDanger(agentLevel: number, playerLevel: number): AgentDanger {
 return agentLevel > playerLevel ? 'dangerous' : agentLevel === playerLevel ? 'even' : 'weaker'
}


// Fixed map bands: the player range changes, but the beginner area never migrates.
export const AGENT_LEVEL_ZONES = { x:80, z:82.5, nearRadius:34, outerRadius:49, edgeRadius:57 } as const
export function agentVillageDistance(point:{x:number;z:number}) {
 return Math.hypot(point.x-AGENT_LEVEL_ZONES.x,point.z-AGENT_LEVEL_ZONES.z)
}
export function agentDifficultyZone(point:{x:number;z:number}) {
 const distance=agentVillageDistance(point)
 return distance<=AGENT_LEVEL_ZONES.nearRadius?0:distance<=AGENT_LEVEL_ZONES.outerRadius?1:2
}
export function assignAgentLevelsByDistance(homes:{x:number;z:number}[],playerLevels:number[]) {
 const {min,max,top}=agentLevelRange(playerLevels),{nearRadius,outerRadius,edgeRadius}=AGENT_LEVEL_ZONES
 return homes.map(home=>{
  const distance=agentVillageDistance(home)
  if(distance<=nearRadius)return min
  if(distance<=outerRadius)return Math.round(min+(max-min)*(distance-nearRadius)/(outerRadius-nearRadius))
  return Math.round(max+(top-max)*Math.min(1,(distance-outerRadius)/(edgeRadius-outerRadius)))
 })
}
