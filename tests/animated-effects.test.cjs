const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),ts=require('typescript'),path=require('path')
const math={exports:{}};vm.runInNewContext(require('esbuild').buildSync({entryPoints:['@dcl/sdk/math'],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text,{module:math,exports:math.exports,require})
function harness(){
 let now=10000,next=10,down=false,intro=false,locked=false,village={level:1},player={health:40,maxHealth:100,healingActive:false},seen=false,position={x:80,y:2,z:80}
 const systems=[],players=[],villages=[],removed=[],sounds=[],cache={},stores={}
 const component=name=>{const store=stores[name]=new Map();return {create:(id,value)=>store.set(id,value),createOrReplace:(id,value)=>store.set(id,value),getMutable:id=>store.get(id),getOrNull:id=>store.get(id),deleteFrom:id=>store.delete(id)}}
 const ecs={engine:{PlayerEntity:1,CameraEntity:2,addEntity:()=>next++,removeEntity:id=>{removed.push(id);for(const s of Object.values(stores))s.delete(id)},addSystem:fn=>systems.push(fn)},ColliderLayer:{CL_PHYSICS:1},LoadingState:{FINISHED:4,NOT_FOUND:2,FINISHED_WITH_ERROR:3},InputModifier:{Mode:{Standard:v=>v},createOrReplace:()=>{locked=true},deleteFrom:()=>{locked=false}}}
 for(const name of ['Transform','GltfContainer','Animator','VisibilityComponent','GltfContainerLoadingState','MainCamera','VirtualCamera','GltfNodeModifiers','LightSource'])ecs[name]=component(name)
 ecs.LightSource.Type={Point:v=>({$case:'point',point:v})}
 stores.Transform.set(1,{position});stores.Transform.set(2,{position:{x:80,y:4,z:90},rotation:{x:0,y:1,z:0,w:0}})
 ecs.MeshRenderer={setCylinder(){}};ecs.MaterialTransparencyMode={MTM_ALPHA_BLEND:2};ecs.Material={setPbrMaterial:(id,data)=>{if(!stores.Material)stores.Material=new Map();stores.Material.set(id,data)},Texture:{Common:v=>({tex:{$case:'texture',texture:v}})}}
 const game={showLocalMessage:value=>sounds.push(value),getVillage:()=>village,getPlayer:()=>player,hasVillageSnapshot:()=>seen,subscribePlayerSnapshots:fn=>players.push(fn),subscribeVillageSnapshots:fn=>villages.push(fn)}
 function load(file){file=path.resolve(file);if(cache[file])return cache[file];const exports={};cache[file]=exports;vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,Date:class extends Date{static now(){return now}},Math,console,require:id=>id.endsWith('/ecs')?ecs:id.endsWith('/math')?math.exports:id==='./gameState'?game:id==='./audio'?{playActionSound:kind=>sounds.push(kind),playSuccessSound:()=>sounds.push('success'),fadeTreeCelebration:()=>sounds.push('fade-celebration'),playTreeCelebration:()=>sounds.push('celebration')}:id==='./tutorial'?{isInTutorial:()=>false,isIntroActive:()=>intro}:id==='./playerDeath'?{isPlayerDown:()=>down}:load(path.resolve(path.dirname(file),id+'.ts'))});return exports}
 return {load,stores,removed,sounds,tick:dt=>{now+=dt*1000;systems.forEach(fn=>fn(dt))},locked:()=>locked,setDown:v=>{down=v},setIntro:v=>{intro=v},move:p=>{Object.assign(position,p)},player:(prev,level,data={})=>{Object.assign(player,data);players.forEach(fn=>fn({previousLevel:prev,level}))},village:(prev,level,start=0)=>{village.level=level;seen=true;villages.forEach(fn=>fn({previousLevel:prev,level,treeTransitionAt:start}))},loaded:()=>{for(const id of stores.GltfContainer.keys())stores.GltfContainerLoadingState.set(id,{currentState:4})}}
}
const assets=h=>[...h.stores.GltfContainer].map(([id,v])=>({id,...v}))
test('tree forms alternate every level through 100 without a village cycle and ignore initial state',()=>{
 const {villageLevelEffect,treeStageForLevel}=harness().load('src/shared/visualRules.ts')
 for(let level=1;level<=100;level++){assert.equal(villageLevelEffect(null,level),'none');assert.equal(villageLevelEffect(level,level),'none');assert.equal(treeStageForLevel(level),(level-1)%4);if(level>1)assert.equal(villageLevelEffect(level-1,level),'transform')}
 const h=harness(),tree=h.load('src/treeCinematic.ts').setupCentralTree();h.village(null,4);assert.match(h.stores.GltfContainer.get(tree).src,/Tree_04_anim/)
 h.village(4,5);h.loaded();h.tick(.1);assert.equal(h.locked(),true);h.tick(7);assert.match(h.stores.GltfContainer.get(tree).src,/Tree_01_anim/);h.tick(1);assert.equal(h.locked(),false)
})

test('tree transition loads lazily, preserves old collider, runs seven seconds and restores camera and input',()=>{
 const h=harness(),tree=h.load('src/treeCinematic.ts').setupCentralTree();assert.equal(assets(h).length,2)
 h.village(null,1);h.village(1,2);assert.equal(h.locked(),false);h.loaded();h.tick(.1)
 assert.equal(h.locked(),true);h.village(2,2);assert.equal(h.locked(),true);assert.equal(h.stores.VisibilityComponent.get(tree).visible,false)
 assert.equal(h.stores.GltfContainer.get(tree).invisibleMeshesCollisionMask,1)
 assert.equal(h.stores.GltfContainer.get(tree).visibleMeshesCollisionMask,0)
 // No decimation and no scaling: a copy of the old tree fades out in light while the new one fades in, both full size.
 const transition=assets(h).find(a=>a.id!==tree&&/Tree_01_anim/.test(a.src)).id,incoming=assets(h).find(a=>a.id!==tree&&/Tree_02_anim/.test(a.src)).id
 assert.equal(assets(h).some(a=>/Dissolve|Transition/.test(a.src)),false)
 const alpha=id=>{const m=h.stores.GltfNodeModifiers.get(id);return m?m.modifiers[0].material.material.pbr.albedoColor.a:undefined},light=()=>[...h.stores.LightSource.values()][0]
 const samples=[];for(let i=0;i<34;i++){h.tick(.2);samples.push({old:alpha(transition),next:alpha(incoming),glow:light()?.intensity??0,oldScale:h.stores.Transform.get(transition)?.scale.y,newScale:h.stores.Transform.get(incoming)?.scale.y})}
 const mid=samples[15];assert.ok(mid.old>0&&mid.old<1&&mid.next>0&&mid.next<1,'both trees half transparent at the crossover')
 assert.ok(samples[25].next>samples[12].next&&samples[25].old<samples[12].old,'old fades out, new fades in')
 assert.ok(samples.every(v=>v.newScale===0||Math.abs(v.newScale-h.load('src/shared/treeGrowth.ts').treePlacementForLevel(2).scale.y)<1e-9),'the new tree never scales')
 assert.ok(Math.max(...samples.map(v=>v.glow))>0&&samples[33].glow<samples[15].glow,'the light swells and dies away')
 assert.equal(h.stores.GltfNodeModifiers.get(incoming).modifiers[0].path,'Armature/Tree_02')
 assert.match(h.stores.GltfNodeModifiers.get(incoming).modifiers[0].material.material.pbr.texture.tex.texture.src,/fade\/Tree_02_base\.jpg/)
 h.tick(.3);assert.match(h.stores.GltfContainer.get(tree).src,/Tree_02_anim/);assert.ok(h.removed.includes(transition))
 assert.equal(h.stores.Animator.get(tree).states[0].clip,'Wind');h.tick(1.3);assert.equal(h.locked(),false);assert.equal([...h.stores.MainCamera.values()].some(v=>v.virtualCameraEntity!==undefined),false)
})
test('tree transition falls back on load errors and respects personal camera ownership',()=>{
 for(const cause of ['timeout','error','intro','death']){
  const h=harness(),tree=h.load('src/treeCinematic.ts').setupCentralTree();h.village(null,1)
  if(cause==='intro')h.setIntro(true);if(cause==='death')h.setDown(true)
  h.village(1,2)
  if(cause==='error'){const entity=assets(h).find(a=>a.id!==tree&&/Tree_01_anim/.test(a.src)).id;h.stores.GltfContainerLoadingState.set(entity,{currentState:3})}
  h.tick(cause==='timeout'?5.1:.1)
  if(cause==='intro'||cause==='death'){h.loaded();h.tick(.1);assert.equal(h.locked(),false);h.tick(7.1)}
  assert.match(h.stores.GltfContainer.get(tree).src,/Tree_02_anim/);assert.equal(h.locked(),false);assert.equal(assets(h).filter(a=>/arbol-central\/Tree_/.test(a.src)).length,1);assert.equal(h.stores.LightSource.size,0)
 }
 const h=harness();h.load('src/treeCinematic.ts').setupCentralTree();h.village(null,1);h.village(1,2);h.loaded();h.tick(.1);h.setDown(true);h.tick(.1)
 assert.equal([...h.stores.MainCamera.values()].some(v=>v.virtualCameraEntity!==undefined),false);assert.equal(h.locked(),true,'death keeps ownership of its input lock')
})
test('animation priorities prevent personality and hit reactions from interrupting attack or appearance',()=>{
 const {canInterruptAgentClip:allow}=harness().load('src/shared/visualRules.ts')
 const priority=['Idle','Look','Alert','Hit','Attack','Appear','Disappear']
 for(let i=0;i<priority.length;i++)for(let j=0;j<priority.length;j++)assert.equal(allow(priority[i],priority[j],1),j>i)
 assert.equal(allow('Attack','Doze',1),false);assert.equal(allow('Appear','Attack',1),false);assert.equal(allow('Disappear','Idle',0),true)
})
test('ambient effects are collision-free, culled at sixty metres, and healing and level-up use explicit snapshot rules',()=>{
 const h=harness();h.load('src/animatedEffects.ts').setupAnimatedEffects()
 for(const asset of assets(h)){assert.equal(asset.visibleMeshesCollisionMask,0);assert.equal(asset.invisibleMeshesCollisionMask,0)}
 assert.equal(assets(h).filter(a=>a.src.includes('Bird_Flock')).length,9);assert.equal(assets(h).filter(a=>a.src.includes('Ambient_Motes')).length,8)
 const heal=assets(h).find(a=>a.src.includes('Heal_Rings')).id,burst=assets(h).find(a=>a.src.includes('LevelUp')).id
 h.player(null,8,{health:40,maxHealth:100});h.tick(.1);assert.equal(h.stores.Transform.get(burst).scale.x,0);assert.equal(h.stores.Transform.get(heal).scale.x,0)
 h.player(8,8,{healingActive:true,health:45});h.tick(.1);assert.equal(h.stores.Transform.get(heal).scale.x,1)
 h.player(8,8,{health:100});h.tick(.1);assert.equal(h.stores.Transform.get(heal).scale.x,1.25);h.tick(1.3);assert.equal(h.stores.Transform.get(heal).scale.x,0)
 h.player(8,9);assert.equal(h.stores.Transform.get(burst).scale.x,1);assert.equal(h.stores.Animator.get(burst).states[0].shouldReset,true)
 h.tick(2.3);assert.equal(h.stores.Transform.get(burst).scale.x,0)
 h.move({x:500,z:500});h.tick(.1);const bird=assets(h).find(a=>a.src.includes('Bird_Flock')).id;assert.equal(h.stores.Transform.get(bird).scale.x,0);assert.equal(h.stores.Animator.get(bird).states[0].playing,false)
})
test('authored FX use no textures, animated trees retain their collider and expected clips',()=>{
 // The perched bird is the one textured FX (a supplied Meshy model), its texture reduced to one small JPEG.
 for(const f of fs.readdirSync('assets/scene/modelos/fx')){if(f==='Bird_Perch_Tweet.glb'){const b=fs.readFileSync('assets/scene/modelos/fx/'+f),j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));assert.equal(j.images.length,1);assert.equal(j.images[0].mimeType,'image/jpeg');const v=j.bufferViews[j.images[0].bufferView];assert.ok(v.byteLength<60000);continue}const b=fs.readFileSync('assets/scene/modelos/fx/'+f),j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));assert.equal(j.images?.length??0,0)}
 for(let i=1;i<=4;i++){const b=fs.readFileSync('assets/scene/modelos/arbol-central/Tree_0'+i+'_anim.glb'),j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));assert.ok(j.nodes.some(n=>n.name==='Tree_collider'));assert.ok(j.animations.some(a=>a.name==='Wind'));assert.equal(j.images.length,3)}
})

test('the healing column covers the whole tree platform, and transformation effects centre on each trunk root',()=>{
 const h=harness(),recovery=h.load('src/shared/recovery.ts');h.load('src/healingBeam.ts').setupHealingBeam()
 for(let level=1;level<=4;level++){
  h.village(null,level);h.tick(.1)
  const b=fs.readFileSync('assets/scene/modelos/arbol-central/Tree_0'+level+'_anim.glb'),j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12))),root=j.nodes.find(n=>n.name==='Root').translation
  const trunk=recovery.treeRootForLevel(level);assert.equal(trunk.x,81.55+root[0]*.94);assert.equal(trunk.z,79.94+root[2]*.94)
  const centre=recovery.healingTreeForLevel(level),bands=[...h.stores.Transform].filter(([id])=>id!==1&&id!==2)
  assert.equal(bands.length,12);assert.ok(Math.abs(centre.x-80.5)<.01&&Math.abs(centre.z-80)<.01)
  for(const [id,t]of bands){assert.equal(t.position.x,centre.x);assert.equal(t.position.z,centre.z);assert.ok(t.scale.x>=7.9);assert.ok(h.stores.Material.get(id).albedoColor.a<=.055)}
  // Every corner of the platform top heals; the lower ground beside it does not.
  for(const [x,z] of [[73.5,72.6],[87.7,72.6],[73.5,87.7],[87.7,87.7],[80.5,80]])assert.equal(recovery.nearHealingTree({x,y:4.2,z},level),true)
  for(const [x,z] of [[70.5,80],[90.5,80],[80,70.5],[80,90.5]])assert.equal(recovery.nearHealingTree({x,y:2.6,z},level),false)
 }
 const band=[...h.stores.Transform.keys()].find(id=>id!==1&&id!==2),y=h.stores.Transform.get(band).position.y;h.tick(.5);assert.ok(h.stores.Transform.get(band).position.y>y)
})
test('ground birds loop for ever: fly a lap, land, peck and take off again, never hidden',()=>{
 const h=harness();h.load('src/animatedEffects.ts').setupAnimatedEffects();h.move({x:10,y:1,z:10})
 const birds=assets(h).filter(a=>a.src.includes('Bird_Perch')).map(a=>a.id);assert.equal(birds.length,27)
 const clips=new Set(),spot=new Map(birds.map(id=>[id,{...h.stores.Transform.get(id).position}]));let highest=0
 for(let i=0;i<900;i++){h.tick(.1);for(const id of birds){const t=h.stores.Transform.get(id),a=h.stores.Animator.get(id);clips.add(a.states[0].clip);assert.ok(!t.scale||t.scale.x>0,'never shrunk away');highest=Math.max(highest,t.position.y-spot.get(id).y)}}
 assert.deepEqual([...clips].sort(),['Fly','Land','Perch','TakeOff']);assert.ok(highest>3,'laps rise into the air')
})
test('ring effects are light (under 900 triangles) and keep their clips, durations and translucent material',()=>{
 const read=f=>{const b=fs.readFileSync('assets/scene/modelos/fx/'+f+'.glb');return JSON.parse(b.subarray(20,20+b.readUInt32LE(12)))}
 const tris=j=>j.nodes.filter(n=>n.mesh!==undefined).reduce((t,n)=>t+j.meshes[n.mesh].primitives.reduce((s,p)=>s+(p.indices!==undefined?j.accessors[p.indices].count:j.accessors[p.attributes.POSITION].count)/3,0),0)
 for(const [f,clips] of [['Heal_Rings',['Heal','Burst','Pulse']],['Corrupt_Rings',['Heal','Burst','Pulse']],['LevelUp_Rings',['Heal','Burst','Pulse']],['Tree_Transform_Rays',['Heal','Burst','Pulse']],['Agent_Rings_Friendly',['Hover']],['Agent_Rings_Corrupt',['Hover']]]){
  const j=read(f);assert.ok(tris(j)<=900,f+' '+tris(j));assert.deepEqual(j.animations.map(a=>a.name),clips)
  assert.equal(j.materials[0].alphaMode,'BLEND');assert.equal(j.nodes.filter(n=>/^Energy_Ring_\d$/.test(n.name)).length,5)
  const ring=j.accessors[j.meshes.find(m=>m.name==='Open_Ring').primitives[0].attributes.POSITION];assert.ok(Math.abs(ring.max[0]-1.03)<.01,'same ring radius')
 }
 assert.equal(read('Tree_Transform_Rays').nodes.filter(n=>/^Transformation_Ray_/.test(n.name)).length,24)
})

test('every tree stage has its own fade texture and the node path the cross-fade overrides',()=>{
 for(let k=1;k<=4;k++){
  assert.ok(fs.statSync('assets/scene/modelos/arbol-central/fade/Tree_0'+k+'_base.jpg').size>1000)
  const b=fs.readFileSync('assets/scene/modelos/arbol-central/Tree_0'+k+'_anim.glb'),j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)))
  const armature=j.nodes.find(n=>n.name==='Armature');assert.ok(armature.children.some(i=>j.nodes[i].name==='Tree_0'+k))
 }
})


test('tree height grows strongly to 15, slowly to 50, stays fixed through 100, and every form remains rooted',()=>{
 const h=harness(),growth=h.load('src/shared/treeGrowth.ts'),recovery=h.load('src/shared/recovery.ts')
 let previous=0
 for(let level=1;level<=100;level++){
  const stage=h.load('src/shared/visualRules.ts').treeStageForLevel(level),file='assets/scene/modelos/arbol-central/Tree_0'+(stage+1)+'_anim.glb'
  const b=fs.readFileSync(file),j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12))),mesh=j.nodes.find(n=>n.name==='Tree_0'+(stage+1)),a=j.accessors[j.meshes[mesh.mesh].primitives[0].attributes.POSITION]
  const place=growth.treePlacementForLevel(level),height=(a.max[1]-a.min[1])*place.scale.y
  assert.ok(Math.abs(height-growth.treeHeightForLevel(level))<1e-8)
  if(level>1&&level<=50)assert.ok(height>previous,'no shrinking when changing forms')
  if(level>50)assert.ok(Math.abs(height-previous)<1e-8,'mature forms have the same height')
  assert.ok(Math.abs(place.position.y+a.min[1]*place.scale.y-recovery.treeRootForLevel(level).y)<1e-8,'root stays grounded')
  previous=height
 }
 assert.ok(growth.treeHeightForLevel(15)>growth.treeHeightForLevel(1)*2)
 assert.ok(growth.treeHeightForLevel(16)-growth.treeHeightForLevel(15)<(growth.treeHeightForLevel(2)-growth.treeHeightForLevel(1))/5)
})

test('perched birds use the Turquoise Tweet model, flap when airborne, peck at the ground and stand on it',()=>{
 const b=fs.readFileSync('assets/scene/modelos/fx/Bird_Perch_Tweet.glb'),j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)))
 assert.deepEqual(j.animations.map(a=>a.name).sort(),['Fly','Land','Perch','TakeOff'])
 const head=j.nodes.findIndex(n=>n.name==='Head'),body=j.nodes.findIndex(n=>n.name==='Body'),perch=j.animations.find(a=>a.name==='Perch')
 for(const node of [head,body])assert.ok(perch.channels.some(c=>c.target.node===node&&c.target.path==='rotation'))
 // While airborne (landing, taking off) it beats its wings: the wing rotation keeps changing direction.
 const wing=j.nodes.findIndex(n=>n.name==='WingL'),bin=b.subarray(28+b.readUInt32LE(12))
 for(const name of ['Fly','Land','TakeOff']){const anim=j.animations.find(a=>a.name===name),c=anim.channels.find(c=>c.target.node===wing&&c.target.path==='rotation'),acc=j.accessors[anim.samplers[c.sampler].output],v=j.bufferViews[acc.bufferView]
  const ys=Array.from({length:acc.count},(_,i)=>bin.readFloatLE((v.byteOffset||0)+(acc.byteOffset||0)+i*16+4));let turns=0;for(let i=2;i<ys.length;i++)if((ys[i]-ys[i-1])*(ys[i-1]-ys[i-2])<0)turns++
  assert.ok(turns>=8,name+' flaps ('+turns+' wing reversals)')}
 const src=fs.readFileSync('src/animatedEffects.ts','utf8');assert.ok(fs.readFileSync('src/birdLoop.ts','utf8').includes('Bird_Perch_Tweet.glb'))
 const {base}=require('../scripts/world-terrain.cjs'),table=eval(src.slice(src.indexOf('[[65,22,65'),src.indexOf(' as [number,number')))
 for(const row of table)[[0,0],[.8,.3],[-.6,.7]].forEach(([dx,dz],i)=>assert.ok(Math.abs(base.height(row[6]+dx,row[8]+dz).y-row[9][i])<.02,'bird '+i+' of flock at '+row[6]+','+row[8]))
})
test('an explorer in the tutorial keeps the tree they arrived with; the village growth plays once the tutorial ends',()=>{
 const src=fs.readFileSync('src/treeCinematic.ts','utf8')
 assert.match(src,/if\(previousLevel!==null&&isInTutorial\(\)\)/)
 assert.match(src,/if\(heldLevel!==undefined&&!isInTutorial\(\)&&!isIntroActive\(\)&&!isCinematicLocked\(\)\)/)
 const ui=fs.readFileSync('src/ui.tsx','utf8');assert.match(ui,/TUTORIAL · STEP/);assert.match(ui,/inTutorial \? tutorialPercent : percent/)
})
test('the tool reception emotes swing the right arm out to the side for the catch, then back',()=>{
 for(const tool of ['Axe','Pickaxe','Sword']){
  const b=fs.readFileSync('assets/scene/modelos/animaciones/Receive_'+tool+'_emote.glb'),j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12))),bin=b.subarray(28+b.readUInt32LE(12))
  const arm=j.nodes.findIndex(n=>n.name==='Avatar_RightArm'),a=j.animations[0],c=a.channels.find(c=>c.target.node===arm&&c.target.path==='rotation'),acc=j.accessors[a.samplers[c.sampler].output],v=j.bufferViews[acc.bufferView]
  const q=k=>[0,1,2,3].map(i=>bin.readFloatLE((v.byteOffset||0)+(acc.byteOffset||0)+k*16+i*4))
  assert.ok(acc.count>40&&Number.isFinite(q(0)[3]),tool+' arm track readable')
  for(let k=0;k<acc.count;k++)assert.ok(Math.abs(Math.hypot(...q(k))-1)<1e-3,tool+' arm rotation stays a unit quaternion')
 }
})
