import { engine, Transform } from '@dcl/sdk/ecs'
import { getEquippedAvatarTool, hideAvatarTools, isAvatarToolPresentationHidden, showAvatarTool } from './avatarTools'
import { triggerSceneEmote } from '~system/RestrictedActions'

const EMOTES = {
  punch: { file: 'Attack_Punch_emote.glb', duration: 867, impact: 0 },
  sword: { file: 'Sword_Attack_Fast_emote.glb', duration: 845, impact: 289 },
  // The same swing played backwards: the blade comes back along the opposite arc, landing at the same moment.
  swordBack: { file: 'Sword_Attack_Back_emote.glb', duration: 845, impact: 289 },
  chop: { file: 'Axe_Chop_emote.glb', duration: 1700, impact: 900 },
  mine: { file: 'Pickaxe_Swing_emote.glb', duration: 1700, impact: 900 },
  pickup: { file: 'Pickup_Hand_emote.glb', duration: 1467, impact: 650 },
  hit: { file: 'Hit_Reaction_emote.glb', duration: 934, impact: 0 },
  death: { file: 'Death_emote.glb', duration: 3500, impact: 0 },
  receiveAxe: { file: 'Receive_Axe_emote.glb', duration: 2600, impact: 0 },
  receivePickaxe: { file: 'Receive_Pickaxe_emote.glb', duration: 2600, impact: 0 },
  receiveSword: { file: 'Receive_Sword_emote.glb', duration: 2600, impact: 0 }
} as const
let attackStyle: 'punch' | 'sword' = 'sword'
let animationSequence = 0
let nextAnimationAt = 0
let animationStatus = ''
const HOLD_EMOTE = 'assets/scene/modelos/animaciones/Hold_Tool_emote.glb'
const HOLD_DELAY = 500
let holding = false
let holdRejected = false
let stillSince = 0
let lastPosition: { x: number; y: number; z: number } | null = null
let avatarDown = false
let pendingImpact: { at: number; sequence: number; origin: { x: number; y: number; z: number } | null; callback: () => void } | null = null
export function getAvatarAnimationStatus() { return animationStatus }
export function getAttackStyle() { return attackStyle }
export function toggleAttackStyle() { attackStyle = attackStyle === 'punch' ? 'sword' : 'punch' }

function playAction(action: keyof typeof EMOTES, onImpact?: () => void) {
  const now = Date.now()
  if ((avatarDown && action !== 'death') || (now < nextAnimationAt && action !== 'hit' && action !== 'death')) return 0
  const sequence = ++animationSequence
  pendingImpact = null
  holding = false
  if (action === 'death') avatarDown = true
  const emote = EMOTES[action]
  hideAvatarTools()
  if (action === 'sword' || action === 'swordBack') showAvatarTool('sword', emote.duration)
  // This swing contains no tool mesh: keep the equipped axe or pickaxe visible.
  nextAnimationAt = now + emote.duration
  if (onImpact && emote.impact > 0) {
    const position = Transform.getOrNull(engine.PlayerEntity)?.position
    pendingImpact = { at: now + emote.impact, sequence, origin: position ? { ...position } : null, callback: onImpact }
  }
  animationStatus = 'Playing ' + action + ' · stand still in third-person view'
  void triggerSceneEmote({ src: 'assets/scene/modelos/animaciones/' + emote.file, loop: false }).then(result => {
    if (sequence !== animationSequence) return
    if (!result.success) {
      hideAvatarTools()
      nextAnimationAt = 0
      pendingImpact = null
      animationStatus = 'Decentraland rejected the animation. Check scene permissions.'
      console.error('[Pandora] Avatar animation rejected:', action, result)
    }
  }).catch(error => {
    if (sequence !== animationSequence) return
    hideAvatarTools()
    nextAnimationAt = 0
    animationStatus = 'Could not load animation: ' + action
    console.error('[Pandora] Avatar animation ' + action + ' failed:', error)
  })
  return emote.impact
}
export function playPunchAnimation() { playAction(attackStyle) }
// These return the milliseconds until the blow lands, or 0 when the swing did not start.
export function playGatherAnimation(kind: 'wood' | 'stone' | 'fruit', onImpact?: () => void) { return playAction(kind === 'wood' ? 'chop' : kind === 'stone' ? 'mine' : 'pickup', onImpact) }
export function playHitReaction() { playAction('hit') }
const RECEPTION_ACTIONS = { axe: 'receiveAxe', pickaxe: 'receivePickaxe', sword: 'receiveSword' } as const
export function playToolReceive(tool: 'axe' | 'pickaxe' | 'sword') { playAction(RECEPTION_ACTIONS[tool]) }
export function toolReceiveSeconds(tool: 'axe' | 'pickaxe' | 'sword') { return EMOTES[RECEPTION_ACTIONS[tool]].duration / 1000 }
// Seconds into each reception when the open hand closes on the handle (frames 22, 22 and 21 at 30 fps).
const RECEPTION_CONTACT = { axe: 22 / 30, pickaxe: 22 / 30, sword: 21 / 30 }
export function toolReceiveContactSeconds(tool: 'axe' | 'pickaxe' | 'sword') { return RECEPTION_CONTACT[tool] }
export function playDeathAnimation() { playAction('death') }
export function releaseAvatarAnimations() { avatarDown = false; nextAnimationAt = 0 }

// Pressing again right after a sword swing answers it with the backhand; a pause starts the combo over.
const SWORD_COMBO_WINDOW = 700
let lastSwordSwing: { action: 'sword' | 'swordBack'; endsAt: number } | null = null
export function playToolAttack(tool: 'sword' | 'axe' | 'pickaxe') {
  if (tool !== 'sword') return playAction(tool === 'pickaxe' ? 'mine' : 'chop')
  const now = Date.now()
  const action = lastSwordSwing && lastSwordSwing.action === 'sword' && now <= lastSwordSwing.endsAt + SWORD_COMBO_WINDOW ? 'swordBack' : 'sword'
  const impact = playAction(action)
  if (impact) lastSwordSwing = { action, endsAt: now + EMOTES[action].duration }
  return impact
}

function updateToolHold() {
  const position = Transform.getOrNull(engine.PlayerEntity)?.position
  if (!position) return
  const now = Date.now()
  if (pendingImpact) {
    const event = pendingImpact
    if (event.sequence !== animationSequence || avatarDown || (event.origin && Math.hypot(position.x - event.origin.x, position.y - event.origin.y, position.z - event.origin.z) > 0.2)) pendingImpact = null
    else if (now >= event.at) { pendingImpact = null; event.callback() }
  }
  const moved = !lastPosition || Math.hypot(position.x - lastPosition.x, position.y - lastPosition.y, position.z - lastPosition.z) > 0.02
  lastPosition = { x: position.x, y: position.y, z: position.z }
  if (moved) {
    stillSince = now
    holding = false
    return
  }
  // No grip pose while a tutorial tool is still on its way: the avatar waits with an empty, relaxed hand.
  if (avatarDown || holding || holdRejected || !getEquippedAvatarTool() || isAvatarToolPresentationHidden() || now < nextAnimationAt || now - stillSince < HOLD_DELAY) return
  holding = true
  void triggerSceneEmote({ src: HOLD_EMOTE, loop: true }).then(result => { if (!result.success) holdRejected = true }).catch(() => { holdRejected = true })
}

export function setupToolHold() { engine.addSystem(updateToolHold, undefined, 'pandora-tool-hold') }
