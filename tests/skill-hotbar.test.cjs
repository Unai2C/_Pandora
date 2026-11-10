const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
const vm = require('node:vm')

test('number keys and click activation use the three equipped slots with safe automatic/empty handling', () => {
  const sent = [], messages = [], systems = [], triggered = new Set()
  const player = { equippedSkills: ['boost', 'phase-jump', 'aura-regeneration'], aura: 100, travelPoints: ['forest-village'] }
  const exports = {}
  const code = ts.transpileModule(fs.readFileSync('src/skillHotbar.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  vm.runInNewContext(code, { exports, require: name => {
    if (name === '@dcl/sdk/ecs') return { engine: { addSystem: fn => systems.push(fn) }, InputAction: { IA_ACTION_3: '1', IA_ACTION_4: '2', IA_ACTION_5: '3' }, PointerEventType: { PET_DOWN: 'down' }, inputSystem: { isTriggered: key => triggered.has(key) } }
    if (name === './gameState') return { getPlayer: () => player, useSkill: (...args) => sent.push(args), showLocalMessage: text => messages.push(text) }
    return { SKILLS: [{ id: 'boost', name: 'Boost', aura: 15 }, { id: 'phase-jump', name: 'Phase Jump', aura: 35 }, { id: 'aura-regeneration', name: 'Aura Regeneration', automatic: true, aura: 0 }] }
  } })
  let menu = false
  exports.setupSkillHotkeys(() => menu, () => '')
  triggered.add('1'); systems[0]()
  assert.deepEqual(sent.pop(), ['boost', ''])
  triggered.clear(); triggered.add('2'); systems[0]()
  assert.deepEqual(sent.pop(), ['phase-jump', 'forest-village'])
  triggered.clear(); triggered.add('3'); systems[0]()
  assert.equal(sent.length, 0)
  assert.match(messages.pop(), /automatically/)
  menu = true; triggered.clear(); triggered.add('1'); systems[0]()
  assert.equal(sent.length, 0)
  menu = false; player.aura = 0; systems[0]()
  assert.equal(sent.length, 0)
  assert.match(messages.pop(), /Not enough aura/)
  player.equippedSkills[0] = ''; exports.activateEquippedSkill(0)
  assert.match(messages.pop(), /empty/)
  player.aura = 100; player.travelPoints = []; exports.activateEquippedSkill(1)
  assert.match(messages.pop(), /waypoint/)
})
