const path=require('node:path')
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),ts=require('typescript')
const manifest=JSON.parse(fs.readFileSync('assets/scene/modelos/pandora-v1-20261103/manifest.json','utf8'))
function glb(file){const b=fs.readFileSync(file);assert.equal(b.toString('ascii',0,4),'glTF');return JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString())}
function tutorialRules(){const visual={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/shared/visualRules.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:visual});const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/shared/tutorial.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:()=>visual});return exports}
test('four delivery altars stay fixed on the lower ground beside the platform corners for every tree phase',()=>{
 const {deliveryPointFor,DELIVERY_POINT,DELIVERY_POINTS}=tutorialRules();assert.equal(DELIVERY_POINTS.length,4)
 for(let level=1;level<=13;level++){assert.equal(deliveryPointFor(level),DELIVERY_POINT);for(const point of DELIVERY_POINTS)assert.equal(deliveryPointFor(level,point),point)}
 const {base,glb,data}=require('../scripts/world-terrain.cjs')
 for(const point of DELIVERY_POINTS){assert.doesNotMatch(base.height(point.x,point.z).name,/Plateau/);assert.ok(Math.abs(base.height(point.x,point.z).y-point.y)<.06);for(let k=0;k<16;k++){const g=base.height(point.x+1.2*Math.cos(k*Math.PI/8),point.z+1.2*Math.sin(k*Math.PI/8));assert.ok(g&&Math.abs(g.y-point.y)<.45,'altar base must sit on the lower ground '+JSON.stringify(point))}}
 for(let k=1;k<=4;k++){const g=glb('assets/scene/modelos/arbol-central/Tree_0'+k+'_anim.glb'),vertices=g.j.meshes.filter(m=>!m.name.includes('collider')).flatMap(m=>m.primitives.flatMap(p=>data(g,p.attributes.POSITION))).map(v=>[81.55+v[0]*.94,1.3+v[1]*.94,79.94+v[2]*.94]);for(const p of DELIVERY_POINTS){const distance=vertices.filter(v=>v[1]>=p.y-.1&&v[1]<p.y+2).reduce((m,v)=>Math.min(m,Math.hypot(v[0]-p.x,v[2]-p.z)),99);assert.ok(distance>1.6,'tree '+k+' blocks altar '+JSON.stringify(p))}}
})

test('export separates water from solid base and supplies an ON/OFF asset for every node',()=>{
 assert.equal(manifest.resources.length,320)
 assert.equal(new Set(manifest.resources.map(n=>n.id)).size,320)
 assert.equal(glb(manifest.base).nodes.some(n=>/water/i.test(n.name)),false)
 assert.ok(glb(manifest.water).meshes.length>0)
 for(const n of manifest.resources){glb(n.on);glb(n.off);assert.ok(n.position.x>=0&&n.position.x<=160);assert.ok(n.position.z>=0&&n.position.z<=160)}
 for(const stage of manifest.treeStages)glb(stage.src)
})
test('runtime keeps water collision-free, swaps ON/OFF and shows only the current tree stage',()=>{
 const models=new Map(),transforms=new Map(),systems=[],subscribers=[];let next=1,level=1,available=true,hits=0,ready=true
 const worldExports={},clickable=new Set(),highlights=[]
 const code=ts.transpileModule(fs.readFileSync('src/world.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
 const animators=new Map(),ecs={Animator:{create:(id,v)=>animators.set(id,v)},Billboard:{create(){}},BillboardMode:{BM_ALL:1},MeshRenderer:{setBox(){}},Material:{setPbrMaterial(){}},engine:{addEntity:()=>next++,removeEntity:id=>{models.delete(id);transforms.delete(id)},addSystem:fn=>systems.push(fn)},ColliderLayer:{CL_PHYSICS:1,CL_POINTER:2},InputAction:{IA_POINTER:0},Transform:{create:(id,data)=>transforms.set(id,data),getMutable:id=>transforms.get(id),getOrNull:()=>({position:{x:90,y:4,z:90}})},GltfContainerLoadingState:{getOrNull:()=>({currentState:ready?4:1})},LoadingState:{FINISHED:4},GltfContainer:{create:(id,data)=>models.set(id,data),createOrReplace:(id,data)=>models.set(id,data)},MeshCollider:{setBox(){}},pointerEventsSystem:{onPointerDown(opts){clickable.add(opts.entity)}}}
 vm.runInNewContext(code,{exports:worldExports,require:id=>{
 if(id === './treeCinematic')return {setupCentralTree(){const entity=ecs.engine.addEntity();ecs.Transform.create(entity,{position:{x:81.55,y:.5,z:79.94},scale:{x:.94,y:.94,z:.94}});const update=()=>{const stage=[...manifest.treeStages].reverse().find(s=>level>=s.level);ecs.GltfContainer.createOrReplace(entity,{src:stage.src,visibleMeshesCollisionMask:0,invisibleMeshesCollisionMask:1})};update();subscribers.push(update);return entity}}
 if(id === './tutorial')return {registerIntroAsset(){},getTutorialStage:()=>5,isGoingToGuide:()=>false,isIntroActive:()=>false}
 if(id === './tutorialHighlight')return {setupTutorialHighlight(){},setTutorialHighlight:entity=>highlights.push(entity)}
 if(id === './agents')return {setupPandoraAgents(){},getGuideEntity:()=>undefined}
 if(id === './testEnemy')return {setupTestEnemy(){},getAgentModel:()=>undefined}
 if(id === './shared/resourceLift'){const value={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/shared/resourceLift.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:value});return value}
 if(id === './shared/tutorial')return tutorialRules()
 if(id.endsWith('/ecs'))return ecs
 if(id.endsWith('/math'))return {Color4:{create:(...args)=>args},Vector3:{create:(x,y,z)=>({x,y,z}),Zero:()=>({x:0,y:0,z:0})}}
 if(id.includes('worldLayout'))return {WORLD_BASE:manifest.base,WORLD_WATER:manifest.water,WORLD_GRASS:manifest.grass,WORLD_RESOURCES:manifest.resources,TREE_STAGES:manifest.treeStages}
 if(id.includes('gameState'))return {getVillage:()=>({level}),subscribe:fn=>subscribers.push(fn),getResourceHits:id=>id===manifest.resources[0].id?hits:0,isResourceAvailable:()=>available,gather(){},deliverAll(){}}
 return {setupPandoraAgents(){},setupTestEnemy(){},registerWoodNode(){},registerStoneNode(){},setupAmbientLife(){}}
 }})
 worldExports.setupPandoraWorld();systems[0]()
 assert.equal([...models.values()].find(m=>m.src===manifest.water).visibleMeshesCollisionMask,0)
 const resource=[...models.keys()].find(id=>models.get(id).src===manifest.resources[0].on)
 // Standing resources are clicked on their own model (so the Explorer outlines them on hover); there are no world bars.
 assert.ok(clickable.has(resource));assert.equal(models.get(resource).visibleMeshesCollisionMask,3)
 assert.equal([...transforms.values()].some(t=>t.scale?.y===0.1&&t.scale?.z===0.04),false)
 available=false;ready=false;systems[0]();assert.equal(models.get(resource).src,manifest.resources[0].on);ready=true;systems[0]();assert.equal(models.has(resource),false);const off=[...models.keys()].find(id=>models.get(id).src===manifest.resources[0].off);assert.ok(off);assert.equal(models.get(off).visibleMeshesCollisionMask,1);assert.equal(clickable.has(off),false)
 available=true;systems[0]();assert.ok([...models.values()].some(m=>m.src===manifest.resources[0].on))
 for(const value of [1,5,9,13]){level=value;subscribers.forEach(fn=>fn());const trees=[...models.values()].filter(m=>m.src.includes('/arbol-central/Tree_'));assert.equal(trees.length,1);assert.equal(trees[0].src,manifest.treeStages.find(s=>s.level===value).src)}
})

test('water and forest GLBs carry their textures, embedded or from the shared folder, and none remains missing',()=>{
 const root='assets/scene/modelos/pandora-v1-20261103/'
 assert.deepEqual(JSON.parse(fs.readFileSync(root+'missing-textures.json','utf8')),[])
 for(const file of [manifest.water,manifest.resources.find(n=>n.kind==='fruit').on,manifest.resources.find(n=>n.kind==='fruit').off]){
  const model=glb(file)
  assert.ok(model.images.length>0)
  assert.ok(model.images.every(image=>image.bufferView!==undefined||fs.existsSync(path.dirname(file)+'/'+image.uri)))
  assert.ok(model.materials.some(material=>material.pbrMetallicRoughness?.baseColorTexture))
 }
})

test('environment emission is capped to avoid washed-out terrain and foliage',()=>{
 const dir='assets/scene/modelos/pandora-v1-20261103/'
 for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.glb'))){
  const model=glb(dir+file)
  for(const material of model.materials??[])assert.ok((material.emissiveFactor??[]).every(value=>value<=0.300001),file+' '+material.name)
 }
})

test('textured vegetation emits its texture colour rather than flat white',()=>{
 const dir='assets/scene/modelos/pandora-v1-20261103/'
 for(const node of manifest.resources.filter(n=>n.kind==='fruit'))for(const file of [node.on,node.off]){
  for(const material of glb(file).materials){
   assert.ok(material.emissiveTexture,file)
   assert.equal(material.emissiveTexture.index,material.pbrMetallicRoughness.baseColorTexture.index)
  }
 }
})

test('resource sizes require one, two or three hits and named variants keep their category',()=>{
 for(const node of manifest.resources){
  assert.equal(node.hitsRequired,{small:1,medium:2,large:3}[node.size])
  if(/small|log|branch/i.test(node.sourceName))assert.equal(node.hitsRequired,1)
  if(/big|large/i.test(node.sourceName))assert.equal(node.hitsRequired,3)
  if(/average|avarage/i.test(node.sourceName))assert.equal(node.hitsRequired,2)
 }
 for(const kind of ['wood','stone','fruit'])for(const count of [1,2,3])assert.ok(manifest.resources.some(n=>n.kind===kind&&n.hitsRequired===count))
})

test('arrival uses the cleared path position and the blueberry bush stays off the path',()=>{
 const scene=JSON.parse(fs.readFileSync('scene.json','utf8')),spawn=scene.spawnPoints.find(p=>p.default).position,bush=manifest.resources.find(n=>n.sourceName==='PP_Bush_big_blueberry_on.006')
 // scene.json may store the spawn as single-precision floats (85.93000030517578).
 assert.ok(Math.abs(spawn.x-85.93)<1e-4&&Math.abs(spawn.z-129.05)<1e-4)
 assert.ok(Math.hypot(bush.position.x-spawn.x,bush.position.z-spawn.z)>8)
 const layout=fs.readFileSync('src/shared/worldLayout.ts','utf8');assert.ok(layout.includes(JSON.stringify(bush.position)))
})

test('stone resources are visible around Novaterra and their reviewed placements survive export',()=>{
 const placements=JSON.parse(fs.readFileSync('design/world-placement-overrides.json','utf8')),layout=fs.readFileSync('src/shared/worldLayout.ts','utf8')
 const central=manifest.resources.filter(n=>n.kind==='stone'&&Math.hypot(n.position.x-80,n.position.z-79.8)<25)
 assert.ok(central.length>=6);assert.ok([1,2,3].every(hits=>central.some(n=>n.hitsRequired===hits)))
 assert.equal(manifest.resources.filter(n=>n.kind==='stone').length,155)
 // Placements are keyed by the object name in the .blend, which survives renumbering when objects are added.
 for(const [name,position]of Object.entries(placements)){
  const node=manifest.resources.find(n=>n.sourceName===name);assert.deepEqual(node.position,position)
  assert.ok(layout.includes(JSON.stringify(position)))
 }
 assert.ok(fs.readFileSync('scripts/export_scene.py','utf8').includes('world-placement-overrides.json'))
})

test('every lake bed stays above the y=0 floor so avatars can sink below the water surface',()=>{
 const y=+fs.readFileSync('src/world.ts','utf8').match(/scenePosition = Vector3\.create\(81\.55, ([\d.]+),/)[1]
 const ground=glb(manifest.base).nodes.find(n=>n.name.startsWith('PP_PLANE')),model=glb(manifest.base),low=model.accessors[model.meshes[ground.mesh].primitives[0].attributes.POSITION].min[1]
 assert.ok(y+.94*low>=0)
 assert.equal(+fs.readFileSync('src/shared/treeGrowth.ts','utf8').match(/ORIGIN = \{x:81\.55,y:([\d.]+),/)[1],y)
})

test('all resource meshes and OFF states fit inside the playable terrain with an edge margin',()=>{
 const {bounds,base}=require('../scripts/world-terrain.cjs');for(const r of manifest.resources){for(const file of [r.on,r.off]){const b=bounds(file),p=r.position;assert.ok(p.x+b.min[0]>=9.999&&p.x+b.max[0]<=150.001&&p.z+b.min[2]>=9.999&&p.z+b.max[2]<=150.001,r.id+' is outside inset bounds');for(const x of [b.min[0]-.35,0,b.max[0]+.35])for(const z of [b.min[2]-.35,0,b.max[2]+.35])assert.ok(base.height(p.x+x,p.z+z),r.id+' footprint leaves the terrain')}}
})


test('fallen logs left by the big pines rest on the slope instead of sinking into it',()=>{
 const lift={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/shared/resourceLift.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:lift})
 const {base,glb,data}=require('../scripts/world-terrain.cjs')
 const rot=(q,v)=>{const uv=[q[1]*v[2]-q[2]*v[1],q[2]*v[0]-q[0]*v[2],q[0]*v[1]-q[1]*v[0]],uuv=[q[1]*uv[2]-q[2]*uv[1],q[2]*uv[0]-q[0]*uv[2],q[0]*uv[1]-q[1]*uv[0]];return v.map((a,i)=>a+2*(q[3]*uv[i]+uuv[i]))}
 for(const r of manifest.resources.filter(r=>/Pine_(avarage|big)|Pine_small/.test(r.sourceName))){
  const g=glb(r.off),up=lift.OFF_MODEL_LIFT[r.id]??0;let below=0,total=0
  for(const n of g.j.nodes.filter(n=>n.mesh!==undefined)){const t=n.translation||[0,0,0],sc=n.scale||[1,1,1],q=n.rotation||[0,0,0,1];for(const p of g.j.meshes[n.mesh].primitives)for(const v of data(g,p.attributes.POSITION)){const w=rot(q,[v[0]*sc[0],v[1]*sc[1],v[2]*sc[2]]).map((a,i)=>(a+t[i])*.94),h=base.height(r.position.x+w[0],r.position.z+w[2]);total++;if(h&&r.position.y+up+w[1]<h.y-.02)below++}}
  assert.ok(below/total<=.11,r.id+' log stays mostly above ground')
 }
})

test('grass is one collision-free model on the shared texture, kept out of the terrain, swaying in the wind',()=>{
 const model=glb(manifest.grass)
 assert.equal(model.nodes.filter(n=>n.mesh!==undefined).length,1)
 assert.ok(model.images.length>0&&model.images.every(image=>image.uri==='textures/texture_gradient.png'))
 assert.equal(glb(manifest.base).nodes.some(n=>/Grass/i.test(n.name)),false)
 const world=fs.readFileSync('src/world.ts','utf8');assert.ok(world.includes('[WORLD_GRASS, 0]'))
 // It sways: two shape keys driven by a looping 'Wind' clip, with weights kept between 0 and 1.
 const mesh=model.meshes.find(m=>m.primitives[0].targets);assert.equal(mesh.primitives[0].targets.length,2)
 const wind=model.animations.find(a=>a.name==='Wind');assert.ok(wind.channels.every(c=>c.target.path==='weights'))
 assert.match(world,/clip: 'Wind', playing: true, loop: true/)
 // The bend is a gentle sway: no vertex moves more than half a metre (a repack that loses the sparse views of the
 // targets stretches blades across the sky).
 const b=fs.readFileSync(manifest.grass),len=b.readUInt32LE(12),bin=b.subarray(28+len)
 const floats=(view,offset,count)=>{const v=model.bufferViews[view],start=(v.byteOffset||0)+(offset||0);return Array.from({length:count},(_,i)=>bin.readFloatLE(start+i*4))}
 for(const primitive of mesh.primitives)for(const target of primitive.targets){const sparse=model.accessors[target.POSITION].sparse
  const values=floats(sparse.values.bufferView,sparse.values.byteOffset,sparse.count*3)
  for(let i=0;i<values.length;i+=3)assert.ok(Math.hypot(values[i],values[i+1],values[i+2])<=.5,'wind offset within half a metre')}
 assert.ok(fs.readFileSync('src/shared/worldLayout.ts','utf8').includes('WORLD_GRASS: string | undefined = "assets/scene/modelos/pandora-v1-20261103/grass.glb"'))
})
test('the world models reference the shared textures instead of embedding copies',()=>{
 const dir='assets/scene/modelos/pandora-v1-20261103/'
 for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.glb')&&f!=='water.glb'))for(const image of glb(dir+file).images??[]){assert.equal(image.bufferView,undefined,file);assert.ok(fs.existsSync(dir+image.uri))}
 for(const name of ['PP_Color_Palette.png','texture_gradient.png'])assert.ok(fs.readFileSync(dir+'textures/'+name).equals(fs.readFileSync('assets/scene/modelos/pandora-v0-20261031/textures/'+name)))
})

test('no resource stands on the south-west delivery altar',()=>{
 const {DELIVERY_POINTS}=tutorialRules(),altar=DELIVERY_POINTS[2]
 for(const r of manifest.resources)assert.ok(Math.hypot(r.position.x-altar.x,r.position.z-altar.z)>3+Math.max(r.collider.x,r.collider.z)/2,r.id+' on the altar')
})

test('trees, bushes and rocks stand clear of the dirt paths',()=>{
 const {clearOfPath,onPath}=require('../scripts/path-mask.cjs')
 // The mask itself: the central north-south path and the cross path are dirt, open meadow is not.
 assert.ok(onPath(81,100)&&onPath(81,120));assert.equal(onPath(60,60),false)
 for(const r of manifest.resources)assert.ok(clearOfPath(r),r.id+' '+r.sourceName+' is on or too close to a path')
})
test('no resource is sunk into the open ground (its origin at most half a metre under the meadow)',()=>{
 const {base}=require('../scripts/world-terrain.cjs')
 // The rocks by the stream at about (98, 106) floated in game and were lowered onto the ground seen there.
 const STREAM_ROCKS=['world-stone-108','world-stone-140','world-stone-149','world-stone-180','world-stone-193','world-stone-202','world-stone-226']
 for(const r of manifest.resources){const h=base.height(r.position.x,r.position.z);if(h&&/PLANE/.test(h.name)&&!STREAM_ROCKS.includes(r.id))assert.ok(r.position.y-h.y>=-.5,r.id+' '+r.sourceName+' is sunk '+(h.y-r.position.y).toFixed(2)+' m')}
})
test('trees keep their crowns off the path both as exported and as the path shows in game',()=>{
 const {pathDistance,shownOnPath,shape,clearance}=require('../scripts/path-mask.cjs')
 // The trees moved off the path also clear it as exported, so they stand right whichever way the terrain shows.
 const MOVED=['world-wood-237','world-wood-239','world-wood-248','world-wood-253','world-wood-261','world-wood-270','world-wood-271','world-wood-288','world-wood-307','world-wood-308','world-wood-312','world-wood-320']
 for(const r of manifest.resources.filter(r=>r.kind==='wood')){const s=shape(r.on),need=clearance(r)
  if(MOVED.includes(r.id))assert.ok(pathDistance(r.position.x+s.trunk[0],r.position.z+s.trunk[1],need)>=need,r.sourceName+' crown over the exported path')
  assert.ok(pathDistance(r.position.x-s.trunk[0],r.position.z+s.trunk[1],need,shownOnPath)>=need,r.sourceName+' crown over the path in game')}
})
test('.dclignore leaves out only files the scene never loads: every model, its textures and the tool palette stay',()=>{
 const ignore=require('ignore'),ig=(ignore.default||ignore)().add(fs.readFileSync('.dclignore','utf8').split('\n').filter(Boolean))
 const kept=f=>!ig.ignores(f)
 for(const r of manifest.resources)assert.ok(kept(r.on)&&kept(r.off),r.id)
 for(const f of [manifest.base,manifest.water,manifest.grass,'assets/scene/modelos/pandora-v1-20261103/textures/PP_Color_Palette.png','assets/scene/modelos/Axe.glb','assets/scene/modelos/fx/Bird_Perch_Tweet.glb','assets/images/story/lore-dcl-v3/memory-01.png','assets/images/agents/Aegis_Core.png','assets/scene/modelos/Agentes/Void_Sentinel_anim.glb','assets/scene/main.composite'])assert.ok(kept(f),f)
 assert.equal(kept('assets/scene/modelos/pandora-v0-20261031/base.glb'),false)
 // Deploy lists files with glob, which skips ! negations: a re-included file would silently be left out of the upload.
 assert.equal(fs.readFileSync('.dclignore','utf8').split('\n').some(l=>l.startsWith('!')),false)
 for(const tool of ['Axe','Pickaxe','Sword']){const j=glb('assets/scene/modelos/'+tool+'.glb');assert.ok(j.images.every(i=>!i.uri||(i.uri.startsWith('pandora-v1-20261103/')&&kept('assets/scene/modelos/'+i.uri))),tool+' texture is uploaded')}
})
