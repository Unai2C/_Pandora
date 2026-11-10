const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function harness() {
 const calls = [], systems = []
 let pressed = false, modified = false
 const exports = {}
 const code = ts.transpileModule(fs.readFileSync('src/playerDeath.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
 vm.runInNewContext(code, { exports, require: id => {
  if (id === './audio') return { playActionSound() {} }
  if (id === './shared/safeRespawn') return { safeRespawnPoint: (level, from) => ({ x: 70, y: 3, z: 90, level, from }) }
  if (id === '@dcl/sdk/ecs') return { Transform: { getOrNull: () => ({ position: { x: 60, y: 2, z: 95 } }) }, engine: { PlayerEntity: 1, addSystem: fn => systems.push(fn) }, InputAction: { IA_PRIMARY: 'E' }, PointerEventType: { PET_DOWN: 1 }, inputSystem: { isTriggered: () => pressed }, InputModifier: { Mode: { Standard: data => data }, createOrReplace: () => { modified = true }, deleteFrom: () => { modified = false } } }
  if (id === '~system/RestrictedActions') return { movePlayerTo: async data => { calls.push(data.newRelativePosition) } }
  if (id === './punchAnimation') return { playDeathAnimation: () => calls.push('death'), releaseAvatarAnimations: () => calls.push('release') }
  return { room: { send: async type => { calls.push(type) } } }
 } })
 exports.setupPlayerDeath()
 return { death: exports, calls, frozen: () => modified, press: value => { pressed = value }, tick: seconds => { for (let t = 0; t < seconds; t += 0.1) systems[0](0.1) } }
}

test('death freezes the player, fades to black and only then offers Continue', () => {
 const h = harness()
 h.death.startPlayerDeath('Sentinel')
 h.death.startPlayerDeath('Sentinel')
 assert.deepEqual(h.calls, ['death'])
 assert.equal(h.frozen(), true)
 assert.equal(h.death.isPlayerDown(), true)
 h.tick(1.5)
 assert.equal(h.death.getDeathScreen().alpha, 0)
 h.press(true); h.tick(1); h.press(false)
 assert.ok(h.death.getDeathScreen().alpha > 0 && h.death.getDeathScreen().alpha < 1)
 assert.equal(h.death.isPlayerDown(), true)
 h.tick(0.6)
 assert.equal(h.death.getDeathScreen().alpha, 1)
 assert.equal(h.death.getDeathScreen().menu, false)
 h.tick(0.6)
 assert.equal(h.death.getDeathScreen().menu, true)
 assert.equal(h.death.getDeathScreen().killer, 'Sentinel')
})

test('Continue returns beside the tree on the side the player fell, releases the player and clears the black screen', async () => {
 const h = harness()
 h.death.setRespawnLevel(9)
 h.death.startPlayerDeath('Sentinel')
 h.tick(3.8)
 await h.death.continueAfterDeath()
 assert.equal(h.death.isPlayerDown(), false)
 assert.equal(h.frozen(), false)
 assert.equal(h.calls[1].level, 9)
 assert.deepEqual({ ...h.calls[1].from }, { x: 60, y: 2, z: 95 })
 assert.ok(h.calls.includes('continueRequest'))
 assert.ok(h.calls.includes('release'))
 assert.equal(h.death.getDeathScreen().menu, false)
 h.tick(1)
 assert.equal(h.death.getDeathScreen().alpha, 0)
})

// Loads a source module with its real local imports.
function load(file, cache = {}) {
 const full = require('node:path').resolve(file); if (cache[full]) return cache[full]
 const exports = {}; cache[full] = exports
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(full, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports, require: id => load(require('node:path').join(require('node:path').dirname(full), id + '.ts'), cache) })
 return exports
}
test('the respawn point is never inside the central tree, at any size and from any side', () => {
 const { safeRespawnPoint } = load('src/shared/safeRespawn.ts'), growth = load('src/shared/treeGrowth.ts'), rules = load('src/shared/visualRules.ts'), grid = load('src/shared/terrainGrid.ts')
 const { glb, data } = require('../scripts/world-terrain.cjs')
 const colliders = [1, 2, 3, 4].map(k => { const g = glb('assets/scene/modelos/arbol-central/Tree_0' + k + '_anim.glb'), n = g.j.nodes.find(n => n.name === 'Tree_collider'), p = g.j.meshes[n.mesh].primitives[0]; const P = data(g, p.attributes.POSITION), I = data(g, p.indices), pts = []
  for (let i = 0; i < I.length; i += 3) for (let a = 0; a <= 4; a++) for (let b = 0; b <= 4 - a; b++) { const c = 4 - a - b; pts.push([0, 1, 2].map(d => (P[I[i]][d] * a + P[I[i + 1]][d] * b + P[I[i + 2]][d] * c) / 4)) } return pts })
 for (const level of [1, 4, 5, 8, 9, 12, 13, 15, 30, 50, 100]) {
  const place = growth.treePlacementForLevel(level), pts = colliders[rules.treeStageForLevel(level)]
  for (let k = 0; k < 8; k++) {
   const from = { x: 80 + 30 * Math.cos(k * Math.PI / 4), z: 80 + 30 * Math.sin(k * Math.PI / 4) }, p = safeRespawnPoint(level, from)
   assert.equal(grid.groundKind(p.x, p.z), 0, 'level ' + level + ' respawn on open ground')
   for (const q of pts) { const x = place.position.x + q[0] * place.scale.x, y = place.position.y + q[1] * place.scale.y, z = place.position.z + q[2] * place.scale.z
    if (y > p.y - .3 && y < p.y + 2.2) assert.ok(Math.hypot(x - p.x, z - p.z) > .6, 'level ' + level + ' side ' + k + ' respawn inside the tree at ' + JSON.stringify(p)) }
  }
 }
})
