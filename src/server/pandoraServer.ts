import { agentPersonality, MAX_VILLAGE_LEVEL } from '../shared/visualRules'
import { playerUpgrades } from '../shared/playerUpgrades'
import { enemyTierFor } from '../shared/enemyTiers'
import { agentStats, agentXpReward, assignAgentLevelsByDistance } from '../shared/agentLevels'
import { TEST_TOOLS } from '../shared/testTools'
import { TOOL_RECEIVE_POINT, GUIDE_POINT, ARRIVAL_POINT, DELIVERY_POINTS, TUTORIAL_DONE, canGatherKind, nextTutorialStage, toolUnlocked } from '../shared/tutorial'
import { WORLD_RESOURCES } from '../shared/worldLayout'
import { nextAgentRoute } from '../shared/agents'
import { TOOL_RULES, isTool } from '../shared/tools'
import { SENTINELS, agentAttackHits, playerAttackRange } from '../shared/testEnemy'
import { updatePatrol, PatrolState } from './sentinelAI'
import { Storage } from '@dcl/sdk/server'
import { AvatarBase, PlayerIdentityData, Transform, engine } from '@dcl/sdk/ecs'
import { room } from '../shared/pandoraMessages'
import type { ResourceKind } from '../gameState'
import { SKILLS, levelForXp, migrateSkillLoadout } from '../shared/progression'

import { nearHealingTree, recoverVitals } from '../shared/recovery'

const PROFILE_KEY = 'pandora_profile_v1'
const VILLAGE_KEY = 'pandora_village_v1'
const RESOURCE_TYPES = ['wood', 'stone', 'fruit'] as const

interface Profile {
  introSeen: boolean; guideMet: boolean; tutorialStage: number; coins: number; xp: number; wood: number; stone: number; fruit: number; defeated: number; chests: number; collected: number
  skillPoints: number; learned: Record<string, number>; equippedSkills: string[]; health: number; aura: number; cycleBadges: number; contributedCycle: number; visitedPoints: Record<string, { x: number; y: number; z: number }>
}
interface EnemyState extends PatrolState { level: number; combatStyle: 'ranged' | 'melee'; attackRange: number; appearUntil: number; id: string; name: string; tier: 'normal' | 'elite' | 'guardian'; maxHealth: number; health: number; physicalResistance: number; magicResistance: number; damage: number; cadence: number; telegraphSeconds: number; respawnSeconds: number; respawnAt: number; participants: Record<string, number>; lastUsefulAt: number; nextAttackAt: number; telegraph: { target: string; endsAt: number; x: number | null; z: number | null } | null }
interface Village {
  level: number; wood: number; stone: number; fruit: number; coins: number; defeats: number; revision: number; cycle: number; contributors: string[]
}

const profiles = new Map<string, Profile>()
const lastGatherAt = new Map<string, number>()
const nodeCooldowns = new Map<string, number>()
const nodeHits = new Map<string, number>()
const chestCooldowns = new Map<string, number>()
const openedChests = new Map<string, string>()
const skillCooldowns = new Map<string, number>()
const lastAttackAt = new Map<string, number>()
const combatUntil = new Map<string, number>()
const shieldUntil = new Map<string, { until: number; reduction: number }>()
const linkFields = new Map<string, { until: number; rank: number }>()
const enemyTargetCursors = new Map<string, number>()
const lastNearTree = new Map<string, boolean>()
const lastPlayerUpdateAt = new Map<string, number>()
const travelPoints = new Map<string, Map<string, { x: number; y: number; z: number }>>()
const boostUntil = new Map<string, number>()
const ascensionUntil = new Map<string, { until: number; lift: number }>()
const enemies = new Map<string, EnemyState>(SENTINELS.map(({id,route,name,combatStyle,attackRange}) => [id, {
  id, level: 1, route, combatStyle, attackRange, position: { ...route[0] }, waypoint: 1, mode: 'patrol', target: '', patrolSpeed:agentPersonality(id).patrolSpeed,pauseSeed:agentPersonality(id).seed,pauseRemaining:agentPersonality(id).pause,
  name, tier: 'normal', maxHealth: enemyTierFor(id).health, health: enemyTierFor(id).health,
  physicalResistance: 0, magicResistance: 0, damage: enemyTierFor(id).damage, cadence: agentPersonality(id).cadence, telegraphSeconds: 0.4,
  respawnSeconds: 30, respawnAt: 0, appearUntil: 0, participants: {}, lastUsefulAt: 0, nextAttackAt: 0, telegraph: null
}]))
let treeTransitionAt = 0
let lastEnemyBroadcast = 0
let nextAgentLevelCheck = 0
const emptyProfile = (): Profile => ({ introSeen: false, guideMet: false, tutorialStage: 0, coins: 0, xp: 0, wood: 0, stone: 0, fruit: 0, defeated: 0, chests: 0, collected: 0, skillPoints: 1, learned: {}, equippedSkills: ['', '', ''], health: 100, aura: 100, cycleBadges: 0, contributedCycle: 0, visitedPoints: {} })
const emptyVillage = (): Village => ({ level: 1, wood: 0, stone: 0, fruit: 0, coins: 0, defeats: 0, revision: 0, cycle: 1, contributors: [] })
let village = emptyVillage()
let villageReady: Promise<void> | null = null

function addressKey(address: string): string {
  if (typeof address !== 'string' || address.length === 0) return ''
  return address.toLowerCase()
}
function validAddress(address: unknown): address is string { return typeof address === 'string' && addressKey(address) !== '' }
function safeCount(value: unknown) { return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0 }
async function loadProfile(address: string): Promise<Profile> {
  const key = addressKey(address)
  if (!key) return emptyProfile()
  const cached = profiles.get(key)
  if (cached) return cached
  try {
    const saved = await Storage.player.get<Partial<Profile>>(key, PROFILE_KEY)
    const profile = { ...emptyProfile(), ...(saved ?? {}) }
    for (const field of ['coins', 'xp', 'wood', 'stone', 'fruit', 'defeated', 'chests', 'collected'] as const) profile[field] = safeCount(profile[field])
    profile.tutorialStage = Math.min(TUTORIAL_DONE, safeCount(saved?.tutorialStage))
    profile.introSeen = typeof saved?.introSeen==='boolean' ? saved.introSeen : profile.tutorialStage>0
    profile.guideMet = saved?.guideMet === true || profile.tutorialStage >= 2
    profile.xp = typeof saved?.xp === 'number' && Number.isFinite(saved.xp) ? Math.max(0, saved.xp) : 0
    profile.coins = typeof saved?.coins === 'number' && Number.isFinite(saved.coins) ? Math.max(0, saved.coins) : 0
    for (const field of ['iron', 'plants', 'ore', 'supplyUnits']) delete (profile as unknown as Record<string, unknown>)[field]
    profile.learned = profile.learned ?? {}
    profile.learned = Object.fromEntries(SKILLS.map(skill => [skill.id, Math.min(3, safeCount(profile.learned[skill.id]))]))
    profile.equippedSkills = migrateSkillLoadout({ ...saved, learned: profile.learned })
    for (const field of ['activeSkills', 'passiveSkills', 'runes', 'equippedRunes', 'healthItems', 'auraItems']) delete (profile as unknown as Record<string, unknown>)[field]
    profile.skillPoints = typeof saved?.skillPoints === 'number' ? safeCount(saved.skillPoints) : levelForXp(profile.xp).level
    profile.cycleBadges = safeCount(profile.cycleBadges)
    profile.contributedCycle = safeCount(profile.contributedCycle)
    profile.visitedPoints = profile.visitedPoints ?? {}
    profiles.set(key, profile)
    return profile
  } catch (error) {
    console.error(`[Pandora] profile load failed for ${key}: ${error}`)
    const profile = emptyProfile()
    profiles.set(key, profile)
    return profile
  }
}

async function saveProfile(address: string, profile: Profile) {
  const key = addressKey(address)
  if (!key) return
  try { await Storage.player.set(key, PROFILE_KEY, profile) }
  catch (error) { console.error(`[Pandora] profile save failed: ${error}`) }
}

async function ensureVillage() {
  if (!villageReady) {
    villageReady = (async () => {
      try {
        const saved = await Storage.get<Partial<Village>>(VILLAGE_KEY)
        village = { ...emptyVillage(), ...(saved ?? {}) }
        for (const field of ['level', 'wood', 'stone', 'fruit', 'defeats', 'revision', 'cycle'] as const) village[field] = safeCount(village[field])
        for (const field of ['iron', 'plants', 'ore', 'supplyUnits']) delete (village as unknown as Record<string, unknown>)[field]
        village.coins = typeof village.coins === 'number' && Number.isFinite(village.coins) ? Math.max(0, village.coins) : 0
        village.level = Math.max(1, Math.min(MAX_VILLAGE_LEVEL, village.level))
        village.contributors = village.contributors ?? []
      } catch (error) { console.error(`[Pandora] village load failed: ${error}`) }
    })()
  }
  await villageReady
}

async function saveVillage() {
  try { await Storage.set(VILLAGE_KEY, village) }
  catch (error) { console.error(`[Pandora] village save failed: ${error}`) }
}

function sendVillage() {
  const t = targetsForLevel(village.level)
  void room.send('villageSnapshot', { treeTransitionAt: String(treeTransitionAt), level: village.level, wood: village.wood, stone: village.stone, fruit: village.fruit, coins: village.coins, defeats: village.defeats, revision: village.revision, cycle: village.cycle, targetWood: t.wood, targetStone: t.stone, targetFruit: t.fruit, targetCoins: t.coins, targetDefeats: t.defeats })
}

function sendResourceNodes(address?: string) {
  const now = Date.now()
  const nodes: { id: string; availableAt: number; hits: number }[] = []
  for (const key of new Set([...nodeCooldowns.keys(), ...nodeHits.keys()])) {
    const availableAt = nodeCooldowns.get(key) ?? 0
    if (availableAt && availableAt <= now) { nodeCooldowns.delete(key); nodeHits.delete(key); continue }
    nodes.push({ id: key.slice(key.indexOf(':') + 1), availableAt, hits: nodeHits.get(key) ?? 0 })
  }
  void room.send('resourceSnapshot', { nodesJson: JSON.stringify(nodes) }, address ? { to: [address] } : undefined)
}
function sendEnemies() {
  void room.send('enemySnapshot', { enemiesJson: JSON.stringify([...enemies.values()].filter(enemy=>village.level>=enemyTierFor(enemy.id).unlockLevel)) })
}

const menuPlayers = new Set<string>()
const tutorialBriefings = new Map<string, { stage:number; until:number }>()
// What each explorer holds, relayed to the others so they see it in that avatar's hand.
const heldTools = new Map<string, string>()
const otherAddresses = (address: string) => [...engine.getEntitiesWith(PlayerIdentityData)].map(([, identity]) => identity.address).filter(other => validAddress(other) && addressKey(other) !== addressKey(address))
const healingPlayers = new Map<string, boolean>()
function sendPlayer(address: string, profile: Profile) {
  const progress = levelForXp(profile.xp)
  const stats = attributes(profile)
  const maxHealth = playerUpgrades(levelForXp(profile.xp).level).maxHealth
  const maxAura = 100 + 2 * (stats.intelligence - 1)
  profile.health = Math.min(profile.health, maxHealth)
  profile.aura = Math.min(profile.aura, maxAura)
  const data = { ...profile, healingActive: !downedPlayers.has(addressKey(address)) && profile.health < maxHealth && healingPlayers.get(addressKey(address)) === true, carried: { wood: profile.wood, stone: profile.stone, fruit: profile.fruit }, ...progress, ...stats, maxHealth, maxAura, nearTree: nearHealingTree(playerPosition(address),village.level), travelPoints: [...Object.keys(profile.visitedPoints ?? {})] }
  void room.send('playerSnapshot', { coins: profile.coins, xp: Math.floor(profile.xp), level: progress.level, wood: profile.wood, stone: profile.stone, fruit: profile.fruit, defeated: profile.defeated, chests: profile.chests, collected: profile.collected, nextCoinAt: (Math.floor(profile.collected / 100) + 1) * 100, profileJson: JSON.stringify(data) }, { to: [address] })
}

// The name other explorers know a player by: their avatar name, or a shortened wallet address.
function playerName(address: string) {
  const entity = findEntity(address), name = entity === undefined ? '' : AvatarBase.getOrNull(entity)?.name?.trim() ?? ''
  return name || `${address.slice(0, 6)}…${address.slice(-4)}`
}
// A line for everyone's community feed: what the rest of the village is doing.
function communityEvent(text: string) { void room.send('communityEvent', { text }) }

function findEntity(address: string) {
  const key = addressKey(address)
  if (!key) return undefined
  for (const [entity, identity] of engine.getEntitiesWith(PlayerIdentityData)) if (addressKey(identity.address) === key) return entity
  return undefined
}

function equippedRank(profile: Profile, skillId: string) {
  return 0
}

function attributes(profile: Profile) {
  const growth = 0
  return { strength: 1 + growth, resilience: 1 + growth, intelligence: 1 + growth }
}

function grantXp(profile: Profile, amount: number) {
  const before = levelForXp(profile.xp).level
  profile.xp += amount
  const after = levelForXp(profile.xp).level
  // Health cap and attack damage derive automatically from the experience level; no skill points.
  return after - before
}

function markCycleContribution(address: string, profile: Profile) {
  if (profile.contributedCycle === village.cycle) return
  profile.contributedCycle = village.cycle
  const key = addressKey(address)
  if (!key) return
  if (!village.contributors.includes(key)) village.contributors.push(key)
}

function playerPosition(address: string) {
  const key = addressKey(address)
  if (!key) return null
  for (const [entity, identity] of engine.getEntitiesWith(PlayerIdentityData)) {
    if (addressKey(identity.address) !== key) continue
    const position = Transform.getOrNull(entity)?.position
    if (position) return position
  }
  return null
}

function enemyWorldPosition(id: string) { return enemies.get(id)?.position ?? SENTINELS[0].route[0] }

const VILLAGE_WAYPOINT = { x: 76, y: 3.94, z: 85 }
const WORLD_WAYPOINTS: Record<string, { x: number; y: number; z: number; island: 'forest' | 'caves' | 'ruins' }> = {
  'forest-village': { ...VILLAGE_WAYPOINT, island: 'forest' },
  'caves-entrance': { x: 102, y: 3.94, z: 85, island: 'caves' },
  'ruins-gate': { x: 128, y: 3.94, z: 85, island: 'ruins' }
}

function isNearVillage(address: string, range = 8) {
  const position = playerPosition(address)
  if (!position) return false
  return DELIVERY_POINTS.some(delivery=>Math.hypot(position.x-delivery.x,position.z-delivery.z)<=range)
}

function isNearPoint(address: string, x: number, z: number, range: number) {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return false
  const position = playerPosition(address)
  return !!position && Math.hypot(position.x - x, position.z - z) <= range
}

const VILLAGE_REQUIREMENTS = [
  { wood: 40, stone: 20, fruit: 30, defeats: 0 },
  { wood: 70, stone: 35, fruit: 45, defeats: 0 },
  { wood: 100, stone: 55, fruit: 65, defeats: 0 },
  { wood: 140, stone: 80, fruit: 90, defeats: 0 },
  { wood: 180, stone: 110, fruit: 120, defeats: 0 },
  { wood: 230, stone: 145, fruit: 150, defeats: 0 },
  { wood: 290, stone: 185, fruit: 185, defeats: 0 },
  { wood: 360, stone: 230, fruit: 225, defeats: 0 },
  { wood: 440, stone: 285, fruit: 270, defeats: 0 },
  { wood: 530, stone: 345, fruit: 320, defeats: 0 },
  { wood: 630, stone: 410, fruit: 375, defeats: 0 },
  { wood: 740, stone: 485, fruit: 435, defeats: 0 },
  { wood: 860, stone: 565, fruit: 500, defeats: 0 }
]
const VILLAGE_SHARD_REQUIREMENTS = [3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24]
function targetsForLevel(level: number) { if (level >= MAX_VILLAGE_LEVEL) return {wood:0,stone:0,fruit:0,coins:0,defeats:0}; const index = Math.max(0, Math.min(12, level - 1)); return { ...VILLAGE_REQUIREMENTS[index], coins: VILLAGE_SHARD_REQUIREMENTS[index] } }

async function progressVillage() {
  while (village.level < MAX_VILLAGE_LEVEL) {
    const target = targetsForLevel(village.level)
    if (village.wood < target.wood || village.stone < target.stone || village.fruit < target.fruit || village.defeats < target.defeats || village.coins < target.coins) break
    village.wood = 0; village.stone = 0; village.fruit = 0; village.coins = 0; village.defeats = 0
    village.revision++
    treeTransitionAt = Date.now()+1500
    village.level++
    void room.send('pandoraFeedback', { text: `Novaterra has reached level ${village.level}!` })
    communityEvent(`Novaterra reached level ${village.level}!`)
  }
}

async function setupPlayer(address: string) {
  if (!validAddress(address)) return
  const profile = await loadProfile(address)
  if (profile.tutorialStage === 0) { const entity = findEntity(address); if (entity) Transform.getMutable(entity).position = { ...ARRIVAL_POINT } }
  travelPoints.set(addressKey(address)!, new Map(Object.entries(profile.visitedPoints ?? {})))
  sendPlayer(address, profile)
  sendVillage()
  sendEnemies()
}

async function handleMenuAction(_data: { action: string; value: string; slot: number }, address: string) {
  if (validAddress(address)) feedback(address, 'Skills are currently disabled.')
}

async function handleSkillUse(_data: { skillId: string; enemyId: string }, address: string) {
  if (validAddress(address)) feedback(address, 'Skills are currently disabled.')
}

async function handleAttack(data: { enemyId: string; tool: string }, address: string) {
  if (downedPlayers.has(addressKey(address))) return
  if (!isTool(data.tool)) return
  const attacker = await loadProfile(address)
  if ((tutorialBriefings.get(addressKey(address))?.until ?? 0) > Date.now()) return
  if (attacker.tutorialStage < 4 || !toolUnlocked(attacker.tutorialStage, data.tool)) { feedback(address, 'Complete the gathering objectives before fighting.'); return }
  const tool = TOOL_RULES[data.tool]
  if (!validAddress(address)) return
  const now = Date.now()
  const position = playerPosition(address)
  const targetable = [...enemies.values()].filter((candidate) => candidate.health > 0 && candidate.respawnAt <= now && village.level>=enemyTierFor(candidate.id).unlockLevel)
  const enemy = data.enemyId
    ? enemies.get(data.enemyId)
    : position
      ? targetable.sort((a, b) => {
          const aPoint = enemyWorldPosition(a.id); const bPoint = enemyWorldPosition(b.id)
          return Math.hypot(position.x - aPoint.x, position.z - aPoint.z) - Math.hypot(position.x - bPoint.x, position.z - bPoint.z)
        })[0]
      : undefined
  if (enemy && village.level < enemyTierFor(enemy.id).unlockLevel) return
  if (!enemy) { feedback(address, data.enemyId ? 'That creature is not part of the current bestiary.' : 'No enemy is close enough to attack.'); return }
  if (enemy.health <= 0 || now < enemy.appearUntil) return
  if (enemy.respawnAt > now) { feedback(address, `${enemy.name} is recovering. Try again shortly.`); return }
  if (enemy.respawnAt && enemy.respawnAt <= now) { enemy.health = enemy.maxHealth; enemy.respawnAt = 0; enemy.participants = {}; sendEnemies() }
  const key = addressKey(address)
  if (now < (lastAttackAt.get(key) ?? 0)) { feedback(address, 'Catch your breath before the next attack.'); return }
  const targetPoint = enemyWorldPosition(enemy.id)
  const reach = playerAttackRange(enemy.id)
  if (!position || Math.hypot(position.x - targetPoint.x, position.z - targetPoint.z) > reach) { feedback(address, `${enemy.name} is out of attack range. Move closer.`); return }
  lastAttackAt.set(key, now + tool.cooldown)
  combatUntil.set(key, now + 8000)
  enemy.participants[key] = now
  enemy.lastUsefulAt = now
  if (!enemy.nextAttackAt) enemy.nextAttackAt = now + enemy.cadence * 1000
  const profile = await loadProfile(address)
  const physicalDamage = tool.damage + playerUpgrades(levelForXp(profile.xp).level).damageBonus
  let linkBonus = 0
  for (const [helper, field] of linkFields) {
    if (field.until <= now || helper === key) continue
    const helperPos = playerPosition(helper)
    const playerPos = playerPosition(address)
    if (!helperPos || !playerPos || Math.hypot(helperPos.x - playerPos.x, helperPos.y - playerPos.y, helperPos.z - playerPos.z) > [0, 4, 5, 6][field.rank]) continue
    linkBonus = Math.max(linkBonus, [0, 0.1, 0.15, 0.2][field.rank])
    enemy.participants[helper] = now
    enemy.lastUsefulAt = now
    combatUntil.set(helper, now + 8000)
  }
  const damage = Math.max(1, Math.floor(physicalDamage * (1 + linkBonus) * (1 - enemy.physicalResistance)))
  enemy.health = Math.max(0, enemy.health - damage)
  if (enemy.health > 0) {
    sendEnemies()
    feedback(address, `Punch landed on ${enemy.name} · shared health ${Math.ceil(enemy.health / enemy.maxHealth * 100)}%.`)
    return
  }

  await rewardEnemyDefeat(enemy, now, address)
}

async function rewardEnemyDefeat(enemy: EnemyState, now: number, recipient: string) {
  if (enemy.respawnAt > now) return
  enemy.health = 0
  enemy.telegraph = null
  enemy.respawnAt = now + enemy.respawnSeconds * 1000
  sendEnemies()
  const contributors = Object.entries(enemy.participants).filter(([, lastUsefulAction]) => now - lastUsefulAction <= 20_000)
  const baseXp = agentXpReward(enemy.tier === 'normal' ? 10 : enemy.tier === 'elite' ? 25 : 60, enemy.level)
  village.defeats++
  village.revision++
  const names = contributors.map(([contributorAddress]) => playerName(contributorAddress))
  if (names.length) communityEvent(`${names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2}` : names.join(' & ')} defeated ${enemy.name}`)
  for (const [contributorAddress] of contributors) {
    const contributor = await loadProfile(contributorAddress)
    contributor.defeated++
    contributor.tutorialStage = nextTutorialStage(contributor.tutorialStage, 'enemy')
    const levelUps = grantXp(contributor, baseXp + (contributors.length >= 2 ? baseXp * 0.25 : 0))
    const shardReward = addressKey(contributorAddress) === addressKey(recipient) ? 1 : 0
    contributor.coins += shardReward
    if (shardReward) void room.send('shardDropped', { ...enemy.position }, { to: [contributorAddress] })
    markCycleContribution(contributorAddress, contributor)

    await saveProfile(contributorAddress, contributor)
    sendPlayer(contributorAddress, contributor)
    feedback(contributorAddress, `${enemy.name} defeated!${contributors.length >= 2 ? ' Collaboration bonus!' : ''}${shardReward ? ' +1 memory shard.' : ' Shared XP reward.'}${levelUps ? ` Level up! ` : ''}`)
  }
  enemy.health = 0
  enemy.telegraph = null
  enemy.respawnAt = now + enemy.respawnSeconds * 1000
  await progressVillage()
  await saveVillage()
  sendVillage()
  sendEnemies()
}

// Fallen players wait on the Game Over screen: enemies ignore them until they continue.
const downedPlayers = new Set<string>()

async function applyEnemyDamage(address: string, enemy: EnemyState) {
  if ((tutorialBriefings.get(addressKey(address))?.until ?? 0) > Date.now()) return
  if (downedPlayers.has(addressKey(address)) || menuPlayers.has(addressKey(address))) return
  const profile = await loadProfile(address)
  const now = Date.now()
  combatUntil.set(addressKey(address), now + 8000)
  const resilienceGain = Math.max(0, attributes(profile).resilience - 1)
  const mitigation = 1 - (1 - resilienceGain / (100 + resilienceGain)) * (1 - [0, 0.05, 0.1, 0.15][equippedRank(profile, 'damage-reduction')]) * (1 - ((shieldUntil.get(addressKey(address))?.until ?? 0) > now ? shieldUntil.get(addressKey(address))?.reduction ?? 0 : 0))
  const damage = Math.max(1, Math.round(enemy.damage * (1 - mitigation)))
  profile.health = Math.max(0, profile.health - damage)
  if (profile.health <= 0) {
    downedPlayers.add(addressKey(address))
    combatUntil.delete(addressKey(address))
    void room.send('playerDefeated', { enemyName: enemy.name }, { to: [address] })
    communityEvent(`${playerName(address)} fell to ${enemy.name}`)
    feedback(address, `${enemy.name} defeated you.`)
  } else feedback(address, `${enemy.name} hit you for ${damage} damage.`)
  await saveProfile(address, profile)
  sendPlayer(address, profile)
}

async function revivePlayer(address: string) {
  const profile = await loadProfile(address)
  if (!downedPlayers.delete(addressKey(address)) && profile.health > 0) return
  const entity = findEntity(address)
  if (entity) Transform.getMutable(entity).position = { x: 80, y: 2.8, z: 82.5 }
  profile.health = playerUpgrades(levelForXp(profile.xp).level).maxHealth
  await saveProfile(address, profile)
  sendPlayer(address, profile)
}

// Re-levels agents to the explorers online now. An agent that is fighting or wounded keeps its level until it is
// back on patrol at full health, or until it respawns.
function refreshAgentLevels() {
  const levels = [...engine.getEntitiesWith(PlayerIdentityData)].map(([, identity]) => profiles.get(addressKey(identity.address))).filter((profile): profile is Profile => !!profile).map(profile => levelForXp(profile.xp).level)
  const active = [...enemies.values()].filter(enemy => village.level >= enemyTierFor(enemy.id).unlockLevel)
  const desired = assignAgentLevelsByDistance(active.map(enemy => enemy.route[0]), levels)
  let changed = false
  active.forEach((enemy, slot) => {
    const level = desired[slot]
    const idle = enemy.health <= 0 || (enemy.mode === 'patrol' && enemy.health >= enemy.maxHealth && !enemy.telegraph)
    if (level === enemy.level || !idle) return
    const stats = agentStats(enemyTierFor(enemy.id), level)
    enemy.level = level; enemy.maxHealth = stats.health; enemy.damage = stats.damage
    if (enemy.health > 0) enemy.health = stats.health
    changed = true
  })
  if (changed) sendEnemies()
}

function feedback(address: string, text: string) {
  if (!validAddress(address)) return
  void room.send('pandoraFeedback', { text }, { to: [address] })
}

export function setupPandoraServer() {
  void ensureVillage()
  engine.addSystem((dt) => {
    const now = Date.now()
    for (const [entity, identity] of engine.getEntitiesWith(PlayerIdentityData)) {
      const key = addressKey(identity.address)
      if (!key) continue
      if (downedPlayers.has(key) || now - (lastPlayerUpdateAt.get(key) ?? 0) < 250) continue
      const elapsed = Math.min(0.5, (now - (lastPlayerUpdateAt.get(key) ?? now)) / 1000)
      lastPlayerUpdateAt.set(key, now)
      void loadProfile(identity.address).then(async (profile) => {
        const inCombat = now < (combatUntil.get(key) ?? 0)
        const stats = attributes(profile)
        const recovery = recoverVitals(profile.health, profile.aura, playerUpgrades(levelForXp(profile.xp).level).maxHealth, 100 + 2 * (stats.intelligence - 1), elapsed, nearHealingTree(playerPosition(identity.address),village.level), inCombat, equippedRank(profile, 'aura-regeneration'), equippedRank(profile, 'healing-pulse'))
        const nearTree = nearHealingTree(playerPosition(identity.address),village.level)
        const activelyHealing = recovery.health > profile.health && recovery.health < playerUpgrades(levelForXp(profile.xp).level).maxHealth
        const healingChanged = healingPlayers.get(key) !== activelyHealing
        healingPlayers.set(key, activelyHealing)
        const movedHealingRange = lastNearTree.get(key) !== nearTree
        lastNearTree.set(key, nearTree)
        const changed = Math.floor(recovery.aura) !== Math.floor(profile.aura) || Math.floor(recovery.health) !== Math.floor(profile.health)
        profile.aura = recovery.aura; profile.health = recovery.health
        if (changed) await saveProfile(identity.address, profile)
        if (changed || movedHealingRange || healingChanged) sendPlayer(identity.address, profile)
        void boostUntil.get(key); void ascensionUntil.get(key); void entity
      })
    }
    const players = [...engine.getEntitiesWith(PlayerIdentityData)].map(([,identity]) => ({ address: addressKey(identity.address), position: playerPosition(identity.address) })).filter((p): p is { address: string; position: { x: number; y: number; z: number } } => !!p.address && !!p.position && !downedPlayers.has(p.address) && !menuPlayers.has(p.address) && (tutorialBriefings.get(p.address)?.until ?? 0) <= now && (profiles.get(p.address)?.tutorialStage ?? 0) >= 4)
    if (now >= nextAgentLevelCheck) { nextAgentLevelCheck = now + 3000; refreshAgentLevels() }
    for (const enemy of enemies.values()) {
      if(village.level<enemyTierFor(enemy.id).unlockLevel){enemy.telegraph=null;enemy.nextAttackAt=0;continue}
      if (enemy.health <= 0 && enemy.respawnAt && enemy.respawnAt <= now) {
        enemy.route = nextAgentRoute(enemy.position, Math.random, enemy.route[0])
        enemy.appearUntil = now + 900
        enemy.health = enemy.maxHealth; enemy.respawnAt = 0; enemy.participants = {}; enemy.telegraph = null; enemy.nextAttackAt = 0
        enemy.position = { ...enemy.route[0] }; enemy.mode = 'patrol'; enemy.target = ''; enemy.waypoint = 1
        refreshAgentLevels()
      }
      if (enemy.health <= 0 || now < enemy.appearUntil) continue
      const previousMode = enemy.mode
      const target = updatePatrol(enemy,players,dt)
      if (enemy.mode === 'return' && previousMode !== 'return') { enemy.health = enemy.maxHealth; enemy.participants = {}; enemy.telegraph = null; enemy.nextAttackAt = 0 }
      if (!target || enemy.mode !== 'attack') { enemy.telegraph = null; enemy.nextAttackAt = 0; continue }
      combatUntil.set(target.address, now + 8000)
      if (!enemy.nextAttackAt) enemy.nextAttackAt = now + agentPersonality(enemy.id).attackDelay
      if (!enemy.telegraph && now >= enemy.nextAttackAt) {
        enemy.telegraph = { target: target.address, endsAt: now + enemy.telegraphSeconds * 1000, x: target.position.x, z: target.position.z }
      } else if (enemy.telegraph && now >= enemy.telegraph.endsAt) {
        const position = playerPosition(enemy.telegraph.target)
        if (agentAttackHits(position, enemy.position, enemy.telegraph, enemy.attackRange)) void applyEnemyDamage(enemy.telegraph.target,enemy)
        enemy.telegraph = null; enemy.nextAttackAt = now + enemy.cadence*1000
      }
    }
    if (now-lastEnemyBroadcast >= 100) { lastEnemyBroadcast = now; sendEnemies() }
  }, undefined, 'pandora-server-systems')
  room.onMessage('connectPandora', async (_data, context) => {
    if (!context || !validAddress(context.from)) return
    menuPlayers.add(addressKey(context.from))
    await ensureVillage()
    await setupPlayer(context.from)
    refreshAgentLevels()
    for (const [address, tool] of heldTools) if (address !== addressKey(context.from)) void room.send('playerTool', { address, tool }, { to: [context.from] })
    sendResourceNodes(context.from)
    await revivePlayer(context.from)
  })
  // Testing control: use normal progression, persistence and the same synchronised tree timestamp.
  room.onMessage('testVillageLevelUpRequest', async (data, context) => {
    if (!TEST_TOOLS || !data.requested || !context || !validAddress(context.from)) return
    await ensureVillage()
    if (village.level >= MAX_VILLAGE_LEVEL) { feedback(context.from, 'Novaterra has reached the maximum level: 100.'); return }
    if (treeTransitionAt > 0 && Date.now() < treeTransitionAt + 11000) {
      feedback(context.from, 'Wait for the current tree transition to finish.')
      return
    }
    const target = targetsForLevel(village.level)
    village.wood = target.wood; village.stone = target.stone; village.fruit = target.fruit
    village.coins = target.coins; village.defeats = target.defeats
    await progressVillage()
    await saveVillage()
    sendVillage(); sendEnemies()
  })
  room.onMessage('restartIntroRequest', async (_data, context) => {
    if (!TEST_TOOLS || !context || !validAddress(context.from) || downedPlayers.has(addressKey(context.from))) return
    await ensureVillage()
    const key = addressKey(context.from), profile = await loadProfile(context.from)
    tutorialBriefings.delete(key)
    menuPlayers.add(key)
    // The player starts over as on their first visit: level, XP, skills, carried resources, travel points and the
    // tutorial all go back to a new explorer's.
    Object.assign(profile, emptyProfile())
    for (const perPlayer of [lastGatherAt, lastAttackAt, combatUntil, healingPlayers, lastNearTree, travelPoints, boostUntil, ascensionUntil, shieldUntil, linkFields, lastPlayerUpdateAt]) perPlayer.delete(key)
    // Restart is a testing action: reset the shared village, not other players' inventories.
    village.level = 1
    village.wood = 0; village.stone = 0; village.fruit = 0; village.coins = 0; village.defeats = 0
    village.revision++
    treeTransitionAt = 0
    await Promise.all([saveProfile(context.from, profile), saveVillage()])
    sendPlayer(context.from, profile)
    sendVillage()
    sendEnemies()
  })
  room.onMessage('tutorialBriefingRequest', async (data,context) => {
    if (!context || !validAddress(context.from)) return
    const key=addressKey(context.from)
    const profile=await loadProfile(context.from)
    if(!data.active){if(tutorialBriefings.get(key)?.stage===data.stage)tutorialBriefings.delete(key);return}
    if(downedPlayers.has(key)||profile.tutorialStage!==data.stage||data.stage<1||data.stage>TUTORIAL_DONE)return
    if(data.stage>=2&&data.stage<=4&&tutorialBriefings.get(key)?.stage!==data.stage){
      const entity=findEntity(context.from)
      if(entity)Transform.getMutable(entity).position={...TOOL_RECEIVE_POINT}
    }
    tutorialBriefings.set(key,{stage:data.stage,until:Date.now()+15_000})
  })
  room.onMessage('guideArrivalRequest', async (_data, context) => {
    if (!context || !validAddress(context.from) || downedPlayers.has(addressKey(context.from))) return
    const profile = await loadProfile(context.from)
    if (profile.tutorialStage !== 1 || profile.guideMet || !isNearPoint(context.from, GUIDE_POINT.x, GUIDE_POINT.z, 6)) return
    profile.guideMet = true
    await saveProfile(context.from, profile); sendPlayer(context.from, profile)
  })
  room.onMessage('introCompleteRequest', async (_data, context) => {
    if (!context || !validAddress(context.from)) return
    const profile = await loadProfile(context.from)
    menuPlayers.delete(addressKey(context.from))
    profile.introSeen = true
    profile.tutorialStage = nextTutorialStage(profile.tutorialStage, 'intro')
    await saveProfile(context.from, profile); sendPlayer(context.from, profile)
  })
  // Skip Tutorial: an explorer past the intro finishes the guided objectives at once, with every tool unlocked.
  room.onMessage('skipTutorialRequest', async (_data, context) => {
    if (!TEST_TOOLS || !context || !validAddress(context.from) || downedPlayers.has(addressKey(context.from))) return
    const profile = await loadProfile(context.from)
    if (profile.tutorialStage < 1 || profile.tutorialStage >= TUTORIAL_DONE) return
    tutorialBriefings.delete(addressKey(context.from))
    profile.introSeen = true; profile.guideMet = true; profile.tutorialStage = TUTORIAL_DONE
    await saveProfile(context.from, profile); sendPlayer(context.from, profile)
  })
  room.onMessage('toolEquipped', (data, context) => {
    if (!context || !validAddress(context.from) || !['', 'axe', 'pickaxe', 'sword'].includes(data.tool)) return
    const address = addressKey(context.from)
    if ((heldTools.get(address) ?? '') === data.tool) return
    heldTools.set(address, data.tool)
    const to = otherAddresses(context.from)
    if (to.length) void room.send('playerTool', { address, tool: data.tool }, { to })
  })
  room.onMessage('continueRequest', async (_data, context) => {
    if (!context || !validAddress(context.from)) return
    await ensureVillage()
    await revivePlayer(context.from)
  })
  room.onMessage('waypointVisit', async (data, context) => {
    if (!context || !validAddress(context.from) || !data.id || data.id.length > 64) return
    const point = WORLD_WAYPOINTS[data.id]
    if (!point) return
    if (!isNearPoint(context.from, point.x, point.z, 8)) { feedback(context.from, 'Move within 8 metres of the travel waypoint.'); return }
    const points = travelPoints.get(addressKey(context.from)) ?? new Map()
    points.set(data.id, point)
    travelPoints.set(addressKey(context.from), points)
    const profile = await loadProfile(context.from)
    profile.visitedPoints[data.id] = point
    await saveProfile(context.from, profile)
    sendPlayer(context.from, profile)
    feedback(context.from, `Travel waypoint visited: ${data.id}. It is now available to Phase Jump.`)
  })
  room.onMessage('menuActionRequest', async (data, context) => {
    if (!context || !validAddress(context.from)) return
    await ensureVillage()
    await handleMenuAction(data, context.from)
  })
  room.onMessage('skillRequest', async (data, context) => {
    if (!context) return
    await ensureVillage()
    await handleSkillUse(data, context.from)
  })
  room.onMessage('attackRequest', async (data, context) => {
    if (!context || !validAddress(context.from)) return
    await ensureVillage()
    await handleAttack(data, context.from)
  })
  room.onMessage('gatherRequest', async (data, context) => {
    if (!context || !validAddress(context.from) || downedPlayers.has(addressKey(context.from))) return
    await ensureVillage()
    const address = context.from
    const profile = await loadProfile(address)
    const kind = data.kind as typeof RESOURCE_TYPES[number]
    if ((profile.tutorialStage === 1 && !profile.guideMet) || !canGatherKind(profile.tutorialStage, kind)) { feedback(address, 'Follow Pandora: complete the current tutorial objective first.'); return }
    if (!RESOURCE_TYPES.includes(kind)) return
    const position = playerPosition(context.from)
    const node = WORLD_RESOURCES.find(node => node.id === data.nodeId && node.kind === kind)
    if (!position || !node || Math.hypot(position.x - node.position.x, position.z - node.position.z) > 8 || Math.abs(position.y - node.position.y) > 5) { feedback(context.from, 'Move within 8 metres of that resource.'); return }
    const now = Date.now()
    if (now - (lastGatherAt.get(addressKey(address)) ?? 0) < 900) return
    const nodeKey = `${kind}:${data.nodeId}`
    if (now < (nodeCooldowns.get(nodeKey) ?? 0)) { feedback(address, 'This resource is recovering. Try another nearby node.'); return }
    if ((nodeCooldowns.get(nodeKey) ?? 0) > 0) { nodeCooldowns.delete(nodeKey); nodeHits.delete(nodeKey) }
    lastGatherAt.set(addressKey(address), now)
    const hits = (nodeHits.get(nodeKey) ?? 0) + 1
    nodeHits.set(nodeKey, hits)
    const depleted = hits >= node.hitsRequired
    if (depleted) nodeCooldowns.set(nodeKey, now + 30_000)
    // The shared node loses one hit; its author receives that hit's yield.
    // Reserve synchronously before saving, so simultaneous players cannot claim a final hit twice.
    sendResourceNodes()
    const amount = 5
    if (depleted) profile.tutorialStage = nextTutorialStage(profile.tutorialStage, kind)
    profile[kind] += amount
    profile.collected += amount
    grantXp(profile, amount)
    await saveProfile(address, profile)
    sendPlayer(address, profile)
    feedback(address, `Collected ${amount} ${kind}. ${depleted ? 'Resource depleted.' : `${hits}/${node.hitsRequired} hits.`} ${profile.tutorialStage >= 5 ? 'Deliver your resources at the village.' : ''}`.trim())

  })
  room.onMessage('deliverRequest', async (_data, context) => {
    if (!context || !validAddress(context.from) || downedPlayers.has(addressKey(context.from))) return
    await ensureVillage()
    if (village.level >= MAX_VILLAGE_LEVEL) { feedback(context.from, 'Novaterra has reached the maximum level: 100.'); return }
    if (!isNearVillage(context.from, 8)) { feedback(context.from, 'Return to the village delivery point to turn in your resources.'); return }
    const profile = await loadProfile(context.from)
    if (profile.tutorialStage < 5) { feedback(context.from, 'Follow Pandora: finish the tutorial objectives before delivering.'); return }
    const total = profile.wood + profile.stone + profile.fruit + profile.coins
    if (!total) { feedback(context.from, 'You are not carrying village resources.'); return }
    // The first delivery is the last tutorial step; Pandora announces the end on the client.
    profile.tutorialStage = nextTutorialStage(profile.tutorialStage, 'deliver')
    village.wood += profile.wood; village.stone += profile.stone; village.fruit += profile.fruit; village.coins += profile.coins;
    markCycleContribution(context.from, profile)
    village.revision++
    const delivered = { wood: profile.wood, stone: profile.stone, fruit: profile.fruit, coins: profile.coins }
    profile.wood = 0; profile.stone = 0; profile.fruit = 0; profile.coins = 0;
    await progressVillage()
    await Promise.all([saveProfile(context.from, profile), saveVillage()])
    sendPlayer(context.from, profile); sendVillage(); sendEnemies()
    communityEvent(`${playerName(context.from)} delivered ${Object.entries(delivered).filter(([, amount]) => amount > 0).map(([kind, amount]) => `${amount} ${kind === 'coins' ? 'shards' : kind}`).join(', ')}`)
    void room.send('pandoraFeedback', { text: `Delivered ${Object.entries(delivered).filter(([, amount]) => amount > 0).map(([kind, amount]) => `${amount} ${kind === 'coins' ? 'memory shards' : kind}`).join(' · ')}. The whole village benefits.` }, { to: [context.from] })
  })
}
