export type EnemySize = 'small'|'medium'|'large'
export const ENEMY_TIERS={small:{unlockLevel:1,scale:1,health:60,damage:8},medium:{unlockLevel:2,scale:1.4,health:100,damage:12},large:{unlockLevel:3,scale:1.8,health:160,damage:18}} as const
export const AGENT_SIZES:Record<string,EnemySize>={
 Aegis_Core:'medium',Arcane_Data_Core:'large',Aureate_Sentinel:'large',Smiling_Skybot:'small',
 Aegis_Drone:'small',Aethercore_Sentinel:'large',Orbital_Cipher:'medium',Pulse_Sentinel:'medium',Triad_Sentinel:'large'
}
export function enemyTierFor(id:string){return ENEMY_TIERS[AGENT_SIZES[id]??'small']}
