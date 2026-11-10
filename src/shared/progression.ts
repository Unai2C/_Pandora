export type SkillBranch = 'explorer' | 'warrior' | 'mage'

export interface SkillDefinition {
  id: string
  name: string
  branch: SkillBranch
  automatic?: boolean
  description: string
  aura: number
  cooldown: number
}

export const SKILLS: SkillDefinition[] = [
  { id: 'boost', name: 'Boost', branch: 'explorer', description: 'Movement speed +20/30/40% for 4/5/6s.', aura: 15, cooldown: 15 },
  { id: 'ascension', name: 'Ascension', branch: 'explorer', description: 'Vertical lift 3/5/7m; controlled air 1.5/2/2.5s.', aura: 25, cooldown: 20 },
  { id: 'phase-jump', name: 'Phase Jump', branch: 'explorer', description: 'Teleport to a visited travel point.', aura: 35, cooldown: 30 },
  { id: 'impact-pulse', name: 'Impact Pulse', branch: 'warrior', description: 'Area physical damage: 150/200/250% basic attack.', aura: 20, cooldown: 8 },
  { id: 'kinetic-shield', name: 'Kinetic Shield', branch: 'warrior', description: 'Reduce incoming damage 20/30/40% for 4/5/6s.', aura: 25, cooldown: 18 },
  { id: 'precision-shot', name: 'Precision Shot', branch: 'warrior', description: 'Long-range physical damage: 200/275/350%.', aura: 25, cooldown: 10 },
  { id: 'arcane-bolt', name: 'Arcane Bolt', branch: 'mage', description: 'Magic projectile; damage scales with Intelligence.', aura: 25, cooldown: 8 },
  { id: 'healing-pulse', name: 'Tree Affinity', automatic: true, branch: 'mage', description: 'Healing near the village tree +10/20/30% while equipped.', aura: 0, cooldown: 0 },
  { id: 'link-field', name: 'Link Field', branch: 'mage', description: 'Nearby allies deal 10/15/20% extra damage briefly.', aura: 30, cooldown: 20 },
  { id: 'swift-movement', name: 'Swift Movement', branch: 'explorer', automatic: true, description: 'Movement speed +5/10/15% while equipped.', aura: 0, cooldown: 0 },
  { id: 'damage-reduction', name: 'Damage Reduction', branch: 'warrior', automatic: true, description: 'Incoming damage -5/10/15% while equipped.', aura: 0, cooldown: 0 },
  { id: 'aura-regeneration', name: 'Aura Regeneration', branch: 'mage', automatic: true, description: 'Aura regeneration +10/20/30% while equipped.', aura: 0, cooldown: 0 }
]

export const BRANCH_ATTRIBUTES: Record<SkillBranch, { strength: number; resilience: number; intelligence: number }> = {
  explorer: { strength: 2, resilience: 2, intelligence: 2 },
  warrior: { strength: 3, resilience: 2, intelligence: 1 },
  mage: { strength: 1, resilience: 2, intelligence: 3 }
}

export function xpNeededForNextLevel(level: number) { return 100 + 20 * Math.max(0, level - 1) }
export function levelForXp(xp: number) {
  let level = 1
  let remaining = Math.max(0, xp)
  while (level < 99 && remaining >= xpNeededForNextLevel(level)) {
    remaining -= xpNeededForNextLevel(level)
    level++
  }
  return { level, intoLevel: level >= 99 ? 0 : remaining, needed: level >= 99 ? 0 : xpNeededForNextLevel(level) }
}

export const EQUIPPED_SKILL_LIMIT = 3
export const SKILL_PATHS = [
  { branch: 'explorer', name: 'EXPLORER', nodes: ['boost', 'swift-movement', 'ascension', 'phase-jump'] },
  { branch: 'warrior', name: 'WARRIOR', nodes: ['impact-pulse', 'damage-reduction', 'kinetic-shield', 'precision-shot'] },
  { branch: 'mage', name: 'MAGE', nodes: ['arcane-bolt', 'aura-regeneration', 'healing-pulse', 'link-field'] }
] as const

export function prerequisiteFor(id: string): string | undefined {
  for (const path of SKILL_PATHS) {
    const index = (path.nodes as readonly string[]).indexOf(id)
    if (index > 0) return path.nodes[index - 1]
  }
  return undefined
}
export function canLearnSkill(id: string, learned: Record<string, number>) {
  if (!SKILLS.some(skill => skill.id === id)) return false
  const parent = prerequisiteFor(id)
  return !parent || (learned[parent] ?? 0) >= 1
}
export function normalizeSkillLoadout(ids: unknown, learned: Record<string, number>) {
  const result = ['', '', '']
  if (!Array.isArray(ids)) return result
  for (let slot = 0; slot < EQUIPPED_SKILL_LIMIT; slot++) {
    const id = ids[slot]
    if (typeof id === 'string' && SKILLS.some(skill => skill.id === id) && (learned[id] ?? 0) > 0 && !result.includes(id)) result[slot] = id
  }
  return result
}
export function migrateSkillLoadout(saved: { equippedSkills?: unknown; activeSkills?: unknown; passiveSkills?: unknown; learned?: Record<string, number> }) {
  const legacy = [...(Array.isArray(saved.activeSkills) ? saved.activeSkills : []), ...(Array.isArray(saved.passiveSkills) ? saved.passiveSkills : [])]
  return normalizeSkillLoadout(saved.equippedSkills ?? [...new Set(legacy.filter(id => typeof id === 'string' && (saved.learned?.[id] ?? 0) > 0))], saved.learned ?? {})
}

