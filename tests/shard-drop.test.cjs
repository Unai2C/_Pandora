const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function harness() {
 const clips = [], impacts = [], systems = [], transforms = new Map(), sounds = []
 let next = 100
 const player = { position: { x: 80, y: 1, z: 82 } }
 const exports = {}
 const code = ts.transpileModule(fs.readFileSync('src/shardDrop.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
 vm.runInNewContext(code, { exports, require: id => {
  if (id === '@dcl/sdk/ecs') return {
   engine: { PlayerEntity: 1, addEntity: () => next++, addSystem: fn => systems.push(fn) },
   Transform: { create: (e, data) => transforms.set(e, data), getMutable: e => transforms.get(e), getOrNull: e => e === 1 ? player : transforms.get(e) },
   GltfContainer: { create: () => {} },
   Animator: { create: () => {}, playSingleAnimation: (e, clip) => clips.push(clip) }
  }
  if (id === '@dcl/sdk/math') return { Vector3: { create: (x, y, z) => ({ x, y, z }), Zero: () => ({ x: 0, y: 0, z: 0 }) } }
  if (id === './audio') return { playInteractionSound: () => sounds.push('collect') }
  return { spawnImpact: (kind, delay, where) => impacts.push({ kind, at: where() }) }
 } })
 exports.setupShardDrops()
 return { shard: exports, clips, impacts, sounds, player, transforms, tick: seconds => { for (let t = 0; t < seconds; t += 0.05) systems[0](0.05) } }
}

test('a defeated agent releases a shard that rises, floats and flies to the player', () => {
 const h = harness()
 const entity = 100
 h.shard.dropShard({ x: 70, y: 2, z: 70 })
 h.tick(0.2)
 assert.deepEqual(h.clips, [])
 h.tick(0.3)
 assert.deepEqual(h.clips, ['Drop'])
 assert.ok(h.transforms.get(entity).scale.x > 0)
 h.tick(1.2)
 assert.deepEqual(h.clips, ['Drop', 'Float'])
 assert.ok(Math.abs(h.transforms.get(entity).position.y - 2.9) < 0.01)
 h.tick(0.75)
 assert.deepEqual(h.clips, ['Drop', 'Float', 'Collect'])
 h.player.position = { x: 75, y: 1, z: 75 }
 h.tick(0.3)
 assert.equal(h.impacts.length, 0)
 h.tick(0.4)
 assert.equal(h.impacts[0].kind, 'shard')
 assert.equal(h.impacts[0].at.x, 75)
 assert.ok(Math.abs(h.impacts[0].at.y - 2.1) < 0.01)
 assert.deepEqual(h.sounds, ['collect'])
 assert.equal(h.transforms.get(entity).scale.x, 0)
})

test('kills in a row each get their own shard', () => {
 const h = harness()
 h.shard.dropShard({ x: 1, y: 1, z: 1 })
 h.shard.dropShard({ x: 2, y: 1, z: 2 })
 h.tick(0.5)
 assert.equal(h.transforms.get(100).position.x, 1)
 assert.equal(h.transforms.get(101).position.x, 2)
})
