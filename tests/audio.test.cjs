const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),ts=require('typescript')
function harness(){
 const sources=new Map(),systems=[],cache={};let next=1
 function load(file){if(cache[file])return cache[file];const exports={};cache[file]=exports;vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,console,require:id=>id.endsWith('/ecs')?{engine:{PlayerEntity:0,addEntity:()=>next++,addSystem:fn=>systems.push(fn)},Transform:{create(){}},AudioSource:{createOrReplace:(id,data)=>sources.set(id,data),getMutable:id=>sources.get(id),getMutableOrNull:id=>sources.get(id),getOrNull:id=>sources.get(id)}}:id.endsWith('/math')?{Vector3:{Zero:()=>({x:0,y:0,z:0})}}:load(id.includes('actionSounds')?'src/shared/actionSounds.ts':'src/shared/musicTracks.ts')});return exports}
 const audio=load('src/audio.ts');return {audio,sources,tick:dt=>systems.forEach(fn=>fn(dt)),tracks:load('src/shared/musicTracks.ts').MUSIC_TRACKS}
}
const playing=h=>[...h.sources.values()].filter(v=>v.playing)
test('game soundtrack cycles main, extra1, extra2, main using one playlist without duplicate starts',()=>{
 const h=harness();h.audio.playGameMusic();h.tick(.8)
 assert.match(playing(h)[0].audioClipUrl,/Pangea_music/);assert.equal(playing(h).length,1)
 const count=h.sources.size;h.audio.playGameMusic();assert.equal(h.sources.size,count)
 for(const [index,next] of [[0,'extra1'],[1,'extra2'],[2,'music']]){
  h.tick(h.tracks[index].seconds-2);h.tick(2)
  const track=playing(h).find(v=>v.audioClipUrl.includes('Pangea_'));assert.match(track.audioClipUrl,new RegExp('Pangea_'+next));assert.equal(playing(h).length,1)
 }
})
test('speech silences music and celebration; celebration ducks the playlist and does not loop',()=>{
 const h=harness();h.audio.playGameMusic();h.tick(1);const normal=playing(h)[0].volume
 h.audio.playTreeCelebration();h.tick(1)
 assert.equal(playing(h).find(v=>v.audioClipUrl.includes('celebration')).loop,false)
 assert.ok(playing(h).find(v=>v.audioClipUrl.includes('Pangea_music')).volume<normal*.2)
 h.tick(53);assert.ok(playing(h).find(v=>v.audioClipUrl.includes('Pangea_music')).volume>normal*.9)
 h.audio.playIntroNarration();assert.deepEqual(playing(h).map(v=>v.audioClipUrl),['assets/sounds/Novaterra Begins.mp3'])
 h.audio.stopIntroNarration();assert.equal(playing(h).length,0)
})
test('playlist durations match the supplied MP3 files',()=>{
 const {mp3Seconds}=require('../scripts/audit-audio.cjs'),h=harness()
 for(const track of h.tracks)assert.equal(track.seconds,mp3Seconds(track.src))
})

test('pickaxe and other action effects use supplied files and stop after a short bounded playback',()=>{
 const h=harness();h.audio.playActionSound('stone')
 assert.match(playing(h)[0].audioClipUrl,/Pickaxe Striking Stone/)
 h.tick(1);assert.equal(playing(h).length,1);h.tick(.3);assert.equal(playing(h).length,0)
 h.audio.playInteractionSound();assert.match(playing(h)[0].audioClipUrl,/pressE/);h.tick(.3);assert.equal(playing(h).length,0)
 for(let i=0;i<20;i++)h.audio.playActionSound('wood');assert.ok(playing(h).length<=8)
})

test('tree celebration fades away at transformation end rather than playing for fifty seconds',()=>{
 const h=harness();h.audio.playTreeCelebration();h.tick(7);h.audio.fadeTreeCelebration(2);h.tick(1)
 assert.ok(playing(h)[0].volume<.5);h.tick(1.1);assert.equal(playing(h).length,0)
})

test('delivery audio lasts through its supplied ending, fades smoothly and is not stolen by combat sounds',()=>{
 const h=harness();h.audio.playActionSound('delivery');h.tick(2.1);assert.ok(playing(h).some(s=>s.audioClipUrl.includes('Accepted')))
 h.audio.playActionSound('agentRanged');h.audio.playActionSound('agentMelee');h.tick(1.7);const source=playing(h).find(s=>s.audioClipUrl.includes('Accepted'));assert.ok(source);assert.ok(source.volume>0&&source.volume<.75);h.tick(.6);assert.ok(!playing(h).some(s=>s.audioClipUrl.includes('Accepted')))
})

test('text confirmations cannot play legacy success or error cues when collecting',()=>{
 const handlers=new Map(),events=[],exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/gameState.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,console,Date,require:id=>id==='./audio'?{playActionSound:kind=>events.push(kind),playInteractionSound:()=>events.push('click')}:id.includes('pandoraMessages')?{room:{onMessage:(name,fn)=>handlers.set(name,fn),send:async()=>{}}}:id.includes('/ecs')?{engine:{PlayerEntity:1},Transform:{getOrNull:()=>({position:{x:80,y:2,z:80}})}}:id.includes('punchAnimation')?{playHitReaction(){}}:id.includes('impactEffects')?{spawnImpact(){}}:{}})
 exports.connectPandora();for(const text of ['Collected 5 fruit.','Collected 5 wood.','Collected 5 stone.','Harvesting wood: 1/3 hits.','The village has reached level 2!','Resource recovering.'])handlers.get('pandoraFeedback')({text});assert.deepEqual(events,[])
 handlers.get('pandoraFeedback')({text:'Delivered 5 wood.'});assert.deepEqual(events,['delivery']);handlers.get('pandoraFeedback')({text:'Punch landed on an agent.'});assert.deepEqual(events,['delivery','hit'])
 const source=fs.readFileSync('src/audio.ts','utf8');assert.doesNotMatch(source,/success\.mp3|wrong\.mp3|successVoices|wrongVoices/)
})

test('a started clip drops currentTime after its first frame, so later volume updates never restart it (mobile noise)',()=>{
 const h=harness();h.audio.playGameMusic();h.audio.playActionSound('click')
 assert.ok([...h.sources.values()].some(v=>v.currentTime===0),'clips start from the top')
 h.tick(.016)
 for(const source of h.sources.values())assert.equal('currentTime' in source,false)
 // During the fade-in the volume changes; once it settles it is no longer rewritten every frame.
 for(let i=0;i<120;i++)h.tick(.016)
 const music=[...h.sources.values()].find(v=>v.playing&&/Pangea_music/.test(v.audioClipUrl)),before=music.volume
 let writes=0;const proxy=new Proxy(music,{set(target,key,value){if(key==='volume')writes++;target[key]=value;return true}})
 for(const [id,v] of h.sources)if(v===music)h.sources.set(id,proxy)
 for(let i=0;i<30;i++)h.tick(.016)
 assert.equal(writes,0);assert.equal(music.volume,before)
})
