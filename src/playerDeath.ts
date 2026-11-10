import { playActionSound } from './audio'
import { engine, InputAction, inputSystem, InputModifier, PointerEventType, Transform } from '@dcl/sdk/ecs'
import { movePlayerTo } from '~system/RestrictedActions'
import { playDeathAnimation, releaseAvatarAnimations } from './punchAnimation'
import { room } from './shared/pandoraMessages'
import { safeRespawnPoint } from './shared/safeRespawn'

// The emote lies still until 3.5s, so the avatar standing up happens behind the black screen.
const FADE_START = 1.6
const FADE_SECONDS = 1.4
const MENU_AT = 3.6
const REVEAL_SECONDS = 0.7
let down = false
let elapsed = 0
let reveal = 0
let killer = ''
let continuing = false
// The village level, for the tree's current size; gameState reports it so this module does not depend on it.
let villageLevel = 1
export function setRespawnLevel(level: number) { villageLevel = level }

export function isPlayerDown() { return down }
export function getDeathScreen() {
  if (down) return { alpha: Math.min(1, Math.max(0, (elapsed - FADE_START) / FADE_SECONDS)), menu: elapsed >= MENU_AT, killer }
  return { alpha: Math.min(1, reveal / REVEAL_SECONDS), menu: false, killer }
}

export function startPlayerDeath(enemyName: string) {
  if (down) return
  down = true
  elapsed = 0
  reveal = 0
  killer = enemyName
  // Any movement would cancel the emote and stand the avatar back up.
  InputModifier.createOrReplace(engine.PlayerEntity, { mode: InputModifier.Mode.Standard({ disableAll: true }) })
  playDeathAnimation()
  playActionSound('death')
}

export async function continueAfterDeath() {
  if (!down || elapsed < MENU_AT || continuing) return
  continuing = true
  try {
    // Back beside the tree on the side the explorer fell, never inside its roots or collider.
    const fell = Transform.getOrNull(engine.PlayerEntity)?.position ?? { x: 80, z: 90 }
    await movePlayerTo({ newRelativePosition: safeRespawnPoint(villageLevel, fell) })
    await room.send('continueRequest', { ready: true })
    releaseAvatarAnimations()
    InputModifier.deleteFrom(engine.PlayerEntity)
    reveal = REVEAL_SECONDS
    down = false
  } catch (error) {
    console.error('[Pandora] Could not return to village:', error)
  } finally { continuing = false }
}

export function setupPlayerDeath() {
  engine.addSystem(dt => {
    if (down) {
      elapsed += dt
      if (inputSystem.isTriggered(InputAction.IA_PRIMARY, PointerEventType.PET_DOWN)) continueAfterDeath()
    } else reveal = Math.max(0, reveal - dt)
  }, undefined, 'pandora-player-death')
}
