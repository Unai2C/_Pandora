import { agentDifficultyZone } from './agentLevels'
export const AGENT_CONFIG = [
  { name: 'Aqua_Sigil_Wisp', scale: 2.0085, x: 66, z: 67, speed: 0.65 },
  { name: 'Celestial_Orbweaver', scale: 1.5, x: 79, z: 65, speed: 0.55 },
  { name: 'Celestial_Prism_Orb', scale: 1.0905, x: 92, z: 66, speed: 0.6 },
  { name: 'Celestial_Resonance_B', scale: 1.1071, x: 64, z: 80, speed: 0.5 },
  { name: 'Ember_Golem_Orb', scale: 2.1152, x: 94, z: 80, speed: 0.7 },
  { name: 'Mosslit_Sentinel', scale: 1.6378, x: 65, z: 94, speed: 0.45 },
  { name: 'Rose_Quartz_Arcana', scale: 0.5084, x: 78, z: 95, speed: 0.5 },
  { name: 'Sentinel_Core', scale: 1.2, x: 84.8, z: 85.5, speed: 0 },
  { name: 'Void_Sentinel', scale: 1.1769, x: 101, z: 71, speed: 0.55 },
  { name: 'Aegis_Core', scale: 1.7845, x: 40, z: 45, speed: 0.55 },
  { name: 'Arcane_Data_Core', scale: 1.7882, x: 65, z: 40, speed: 0.55 },
  { name: 'Aureate_Sentinel', scale: 1.7754, x: 100, z: 40, speed: 0.55 },
  { name: 'Smiling_Skybot', scale: 1.7781, x: 125, z: 48, speed: 0.55 },
  { name: 'Aegis_Drone', scale: 1.7772, x: 128, z: 78, speed: 0.55 },
  { name: 'Aethercore_Sentinel', scale: 1.7745, x: 125, z: 115, speed: 0.55 },
  { name: 'Orbital_Cipher', scale: 1.7781, x: 100, z: 128, speed: 0.55 },
  { name: 'Pulse_Sentinel', scale: 1.7754, x: 65, z: 128, speed: 0.55 },
  { name: 'Triad_Sentinel', scale: 1.7781, x: 36, z: 110, speed: 0.55 }
] as const

export const AGENT_SPAWNS = [
 { x: 60, y: 3.7, z: 62 }, { x: 80, y: 3.7, z: 60 }, { x: 100, y: 3.7, z: 62 },
 { x: 60, y: 3.7, z: 82 }, { x: 102, y: 3.7, z: 82 }, { x: 60, y: 3.7, z: 102 },
 { x: 80, y: 3.7, z: 105 }, { x: 102, y: 3.7, z: 102 },
 // Same order as AGENT_CONFIG, excluding the friendly Sentinel_Core.
 { x: 40, y: 3.7, z: 45 }, { x: 65, y: 3.7, z: 40 }, { x: 100, y: 3.7, z: 40 },
 { x: 125, y: 3.7, z: 48 }, { x: 128, y: 3.7, z: 78 }, { x: 125, y: 3.7, z: 115 },
 { x: 100, y: 3.7, z: 128 }, { x: 65, y: 3.7, z: 128 }, { x: 36, y: 3.7, z: 110 }
]
export function agentRoute(point: { x: number; y: number; z: number }) {
 return [{ ...point }, { x: point.x + 3, y: point.y, z: point.z + 2 }, { x: point.x - 2, y: point.y, z: point.z + 4 }]
}
// A defeated agent relocates within its difficulty band, using the same validated terrain points.
export function nextAgentRoute(previous: { x: number; z: number }, random = Math.random, home = previous) {
 const zone=agentDifficultyZone(home)
 const band=AGENT_SPAWNS.filter(p=>agentDifficultyZone(p)===zone)
 const choices=band.filter(p=>Math.hypot(p.x-previous.x,p.z-previous.z)>10)
 const pool=choices.length?choices:band
 return agentRoute(pool[Math.min(pool.length-1,Math.max(0,Math.floor(random()*pool.length)))])
}
