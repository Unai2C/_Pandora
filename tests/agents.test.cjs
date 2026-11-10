const { test } = require('node:test'), assert = require('node:assert/strict')
const fs = require('fs'), vm = require('vm'), ts = require('typescript'), path = require('path')
function harness() {
 const colliders = new Map(), texts = new Map()
 const transforms = new Map(), models = new Map(), animations = new Map(), visible = new Map(), systems = [], clicks = [], cache = {}
 let next = 1, enemies = [], dialogue = false
 const ecs = { TextShape:{create:(id,data)=>texts.set(id,data),get:id=>texts.get(id),getMutable:id=>texts.get(id)},Billboard: { create() {} }, BillboardMode: { BM_ALL: 7 }, ColliderLayer: { CL_POINTER: 2, CL_PHYSICS: 1 }, MeshRenderer: { setBox() {} }, Material: { setPbrMaterial() {} }, MeshCollider: { setBox: (id, mask) => colliders.set(id, mask) }, InputAction: { IA_POINTER: 0 }, pointerEventsSystem: { onPointerDown: (opts, fn) => clicks.push(fn) }, engine: { addEntity: () => next++, addSystem: fn => systems.push(fn) }, Transform: { create: (id, data) => transforms.set(id, data), getMutable: id => transforms.get(id), getOrNull: () => ({ position: { x: 81, y: 2, z: 80 } }) }, GltfContainer: { create: (id, data) => models.set(id, data) }, Animator: { createOrReplace:(id,data)=>animations.set(id,data),create: (id, data) => animations.set(id, data), getMutable: id => animations.get(id) }, VisibilityComponent: { create: (id, data) => visible.set(id, data), get: id => visible.get(id), getMutable: id => visible.get(id) } }
 const math = { Color4: { create: (...args) => args }, Vector3: { create: (x,y,z) => ({ x,y,z }), Zero: () => ({ x:0,y:0,z:0 }) }, Quaternion: { fromEulerDegrees: (x,y,z) => ({ x,y,z }) } }
 function load(file) {
  file = path.resolve(file); if (cache[file]) return cache[file]
  const exports = {}; cache[file] = exports
  const code = ts.transpileModule(fs.readFileSync(file,'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  vm.runInNewContext(code, { exports, require: id => id === './audio' ? {playActionSound(){}} : id === './cinematicLock' ? {isCinematicLocked:()=>false} : id === './tutorial' ? { registerIntroAsset() {}, requestTutorialExplanation:()=>false, isIntroActive:()=>false } : id.includes('villageGuide') ? { setVillageGuideOpen: value => { dialogue = value } } : id.includes('gameState') ? { getEnemies: () => enemies, attackEnemy() {}, getPlayer: () => ({ level: 3 }) } : id.endsWith('/ecs') ? ecs : id.endsWith('/math') ? math : load(path.resolve(path.dirname(file),id + '.ts')) })
  return exports
 }
 return { load, texts, colliders, transforms, models, animations, visible, clicks, setEnemies: value => { enemies = value }, tick: dt => systems.forEach(fn => fn(dt)), dialogue: () => dialogue }
}
test('seventeen agent enemies use the configured models and Sentinel Core remains fixed and friendly', () => {
 const h = harness(); h.load('src/agents.ts').setupPandoraAgents(); h.load('src/testEnemy.ts').setupTestEnemy()
 assert.equal([...h.models.values()].filter(m=>m.src.includes('/Agentes/')).length,18)
 assert.equal(h.colliders.size,18)
 // Pandora keeps her box; enemy boxes only block movement because the pointer (and hover outline) is on the model.
 assert.deepEqual([...h.colliders.values()].sort(),[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3])
 for (const model of [...h.models.values()].filter(m=>m.src.includes('/Agentes/'))) { assert.match(model.src, /Agentes/); assert.equal(model.visibleMeshesCollisionMask,/Sentinel_Core/.test(model.src)?0:2); assert.equal(model.invisibleMeshesCollisionMask,0) }
 const guide = [...h.models].find(([,m]) => /Sentinel_Core/.test(m.src))[0]
 const start = JSON.stringify(h.transforms.get(guide).position)
 for(let i=0;i<100;i++) h.tick(0.1)
 assert.equal(JSON.stringify(h.transforms.get(guide).position),start)
 h.clicks[0](); assert.equal(h.dialogue(),true)
 for(let i=0;i<16;i++) h.tick(0.1)
 assert.deepEqual(Array.from(h.animations.get(guide).states.filter(s=>s.playing),s=>s.clip),['Idle'])
})
test('agent teleports out once, hides, appears at new position and returns to Idle; attacks face target', () => {
 const h = harness(); const config = h.load('src/shared/testEnemy.ts').SENTINELS[0]
 const enemy = { id: config.id, health:60,maxHealth:60,position:{...config.route[0]},telegraph:null }
 h.setEnemies([enemy]); h.load('src/testEnemy.ts').setupTestEnemy()
 const model = [...h.models.keys()][0]
 const active = () => Array.from(h.animations.get(model).states.filter(s=>s.playing),s=>s.clip)
 enemy.telegraph = { endsAt:400, x:enemy.position.x+2,z:enemy.position.z }
 h.tick(0.01); assert.deepEqual(active(),['Attack']); assert.equal(h.transforms.get(model).rotation.y,90)
 enemy.telegraph = null; h.tick(1.3); assert.deepEqual(active(),['Idle'])
 enemy.health=0; h.tick(0.01)
 assert.deepEqual(active(),['Disappear'])
 const disappear=h.animations.get(model).states.find(s=>s.clip==='Disappear'); assert.equal(disappear.shouldReset,false); assert.equal(disappear.loop,false)
 assert.equal(h.transforms.get([...h.colliders.keys()][0]).scale.x,0)
 h.tick(0.5); assert.deepEqual(active(),['Disappear'])
 h.tick(0.41); assert.equal(h.visible.get(model).visible,false); assert.deepEqual(active(),[])
 h.tick(10); assert.equal(h.visible.get(model).visible,false)
 enemy.health=60; enemy.position={x:110,y:2.9,z:110}; h.tick(0.01)
 assert.equal(h.visible.get(model).visible,true); assert.deepEqual(active(),['Appear']); assert.equal(h.transforms.get(model).position.x,110)
 h.tick(0.9); assert.deepEqual(active(),['Idle'])
})

test('all seventeen enemies have ordered routes, valid models and the nine new combat styles',()=>{
 const h=harness(),{AGENT_CONFIG,AGENT_SPAWNS}=h.load('src/shared/agents.ts'),{SENTINELS,AGENT_COMBAT,inVillageSafeZone}=h.load('src/shared/testEnemy.ts')
 assert.equal(SENTINELS.length,17);assert.equal(AGENT_SPAWNS.length,17)
 const configs=AGENT_CONFIG.filter(c=>c.name!=='Sentinel_Core')
 const ranged=['Aegis_Core','Arcane_Data_Core','Aureate_Sentinel','Smiling_Skybot']
 const melee=['Aegis_Drone','Aethercore_Sentinel','Orbital_Cipher','Pulse_Sentinel','Triad_Sentinel']
 for(const [index,enemy] of SENTINELS.entries()){
  assert.equal(enemy.id,configs[index].name);assert.equal(JSON.stringify(enemy.route[0]),JSON.stringify(AGENT_SPAWNS[index]));assert.ok(enemy.combatStyle)
  for(const point of enemy.route)assert.equal(inVillageSafeZone(point),false)
  const b=fs.readFileSync('assets/scene/modelos/Agentes/'+enemy.id+'_anim.glb'),j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)))
  for(const clip of ['Idle','Greet','Attack','Disappear','Appear','Look','Alert','Hit','Doze'])assert.ok(j.animations.some(a=>a.name===clip),enemy.id+' '+clip)
  if(index>=8){assert.ok(enemy.scale>0);assert.ok(enemy.bodyWidth>=1.7);for(const other of AGENT_SPAWNS.slice(0,index))assert.ok(Math.hypot(other.x-enemy.route[0].x,other.z-enemy.route[0].z)>15)}
 }
 for(const name of ranged)assert.equal(AGENT_COMBAT[name],'ranged')
 for(const name of melee)assert.equal(AGENT_COMBAT[name],'melee')
})

test('agent Hit and Alert react to snapshots but cannot interrupt Attack or Appear',()=>{
 const h=harness(),config=h.load('src/shared/testEnemy.ts').SENTINELS[0]
 const enemy={id:config.id,health:60,maxHealth:60,position:{...config.route[0]},telegraph:null,mode:'patrol'}
 h.setEnemies([enemy]);h.load('src/testEnemy.ts').setupTestEnemy();const model=[...h.models.keys()][0]
 const active=()=>Array.from(h.animations.get(model).states.filter(s=>s.playing),s=>s.clip)
 h.tick(.01);enemy.health=50;h.tick(.01);assert.deepEqual(active(),['Hit'])
 h.tick(.61);enemy.mode='chase';h.tick(.01);assert.deepEqual(active(),['Alert'])
 enemy.telegraph={endsAt:123,x:65,z:65};h.tick(.01);assert.deepEqual(active(),['Attack'])
 enemy.health=40;h.tick(.01);assert.deepEqual(active(),['Attack'])
 enemy.health=0;h.tick(.01);assert.deepEqual(active(),['Disappear']);h.tick(.91)
 enemy.health=60;enemy.telegraph={endsAt:456,x:66,z:66};h.tick(.01);assert.deepEqual(active(),['Appear'])
 enemy.health=50;h.tick(.01);assert.deepEqual(active(),['Appear'])
})

test('enemy Idle phases and tempos have independent identity seeds',()=>{
 const h=harness(),rules=h.load('src/shared/visualRules.ts'),agents=h.load('src/shared/testEnemy.ts').SENTINELS,p=agents.map(a=>rules.agentPersonality(a.id));assert.equal(new Set(p.map(p=>p.seed)).size,17);assert.ok(new Set(p.map(p=>p.idleDelay)).size>10);assert.ok(new Set(p.map(p=>p.idleSpeed)).size>10);assert.ok(new Set(p.map(p=>p.patrolSpeed)).size>10);assert.ok(new Set(p.map(p=>p.cadence)).size>10)
})

test('agents wear a level tag coloured against the player level, and their hover rings never fade while the body is shown',()=>{
 const h=harness(),config=h.load('src/shared/testEnemy.ts').SENTINELS[0]
 const enemy={id:config.id,level:5,health:60,maxHealth:60,position:{...config.route[0]},telegraph:null}
 h.setEnemies([enemy]);h.load('src/testEnemy.ts').setupTestEnemy();h.tick(.1)
 const tag=[...h.texts.values()][0];assert.equal(tag.text,'LV 5 · '+config.name);assert.deepEqual(tag.textColor,[1,.3,.25,1],'above the player level reads as dangerous')
 enemy.level=3;h.tick(.1);assert.equal(tag.text,'LV 3 · '+config.name);assert.deepEqual(tag.textColor,[1,.9,.45,1])
 const rings=[...h.models].find(([,m])=>/Agent_Rings_Corrupt/.test(m.src))[0]
 for(let i=0;i<30;i++){h.tick(.1);assert.ok(h.transforms.get(rings).scale.x>0,'rings stay on')}
 assert.equal(h.animations.get(rings).states[0].clip,'Hover')
})
test('only ranged agents load the shot effect; melee agents carry no hidden ring geometry for it',()=>{
 const h=harness(),{SENTINELS}=h.load('src/shared/testEnemy.ts');h.load('src/testEnemy.ts').setupTestEnemy()
 const shots=[...h.models.values()].filter(m=>/Heal_Rings/.test(m.src)).length
 assert.equal(shots,SENTINELS.filter(s=>s.combatStyle==='ranged').length);assert.ok(shots<SENTINELS.length)
})


test('large agents can be reached outside their collider corners, and health bars appear only in combat or after damage',()=>{
 const h=harness(),{SENTINELS,playerAttackRange}=h.load('src/shared/testEnemy.ts'),config=SENTINELS.find(a=>a.id==='Arcane_Data_Core')
 const cornerDistance=config.bodyWidth/Math.sqrt(2)+.5
 assert.ok(playerAttackRange(config.id)>cornerDistance)
 assert.ok(playerAttackRange(config.id)>3.5)
 assert.equal(playerAttackRange('Rose_Quartz_Arcana'),2.8)
 const enemy={id:config.id,health:160,maxHealth:160,position:{...config.route[0]},mode:'patrol',telegraph:null}
 h.setEnemies([enemy]);h.load('src/testEnemy.ts').setupTestEnemy();h.tick(.1)
 const tag=[...h.texts].find(([,t])=>t.text.includes(config.name))[0],bar=tag-1
 assert.equal(h.transforms.get(bar).scale.x,0,'healthy patrol hides bar')
 enemy.mode='chase';h.tick(.1);assert.ok(h.transforms.get(bar).scale.x>0,'chasing shows full health')
 enemy.mode='attack';h.tick(.1);assert.ok(h.transforms.get(bar).scale.x>0,'attacking shows health')
 enemy.mode='patrol';enemy.health=150;h.tick(.1);assert.ok(h.transforms.get(bar).scale.x>0,'damaged patrol shows health')
 enemy.health=0;h.tick(.1);assert.equal(h.transforms.get(bar).scale.x,0,'defeated hides bar')
})


test('respawns keep every agent in its difficulty band while moving to another validated map point',()=>{
 const h=harness(),{AGENT_SPAWNS,nextAgentRoute}=h.load('src/shared/agents.ts'),{agentDifficultyZone}=h.load('src/shared/agentLevels.ts')
 for(const home of AGENT_SPAWNS){let previous=home;for(let i=0;i<30;i++){const route=nextAgentRoute(previous,()=>i/30,home);assert.equal(agentDifficultyZone(route[0]),agentDifficultyZone(home));assert.ok(Math.hypot(route[0].x-previous.x,route[0].z-previous.z)>10);assert.ok(AGENT_SPAWNS.some(p=>p.x===route[0].x&&p.z===route[0].z));previous=route[0]}}
})
test('the agent level tag keeps its size and is shown or hidden with visibility, never laid out at scale 0',()=>{
 const src=fs.readFileSync('src/testEnemy.ts','utf8')
 assert.match(src,/Transform\.create\(levelTag, \{ position: \{ \.\.\.config\.route\[0\] \}, scale: Vector3\.create\(\.6, \.6, \.6\) \}\)/)
 assert.match(src,/VisibilityComponent\.create\(levelTag, \{ visible: false \}\)/);assert.doesNotMatch(src,/getMutable\(levelTag\)\.scale/)
})
