const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),ts=require('typescript')
function clips(file){const b=fs.readFileSync(file);return JSON.parse(b.subarray(20,20+b.readUInt32LE(12))).animations.map(a=>a.name)}
function harness(){
 let next=100
 const transforms=new Map(),animators=new Map(),models=new Map(),systems=[],listeners=[]
 const village={level:1,stock:{wood:0,stone:0,fruit:0,coins:0},targets:{wood:10,stone:10,fruit:10,coins:10}}
 const player={x:0,y:0,z:0};transforms.set('player',{position:player})
 const ecs={engine:{PlayerEntity:'player',addEntity:()=>next++,addSystem:fn=>systems.push(fn)},
  Transform:{create:(e,d)=>transforms.set(e,d),get:e=>transforms.get(e),getOrNull:e=>transforms.get(e)??null,getMutable:e=>transforms.get(e)},
  GltfContainer:{create:(e,d)=>models.set(e,d.src)},Animator:{createOrReplace:(e,d)=>animators.set(e,d),getMutable:e=>animators.get(e)}}
 const math={Quaternion:{fromEulerDegrees:()=>({})},Vector3:{create:(x,y,z)=>({x,y,z}),Zero:()=>({x:0,y:0,z:0}),One:()=>({x:1,y:1,z:1}),distance:(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)}}
 const exports={},run=(file,exports,require)=>vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,Math,Array,require})
 const birdLoop={};run('src/birdLoop.ts',birdLoop,id=>id.endsWith('/ecs')?ecs:math)
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/ambientLife.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,Math,Array,require:id=>id==='./birdLoop'?birdLoop:id==='./healingBeam'?{setupHealingBeam(){}}:id.endsWith('/ecs')?ecs:id.endsWith('/math')?math:id.includes('gameState')?{getVillage:()=>village,subscribeVillageSnapshots:fn=>listeners.push(fn)}:{HEALING_TREE:{x:80,y:2,z:77}}})
 exports.setupAmbientLife('altar')
 const tick=dt=>systems.forEach(fn=>fn(dt))
 const byAsset=name=>[...models].filter(([,src])=>src.includes(name)).map(([e])=>e)
 return {village,player,animators,transforms,tick,byAsset,clip:e=>animators.get(e).states[0].clip,snapshot:()=>listeners.forEach(fn=>fn({}))}
}
test('every ambient clip exists in its model',()=>{
 for(const [asset,names] of Object.entries({Butterfly_Swarm:['Flutter'],Fireflies:['Glow'],Tree_Beam:['Pulse'],Crystal_Flowers:['Bud','Bloom','Open','Close'],Bird_Perch_Tweet:['Fly','Perch','TakeOff','Land'],Altar_Crystal:['Orbit']}))for(const n of names)assert.ok(clips('assets/scene/modelos/fx/'+asset+'.glb').includes(n),asset+' '+n)
 assert.deepEqual(clips('assets/scene/modelos/entrega/Delivery_Altar.glb').sort(),['Deliver','Idle'])
})
test('a delivery bursts the altar for everyone, lights progress crystals and returns to idle',()=>{
 const h=harness();assert.equal(h.clip('altar'),'Idle')
 h.village.stock={wood:10,stone:10,fruit:0,coins:0};h.snapshot()
 assert.equal(h.clip('altar'),'Deliver')
 assert.equal(h.byAsset('Altar_Crystal').filter(e=>h.transforms.get(e).scale.x===1).length,4)
 h.tick(2.6);assert.equal(h.clip('altar'),'Deliver');h.tick(1.8);assert.equal(h.clip('altar'),'Idle')
 h.snapshot();assert.equal(h.clip('altar'),'Idle')
})
test('flowers open near a player and close once the player leaves',()=>{
 const h=harness(),flower=h.byAsset('Crystal_Flowers')[0]
 h.player.x=76;h.player.z=90;h.tick(.3);assert.equal(h.clip(flower),'Open')
 h.tick(1.1);assert.equal(h.clip(flower),'Bloom')
 h.player.x=0;h.tick(.3);assert.equal(h.clip(flower),'Close')
 h.tick(1.1);assert.equal(h.clip(flower),'Bud')
})
test('a perched bird flees, circles while someone is near its rock, then comes back down and perches',()=>{
 const h=harness(),bird=h.byAsset('Bird_Perch')[0],step=n=>{for(let i=0;i<n;i++)h.tick(.1)}
 h.player.x=86.21;h.player.z=27.75;step(1);assert.equal(h.clip(bird),'TakeOff')
 step(300);assert.equal(h.clip(bird),'Fly','still circling while the rock is taken');assert.ok(h.transforms.get(bird).position.y>2.53,'up in the air')
 h.player.x=0;const seen=new Set();for(let i=0;i<200;i++){step(1);seen.add(h.clip(bird))}
 assert.ok(seen.has('Land')&&seen.has('Perch'),'lands and perches again: '+[...seen])
 for(let i=0;i<400&&h.clip(bird)!=='Perch';i++)step(1);assert.deepEqual({...h.transforms.get(bird).position},{x:86.21,y:2.53,z:27.75},'perches back on its own rock')
})
