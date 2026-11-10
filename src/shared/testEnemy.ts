import { enemyTierFor } from './enemyTiers'
import { AGENT_CONFIG, AGENT_SPAWNS, agentRoute } from './agents'
export type AgentCombatStyle = 'ranged' | 'melee'
export const AGENT_COMBAT: Record<string, AgentCombatStyle> = {
 Aqua_Sigil_Wisp: 'ranged', Celestial_Prism_Orb: 'ranged', Celestial_Resonance_B: 'ranged', Rose_Quartz_Arcana: 'ranged',
 Celestial_Orbweaver: 'melee', Ember_Golem_Orb: 'melee', Mosslit_Sentinel: 'melee', Void_Sentinel: 'melee',
 Aegis_Core: 'ranged', Arcane_Data_Core: 'ranged', Aureate_Sentinel: 'ranged', Smiling_Skybot: 'ranged',
 Aegis_Drone: 'melee', Aethercore_Sentinel: 'melee', Orbital_Cipher: 'melee', Pulse_Sentinel: 'melee', Triad_Sentinel: 'melee'
}
// Local body bounds exclude the much larger attack FX. Leave clearance for the authored Idle hover.
const AGENT_BODY_TOP: Record<string, number> = {
 "Aqua_Sigil_Wisp": 0.6,
 "Celestial_Orbweaver": 0.6,
 "Celestial_Prism_Orb": 0.6,
 "Celestial_Resonance_B": 0.6,
 "Ember_Golem_Orb": 0.4749,
 "Mosslit_Sentinel": 0.6,
 "Rose_Quartz_Arcana": 0.6,
 "Void_Sentinel": 0.6,
 "Aegis_Core": 0.3525,
 "Arcane_Data_Core": 0.4417,
 "Aureate_Sentinel": 0.3972,
 "Smiling_Skybot": 0.3899,
 "Aegis_Drone": 0.3384,
 "Aethercore_Sentinel": 0.3772,
 "Orbital_Cipher": 0.373,
 "Pulse_Sentinel": 0.3669,
 "Triad_Sentinel": 0.3469
}
export const SENTINELS = AGENT_CONFIG.filter(config => config.name !== 'Sentinel_Core').map((config, index) => ({
 bodyTop: (AGENT_BODY_TOP[config.name] + .15) * config.scale * enemyTierFor(config.name).scale,
 id: config.name, name: config.name.replace(/_/g, ' '), scale: config.scale * enemyTierFor(config.name).scale, bodyWidth: 1.7 * enemyTierFor(config.name).scale, unlockLevel: enemyTierFor(config.name).unlockLevel, combatStyle: AGENT_COMBAT[config.name], attackRange: AGENT_COMBAT[config.name] === 'ranged' ? 6 : 2.2, route: agentRoute(AGENT_SPAWNS[index])
}))
export type SentinelMode = 'patrol' | 'chase' | 'return' | 'attack'
export const VILLAGE_SAFE_RADIUS = 12
export function inVillageSafeZone(p: { x: number; z: number }) { return Math.hypot(p.x - 80, p.z - 82.5) < VILLAGE_SAFE_RADIUS }

export function agentAttackHits(position: { x: number; y: number; z: number } | null, origin: { x: number; y: number; z: number }, aim: { x: number | null; z: number | null }, range: number) {
 return !!position && !inVillageSafeZone(position) && Math.abs(position.y - origin.y) < 4 && Math.hypot(position.x - origin.x, position.z - origin.z) <= range + 0.6 && Math.hypot(position.x - (aim.x ?? origin.x), position.z - (aim.z ?? origin.z)) <= 1.6
}

// Keep the same weapon reach beyond the scaled physical box, including its corners.
export function playerAttackRange(agentId: string) {
 const width = SENTINELS.find(agent => agent.id === agentId)?.bodyWidth ?? 1.7
 return 2.8 + Math.max(0, width - 1.7) * Math.SQRT1_2
}
