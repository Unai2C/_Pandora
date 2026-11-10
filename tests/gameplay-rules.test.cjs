const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

function harness(saved = {}, testTools = true) {
  const address = '0xtest'
  const sends = [], villageSaves = []
  const position = { x: 79.65, y: 2, z: 77.01 }
  const storage = new Map([[address + ':pandora_profile_v1', { tutorialStage: 5, ...saved }]])
  const identities=[[1,{address}]]
  const systems = []
  const handlers = new Map()
  let now = 10000
  const cache = new Map()
  const room = { send: async (type, data) => sends.push({ type, data }), onMessage(type, fn) { handlers.set(type, fn) } }
  function load(file) {
    file = path.resolve(file)
    if (cache.has(file)) return cache.get(file)
    const exports = {}
    cache.set(file, exports)
    const source = fs.readFileSync(file, 'utf8')
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
    const requireMock = name => {
      if (name === '@dcl/sdk/server') return { Storage: { player: { get: async (key, field) => storage.get(key + ':' + field), set: async (key, field, data) => storage.set(key + ':' + field, JSON.parse(JSON.stringify(data))) }, get: async () => undefined, set: async (_key,data) => villageSaves.push(JSON.parse(JSON.stringify(data))) } }
      if (name === '@dcl/sdk/ecs') return { AvatarBase: { getOrNull: entity => entity === 1 ? { name: 'Unai' } : null }, PlayerIdentityData: {}, Transform: { getOrNull: () => ({ position }), getMutable: () => ({ position }) }, engine: { getEntitiesWith: () => identities, addSystem: fn => systems.push(fn) } }
      if (name.endsWith('pandoraMessages')) return { room }
      if (name.endsWith('sentinelAI')) return { updatePatrol: () => null }
      // The testing controls are on in these tests; the published scene ships with them off (see the last test).
      if (name.endsWith('testTools')) return { TEST_TOOLS: testTools }
      return load(path.resolve(path.dirname(file), name + '.ts'))
    }
    const suffix = file.endsWith('pandoraServer.ts') ? '\nexports.rules = { loadProfile, applyEnemyDamage, revivePlayer, rewardEnemyDefeat, handleMenuAction, handleSkillUse, handleAttack, getTestEnemies: () => enemies, attributes, equippedRank, progressVillage, targetsForLevel, getVillage: () => village };' : ''
    vm.runInNewContext(code + suffix, { exports, require: requireMock, console, Date: class extends Date { static now() { return now } } }, { filename: file })
    return exports
  }
  return { address, sends, villageSaves, position, systems, load, handlers, addPlayer: address=>identities.push([identities.length+1,{address}]), removePlayer: address=>{const index=identities.findIndex(([,p])=>p.address===address);if(index>=0)identities.splice(index,1)}, tick: ms => { now += ms; systems.forEach(fn => fn(ms / 1000)) } }
}

test('legacy loadouts migrate to three unique learned skills; modern slots retain gaps', () => {
  const { load } = harness()
  const rules = load('src/shared/progression.ts')
  const result = rules.migrateSkillLoadout({ activeSkills: ['boost', '', 'boost', 'ascension'], passiveSkills: ['damage-reduction', 'aura-regeneration'], learned: { boost: 1, ascension: 1, 'damage-reduction': 1, 'aura-regeneration': 1 } })
  assert.deepEqual(Array.from(result), ['boost', 'ascension', 'damage-reduction'])
  assert.deepEqual(Array.from(rules.normalizeSkillLoadout(['', 'boost', 'boost', 'ascension'], { boost: 1, ascension: 1 })), ['', 'boost', ''])
})

test('tree dependencies are real and every node can be reached', () => {
  const rules = harness().load('src/shared/progression.ts')
  const learned = {}
  for (const branch of rules.SKILL_PATHS) {
    assert.equal(rules.canLearnSkill(branch.nodes[0], learned), true)
    assert.equal(rules.canLearnSkill(branch.nodes[1], learned), false)
    for (const id of branch.nodes) {
      assert.equal(rules.canLearnSkill(id, learned), true)
      learned[id] = 1
    }
  }
  assert.equal(Object.keys(learned).length, rules.SKILLS.length)
  assert.equal(rules.canLearnSkill('unknown', learned), false)
})

test('health recovers only near the tree; aura recovers everywhere and caps correctly', () => {
  const rules = harness().load('src/shared/recovery.ts')
  const outside = rules.recoverVitals(40, 10, 100, 100, 0.5, false, false, 0, 0)
  assert.equal(outside.health, 40)
  assert.equal(outside.aura, 12.5)
  assert.ok(Math.abs(rules.recoverVitals(40,10,100,100,.5,true,false,0,0).health-(100-60*Math.exp(-.65*.5)))<1e-9)
  assert.equal(rules.recoverVitals(40, 10, 100, 100, 0.5, false, true, 0, 0).aura, 11)
  assert.equal(rules.recoverVitals(99, 99, 100, 100, 0.5, true, false, 3, 3).health, 100)
  assert.equal(rules.nearHealingTree({ x: 79.65, y: 2, z: 77.01 }), true)
  assert.equal(rules.nearHealingTree({ x: 79.65, y: 30, z: 77.01 }), false)
  assert.equal(rules.nearHealingTree(null), false)
})

test('retired skill attributes remain disabled while level bonuses use a separate rule', () => {
  const rules = harness().load('src/server/pandoraServer.ts').rules
  const profile = { xp: 999999, learned: { 'damage-reduction': 3 }, equippedSkills: ['damage-reduction'] }
  assert.deepEqual(JSON.parse(JSON.stringify(rules.attributes(profile))), { strength: 1, resilience: 1, intelligence: 1 })
  assert.equal(rules.equippedRank(profile, 'damage-reduction'), 0)
})

test('delivery transfers all resources and fractional coins once, including coin-only delivery', async () => {
  for (const resources of [{ wood: 5, stone: 2, fruit: 3 }, { wood: 0, stone: 0, fruit: 0 }]) {
    const h = harness({ ...resources, coins: 12.5 })
    const server = h.load('src/server/pandoraServer.ts')
    server.setupPandoraServer()
    const profile = await server.rules.loadProfile(h.address)
    const deliver = () => h.handlers.get('deliverRequest')({}, { from: h.address })
    Object.assign(h.position, { x: 86, z: 88 })
    await deliver()
    assert.equal(profile.coins, 0)
    assert.equal(profile.wood + profile.stone + profile.fruit, 0)
    let snapshot = h.sends.filter(s => s.type === 'villageSnapshot').at(-1).data
    assert.equal(snapshot.coins, 12.5)
    assert.equal(snapshot.wood, resources.wood)
    await deliver()
    snapshot = h.sends.filter(s => s.type === 'villageSnapshot').at(-1).data
    assert.equal(snapshot.coins, 12.5)
  }
})

test('retired menu and manual skill requests cannot change saved progression or spend aura', async () => {
  const h = harness({ coins: 150, xp: 100, skillPoints: 20, learned: { boost: 1 }, equippedSkills: ['boost', '', ''], health: 40, aura: 90 })
  const server = h.load('src/server/pandoraServer.ts').rules
  const profile = await server.loadProfile(h.address)
  const before = JSON.stringify(profile)
  for (const action of ['learn', 'equip-skill', 'unequip-skill', 'reset-board', 'use-health', 'use-aura']) await server.handleMenuAction({ action, value: 'boost', slot: 0 }, h.address)
  await server.handleSkillUse({ skillId: 'boost', enemyId: '' }, h.address)
  assert.equal(JSON.stringify(profile), before)
})

test('server recovery tick respects the actual tree position', async () => {
  const h = harness({ health: 40, aura: 10 })
  const server = h.load('src/server/pandoraServer.ts')
  server.setupPandoraServer()
  const profile = await server.rules.loadProfile(h.address)
  const flush = () => new Promise(resolve => setImmediate(resolve))
  h.position.x = 110
  h.tick(250); await flush()
  h.tick(250); await flush()
  assert.equal(profile.health, 40)
  assert.ok(profile.aura > 10)
  h.position.x = 79.65
  h.tick(250); await flush()
  assert.ok(profile.health > 40)
})

 test('coins are required and spent along with other village materials', async () => {
  const rules = harness().load('src/server/pandoraServer.ts').rules
  const village = rules.getVillage()
  const target = rules.targetsForLevel(1)
  assert.equal(target.coins, 3)
  Object.assign(village, { wood: target.wood, stone: target.stone, fruit: target.fruit, coins: 2 })
  await rules.progressVillage()
  assert.equal(village.level, 1)
  village.coins = 8
  await rules.progressVillage()
  assert.equal(village.level, 2)
  assert.equal(village.coins, 0)
  assert.equal(rules.targetsForLevel(2).coins, 4)
 })

test('server applies tool damage and preserves the previous cooldown when switching tools', async () => {
 const h = harness(), rules = h.load('src/server/pandoraServer.ts').rules
 const enemy = rules.getTestEnemies().values().next().value
 Object.assign(h.position, enemy.position)
 enemy.health = 100; enemy.maxHealth = 100
 await rules.handleAttack({ enemyId: enemy.id, tool: 'pickaxe' }, h.address)
 assert.equal(enemy.health, 86)
 h.tick(1500)
 await rules.handleAttack({ enemyId: enemy.id, tool: 'sword' }, h.address)
 assert.equal(enemy.health, 86)
 h.tick(700)
 await rules.handleAttack({ enemyId: enemy.id, tool: 'sword' }, h.address)
 assert.equal(enemy.health, 66)
 h.tick(1300)
 await rules.handleAttack({ enemyId: enemy.id, tool: 'axe' }, h.address)
 assert.equal(enemy.health, 58)
 h.tick(1500)
 await rules.handleAttack({ enemyId: enemy.id, tool: 'invalid' }, h.address)
 assert.equal(enemy.health, 58)
})

test('defeated agents wait thirty seconds, respawn elsewhere and cannot attack while appearing', () => {
 const h = harness(), server = h.load('src/server/pandoraServer.ts')
 server.setupPandoraServer()
 const enemies = server.rules.getTestEnemies()
 assert.equal(enemies.size,17)
 assert.equal([...enemies.values()].some(e => /inferno|Sentinel_Core/i.test(e.id)),false)
 const enemy = enemies.values().next().value, previous = {...enemy.position}
 enemy.health=0; enemy.respawnAt=40000
 h.tick(29999); assert.equal(enemy.health,0)
 h.tick(1); assert.equal(enemy.health,60)
 assert.ok(Math.hypot(enemy.position.x-previous.x,enemy.position.z-previous.z)>10)
 assert.equal(enemy.appearUntil,40900)
 assert.equal(enemy.telegraph,null)
})

test('ranged and melee agents have distinct engagement ranges and respect safe zone and dodging', () => {
 const rules = harness().load('src/shared/testEnemy.ts')
 assert.equal(rules.SENTINELS.filter(e => e.combatStyle === 'ranged').length,8)
 assert.equal(rules.SENTINELS.filter(e => e.combatStyle === 'melee').length,9)
 const origin = { x:60,y:2.9,z:62 }, player = { x:65,y:2,z:62 }
 assert.equal(rules.agentAttackHits(player,origin,player,6),true)
 assert.equal(rules.agentAttackHits(player,origin,player,2.2),false)
 assert.equal(rules.agentAttackHits({x:69,y:2,z:62},origin,player,6),false)
 assert.equal(rules.agentAttackHits({x:80,y:2,z:82}, {x:78,y:2.9,z:82}, {x:80,z:82},6),false)
 assert.equal(rules.agentAttackHits({x:65,y:20,z:62},origin,player,6),false)
})

test('each enemy awards one shard total, no collaboration multiplier or kill milestone bonus', async () => {
 const h = harness({ coins: 0, defeated: 9 }), rules = h.load('src/server/pandoraServer.ts').rules
 const profile = await rules.loadProfile(h.address), ally = await rules.loadProfile('0xally')
 const enemy = rules.getTestEnemies().values().next().value
 enemy.participants = { [h.address]: 10000, '0xally': 10000 }
 await rules.rewardEnemyDefeat(enemy,10000,h.address)
 assert.equal(profile.coins,1); assert.equal(ally.coins,0)
 assert.equal(profile.defeated,10)
 await rules.rewardEnemyDefeat(enemy,10000,h.address)
 assert.equal(profile.coins,1); assert.equal(profile.defeated,10)
 assert.ok(h.sends.some(s => s.type === 'pandoraFeedback' && /1 memory shard/.test(s.data.text)))
})

test('village shard goals are bounded and combat remains the sole new shard source', () => {
 const rules = harness().load('src/server/pandoraServer.ts').rules
 assert.deepEqual(Array.from({length:13},(_,i)=>rules.targetsForLevel(i+1).coins),[3,4,5,6,8,10,12,14,16,18,20,22,24])
 const source = fs.readFileSync('src/server/pandoraServer.ts','utf8')
 assert.equal(/addMilestoneCoins|coins \+= 100|due \* 10/.test(source),false)
})

test('lethal damage waits for Continue before healing or returning to the village', async () => {
 const h=harness({health:1,coins:7,wood:5}), server=h.load('src/server/pandoraServer.ts'), rules=server.rules
 server.setupPandoraServer()
 const enemy=rules.getTestEnemies().values().next().value
 Object.assign(h.position,enemy.position)
 const profile=await rules.loadProfile(h.address), before=JSON.stringify(h.position)
 await rules.applyEnemyDamage(h.address,enemy)
 assert.equal(profile.health,0)
 assert.equal(JSON.stringify(h.position),before)
 assert.equal(h.sends.filter(s=>s.type==='playerDefeated').length,1)
 h.tick(1000); await new Promise(r=>setImmediate(r))
 assert.equal(profile.health,0)
 await rules.handleAttack({enemyId:enemy.id,tool:'sword'},h.address)
 assert.equal(enemy.health,enemy.maxHealth)
 await rules.revivePlayer(h.address)
 assert.equal(profile.health,100)
 assert.equal(profile.coins,7);assert.equal(profile.wood,5)
})

test('authored resource nodes enforce position, shared cooldowns, OFF snapshots and regeneration', async () => {
 const h=harness(), server=h.load('src/server/pandoraServer.ts')
 server.setupPandoraServer()
 const node=h.load('src/shared/worldLayout.ts').WORLD_RESOURCES.find(n=>n.kind==='wood'&&n.hitsRequired===1)
 Object.assign(h.position,node.position)
 const profile=await server.rules.loadProfile(h.address)
 const request={kind:node.kind,nodeId:node.id}
 await h.handlers.get('gatherRequest')(request,{from:h.address})
 assert.equal(profile.wood,5)
 let snapshot=h.sends.filter(s=>s.type==='resourceSnapshot').at(-1)
 assert.ok(JSON.parse(snapshot.data.nodesJson).some(n=>n.id===node.id && n.availableAt===40000))
 await h.handlers.get('gatherRequest')(request,{from:h.address})
 assert.equal(profile.wood,5)
 await h.handlers.get('connectPandora')({ready:true},{from:h.address})
 snapshot=h.sends.filter(s=>s.type==='resourceSnapshot').at(-1)
 assert.ok(JSON.parse(snapshot.data.nodesJson).some(n=>n.id===node.id))
 h.tick(30001)
 await h.handlers.get('gatherRequest')(request,{from:h.address})
 assert.equal(profile.wood,10)
 await h.handlers.get('gatherRequest')({kind:'fruit',nodeId:node.id},{from:h.address})
 assert.equal(profile.fruit,0)
})

test('large resources reward each timed impact and stay ON until the shared reserve is empty',async()=>{
 const h=harness(), server=h.load('src/server/pandoraServer.ts');server.setupPandoraServer()
 const node=h.load('src/shared/worldLayout.ts').WORLD_RESOURCES.find(n=>n.kind==='fruit'&&n.hitsRequired===3)
 Object.assign(h.position,node.position)
 const profile=await server.rules.loadProfile(h.address)
 const hit=()=>h.handlers.get('gatherRequest')({kind:node.kind,nodeId:node.id},{from:h.address})
 const state=()=>JSON.parse(h.sends.filter(s=>s.type==='resourceSnapshot').at(-1).data.nodesJson).find(n=>n.id===node.id)
 await hit();assert.equal(profile.fruit,5);assert.equal(state().hits,1);assert.equal(state().availableAt,0)
 await hit();assert.equal(state().hits,1)
 h.tick(1000);await hit();assert.equal(profile.fruit,10);assert.equal(state().hits,2)
 h.tick(1000);await hit();assert.equal(profile.fruit,15);assert.equal(state().hits,3);assert.ok(state().availableAt>12000)
 h.tick(1000);await hit();assert.equal(profile.fruit,15)
 h.tick(30001);await hit();assert.equal(profile.fruit,20);assert.equal(state().hits,1);assert.equal(state().availableAt,0)
})

test('tutorial awards tools in order and resumes its saved stage',async()=>{
 const h=harness({tutorialStage:0}),server=h.load('src/server/pandoraServer.ts');server.setupPandoraServer()
 const profile=await server.rules.loadProfile(h.address),rules=h.load('src/shared/tutorial.ts')
 const nodes=h.load('src/shared/worldLayout.ts').WORLD_RESOURCES
 const gather=async kind=>{const node=nodes.find(n=>n.kind===kind&&n.hitsRequired===1);Object.assign(h.position,node.position);await h.handlers.get('gatherRequest')({kind,nodeId:node.id},{from:h.address})}
 await gather('wood');assert.equal(profile.wood,0);assert.equal(profile.tutorialStage,0)
 assert.equal(rules.toolUnlocked(profile.tutorialStage,'axe'),false)
 await h.handlers.get('introCompleteRequest')({ready:true},{from:h.address});assert.equal(profile.tutorialStage,1)
 await gather('stone');assert.equal(profile.stone,0)
 await gather('fruit');assert.equal(profile.fruit,0);assert.equal(profile.tutorialStage,1)
 await h.handlers.get('guideArrivalRequest')({ready:true},{from:h.address});assert.equal(profile.guideMet,false)
 Object.assign(h.position,{x:83,y:2,z:84});await h.handlers.get('guideArrivalRequest')({ready:true},{from:h.address});assert.equal(profile.guideMet,true)
 await gather('fruit');assert.equal(profile.tutorialStage,2);assert.equal(rules.toolUnlocked(2,'axe'),true);assert.equal(rules.toolUnlocked(2,'pickaxe'),false)
 h.tick(1000);await gather('wood');assert.equal(profile.tutorialStage,3);assert.equal(rules.toolUnlocked(3,'pickaxe'),true);assert.equal(rules.toolUnlocked(3,'sword'),false)
 h.tick(1000);await gather('stone');assert.equal(profile.tutorialStage,4);assert.equal(rules.toolUnlocked(4,'sword'),true)
 const enemy=server.rules.getTestEnemies().values().next().value;enemy.participants={[h.address]:13000}
 await server.rules.rewardEnemyDefeat(enemy,13000,h.address);assert.equal(profile.tutorialStage,5)
 const resumed=harness(JSON.parse(JSON.stringify(profile)));assert.equal((await resumed.load('src/server/pandoraServer.ts').rules.loadProfile(resumed.address)).tutorialStage,5)
})

test('all nine new server agents have health, combat settings, XP and exactly one shard each',async()=>{
 const h=harness(),rules=h.load('src/server/pandoraServer.ts').rules,profile=await rules.loadProfile(h.address)
 const enemies=[...rules.getTestEnemies().values()].slice(8);assert.equal(enemies.length,9)
 const beforeXp=profile.xp,beforeShards=profile.coins
 for(const enemy of enemies){
  assert.ok([60,100,160].includes(enemy.health));assert.equal(enemy.maxHealth,enemy.health);assert.equal(enemy.respawnSeconds,30)
  assert.equal(enemy.attackRange,enemy.combatStyle==='ranged'?6:2.2)
  enemy.participants={[h.address]:10000};await rules.rewardEnemyDefeat(enemy,10000,h.address)
  assert.equal(enemy.respawnAt,40000)
 }
 assert.equal(profile.xp-beforeXp,90);assert.equal(profile.coins-beforeShards,9)
})

test('restarting the intro starts the player over as a new explorer and resets the village to level one',async()=>{
 const h=harness({tutorialStage:5,guideMet:true,introSeen:true,wood:12,stone:9,fruit:7,coins:4,xp:9000,skillPoints:6,learned:{},defeated:8,chests:3,collected:250,health:40,visitedPoints:{altar:{x:1,y:0,z:1}}}),server=h.load('src/server/pandoraServer.ts');server.setupPandoraServer()
 await h.handlers.get('connectPandora')({ready:true},{from:h.address})
 const profile=await server.rules.loadProfile(h.address),village=server.rules.getVillage()
 Object.assign(village,{level:7,wood:40,stone:30,fruit:20,coins:5,defeats:9,revision:23})
 const helper=await server.rules.loadProfile('0xhelper');helper.wood=19;helper.tutorialStage=5
 const reset=()=>h.handlers.get('restartIntroRequest')({ready:true},{from:h.address})
 await reset()
 assert.equal(profile.tutorialStage,0);assert.equal(profile.guideMet,false)
 for(const key of ['wood','stone','fruit','coins','xp','defeated','chests','collected'])assert.equal(profile[key],0)
 assert.equal(profile.introSeen,false);assert.equal(profile.skillPoints,1);assert.equal(profile.health,100);assert.deepEqual({...profile.visitedPoints},{})
 assert.equal(JSON.parse(h.sends.filter(s=>s.type==='playerSnapshot').at(-1).data.profileJson).level,1,'the hero is level one again')
 assert.equal(village.level,1);assert.equal(village.revision,24)
 for(const key of ['wood','stone','fruit','coins','defeats'])assert.equal(village[key],0)
 assert.equal(helper.wood,19);assert.equal(helper.tutorialStage,5)
 const snapshot=h.sends.filter(s=>s.type==='villageSnapshot').at(-1).data
 assert.equal(snapshot.level,1);assert.equal(snapshot.targetWood,server.rules.targetsForLevel(1).wood);assert.equal(snapshot.treeTransitionAt,'0');assert.equal(h.villageSaves.at(-1).level,1);assert.equal(h.villageSaves.at(-1).wood,0)
 const tiers=h.load('src/shared/enemyTiers.ts'),enemies=JSON.parse(h.sends.filter(s=>s.type==='enemySnapshot').at(-1).data.enemiesJson);assert.ok(enemies.every(e=>tiers.enemyTierFor(e.id).unlockLevel===1))
 village.wood=11;await reset();assert.equal(village.level,1);assert.equal(village.wood,0);assert.equal(h.villageSaves.at(-1).wood,0)
})

test('server reports healing explicitly and stops it on leaving the tree or reaching full health',async()=>{
 const h=harness({health:40,aura:100}),server=h.load('src/server/pandoraServer.ts');server.setupPandoraServer()
 await server.rules.loadProfile(h.address);const flush=()=>new Promise(r=>setImmediate(r))
 const latest=()=>JSON.parse(h.sends.filter(s=>s.type==='playerSnapshot').at(-1).data.profileJson)
 h.tick(250);await flush();h.tick(500);await flush();assert.equal(latest().healingActive,true)
 Object.assign(h.position,{x:10,y:2,z:10});h.tick(250);await flush();assert.equal(latest().healingActive,false)
 const profile=await server.rules.loadProfile(h.address);profile.health=99;Object.assign(h.position,{x:79.65,y:2,z:77.01})
 h.tick(500);await flush();assert.equal(latest().health,100);assert.equal(latest().healingActive,false)
})

test('tutorial briefing protects the player only for the current stage and releases protection afterwards',async()=>{
 const h=harness({tutorialStage:4}),server=h.load('src/server/pandoraServer.ts');server.setupPandoraServer()
 const profile=await server.rules.loadProfile(h.address),enemy=server.rules.getTestEnemies().values().next().value
 await h.handlers.get('tutorialBriefingRequest')({active:true,stage:4},{from:h.address})
 await server.rules.applyEnemyDamage(h.address,enemy);assert.equal(profile.health,100)
 await h.handlers.get('tutorialBriefingRequest')({active:false,stage:4},{from:h.address})
 await server.rules.applyEnemyDamage(h.address,enemy);assert.equal(profile.health,92)
 profile.health=100
 await h.handlers.get('tutorialBriefingRequest')({active:true,stage:2},{from:h.address})
 await server.rules.applyEnemyDamage(h.address,enemy);assert.equal(profile.health,92)
})

test('two players receive their own impacts from one shared large node without duplicating the final yield',async()=>{
 const h=harness();h.addPlayer('0xhelper');const server=h.load('src/server/pandoraServer.ts');server.setupPandoraServer()
 const node=h.load('src/shared/worldLayout.ts').WORLD_RESOURCES.find(n=>n.kind==='stone'&&n.hitsRequired===3);Object.assign(h.position,node.position)
 const a=await server.rules.loadProfile(h.address),b=await server.rules.loadProfile('0xhelper');b.tutorialStage=5
 const hit=address=>h.handlers.get('gatherRequest')({kind:'stone',nodeId:node.id},{from:address})
 await Promise.all([hit(h.address),hit('0xhelper')]);assert.equal(a.stone,5);assert.equal(b.stone,5)
 h.tick(1000);await Promise.all([hit(h.address),hit('0xhelper')]);assert.equal(a.stone+b.stone,15)
 const state=JSON.parse(h.sends.filter(s=>s.type==='resourceSnapshot').at(-1).data.nodesJson).find(n=>n.id===node.id);assert.equal(state.hits,3);assert.ok(state.availableAt>0)
})
test('village level resets all community excess, preserves unsubmitted player resources and broadcasts a common transition time',async()=>{
 const h=harness({wood:17,coins:9}),server=h.load('src/server/pandoraServer.ts');server.setupPandoraServer();const p=await server.rules.loadProfile(h.address),v=server.rules.getVillage()
 Object.assign(v,{wood:9999,stone:9999,fruit:9999,coins:9999,defeats:9999});await server.rules.progressVillage()
 assert.equal(v.level,2);for(const kind of ['wood','stone','fruit','coins','defeats'])assert.equal(v[kind],0);assert.equal(p.wood,17);assert.equal(p.coins,9)
 await h.handlers.get('connectPandora')({ready:true},{from:h.address});const snapshot=h.sends.filter(s=>s.type==='villageSnapshot').at(-1).data;assert.equal(snapshot.treeTransitionAt,'11500')
})
test('player levels add ten maximum health and two attack damage without restoring retired skills',async()=>{
 const h=harness({xp:100}),server=h.load('src/server/pandoraServer.ts'),u=h.load('src/shared/playerUpgrades.ts');server.setupPandoraServer()
 for(let level=1;level<=10;level++){assert.equal(u.playerUpgrades(level).maxHealth,100+10*(level-1));assert.equal(u.playerUpgrades(level).damageBonus,2*(level-1))}
 const profile=await server.rules.loadProfile(h.address),level=h.load('src/shared/progression.ts').levelForXp(profile.xp).level
 const enemy=server.rules.getTestEnemies().values().next().value;enemy.health=500;enemy.maxHealth=500;Object.assign(h.position,enemy.position)
 await server.rules.handleAttack({enemyId:enemy.id,tool:'sword'},h.address);assert.equal(enemy.health,500-(20+2*(level-1)))
 await h.handlers.get('connectPandora')({ready:true},{from:h.address});const data=JSON.parse(h.sends.filter(s=>s.type==='playerSnapshot').at(-1).data.profileJson);assert.equal(data.maxHealth,100+10*(level-1))
})
test('enemy size tiers unlock for everyone at village levels two and three and locked agents reject attacks',async()=>{
 const h=harness(),server=h.load('src/server/pandoraServer.ts');server.setupPandoraServer();await h.handlers.get('connectPandora')({ready:true},{from:h.address});const v=server.rules.getVillage(),tiers=h.load('src/shared/enemyTiers.ts')
 for(const level of [1,2,3]){v.level=level;await h.handlers.get('connectPandora')({ready:true},{from:h.address});const enemies=JSON.parse(h.sends.filter(s=>s.type==='enemySnapshot').at(-1).data.enemiesJson);assert.ok(enemies.length>0);assert.ok(enemies.every(e=>tiers.enemyTierFor(e.id).unlockLevel<=level));if(level===3)assert.equal(enemies.length,17)}
 v.level=1;const enemy=server.rules.getTestEnemies().get('Aethercore_Sentinel'),health=enemy.health;Object.assign(h.position,enemy.position);await server.rules.handleAttack({enemyId:enemy.id,tool:'sword'},h.address);assert.equal(enemy.health,health)
})

test('exponential healing takes the same time at every health cap and ends at exactly full health',()=>{
 const r=harness().load('src/shared/recovery.ts'),times=[];for(const maximum of [100,250,1000]){let health=maximum*.1,time=0;while(health<maximum&&time<30){health=r.recoverVitals(health,0,maximum,100,.1,true,false,0,0).health;time+=.1}assert.equal(health,maximum);times.push(time)}assert.equal(times[0],times[1]);assert.equal(times[1],times[2]);assert.ok(times[0]<8)
 const low=r.recoverVitals(10,0,100,100,.5,true,false,0,0).health-10,high=r.recoverVitals(80,0,100,100,.5,true,false,0,0).health-80;assert.ok(low>high)
})
test('all four platform altars accept resources into the same community stock',async()=>{
 const h=harness(),server=h.load('src/server/pandoraServer.ts');server.setupPandoraServer();await h.handlers.get('connectPandora')({ready:true},{from:h.address});const p=await server.rules.loadProfile(h.address),points=h.load('src/shared/tutorial.ts').DELIVERY_POINTS
 for(const point of points){Object.assign(h.position,point);p.wood=5;await h.handlers.get('deliverRequest')({},{from:h.address});assert.equal(p.wood,0)}assert.equal(server.rules.getVillage().wood,20)
 Object.assign(h.position,{x:10,y:2,z:10});p.wood=7;await h.handlers.get('deliverRequest')({},{from:h.address});assert.equal(p.wood,7);assert.equal(server.rules.getVillage().wood,20)
})

test('intro history persists, migrates old saves, and restarting explicitly enables the cinematic again',async()=>{
 for(const [saved,seen]of [[{tutorialStage:0},false],[{tutorialStage:3},true],[{tutorialStage:5,introSeen:true},true]]){const h=harness(saved),s=h.load('src/server/pandoraServer.ts');s.setupPandoraServer();const p=await s.rules.loadProfile(h.address);assert.equal(p.introSeen,seen);await h.handlers.get('introCompleteRequest')({ready:true},{from:h.address});assert.equal(p.introSeen,true);const expected=saved.tutorialStage===0?1:saved.tutorialStage;assert.equal(p.tutorialStage,expected);const resumed=harness(JSON.parse(JSON.stringify(p))).load('src/server/pandoraServer.ts');assert.equal((await resumed.rules.loadProfile(h.address)).introSeen,true);await h.handlers.get('restartIntroRequest')({ready:true},{from:h.address});assert.equal(p.introSeen,false);assert.equal(p.tutorialStage,0)}
})
test('enemies cannot damage a returning explorer in the entry menu or controls guide',async()=>{
 const h=harness({tutorialStage:5}),s=h.load('src/server/pandoraServer.ts');s.setupPandoraServer();await h.handlers.get('connectPandora')({ready:true},{from:h.address});const p=await s.rules.loadProfile(h.address),enemy=s.rules.getTestEnemies().values().next().value;Object.assign(h.position,enemy.position);await s.rules.applyEnemyDamage(h.address,enemy);assert.equal(p.health,100);await h.handlers.get('introCompleteRequest')({ready:true},{from:h.address});await s.rules.applyEnemyDamage(h.address,enemy);assert.equal(p.health,92);assert.equal(p.tutorialStage,5)
})


test('Arcane Data Core takes melee damage beyond the old centre limit, but distant hits remain rejected',async()=>{
 const h=harness(),rules=h.load('src/server/pandoraServer.ts').rules
 rules.getVillage().level=3
 const enemy=rules.getTestEnemies().get('Arcane_Data_Core')
 enemy.health=enemy.maxHealth=500
 Object.assign(h.position,{x:enemy.position.x+3.5,y:enemy.position.y-1,z:enemy.position.z})
 await rules.handleAttack({enemyId:enemy.id,tool:'sword'},h.address)
 assert.equal(enemy.health,480,'a large collider must not keep the sword outside its valid reach')
 h.tick(1000)
 h.position.x=enemy.position.x+5
 await rules.handleAttack({enemyId:enemy.id,tool:'sword'},h.address)
 assert.equal(enemy.health,480,'range validation still rejects distant attacks')
})


test('test button advances the shared village once, saves and broadcasts the normal transition without spending carried resources',async()=>{
 const h=harness({wood:12,stone:9,fruit:7,coins:4}),server=h.load('src/server/pandoraServer.ts');server.setupPandoraServer()
 await h.handlers.get('connectPandora')({ready:true},{from:h.address})
 const p=await server.rules.loadProfile(h.address),v=server.rules.getVillage(),run=()=>h.handlers.get('testVillageLevelUpRequest')({requested:true},{from:h.address})
 await run();assert.equal(v.level,2);assert.equal(h.villageSaves.at(-1).level,2)
 const snapshot=h.sends.filter(s=>s.type==='villageSnapshot').at(-1).data
 assert.equal(snapshot.level,2);assert.equal(snapshot.treeTransitionAt,'11500')
 for(const field of ['wood','stone','fruit','coins','defeats'])assert.equal(v[field],0)
 assert.equal(p.wood,12);assert.equal(p.stone,9);assert.equal(p.fruit,7);assert.equal(p.coins,4)
 await run();assert.equal(v.level,2,'repeated clicks cannot skip the current animation')
 h.tick(13000);await run();assert.equal(v.level,3)
})


test('village progresses past 13 to 100, never resets or grants cycle badges, and max-level test requests preserve inventory',async()=>{
 const h=harness({wood:12,coins:4}),server=h.load('src/server/pandoraServer.ts');server.setupPandoraServer()
 await h.handlers.get('connectPandora')({ready:true},{from:h.address})
 const v=server.rules.getVillage(),p=await server.rules.loadProfile(h.address),cycle=v.cycle
 v.level=13
 for(let level=13;level<100;level++){Object.assign(v,server.rules.targetsForLevel(level));await server.rules.progressVillage();assert.equal(v.level,level+1)}
 assert.equal(v.cycle,cycle);assert.equal(p.cycleBadges,0)
 assert.ok(h.sends.filter(s=>s.type==='pandoraFeedback').every(s=>! /Storehouse|Shelter|expansion|Cycle complete/.test(s.data.text)))
 Object.assign(v,{wood:9999,stone:9999,fruit:9999,coins:9999});await server.rules.progressVillage();assert.equal(v.level,100)
 await h.handlers.get('testVillageLevelUpRequest')({requested:true},{from:h.address});assert.equal(v.level,100)
 await h.handlers.get('deliverRequest')({},{from:h.address});assert.equal(p.wood,12);assert.equal(p.coins,4)
})

test('the community feed hears about deliveries, falls and defeated agents, by player name',async()=>{
 const h=harness(),server=h.load('src/server/pandoraServer.ts');server.setupPandoraServer();await h.handlers.get('connectPandora')({ready:true},{from:h.address})
 const p=await server.rules.loadProfile(h.address),feed=()=>h.sends.filter(s=>s.type==='communityEvent').map(s=>s.data.text)
 Object.assign(h.position,h.load('src/shared/tutorial.ts').DELIVERY_POINTS[0]);p.wood=5;p.fruit=3;await h.handlers.get('deliverRequest')({},{from:h.address})
 assert.ok(feed().includes('Unai delivered 5 wood, 3 fruit'),JSON.stringify(feed()))
 const other=[...server.rules.getTestEnemies().values()][1];other.participants={[h.address]:Date.now()};await server.rules.rewardEnemyDefeat(other,Date.now(),h.address)
 assert.ok(feed().includes('Unai defeated '+other.name))
})

test('a fall reaches the community feed with the player name',async()=>{
 const h=harness({health:1}),server=h.load('src/server/pandoraServer.ts');server.setupPandoraServer()
 const enemy=server.rules.getTestEnemies().values().next().value;Object.assign(h.position,enemy.position);await server.rules.loadProfile(h.address)
 await server.rules.applyEnemyDamage(h.address,enemy)
 assert.ok(h.sends.some(s=>s.type==='communityEvent'&&s.data.text==='Unai fell to '+enemy.name))
})


test('server adapts distance bands to online beginners and veterans, holds combat levels, and updates after a disconnect',async()=>{
 const h=harness(),s=h.load('src/server/pandoraServer.ts');s.setupPandoraServer()
 await h.handlers.get('connectPandora')({ready:true},{from:h.address})
 const p=await s.rules.loadProfile(h.address),progress=h.load('src/shared/progression.ts'),rules=h.load('src/shared/agentLevels.ts')
 h.addPlayer('0xveteran');const veteran=await s.rules.loadProfile('0xveteran');let xp=0;while(progress.levelForXp(xp).level<30)xp+=100;veteran.xp=xp
 const village=s.rules.getVillage();village.level=3;h.tick(3001)
 const agents=[...s.rules.getTestEnemies().values()].sort((a,b)=>rules.agentVillageDistance(a.route[0])-rules.agentVillageDistance(b.route[0]))
 for(const enemy of agents)assert.equal(enemy.level,rules.assignAgentLevelsByDistance([enemy.route[0]],[1,30])[0])
 assert.equal(agents[0].level,1);assert.ok(agents.at(-1).level>=30)
 const fighter=agents.at(-1),oldLevel=fighter.level;fighter.mode='attack';fighter.health--;veteran.xp=0;h.tick(3001);assert.equal(fighter.level,oldLevel,'combat retains its level')
 fighter.mode='patrol';fighter.health=fighter.maxHealth;h.tick(3001);assert.ok(fighter.level<=3)
 // A cached beginner profile is no longer considered after its identity leaves the server.
 veteran.xp=xp;h.removePlayer(h.address);h.tick(3001);assert.equal(agents[0].level,30);assert.equal(p.xp,0)
})
test('skipping the tutorial finishes it on the server with every tool unlocked, only for explorers past the intro',async()=>{
 const h=harness({tutorialStage:2,guideMet:true,introSeen:true}),server=h.load('src/server/pandoraServer.ts');server.setupPandoraServer()
 await h.handlers.get('connectPandora')({ready:true},{from:h.address})
 const profile=await server.rules.loadProfile(h.address)
 await h.handlers.get('skipTutorialRequest')({ready:true},{from:h.address})
 assert.equal(profile.tutorialStage,6);assert.equal(profile.guideMet,true)
 const fresh=await server.rules.loadProfile('0xnew');fresh.tutorialStage=0
 await h.handlers.get('skipTutorialRequest')({ready:true},{from:'0xnew'});assert.equal(fresh.tutorialStage,0,'the intro is not skipped this way')
})
test('agents wind up slowly and late enough for the explorer to strike first',()=>{
 const exports={};require('node:vm').runInNewContext(require('typescript').transpileModule(fs.readFileSync('src/shared/visualRules.ts','utf8'),{compilerOptions:{module:1}}).outputText,{exports,Math})
 for(const id of ['Aegis_Core','A','Sentinel_07']){const p=exports.agentPersonality(id);assert.ok(p.attackDelay>=1800);assert.ok(p.cadence>=4.4)}
})
test('the first delivery at an altar is the last tutorial step; before it the tutorial player cannot deliver',async()=>{
 const h=harness({tutorialStage:4,guideMet:true,introSeen:true}),server=h.load('src/server/pandoraServer.ts');server.setupPandoraServer();await h.handlers.get('connectPandora')({ready:true},{from:h.address})
 const p=await server.rules.loadProfile(h.address),point=h.load('src/shared/tutorial.ts').DELIVERY_POINTS[0];Object.assign(h.position,point)
 p.wood=3;await h.handlers.get('deliverRequest')({},{from:h.address});assert.equal(p.wood,3,'still on the agent step');assert.equal(p.tutorialStage,4)
 p.tutorialStage=5;await h.handlers.get('deliverRequest')({},{from:h.address});assert.equal(p.wood,0);assert.equal(p.tutorialStage,6,'tutorial complete')
 assert.equal(JSON.parse(h.sends.filter(s=>s.type==='playerSnapshot').at(-1).data.profileJson).tutorialStage,6)
})
test('the published scene ships without testing controls: the server ignores restart, skip and level-up requests',async()=>{
 assert.match(fs.readFileSync('src/shared/testTools.ts','utf8'),/export const TEST_TOOLS = false/)
 const h=harness({tutorialStage:2,guideMet:true,introSeen:true,wood:4},false),server=h.load('src/server/pandoraServer.ts');server.setupPandoraServer()
 await h.handlers.get('connectPandora')({ready:true},{from:h.address})
 const profile=await server.rules.loadProfile(h.address),village=server.rules.getVillage();village.level=3
 await h.handlers.get('restartIntroRequest')({ready:true},{from:h.address});await h.handlers.get('skipTutorialRequest')({ready:true},{from:h.address});await h.handlers.get('testVillageLevelUpRequest')({requested:true},{from:h.address})
 assert.equal(profile.tutorialStage,2);assert.equal(profile.wood,4);assert.equal(village.level,3)
})
