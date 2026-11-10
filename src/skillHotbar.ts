import { engine, InputAction, inputSystem, PointerEventType } from '@dcl/sdk/ecs'
import { getPlayer, showLocalMessage, useSkill } from './gameState'
import { SKILLS } from './shared/progression'

export function activateEquippedSkill(slot: number, destination = '') {
  if (!Number.isInteger(slot) || slot < 0 || slot >= 3) return
  const player = getPlayer()
  const skill = SKILLS.find(entry => entry.id === player.equippedSkills[slot])
  if (!skill) { showLocalMessage(`Skill slot ${slot + 1} is empty. Equip a skill in Skills.`); return }
  if (skill.automatic) { showLocalMessage(`${skill.name} works automatically while equipped.`); return }
  if (player.aura < skill.aura) { showLocalMessage(`Not enough aura for ${skill.name}.`); return }
  const waypoint = player.travelPoints.includes(destination) ? destination : player.travelPoints[0] ?? ''
  if (skill.id === 'phase-jump' && !waypoint) { showLocalMessage('Visit a travel waypoint before using Phase Jump.'); return }
  useSkill(skill.id, skill.id === 'phase-jump' ? waypoint : '')
}

export function setupSkillHotkeys(menuOpen: () => boolean, destination: () => string) {
  // Decentraland's default bindings for number keys 1, 2 and 3.
  const keys = [InputAction.IA_ACTION_3, InputAction.IA_ACTION_4, InputAction.IA_ACTION_5]
  engine.addSystem(() => {
    if (menuOpen()) return
    keys.forEach((key, slot) => {
      if (inputSystem.isTriggered(key, PointerEventType.PET_DOWN)) activateEquippedSkill(slot, destination())
    })
  }, undefined, 'pandora-skill-hotkeys')
}
