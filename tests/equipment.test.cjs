const { test } = require('node:test')
const assert = require('node:assert/strict')
const ts = require('typescript')
const fs = require('fs')
const vm = require('vm')
test('E uses only the selected tool, respects reach and prevents repeated actions', () => {
 const enemies = []
 const calls = [], systems = [], position = { x: 10, y: 2, z: 10 }
 let now = 10000, pressed = false, selectedKey = null
 const exports = {}
 const ecs = { engine: { PlayerEntity: 1, addSystem: fn => systems.push(fn) }, InputAction: { IA_PRIMARY: 'E', IA_ACTION_3: '1', IA_ACTION_4: '2', IA_ACTION_5: '3' }, PointerEventType: { PET_DOWN: 1 }, inputSystem: { isTriggered: key => (pressed && key === 'E') || (selectedKey !== null && key === selectedKey) }, Transform: { getOrNull: () => ({ position }) } }
 const source = ts.transpileModule(fs.readFileSync('src/equipment.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
 vm.runInNewContext(source, { exports, Date: { now: () => now }, require: name => name.includes('cinematicLock') ? {isCinematicLocked:()=>false} : name.includes('shared/testEnemy') ? { playerAttackRange: () => 2.8 } : name.includes('shared/tutorial') ? { toolUnlocked: () => true } : name === './tutorial' ? { getTutorialStage: () => 5, isIntroActive: () => false } : name.includes('shared/tools') ? { TOOL_RULES: { sword: { cooldown: 1300 }, axe: { cooldown: 1500 }, pickaxe: { cooldown: 2200 } } } : name.includes('avatarTools') ? { equipAvatarTool: tool => calls.push('equip:' + tool) } : name.includes('/ecs') ? ecs : name.includes('gameState') ? { isResourceAvailable: () => true, getEnemies: () => enemies, attackEnemy: () => calls.push('attack'), gather: (...args) => calls.push(args.join(':')), showLocalMessage: () => {} } : { playGatherAnimation: () => calls.push('chop-air') } })
 exports.registerWoodNode('near', 11, 10)
 exports.registerWoodNode('far', 12, 10)
 exports.registerStoneNode('stone', 11, 10)
 exports.setupEquipmentControls()
 assert.equal(calls.pop(), 'equip:sword')
 pressed = true; systems[0]()
 assert.deepEqual(calls, ['attack'])
 systems[0](); assert.equal(calls.length, 1)
 now += 2000; exports.equipTool('axe'); systems[0]()
 assert.equal(calls.at(-1), 'wood:near')
 now += 2000; position.x = 30; systems[0]()
 assert.equal(calls.at(-1), 'chop-air')
 now += 2000; exports.equipTool('sword'); systems[0]()
 assert.equal(calls.at(-1), 'attack')
 pressed = false
 for (const [key, tool] of [['1', 'sword'], ['2', 'axe'], ['3', 'pickaxe']]) {
  selectedKey = key; systems[0](); assert.equal(exports.getEquippedTool(), tool)
 }
 selectedKey = null; pressed = true; now += 2000; position.x = 10; systems[0]()
 assert.equal(calls.at(-1), 'stone:stone')
 now += 2300; enemies.push({ id: 'enemy', health: 60, respawnAt: 0, position: { x: 11, z: 10 } }); systems[0](); assert.equal(calls.at(-1), 'attack')
})

test('clicking a resource automatically equips its tool and attacks send the selected tool', () => {
 const calls = [], exports = {}; let tool = 'sword'
 const source = ts.transpileModule(fs.readFileSync('src/gameState.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
 vm.runInNewContext(source, { exports, console, Date, require:name=>{
 if(name.includes('cinematicLock'))return {isCinematicLocked:()=>false}

 if(name.includes('cinematicLock'))return {isCinematicLocked:()=>false}
  if (name === './tutorial') return { isIntroActive: () => false, syncTutorial() {} }
  if (name.includes('equipment')) return { equipTool: value => { tool = value; calls.push(value) }, getEquippedTool: () => tool }
  if (name.includes('shared/tools')) return { TOOL_RULES: { pickaxe: { cooldown: 2200 } } }
  if (name.includes('pandoraMessages')) return { room: { send: async (type, data) => calls.push({ type, data }) } }
  if (name.includes('punchAnimation')) return { playGatherAnimation() {}, playToolAttack() {return 289} }
  if (name.includes('/ecs')) return { engine: {}, Transform: { getOrNull: () => null } }
  return { playActionSound() {}, playInteractionSound() {}, spawnImpact() {}, isPlayerDown: () => false }
 } })
 exports.gather('wood', 'wood-node'); assert.equal(tool, 'axe')
 exports.gather('stone', 'stone-node'); assert.equal(tool, 'pickaxe')
 exports.attackEnemy('enemy')
 assert.equal(calls.at(-1).data.tool, 'pickaxe')
})

test('resource request waits for the animation impact rather than the click',()=>{
 const calls=[], callbacks=[], exports={};let tool='sword'
 const source=ts.transpileModule(fs.readFileSync('src/gameState.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
 vm.runInNewContext(source,{exports,console,Date,require:name=>{
 if(name.includes('cinematicLock'))return {isCinematicLocked:()=>false}

 if(name.includes('cinematicLock'))return {isCinematicLocked:()=>false}
  if(name === './tutorial')return {isIntroActive:()=>false,syncTutorial(){}}
  if(name.includes('equipment'))return {equipTool:value=>{tool=value},getEquippedTool:()=>tool}
  if(name.includes('pandoraMessages'))return {room:{send:async(type,data)=>calls.push({type,data})}}
  if(name.includes('punchAnimation'))return {playGatherAnimation:(kind,callback)=>{callbacks.push(callback);return 900}}
  if(name.includes('/ecs'))return {engine:{},Transform:{getOrNull:()=>null}}
  return {playActionSound(){},playInteractionSound(){},spawnImpact(){},isPlayerDown:()=>false}
 }})
 exports.gather('wood','tree')
 assert.equal(calls.length,0)
 callbacks[0]()
 assert.equal(calls[0].type,'gatherRequest');assert.equal(calls[0].data.nodeId,'tree')
})

test('new players hold nothing and tool selection unlocks progressively',()=>{
 let stage=1,pressed=null;const systems=[],visible=[],exports={}
 const code=ts.transpileModule(fs.readFileSync('src/equipment.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
 vm.runInNewContext(code,{exports,Date,require:name=>{
 if(name.includes('cinematicLock'))return {isCinematicLocked:()=>false}

 if(name==='./tutorial')return {getTutorialStage:()=>stage,isIntroActive:()=>stage<1}
 if(name.includes('shared/tutorial'))return {toolUnlocked:(s,t)=>s>=({axe:2,pickaxe:3,sword:4}[t])}
 if(name.includes('avatarTools'))return {equipAvatarTool:t=>visible.push(t)}
 if(name.includes('/ecs'))return {engine:{addSystem:fn=>systems.push(fn)},InputAction:{IA_ACTION_3:'1',IA_ACTION_4:'2',IA_ACTION_5:'3',IA_PRIMARY:'E'},PointerEventType:{PET_DOWN:1},inputSystem:{isTriggered:key=>key===pressed}}
 if(name.includes('gameState'))return {showLocalMessage(){}}
 return {}
 }})
 exports.setupEquipmentControls();assert.equal(exports.getEquippedTool(),null)
 pressed='1';systems[0]();assert.equal(exports.getEquippedTool(),null)
 pressed=null;stage=2;systems[0]();assert.equal(exports.getEquippedTool(),'axe')
 pressed='3';systems[0]();assert.equal(exports.getEquippedTool(),'axe')
 pressed=null;stage=3;systems[0]();assert.equal(exports.getEquippedTool(),'pickaxe')
 stage=4;systems[0]();assert.equal(exports.getEquippedTool(),'sword')
})
