const { test } = require('node:test'), assert = require('node:assert/strict'), fs = require('fs'), vm = require('vm'), ts = require('typescript')
test('ranged stops to shoot at five metres; melee continues closing in', () => {
 const exports = {}
 const source = ts.transpileModule(fs.readFileSync('src/server/sentinelAI.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
 vm.runInNewContext(source,{exports,require:()=>({inVillageSafeZone:()=>false})})
 const make = attackRange => ({position:{x:60,y:2.9,z:62},route:[{x:60,y:2.9,z:62},{x:64,y:2.9,z:64}],waypoint:1,mode:'patrol',target:'',attackRange})
 const players=[{address:'p',position:{x:65,y:2,z:62}}]
 const ranged=make(6), melee=make(2.2)
 exports.updatePatrol(ranged,players,0.1); exports.updatePatrol(melee,players,0.1)
 assert.equal(ranged.mode,'attack'); assert.equal(ranged.position.x,60)
 assert.equal(melee.mode,'chase'); assert.ok(melee.position.x>60)
})

test('agents hold their ground when the player approaches and chase only after the player leaves attack range',()=>{
 const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/server/sentinelAI.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:()=>({inVillageSafeZone:()=>false})})
 for(const range of [2.2,6]){const state={position:{x:60,y:3,z:62},route:[{x:60,y:3,z:62},{x:64,y:3,z:64}],waypoint:1,mode:'attack',target:'p',attackRange:range},player={address:'p',position:{x:61,y:3,z:62}};for(let i=0;i<100;i++)exports.updatePatrol(state,[player],.1);assert.equal(state.position.x,60);assert.equal(state.position.z,62);assert.equal(state.mode,'attack');player.position.x=60+range+2;exports.updatePatrol(state,[player],.1);assert.equal(state.mode,'chase');assert.ok(state.position.x>60)}
})
test('patrol speed, rest duration and movement state belong to each agent independently',()=>{
 const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/server/sentinelAI.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:()=>({inVillageSafeZone:()=>false})})
 const make=(speed,pause,seed)=>({position:{x:60,y:3,z:62},route:[{x:60,y:3,z:62},{x:64,y:3,z:62}],waypoint:1,mode:'patrol',target:'',patrolSpeed:speed,pauseRemaining:pause,pauseSeed:seed}),a=make(.9,.1,51),b=make(1.5,1.3,713)
 for(let i=0;i<20;i++){exports.updatePatrol(a,[],.1);exports.updatePatrol(b,[],.1)}assert.notEqual(a.position.x,b.position.x);a.position={x:64,y:3,z:62};b.position={x:64,y:3,z:62};a.pauseRemaining=b.pauseRemaining=0;exports.updatePatrol(a,[],.1);exports.updatePatrol(b,[],.1);assert.notEqual(a.pauseRemaining,b.pauseRemaining)
})
