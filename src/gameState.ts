import { isCinematicLocked } from './cinematicLock'
import { syncTutorial, isIntroActive, getTutorialStage, getTutorialActionPrompt } from './tutorial'
import { engine, Transform } from '@dcl/sdk/ecs'
import { equipTool, getEquippedTool, getResourceNode } from './equipment'
import { spawnImpact } from './impactEffects'
import { isPlayerDown, setRespawnLevel, startPlayerDeath } from './playerDeath'
import { dropShard } from './shardDrop'
import { TOOL_RULES } from './shared/tools'
import { WORLD_RESOURCES } from './shared/worldLayout'
import { playToolAttack } from './punchAnimation'
import { room } from './shared/pandoraMessages'
import { playPunchAnimation, playGatherAnimation, playHitReaction } from './punchAnimation'
import { playActionSound, playInteractionSound } from './audio'

export type ResourceKind = 'wood' | 'stone' | 'fruit'
export type VillageMaterial = ResourceKind

export interface PlayerProgress {
  introSeen: boolean
  healingActive?: boolean
  guideMet: boolean
  tutorialStage: number
  coins: number
  level: number
  xp: number
  carried: Record<ResourceKind, number>
  defeated: number
  chests: number
  collected: number
  nextCoinAt: number
  skillPoints: number
  learned: Record<string, number>
  equippedSkills: string[]
  nearTree: boolean
  health: number
  maxHealth: number
  aura: number
  maxAura: number
  intoLevel: number
  needed: number
  strength: number
  resilience: number
  intelligence: number
  cycleBadges: number
  travelPoints: string[]
}

export interface VillageProgress {
  level: number
  defeats: number
  revision: number
  stock: Record<VillageMaterial, number> & { coins: number }
  targets: Record<VillageMaterial | 'defeats' | 'coins', number>
  cycle: number
}
export interface EnemyProgress { level?: number; combatStyle?: 'ranged' | 'melee'; attackRange?: number; position: { x: number; y: number; z: number }; mode: 'patrol' | 'chase' | 'return' | 'attack'; target: string; id: string; name: string; tier: 'normal' | 'elite' | 'guardian'; maxHealth: number; health: number; respawnAt: number; telegraph: { target: string; endsAt: number; x: number | null; z: number | null } | null }

const player: PlayerProgress = { introSeen:false, guideMet: false, tutorialStage: 0, coins: 0, level: 1, xp: 0, carried: { wood: 0, stone: 0, fruit: 0 }, defeated: 0, chests: 0, collected: 0, nextCoinAt: 100, skillPoints: 1, learned: {}, equippedSkills: ['', '', ''], nearTree: false, health: 100, maxHealth: 100, aura: 100, maxAura: 100, intoLevel: 0, needed: 100, strength: 1, resilience: 1, intelligence: 1, cycleBadges: 0, travelPoints: [] }
const village: VillageProgress = { level: 1, stock: { wood: 0, stone: 0, fruit: 0, coins: 0 }, defeats: 0, revision: 0, cycle: 1, targets: { wood: 40, stone: 20, fruit: 30, coins: 3, defeats: 0 } }
let message = '', messageAt = 0
// A personal level-up stays in the action panel for a few seconds even if feedback arrives right after it.
let levelUpText = '', levelUpUntil = 0
const MESSAGE_SECONDS = 5000
let enemyStates: EnemyProgress[] = []
const listeners = new Set<() => void>()
type SnapshotEvent = { treeTransitionAt?: number; previousLevel: number | null; level: number }
const playerSnapshotListeners = new Set<(event: SnapshotEvent) => void>()
const villageSnapshotListeners = new Set<(event: SnapshotEvent) => void>()
let receivedPlayer = false, receivedVillage = false
export function subscribePlayerSnapshots(listener: (event: SnapshotEvent) => void) { playerSnapshotListeners.add(listener) }
export function subscribeVillageSnapshots(listener: (event: SnapshotEvent) => void) { villageSnapshotListeners.add(listener) }
export function hasVillageSnapshot() { return receivedVillage }
const resourceCooldowns = new Map<string, number>()
const resourceHits = new Map<string, number>()
export function getResourceHits(id: string) { const availableAt = resourceCooldowns.get(id) ?? 0; return availableAt > 0 && Date.now() >= availableAt ? 0 : resourceHits.get(id) ?? 0 }
export function isResourceAvailable(id: string) { return Date.now() >= (resourceCooldowns.get(id) ?? 0) }
// The resource the player is working on drives one progress bar in a fixed place on screen, the same for every kind.
let lastGathered = { id: '', at: 0 }
let resourceIndex: Map<string, { kind: ResourceKind; hitsRequired: number }> | undefined
export function getGatherProgress() {
  resourceIndex ??= new Map(WORLD_RESOURCES.map(node => [node.id, node]))
  const node = resourceIndex.get(lastGathered.id), required = node?.hitsRequired ?? 0, hits = getResourceHits(lastGathered.id)
  if (!required || Date.now() - lastGathered.at > 8000 || !isResourceAvailable(lastGathered.id) || hits <= 0 || hits >= required) return undefined
  return { kind: node!.kind, hits, required, remaining: (required - hits) / required }
}

// Resource models stand on the raised village ground, with the hit face about half a metre from their origin.
const RESOURCE_GROUND = 2.7
const RESOURCE_HIT_HEIGHT = 1.1
function playerPosition() { return Transform.getOrNull(engine.PlayerEntity)?.position }
function resourceContact(nodeId: string) {
  const node = getResourceNode(nodeId), position = playerPosition()
  if (!node) return undefined
  const distance = position ? Math.hypot(position.x - node.x, position.z - node.z) : 0
  const reach = distance ? Math.min(0.5, distance) / distance : 0
  return { x: node.x + (position ? (position.x - node.x) * reach : 0), y: (node.y ?? RESOURCE_GROUND) + RESOURCE_HIT_HEIGHT, z: node.z + (position ? (position.z - node.z) * reach : 0) }
}
function changed() { for (const listener of listeners) listener() }
export function subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener) }
export function getPlayer(): Readonly<PlayerProgress> { return player }
export function getVillage(): Readonly<VillageProgress> { return village }
// What the rest of the community is doing (deliveries, falls, defeated agents, village levels): the latest few lines,
// each shown for COMMUNITY_FEED_SECONDS and fading out over its last second.
const COMMUNITY_FEED_SIZE = 5, COMMUNITY_FEED_SECONDS = 12
const communityFeed: { text: string; at: number }[] = []
export function getCommunityFeed(now = Date.now()) {
  return communityFeed.filter(line => now - line.at < COMMUNITY_FEED_SECONDS * 1000).map(line => ({ text: line.text, alpha: Math.min(1, (COMMUNITY_FEED_SECONDS * 1000 - (now - line.at)) / 1000) }))
}
export function getMessage() {
  const now = Date.now()
  if (now < levelUpUntil) return levelUpText
  // During the tutorial a message only lingers briefly; then the panel returns to the current step.
  const stage = getTutorialStage()
  if (stage >= 1 && stage < 6 && (!message || now - messageAt > MESSAGE_SECONDS)) return getTutorialActionPrompt()
  return message || getTutorialActionPrompt()
}
export function getEnemies() { return enemyStates }
export function showLocalMessage(text: string) { message = text; messageAt = Date.now(); changed() }

export function connectPandora() {
  room.onMessage('resourceSnapshot', data => {
    try {
      const nodes = JSON.parse(data.nodesJson) as { id: string; availableAt: number; hits: number }[]
      resourceCooldowns.clear()
      resourceHits.clear()
      for (const node of nodes) { resourceCooldowns.set(node.id, node.availableAt); resourceHits.set(node.id, node.hits ?? 0) }
      changed()
    } catch (error) { console.error('[Pandora] Invalid resource state:', error) }
  })
  room.onMessage('playerSnapshot', (data) => {
    const previousLevel = receivedPlayer ? player.level : null
    receivedPlayer = true
    Object.assign(player, data)
    try {
      const snapshot = JSON.parse(data.profileJson) as Partial<PlayerProgress>
      Object.assign(player, snapshot)
      player.carried = snapshot.carried ?? { wood: data.wood, stone: data.stone, fruit: data.fruit }
    } catch (error) { console.error(`[Pandora] invalid player snapshot: ${error}`) }
    syncTutorial(player.tutorialStage, player.guideMet, player.introSeen)
    if (previousLevel !== null && player.level > previousLevel) { levelUpText = `LEVEL UP! You are now level ${player.level}.`; levelUpUntil = Date.now() + 4000 }
    for (const listener of playerSnapshotListeners) listener({ previousLevel, level: player.level })
    changed()
  })
  room.onMessage('villageSnapshot', (data) => {
    const previousLevel = receivedVillage ? village.level : null
    receivedVillage = true
    village.level = data.level; setRespawnLevel(village.level)
    village.stock = { wood: data.wood, stone: data.stone, fruit: data.fruit, coins: data.coins ?? 0 }
    village.defeats = data.defeats
    village.revision = data.revision
    village.cycle = data.cycle
    village.targets = { wood: data.targetWood, stone: data.targetStone, fruit: data.targetFruit, coins: data.targetCoins, defeats: data.targetDefeats }
    for (const listener of villageSnapshotListeners) listener({ previousLevel, level: village.level, treeTransitionAt: Number(data.treeTransitionAt)||0 })
    changed()
  })
  room.onMessage('pandoraFeedback', (data) => {
    message = data.text
    messageAt = Date.now()
    if (/ hit you for \d+ damage\./i.test(data.text)) {
      playHitReaction()
      spawnImpact('hit', 0, () => { const position = playerPosition(); return position && { x: position.x, y: position.y + 1, z: position.z } })
    }
    if (/^Delivered/i.test(data.text)) playActionSound('delivery')
    else if (/^Punch landed/i.test(data.text)) playActionSound('hit')
    // Collection audio already plays at the actual tool impact. Feedback text is silent.
    changed()
  })
  room.onMessage('enemySnapshot', (data) => {
    try { enemyStates = JSON.parse(data.enemiesJson) as EnemyProgress[] }
    catch (error) { console.error(`[Pandora] invalid enemy snapshot: ${error}`) }
    changed()
  })
  room.onMessage('playerDefeated', (data) => { startPlayerDeath(data.enemyName) })
  room.onMessage('communityEvent', (data) => { communityFeed.push({ text: data.text, at: Date.now() }); if (communityFeed.length > COMMUNITY_FEED_SIZE) communityFeed.shift() })
  room.onMessage('shardDropped', (data) => { dropShard(data) })
  void room.send('connectPandora', { ready: true })
}

export function gather(kind: ResourceKind, nodeId: string) {
  if (isPlayerDown() || isCinematicLocked() || isIntroActive()) return
  if (kind === 'wood') equipTool('axe')
  if (kind === 'stone') equipTool('pickaxe')
  if ((kind === 'wood' && getEquippedTool() !== 'axe') || (kind === 'stone' && getEquippedTool() !== 'pickaxe')) return
  if (!isResourceAvailable(nodeId)) return
  const impact = playGatherAnimation(kind, () => {
    if (isPlayerDown() || !isResourceAvailable(nodeId)) return
    if ((kind === 'wood' && getEquippedTool() !== 'axe') || (kind === 'stone' && getEquippedTool() !== 'pickaxe')) return
    playActionSound(kind)
    if (kind !== 'fruit') spawnImpact(kind, 0, () => resourceContact(nodeId))
    void room.send('gatherRequest', { kind, nodeId }).catch(error => {
      console.error('[Pandora] gather request failed:', error)
      showLocalMessage('Could not reach the village server. Please try again.')
    })
  })
  if (!impact) return
  lastGathered = { id: nodeId, at: Date.now() }
  showLocalMessage(`Gathering ${kind}...`)
}
export function deliverAll() { if (isCinematicLocked()) return; playInteractionSound(); void room.send('deliverRequest', { requested: true }) }
export function defeatEnemy(enemyId: string) { void room.send('defeatRequest', { enemyId }) }
let nextToolAttackAt = 0
export function attackEnemy(enemyId = '') {
  if (isPlayerDown() || isCinematicLocked() || Date.now() < nextToolAttackAt) return
  const tool = getEquippedTool()
  if (!tool || isIntroActive()) return
  const impact = playToolAttack(tool)
  if (!impact) return
  nextToolAttackAt = Date.now() + TOOL_RULES[tool].cooldown
  if (impact && tool === 'sword') playActionSound('swing')
  if (impact && enemyId) spawnImpact('hit', impact, () => { const enemy = enemyStates.find(e => e.id === enemyId && e.health > 0); return enemy && { ...enemy.position } })
  void room.send('attackRequest', { enemyId, tool })
}
export function useSkill(skillId: string, enemyId = '') { if (isPlayerDown()) return; playInteractionSound(); void room.send('skillRequest', { skillId, enemyId }) }
export function requestMenuAction(action: string, value = '', slot = 0) { playInteractionSound(); void room.send('menuActionRequest', { action, value, slot }) }
export function openTreasure(chestId: string) { playInteractionSound(); void room.send('treasureRequest', { chestId }) }
export function visitWaypoint(id: string) { playInteractionSound(); void room.send('waypointVisit', { id }) }

// Temporary shared-village test control; the server performs the real level transition.
export function testVillageLevelUp() {
 if (isIntroActive() || isCinematicLocked() || isPlayerDown()) return
 playInteractionSound()
 void room.send('testVillageLevelUpRequest', { requested: true }).catch(error => {
  console.error('[Pandora] Test village level up failed:', error)
  showLocalMessage('Could not reach the village server. Please try again.')
 })
}
