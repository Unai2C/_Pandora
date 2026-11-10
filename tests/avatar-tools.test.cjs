const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function harness() {
  let entity = 1, now = 10000
  const player = { position: { x: 0, y: 0, z: 0 } }
  const models = new Map(), visible = new Map(), attached = [], transforms = new Map(), systems = [], pending = []
  const cache = {}, handlers = new Map(), sent = []
  function load(name) {
    if (cache[name]) return cache[name]
    const exports = {}; cache[name] = exports
    const code = ts.transpileModule(fs.readFileSync('src/' + name + '.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
    vm.runInNewContext(code, { exports, console, Date: { now: () => now }, require: id => {
      if (id === '@dcl/sdk/ecs') return { MeshRenderer: { setBox() {} }, Material: { setPbrMaterial() {} }, engine: { PlayerEntity: 0, addEntity: () => entity++, addSystem: fn => systems.push(fn) }, AvatarAnchorPointType: { AAPT_RIGHT_HAND: 3 }, AvatarAttach: { create: (id, data) => attached.push(data) }, Transform: { create: (id, data) => transforms.set(id, data), getOrNull: () => player }, GltfContainer: { create: (id, data) => models.set(id, data), createOrReplace: (id, data) => models.set(id, data) }, VisibilityComponent: { create: (id, data) => visible.set(id, data.visible), createOrReplace: (id, data) => visible.set(id, data.visible) } }
      if (id === '@dcl/sdk/math') return { Color4: { create: (...v) => v }, Vector3: { create: (x, y, z) => ({ x, y, z }) }, Quaternion: { fromEulerDegrees: (x, y, z) => ({ x, y, z }), create: (x, y, z, w) => ({ x, y, z, w }) } }
      if (id === '~system/RestrictedActions') return { triggerSceneEmote: data => new Promise(resolve => pending.push({ data, resolve })) }
      if (id === './shared/pandoraMessages') return { room: { onMessage: (name, fn) => handlers.set(name, fn), send: async (name, data) => { sent.push({ name, ...data }) } } }
      return load(id.replace('./', ''))
    } })
    return exports
  }
  return { load, handlers, sent, models, visible, attached, transforms, pending, player, advance: ms => { now += ms; systems.forEach(fn => fn()) }, active: () => [...models].filter(([id]) => visible.get(id)).map(([, data]) => data.src) }
}

test('tools attach to the right hand, compensate exported origins, never collide, and disappear after the action', () => {
  const h = harness(), tools = h.load('avatarTools')
  tools.setupAvatarTools(); tools.setupAvatarTools()
  assert.equal(h.models.size, 3)
  assert.equal(h.attached[0].anchorPointId, 3)
  assert.equal(h.active().length, 0)
  for (const [id, data] of h.models) {
    assert.equal(data.visibleMeshesCollisionMask, 0)
    assert.equal(data.invisibleMeshesCollisionMask, 0)
    assert.ok(Math.abs(h.transforms.get(id).position.y - 0.0848) < 1e-6)
  }
  tools.showAvatarTool('sword', 1267)
  assert.match(h.active()[0], /Sword\.glb/)
  tools.showAvatarTool('axe', 1467)
  assert.equal(h.active().length, 1)
  assert.match(h.active()[0], /Axe\.glb/)
  h.advance(1467)
  assert.equal(h.active().length, 0)
})

test('attack uses sword, chopping uses axe, hit interrupts tools, and stale failures cannot hide a newer action', async () => {
  const h = harness(), animation = h.load('punchAnimation')
  animation.playPunchAnimation()
  assert.equal(h.active().length, 1)
  assert.match(h.pending[0].data.src, /Sword_Attack_Fast_emote/)
  h.advance(1267)
  animation.playGatherAnimation('wood')
  assert.equal(h.active().length, 0)
  assert.match(h.pending.at(-1).data.src, /Axe_Chop_emote/)
  h.pending[0].resolve({ success: false }); await Promise.resolve()
  assert.equal(h.active().length, 0)
  animation.playHitReaction()
  assert.equal(h.active().length, 0)
  h.advance(934)
  animation.playGatherAnimation('wood')
  h.pending.at(-1).resolve({ success: false }); await Promise.resolve()
  assert.equal(h.active().length, 0)
})

 test('equipped tool stays visible at rest, through animations and failures, and switches immediately', async () => {
  const h = harness(), tools = h.load('avatarTools'), animation = h.load('punchAnimation')
  tools.equipAvatarTool('sword')
  h.advance(10000)
  assert.match(h.active()[0], /Sword\.glb/)
  animation.playPunchAnimation()
  h.advance(1267)
  assert.match(h.active()[0], /Sword\.glb/)
  tools.equipAvatarTool('axe')
  assert.equal(h.active().length, 1)
  assert.match(h.active()[0], /Axe\.glb/)
  animation.playHitReaction()
  h.pending.at(-1).resolve({ success: false }); await Promise.resolve()
  h.advance(10000)
  assert.equal(h.active().length, 1)
  assert.match(h.active()[0], /Axe\.glb/)
  tools.hideAvatarTools()
  assert.match(h.active()[0], /Axe\.glb/)
 })

test('pickaxe can be equipped persistently and replaced by the sword', () => { const h = harness(), tools = h.load('avatarTools'); tools.equipAvatarTool('pickaxe'); assert.match(h.active()[0], /Pickaxe\.glb/); assert.equal([...h.visible.values()].filter(Boolean).length, 1); h.advance(10000); assert.equal([...h.visible.values()].filter(Boolean).length, 1); tools.equipAvatarTool('sword'); assert.match(h.active()[0], /Sword\.glb/); assert.equal([...h.visible.values()].filter(Boolean).length, 1) })

test('mesh-free chop keeps the selected tool visible throughout the swing', () => {
  const h = harness(), tools = h.load('avatarTools'), animation = h.load('punchAnimation')
  tools.equipAvatarTool('axe')
  assert.equal(h.active().length, 1)
  animation.playGatherAnimation('wood')
  assert.equal(h.active().length, 1)
  h.advance(1700)
  assert.match(h.active()[0], /Axe\.glb/)
})

test('standing still with a tool loops the hold emote, moving rearms it, and actions take priority', () => {
  const h = harness(), tools = h.load('avatarTools'), animation = h.load('punchAnimation')
  const holds = () => h.pending.filter(p => /Hold_Tool_emote/.test(p.data.src)).length
  animation.setupToolHold()
  h.advance(10); h.advance(1000)
  assert.equal(holds(), 0)
  tools.equipAvatarTool('sword')
  h.advance(1000)
  assert.equal(holds(), 1)
  assert.equal(h.pending.at(-1).data.loop, true)
  h.advance(1000)
  assert.equal(holds(), 1)
  h.player.position = { x: 1, y: 0, z: 0 }
  h.advance(10)
  h.advance(100)
  assert.equal(holds(), 1)
  h.advance(600)
  assert.equal(holds(), 2)
  animation.playPunchAnimation()
  h.advance(600)
  assert.equal(holds(), 2)
  h.advance(700)
  assert.equal(holds(), 3)
})

test('mining uses a mesh-free swing and never substitutes an axe for the pickaxe', () => {
 const h = harness(), tools = h.load('avatarTools'), animation = h.load('punchAnimation')
 tools.equipAvatarTool('pickaxe')
 animation.playGatherAnimation('stone')
 assert.match(h.active()[0], /Pickaxe\.glb/)
 assert.match(h.pending.at(-1).data.src, /Pickaxe_Swing_emote/)
 h.advance(1700)
 assert.equal(h.active().length, 1)
 assert.match(h.active()[0], /Pickaxe\.glb/)
})

test('swings report when the blow lands, a blocked swing reports nothing, and death locks every action until released', () => {
 const h = harness(), animation = h.load('punchAnimation')
 assert.equal(animation.playToolAttack('sword'), 289)
 assert.equal(animation.playToolAttack('axe'), 0)
 h.advance(1267)
 assert.equal(animation.playGatherAnimation('stone'), 900)
 h.advance(1700)
 assert.equal(animation.playGatherAnimation('fruit'), 650)
 h.advance(1467)
 animation.playDeathAnimation()
 assert.match(h.pending.at(-1).data.src, /Death_emote/)
 const emotes = h.pending.length
 animation.playHitReaction()
 assert.equal(animation.playToolAttack('sword'), 0)
 h.advance(10000)
 assert.equal(h.pending.length, emotes)
 animation.releaseAvatarAnimations()
 assert.equal(animation.playToolAttack('sword'), 289)
})

test('death interrupts an attack immediately and prevents further action animations', () => {
 const h = harness(), animation = h.load('punchAnimation')
 animation.playToolAttack('sword')
 animation.playDeathAnimation()
 assert.match(h.pending.at(-1).data.src,/Death_emote/)
 const count=h.pending.length
 animation.playToolAttack('sword'); animation.playHitReaction()
 assert.equal(h.pending.length,count)
})

test('gather commits once at impact and interrupted swings never commit',()=>{
 const h=harness(), animation=h.load('punchAnimation');let collected=0
 animation.setupToolHold()
 animation.playGatherAnimation('wood',()=>collected++)
 h.advance(899);assert.equal(collected,0)
 h.advance(1);assert.equal(collected,1)
 h.advance(1000);assert.equal(collected,1)
 animation.playGatherAnimation('stone',()=>collected++)
 animation.playHitReaction();h.advance(1000);assert.equal(collected,1)
 animation.playGatherAnimation('fruit',()=>collected++)
 h.player.position.x+=1;h.advance(700);assert.equal(collected,1)
})

test('receiving a tool plays the raising emote once while keeping the equipped model attached',()=>{
 const h=harness(),tools=h.load('avatarTools'),animation=h.load('punchAnimation');tools.equipAvatarTool('pickaxe');animation.setupToolHold()
 animation.playToolReceive('pickaxe');assert.match(h.pending.at(-1).data.src,/Receive_Pickaxe_emote/);assert.equal(h.pending.at(-1).data.loop,false);assert.match(h.active()[0],/Pickaxe/)
 const count=h.pending.length;h.advance(2000);assert.equal(h.pending.length,count)
 h.advance(700);assert.match(h.pending.at(-1).data.src,/Hold_Tool_emote/)
})
test('receive emote uses the avatar rig, lasts 2.6 seconds, raises the right arm and adds no meshes or textures',()=>{
 const b=fs.readFileSync('assets/scene/modelos/animaciones/Receive_Tool_emote.glb'),n=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+n)),bin=b.subarray(28+n),clip=j.animations[0]
 assert.equal(b.readUInt32LE(8),b.length);assert.equal(j.meshes?.length??0,0);assert.equal(j.images?.length??0,0)
 const node=j.nodes.findIndex(n=>n.name==='Avatar_RightArm'),channel=clip.channels.find(c=>c.target.node===node&&c.target.path==='rotation'),sampler=clip.samplers[channel.sampler]
 assert.equal(j.accessors[sampler.input].max[0],2.6)
 const a=j.accessors[sampler.output],v=j.bufferViews[a.bufferView],q=index=>Array.from({length:4},(_,k)=>bin.readFloatLE((v.byteOffset??0)+(a.byteOffset??0)+(index*4+k)*4))
 const first=q(0),raised=q(42),last=q(a.count-1);assert.ok(first.reduce((s,x,i)=>s+Math.abs(x-raised[i]),0)>.3)
 for(let i=0;i<4;i++)assert.ok(Math.abs(first[i]-last[i])<.00001)
})

test('each tutorial item selects its own supplied reception emote and preserves the held tool',()=>{
 for(const tool of ['axe','pickaxe','sword']){
  const h=harness(),tools=h.load('avatarTools'),animation=h.load('punchAnimation');tools.equipAvatarTool(tool);animation.setupToolHold();animation.playToolReceive(tool)
  const name=tool==='axe'?'Axe':tool==='pickaxe'?'Pickaxe':'Sword';assert.ok(h.pending.at(-1).data.src.endsWith('/Receive_'+name+'_emote.glb'));assert.equal(h.pending.at(-1).data.loop,false);assert.equal(animation.toolReceiveSeconds(tool),2.6);assert.ok(h.active()[0].endsWith('/'+name+'.glb'))
  h.advance(0);const count=h.pending.length;h.advance(2500);assert.equal(h.pending.length,count);h.advance(200);assert.match(h.pending.at(-1).data.src,/Hold_Tool_emote/)
 }
})
test('new reception files contain one 2.6-second avatar clip and no duplicate item meshes or textures',()=>{
 for(const name of ['Axe','Pickaxe','Sword']){
  const b=fs.readFileSync('assets/scene/modelos/animaciones/Receive_'+name+'_emote.glb'),j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));assert.equal(b.readUInt32LE(8),b.length);assert.equal(j.meshes?.length??0,0);assert.equal(j.images?.length??0,0);assert.equal(j.animations.length,1);assert.equal(j.animations[0].name,'Receive_'+name+'_Avatar');assert.ok(j.nodes.some(n=>n.name==='Avatar_RightHand'));assert.ok(j.nodes.some(n=>n.name==='Avatar_RightArm'));assert.equal(Math.max(...j.animations[0].samplers.map(s=>j.accessors[s.input].max[0])),2.6)
 }
})

test('other explorers see the tool in the right hand of each avatar, and the hand empties when they put it away', () => {
 const h = harness(), tools = h.load('avatarTools'); tools.setupAvatarTools()
 tools.equipAvatarTool('axe'); tools.equipAvatarTool('axe'); tools.equipAvatarTool(null)
 assert.deepEqual(h.sent.map(m => m.tool), ['axe', ''], 'our own changes go to the server once each')
 h.handlers.get('playerTool')({ address: '0xfriend', tool: 'sword' })
 const hand = h.attached.find(a => a.avatarId === '0xfriend'); assert.ok(hand); assert.equal(hand.anchorPointId, 3)
 assert.ok(h.active().some(src => src.endsWith('Sword.glb')), 'the friend holds a sword')
 h.handlers.get('playerTool')({ address: '0xfriend', tool: '' }); assert.equal(h.active().some(src => src.endsWith('Sword.glb')), false)
 assert.equal(h.attached.filter(a => a.avatarId === '0xfriend').length, 1, 'one hand per avatar')
})
