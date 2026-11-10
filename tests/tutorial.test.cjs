const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),ts=require('typescript')
const mathModule={exports:{}}
vm.runInNewContext(require('esbuild').buildSync({entryPoints:['@dcl/sdk/math'],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text,{module:mathModule,exports:mathModule.exports,require})
function harness(){
 const transforms=new Map(),systems=[],calls=[];let next=10,loaded=false,locked=false,main=null,pressed=false
 const exports={}
 const ecs={inputSystem:{isTriggered:()=>{const value=pressed;pressed=false;return value}},InputAction:{IA_PRIMARY:1},PointerEventType:{PET_DOWN:1},engine:{PlayerEntity:1,CameraEntity:2,addEntity:()=>next++,removeEntity:id=>transforms.delete(id),addSystem:fn=>systems.push(fn)},Transform:{create:(id,data)=>transforms.set(id,data),getOrNull:id=>id===2?({position:{x:81.55,y:5,z:151},rotation:{x:0,y:1,z:0,w:0}}):({position:{x:81,y:2,z:146}}),getMutable:id=>transforms.get(id)},InputModifier:{Mode:{Standard:v=>v},createOrReplace:()=>{locked=true},deleteFrom:()=>{locked=false}},VirtualCamera:{create:(id,data)=>calls.push({camera:id,...data}),createOrReplace:(id,data)=>calls.push({camera:id,...data})},MainCamera:{createOrReplace:(id,data)=>{main=data.virtualCameraEntity??null},deleteFrom:()=>{main=null}},GltfContainerLoadingState:{getOrNull:()=>({currentState:loaded?4:1})},LoadingState:{FINISHED:4}}
 const code=ts.transpileModule(fs.readFileSync('src/tutorial.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
 vm.runInNewContext(code,{exports,console,require:id=>{
 if(id==='./audio')return {playGameMusic:()=>calls.push('music-start'),stopGameMusic:()=>calls.push('music-stop'),playIntroNarration:()=>calls.push('narration-start'),stopIntroNarration:()=>calls.push('narration-stop')}
 if(id==='./villageGuide')return {setVillageGuideOpen:value=>calls.push({dialogue:value})}
 if(id.endsWith('/ecs'))return ecs
 if(id.endsWith('/math'))return mathModule.exports
 if(id.includes('RestrictedActions'))return {movePlayerTo:async data=>calls.push({move:data.newRelativePosition,camera:data.cameraTarget,avatar:data.avatarTarget})}
 if(id.includes('pandoraMessages'))return {room:{send:async type=>calls.push(type)}}
 return {TUTORIAL_DONE:6,GUIDE_POINT:{x:83,y:3.9,z:84},ARRIVAL_POINT:{x:81.55,y:2,z:146},tutorialInstruction:()=>({title:'test',body:'test'})}
 }})
 exports.setupTutorialIntro();exports.registerIntroAsset(99)
 return {intro:exports,calls,transforms,press:()=>{pressed=true},locked:()=>locked,main:()=>main,load:()=>{loaded=true},tick:()=>systems.forEach(fn=>fn(0.1))}
}
const flush=()=>new Promise(r=>setImmediate(r))
async function begin(h){h.load();h.intro.syncTutorial(0,false,false);h.tick();await h.intro.startIntroGame();h.tick();await flush();for(let i=0;i<6;i++)h.tick()}
async function skipToWayfinding(h){await h.intro.finishIntro();for(let i=0;i<14;i++)h.tick();await flush();h.intro.syncTutorial(1,false,true)}
test('every entry opens the start menu before any narration or camera movement',async()=>{
 const h=harness();h.load();h.intro.syncTutorial(0,false,false);for(let i=0;i<100;i++)h.tick();assert.equal(h.intro.isIntroTitle(),true);assert.equal(h.locked(),true);assert.equal(h.main(),null);assert.equal(h.calls.includes('narration-start'),false);assert.equal(h.calls.some(c=>typeof c==='object'&&c.move),false)
 h.press();h.tick();h.tick();await flush();for(let i=0;i<7;i++)h.tick();assert.equal(h.intro.isIntroTitle(),false);assert.equal(h.calls.filter(c=>c==='narration-start').length,1)
})
test('the first visit keeps the full narration, then continues to the tree shot without a second start menu',async()=>{
 const h=harness();await begin(h);for(let i=0;i<335;i++)h.tick();assert.equal(h.calls.filter(c=>c==='narration-start').length,1);assert.equal(h.calls.includes('narration-stop'),false);assert.equal(h.calls.filter(c=>c==='introCompleteRequest').length,0)
 for(let i=0;i<15;i++)h.tick();assert.equal(h.intro.getIntroFade(),1);assert.equal(h.intro.isIntroTitle(),false)
 for(let i=0;i<15;i++)h.tick();await flush();h.intro.syncTutorial(1,false,true);assert.equal(h.calls.filter(c=>c==='introCompleteRequest').length,1);assert.equal(h.intro.isIntroTitle(),false);assert.equal(h.intro.getIntroFade(),1,'placement happens under the cover');await flush();for(let i=0;i<6;i++)h.tick();assert.notEqual(h.main(),null);assert.equal(h.calls.includes('narration-stop'),false)
 for(let i=0;i<100;i++)h.tick();assert.equal(h.intro.isIntroActive(),false);assert.equal(h.main(),null);assert.equal(h.locked(),false)
})
test('returning players enter directly after Start Game and keep their saved tutorial stage',async()=>{
 for(const stage of [1,2,4,5]){const h=harness();h.load();h.intro.syncTutorial(stage,stage>1,true);h.tick();assert.equal(h.intro.isIntroTitle(),true);assert.equal(h.locked(),true);await h.intro.startIntroGame();h.tick();assert.equal(h.intro.isIntroActive(),false);assert.equal(h.main(),null);assert.equal(h.locked(),false);assert.equal(h.calls.includes('narration-start'),false);assert.equal(h.calls.some(c=>typeof c==='object'&&c.move),false);assert.equal(h.intro.getTutorialStage(),stage);assert.equal(h.calls.filter(c=>c==='introCompleteRequest').length,1)}
})
test('skipping the cinematic advances automatically once and Restart Intro reopens the first-visit menu',async()=>{
 const h=harness();await begin(h);await skipToWayfinding(h);assert.equal(h.calls.filter(c=>c==='introCompleteRequest').length,1);await h.intro.startIntroGame();assert.equal(h.calls.filter(c=>c==='introCompleteRequest').length,1)
 for(let i=0;i<100;i++)h.tick();await h.intro.restartIntro();assert.ok(h.calls.includes('restartIntroRequest'));h.intro.syncTutorial(0,false,false);h.tick();assert.equal(h.intro.isIntroTitle(),true);assert.equal(h.intro.isIntroActive(),true);await h.intro.startIntroGame();assert.equal(h.intro.isIntroTitle(),false)
})
test('narration subtitles retain all supplied timecodes after moving the menu to entry',async()=>{
 const h=harness();await begin(h);const seen=[];for(let i=0;i<335;i++){const text=h.intro.getIntroCaption();if(text&&!seen.includes(text))seen.push(text);h.tick()}assert.deepEqual(seen,Array.from(h.intro.INTRO_SUBTITLES,c=>c.text))
 const cues=h.intro.INTRO_SUBTITLES;for(const [text,start]of [['The Ancients',5],['and lost',8],['Now',10],['among their',13],['I am one',18],['explorer.',23],['Novaterra',26]])assert.equal(cues.find(c=>c.text.startsWith(text)).start,start);assert.equal(cues[0].end,3)
})
test('the tree shot ends on the settled native camera pose and hands over under a short dip to black',async()=>{
 const h=harness();await begin(h);await skipToWayfinding(h)
 const starts=h.calls.filter(c=>typeof c==='object'&&c.move);assert.ok(starts.length>=2,'the avatar is placed again under the cover');const last=starts.at(-1);assert.deepEqual(last.move,{x:81.55,y:2,z:146});assert.deepEqual(last.camera,{x:83,y:3.9,z:84});assert.deepEqual(last.avatar,{x:83,y:3.9,z:84})
 let camera,pose;for(let i=0;i<80&&h.main()!==null||i<5;i++){camera=h.main()??camera;if(camera!==undefined&&h.transforms.get(camera))pose={position:{...h.transforms.get(camera).position},rotation:{...h.transforms.get(camera).rotation}};const before=h.main();h.tick();if(before!==null&&h.main()===null){assert.equal(h.intro.getIntroFade(),1,'the switch happens under full black');assert.equal(h.locked(),false,'controls return under the black');h.tick();h.tick();assert.equal(h.intro.getIntroFade(),1,'black holds while the Explorer camera settles');break}assert.equal(h.intro.isIntroTitle(),false)}
 assert.equal(h.main(),null);let ticks=0,partial=false;while(h.intro.isIntroActive()&&ticks<10){h.tick();ticks++;const f=h.intro.getIntroFade();if(f>0&&f<1)partial=true}assert.ok(partial,'the game fades back in');assert.ok(ticks<=6,'the reveal stays short');assert.equal(h.intro.isIntroActive(),false);assert.equal(h.locked(),false)
 for(const [k,v]of Object.entries({x:81.55,y:5,z:151}))assert.ok(Math.abs(pose.position[k]-v)<1e-6,'last frame position '+k)
 const q=pose.rotation;assert.ok(Math.abs(Math.abs(q.x*0+q.y*1+q.z*0+q.w*0)-1)<1e-6,'last frame rotation matches the native camera')
 assert.ok(h.calls.some(c=>typeof c==='object'&&c.defaultTransition&&c.defaultTransition.transitionMode.time===0))
})
test('controls do not start the cinematic behind the guide, and Back returns to the entry menu',async()=>{
 const h=harness();h.load();h.intro.syncTutorial(0,false,false);h.tick();h.intro.showIntroControls(true);h.press();h.tick();await flush();assert.equal(h.intro.isIntroControls(),true);assert.equal(h.calls.includes('narration-start'),false);assert.equal(h.calls.filter(c=>c==='introCompleteRequest').length,0)
 h.intro.showIntroControls(false);h.press();h.tick();assert.equal(h.intro.isIntroControls(),false);assert.equal(h.intro.isIntroTitle(),false)
})
test('arrival objective stays active until the guide meeting is acknowledged',()=>{
 const h=harness();h.intro.syncTutorial(1,false,true);assert.equal(h.intro.isGoingToGuide(),true);h.intro.syncTutorial(1,true,true);assert.equal(h.intro.isGoingToGuide(),false);assert.ok(h.calls.some(c=>c.dialogue===true))
})
test('the intro ends on the native camera only when it sits behind the avatar looking at the tree (mobile reports it early)',()=>{
 const h=harness(),toTree={x:0,y:1,z:0,w:0},away={x:0,y:0,z:0,w:1}
 assert.equal(h.intro.plausibleHandoff({x:81.55,y:5,z:151},toTree),true)
 assert.equal(h.intro.plausibleHandoff({x:81.55,y:5,z:151},away),false,'looking away from the tree')
 assert.equal(h.intro.plausibleHandoff({x:40,y:5,z:151},toTree),false,'far from the avatar')
 assert.equal(h.intro.plausibleHandoff({x:81.55,y:30,z:151},toTree),false,'high above')
})
test('Skip Tutorial asks the server to finish the tutorial and plays no explanation on the jump',async()=>{
 const h=harness();h.load();h.intro.syncTutorial(2,true,true);h.tick();await h.intro.startIntroGame();h.tick()
 assert.equal(h.intro.canSkipTutorial(),true);const before=h.calls.length
 await h.intro.skipTutorial();assert.ok(h.calls.includes('skipTutorialRequest'))
 h.intro.syncTutorial(6,true,true);assert.equal(h.calls.slice(before).some(c=>typeof c==='object'&&c.dialogue===true),false,'no Pandora explanation')
 assert.equal(h.intro.canSkipTutorial(),false)
})
test('the intro shot steers its own rotation and keeps one virtual camera (mobile ignores look-at targets)',()=>{
 const src=fs.readFileSync('src/tutorial.ts','utf8')
 assert.doesNotMatch(src,/lookAtEntity:/);assert.doesNotMatch(src,/VirtualCamera\.createOrReplace\(camera,\{\}\)/)
 assert.match(src,/if \(elapsed <= 28\) transform\.rotation=Quaternion\.lookRotation/)
})
