const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),ts=require('typescript')
const math={exports:{}};vm.runInNewContext(require('esbuild').buildSync({entryPoints:['@dcl/sdk/math'],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text,{module:math,exports:math.exports,require})
function harness(){
 let next=10,stage=1,down=false,intro=false,locked=false,frozen=false,main=null,pressed=false,explain
 let clock=0,toolHidden=false;const hiddenLog=[]
 const moves=[],playerPose={position:{x:84,y:2,z:90}}
 const models=new Map(),transforms=new Map(),systems=[],messages=[],receives=[],greetings=[],guide=[],removed=[]
 const resources=[{id:'fruit',kind:'fruit',position:{x:90,y:1,z:96},collider:{y:2},hitsRequired:1},{id:'wood',kind:'wood',position:{x:101,y:1,z:95},collider:{y:3},hitsRequired:2},{id:'stone',kind:'stone',position:{x:65,y:1,z:95},collider:{y:2},hitsRequired:1}]
 const enemies=[{id:'Aegis_Core',position:{x:110,y:2.9,z:100},health:60,respawnAt:0}]
 const exports={},animators=new Map(),ecs={Animator:{create:(id,v)=>animators.set(id,v)},engine:{CameraEntity:2,PlayerEntity:1,addEntity:()=>next++,removeEntity:id=>{removed.push(id);transforms.delete(id)},addSystem:fn=>systems.push(fn)},Transform:{create:(id,v)=>transforms.set(id,v),getMutable:id=>transforms.get(id),getOrNull:id=>id===1?playerPose:id===2?{position:{x:84,y:5,z:94},rotation:{x:0,y:1,z:0,w:0}}:transforms.get(id)},GltfContainer:{create:(id,data)=>models.set(id,data)},VirtualCamera:{create(){}},MainCamera:{createOrReplace:(id,v)=>{main=v.virtualCameraEntity??null}},InputModifier:{Mode:{Standard:v=>v},createOrReplace:()=>{frozen=true},deleteFrom:()=>{frozen=false}},InputAction:{IA_PRIMARY:'E'},PointerEventType:{PET_DOWN:1},inputSystem:{isTriggered:()=>{const v=pressed;pressed=false;return v}}}
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/tutorialCinematics.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,console,require:id=>{
 if(id==='~system/RestrictedActions')return {movePlayerTo:data=>{moves.push({camera:main,data});playerPose.position={...data.newRelativePosition};return {then:fn=>{fn();return {catch(){}}}}}}
 if(id.endsWith('/ecs'))return ecs;if(id.endsWith('/math'))return math.exports
 if(id==='./tutorial')return {getTutorialStage:()=>stage,isIntroActive:()=>intro,subscribeTutorialExplanations:fn=>{explain=fn}}
 if(id==='./playerDeath')return {isPlayerDown:()=>down}
 if(id==='./cinematicLock')return {isCinematicLocked:()=>locked,setCinematicLocked:v=>{locked=v}}
 if(id==='./gameState')return {getEnemies:()=>enemies,getVillage:()=>({level:1}),isResourceAvailable:()=>true}
 if(id.includes('worldLayout'))return {WORLD_RESOURCES:resources}
 if(id==='./tutorialObjective'){const objective={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/tutorialObjective.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:objective.exports,require:()=>({WORLD_RESOURCES:resources})});return objective.exports}
 if(id.includes('terrainGrid'))return {groundHeight:()=>1,groundKind:()=>0}
 if(id==='./villageGuide')return {setVillageGuideOpen:v=>guide.push(v)}
 if(id==='./agents')return {greetVillageGuide:p=>greetings.push(p)}
 if(id==='./punchAnimation')return {playToolReceive:tool=>receives.push({tool,at:clock,hidden:toolHidden}),toolReceiveSeconds:()=>2.6,toolReceiveContactSeconds:tool=>tool==='sword'?.7:22/30}
 if(id==='./avatarTools')return {setAvatarToolPresentationHidden:v=>{toolHidden=v;hiddenLog.push(v)}}
 if(id==='./audio')return {playInteractionSound(){}}
 if(id.includes('pandoraMessages'))return {room:{send:async(type,data)=>messages.push({type,...data})}}
 return {TOOL_RECEIVE_POINT:{x:84.5,y:2,z:98},GUIDE_POINT:{x:84.8,y:3.9,z:85.5},deliveryPointFor:()=>({x:81.5,y:2.4,z:85.5}),tutorialInstruction:s=>({title:'stage'+s,body:'Explain why we rebuild Novaterra.'})}
 }})
 exports.setupTutorialCinematics()
 const tick=(n=1)=>{for(let i=0;i<n;i++){clock+=.1;systems.forEach(fn=>fn(.1));pressed=false}}
 return {resources,toolHidden:()=>toolHidden,hiddenLog,clock:()=>clock,director:exports,explain:(value,afterObjective=false)=>{stage=value;explain(value,afterObjective)},tick,press:()=>{pressed=true},camera:()=>main,locked:()=>locked,frozen:()=>frozen,moves,receives,models,transforms,messages,greetings,guide,enemies,setDown:v=>{down=v},setIntro:v=>{intro=v},reset:()=>{stage=0;intro=true}}
}
test('each tutorial step frames the guide, waits for E, then shows the correct resource or agent',()=>{
 for(const [stage,label,x]of [[1,'GATHER FRUIT',95],[2,'GATHER WOOD',106],[3,'MINE STONE',70],[4,'RECOVER MEMORY SHARDS',115],[5,'DELIVER TO NOVATERRA',86.5]]){
  const h=harness();h.explain(stage);h.tick();assert.equal(h.director.getTutorialCinematic().phase,'guide');assert.equal(h.locked(),true)
  assert.equal(h.greetings.length,1);assert.equal(h.guide.at(-1),false);assert.ok(h.messages.some(m=>m.active===true&&m.stage===stage))
  h.press();h.tick();assert.equal(h.director.getTutorialCinematic().phase,'guide','opening key cannot skip the text')
  h.tick(15);assert.equal(h.director.getTutorialCinematic().canContinue,true)
  h.press();h.tick();h.tick(stage>=2&&stage<=4?92:48);assert.equal(h.director.getTutorialCinematic().title,label)
  // The camera stands on the player's side of the objective, at a framing distance (target x given above, z about 95-100).
  const cam=h.transforms.get(h.camera()).position,target={x:x-5,z:stage===4?100:stage===5?85.5:95},player={x:84,z:stage>=2&&stage<=4?98:90},d=Math.hypot(cam.x-target.x,cam.z-target.z)
  assert.ok(d>4.5&&d<11,'framing distance '+d.toFixed(2));assert.ok((cam.x-target.x)*(player.x-target.x)+(cam.z-target.z)*(player.z-target.z)>0,'camera on the player side')
  h.tick(60);assert.equal(h.director.getTutorialCinematic().active,false);assert.equal(h.camera(),null);assert.equal(h.locked(),false);assert.equal(h.messages.at(-1).active,false);assert.equal(h.frozen(),false)
 }
})
test('guide dialogue does not expire, and protection is renewed while reading',()=>{
 const h=harness();h.explain(4);h.tick();h.tick(300)
 assert.equal(h.director.getTutorialCinematic().phase,'guide');assert.equal(h.locked(),true)
 assert.ok(h.messages.filter(m=>m.active).length>=6)
})
test('enemy focus frames the live agent once and then holds still, and camera is reset under a full black cover',()=>{
 const h=harness();h.explain(4);h.tick();h.tick(15);h.director.continueTutorialCinematic();h.tick(92)
 const held={...h.transforms.get(h.camera()).position},rotation={...h.transforms.get(h.camera()).rotation}
 h.enemies[0].position.x=120;h.tick();h.tick(5)
 assert.deepEqual({...h.transforms.get(h.camera()).position},held);assert.deepEqual({...h.transforms.get(h.camera()).rotation},rotation)
 h.tick(26);assert.equal(h.director.getTutorialCinematic().phase,'cover');assert.equal(h.director.getTutorialCinematic().fade,1)
 h.tick(3);assert.equal(h.camera(),null);assert.equal(h.locked(),true)
 h.tick(20);assert.equal(h.locked(),false)
})
test('death or restarting the intro cancels a briefing without removing the death or intro input lock',()=>{
 for(const cause of ['death','intro']){
  const h=harness();h.explain(2);h.tick();if(cause==='death')h.setDown(true);else h.reset();h.tick()
  assert.equal(h.director.getTutorialCinematic().active,false);assert.equal(h.camera(),null);assert.equal(h.locked(),false)
  assert.equal(h.messages.at(-1).active,false);assert.equal(h.frozen(),true)
 }
})

test('the guide displays each tool without collisions and throws it towards the player',()=>{
 for(const [stage,name]of [[2,'Axe'],[3,'Pickaxe'],[4,'Sword']]){
  const h=harness();h.explain(stage);h.tick();const [id,model]=[...h.models][0]
  assert.ok(model.src.endsWith('/'+name+'.glb'));assert.equal(model.visibleMeshesCollisionMask,0);assert.equal(model.invisibleMeshesCollisionMask,0)
  h.tick(15);const before={...h.transforms.get(id).position};h.director.continueTutorialCinematic();assert.equal(h.director.getTutorialCinematic().phase,'closeup');h.tick(17);assert.equal(h.director.getTutorialCinematic().phase,'give')
  h.tick(6);assert.ok(Math.hypot(h.transforms.get(id).position.x-before.x,h.transforms.get(id).position.z-before.z)>.2)
  h.tick(19);assert.equal(h.transforms.has(id),false);assert.equal(h.director.getTutorialCinematic().phase,'receive');assert.equal(h.receives.length,1);assert.equal(h.receives[0].tool,name.toLowerCase());h.tick(28);assert.equal(h.director.getTutorialCinematic().phase,'travel')
 }
})

test('presented tools stay beside Sentinel Core, leaving its centre unobstructed',()=>{
 const h=harness();h.explain(3);h.tick();const id=[...h.models.keys()][0],p=h.transforms.get(id).position
 assert.ok(p.x-84.8>=1.9);assert.ok(Math.abs(p.z-85.5)<.5)
 h.tick(20);assert.ok(h.transforms.get(id).position.x-84.8>=1.9)
})

test('all three tools get a close-up before they move towards the avatar',()=>{
 for(const stage of [2,3,4]){
  const h=harness();h.explain(stage);h.tick();h.tick(15);const id=[...h.models.keys()][0]
  h.director.continueTutorialCinematic();h.tick(8)
  assert.equal(h.director.getTutorialCinematic().phase,'closeup')
  const tool=h.transforms.get(id).position,camera=h.transforms.get(h.camera()).position
  assert.ok(Math.hypot(tool.x-camera.x,tool.y+.55-camera.y,tool.z-camera.z)<3)
  assert.ok(tool.x-84.8>=1.9);assert.equal(h.receives.length,0)
  h.tick(9);assert.equal(h.director.getTutorialCinematic().phase,'give')
 }
})

test('tool reception places the avatar on the clear path while the camera is already on the guide',()=>{
 for(const stage of [2,3,4]){
  const h=harness();h.explain(stage);h.tick();assert.equal(h.moves.length,1)
  assert.notEqual(h.moves[0].camera,null);assert.equal(h.director.getTutorialCinematic().phase,'guide')
  assert.deepEqual({...h.moves[0].data.newRelativePosition},{x:84.5,y:2,z:98})
  h.tick(60);assert.equal(h.moves.length,1,'heartbeat must not teleport the player again')
 }
 for(const stage of [1,5]){const h=harness();h.explain(stage);h.tick();assert.equal(h.moves.length,0)}
})

test('the throw starts at the displayed tool position and handoff faces the next objective',()=>{
 for(const stage of [2,3,4]){const h=harness();h.explain(stage);h.tick();h.tick(15);h.director.continueTutorialCinematic();while(h.director.getTutorialCinematic().phase==='closeup')h.tick();const id=[...h.models.keys()][0],before={...h.transforms.get(id).position};h.tick();const after=h.transforms.get(id).position;assert.ok(Math.hypot(after.x-before.x,after.y-before.y,after.z-before.z)<.15);h.tick(140);assert.ok(h.moves.some(m=>m.data.cameraTarget&&Math.abs(m.data.cameraTarget.x-84.8)>.5))}
})

test('the reception emote starts before landing so the hand closes as the thrown tool arrives, and only then shows the held copy',()=>{
 for(const [stage,name,contact]of [[2,'axe',22/30],[3,'pickaxe',22/30],[4,'sword',.7]]){
  const h=harness();h.explain(stage);h.tick();assert.equal(h.toolHidden(),true,'the equipped copy is hidden while the guide still holds the tool')
  assert.ok(h.moves[0].data.avatarTarget,'the avatar is turned towards the thrown tool')
  h.tick(15);h.director.continueTutorialCinematic();while(h.director.getTutorialCinematic().phase==='closeup')h.tick()
  const giveAt=h.clock(),id=[...h.models.keys()][0];while(h.director.getTutorialCinematic().phase==='give')h.tick()
  assert.equal(h.receives.length,1);assert.equal(h.receives[0].tool,name);assert.equal(h.receives[0].hidden,true)
  const startedAfter=h.receives[0].at-giveAt;assert.ok(Math.abs(startedAfter-(2.3-contact))<=.11,name+' emote started '+startedAfter.toFixed(2)+' s into the throw')
  assert.equal(h.transforms.has(id),false);assert.equal(h.toolHidden(),false,'the held copy appears at contact')
  h.tick(25);assert.equal(h.director.getTutorialCinematic().phase,'travel','the camera leaves once the emote has lowered the tool')
 }
})

test('the thrown tool floats 0.75 m above the receiving hand, in front of the face',()=>{
 const h=harness();h.explain(2);h.tick();h.tick(15);h.director.continueTutorialCinematic();while(h.director.getTutorialCinematic().phase==='closeup')h.tick()
 const id=[...h.models.keys()][0];h.tick(12);const p=h.transforms.get(id).position
 assert.ok(Math.abs(p.y-(2-.88+1.24+.75))<.1,"arrives at "+p.y.toFixed(2));assert.ok(Math.abs(p.z-(98+.41))<.1);assert.ok(Math.abs(p.x-(84.5+.37))<.1,"out to the side of the right hand")
 assert.ok(h.transforms.get(id).scale.x<1.05)
})

test('the thrown tool floats in front of the avatar for a second before the hand reaches for it',()=>{
 const h=harness();h.explain(3);h.tick();h.tick(15);h.director.continueTutorialCinematic();while(h.director.getTutorialCinematic().phase==='closeup')h.tick()
 const id=[...h.models.keys()][0];h.tick(13);const ys=[]
 for(let i=0;i<2;i++){const p=h.transforms.get(id).position;assert.ok(Math.abs(p.z-98.41)<.05&&Math.abs(p.x-84.87)<.05,'stays in front of the avatar');ys.push(p.y);h.tick()}
 assert.ok(Math.max(...ys)-Math.min(...ys)>.01,'it bobs gently');assert.equal(h.receives.length,0,'the hand has not reached yet')
 h.tick();assert.equal(h.receives.length,1);assert.equal(h.transforms.has(id),true,'the tool is still floating while the hand reaches')
})

test('the floating tool vanishes in a flash while the reception plays, and the flash clears itself',()=>{
 const h=harness();h.explain(2);h.tick();h.tick(15);h.director.continueTutorialCinematic();while(h.director.getTutorialCinematic().phase==='closeup')h.tick()
 while(h.director.getTutorialCinematic().phase==='give')h.tick()
 const flash=[...h.models].find(([,m])=>m.src.includes('Tool_Flash'));assert.ok(flash,'flash appears');assert.ok(h.receives.length===1&&h.receives[0].at<h.clock(),'reception already playing')
 assert.equal(h.transforms.has(flash[0]),true);h.tick(8);assert.equal(h.transforms.has(flash[0]),false)
})

test('the objective camera never looks through another tree or rock',()=>{
 const h=harness()
 // A large tree right between the player (84, 90) and the fruit (90, 96), on the default side of the shot.
 h.resources.push({id:'blocker',kind:'wood',position:{x:87,y:1,z:93},collider:{y:3},hitsRequired:3,visualBounds:{min:{x:-2.5,y:0,z:-2.5},max:{x:2.5,y:9,z:2.5}}})
 h.explain(1);h.tick();h.tick(15);h.press();h.tick();h.tick(48)
 const cam=h.transforms.get(h.camera()).position,target={x:90,y:2.2,z:96}
 for(let k=.1;k<.95;k+=.02){const x=cam.x+(target.x-cam.x)*k,y=cam.y+(target.y-cam.y)*k,z=cam.z+(target.z-cam.z)*k
  assert.ok(!(Math.hypot(x-87,z-93)<2.1&&y<10),'line of sight crosses the blocking tree at '+[x,y,z].map(v=>v.toFixed(1)))}
})
test('after a completed objective the cut to Pandora waits a second, so the pickup lands first',()=>{
 const h=harness();h.explain(2,true);h.tick(9);assert.equal(h.director.getTutorialCinematic().active,false);assert.equal(h.locked(),false)
 h.tick(3);assert.equal(h.director.getTutorialCinematic().phase,'guide')
 const asked=harness();asked.explain(2);asked.tick();assert.equal(asked.director.getTutorialCinematic().phase,'guide','talking to Pandora opens at once')
})
test('after the tutorial delivery Pandora waits for the altar animation to finish before her closing words',()=>{
 const h=harness();h.explain(6,true);h.tick(40);assert.equal(h.director.getTutorialCinematic().active,false,'altars still delivering')
 h.tick(8);assert.equal(h.director.getTutorialCinematic().phase,'guide')
 assert.doesNotMatch(fs.readFileSync('src/world.ts','utf8'),/setTutorialHighlight|tutorialHighlight/,'no objective highlight in the world')
})
