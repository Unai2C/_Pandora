const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),ts=require('typescript')
function load(file,require=()=>({}),extra={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require,Math,...extra});return exports}

test('agent levels span the weakest to beyond the strongest explorer online and grow stronger per level',()=>{
 const {assignAgentLevels,agentStats,agentDanger,agentXpReward}=load('src/shared/agentLevels.ts')
 const levels=assignAgentLevels(17,[2,6,4])
 assert.equal(Math.min(...levels),2,'the weakest agents match the lowest-level player');assert.ok(levels.includes(6),'some match the strongest');assert.ok(levels.some(l=>l>6),'some exceed the strongest')
 assert.deepEqual([...assignAgentLevels(3,[])],[1,1,3])
 assert.ok(agentStats({health:60,damage:8},6).health>agentStats({health:60,damage:8},5).health)
 assert.deepEqual({...agentStats({health:60,damage:8},1)},{health:60,damage:8})
 assert.equal(agentDanger(7,6),'dangerous');assert.equal(agentDanger(6,6),'even');assert.equal(agentDanger(3,6),'weaker')
 assert.ok(agentXpReward(10,5)>agentXpReward(10,1))
})

test('the action panel walks the tutorial one step at a time and announces level-ups',()=>{
 const rules=load('src/shared/tutorial.ts')
 assert.match(rules.tutorialActionPrompt(1,false),/Pandora/);assert.match(rules.tutorialActionPrompt(1),/fruit/i)
 for(const stage of [1,2,3,4])assert.doesNotMatch(rules.tutorialActionPrompt(stage),/Deliver/)
 assert.match(rules.tutorialActionPrompt(5),/Deliver/)
 let now=1000,stage=1;const handlers=new Map()
 const game=load('src/gameState.ts',id=>id==='./tutorial'?{syncTutorial(){},isIntroActive:()=>false,getTutorialStage:()=>stage,getTutorialActionPrompt:()=>rules.tutorialActionPrompt(stage)}:id.includes('pandoraMessages')?{room:{onMessage:(name,fn)=>handlers.set(name,fn),send:async()=>{}}}:id.includes('/ecs')?{engine:{PlayerEntity:1},Transform:{getOrNull:()=>null}}:id.includes('worldLayout')?{WORLD_RESOURCES:[]}:{},{Date:{now:()=>now},console})
 game.connectPandora()
 assert.match(game.getMessage(),/fruit/i)
 handlers.get('pandoraFeedback')({text:'Collected 5 fruit. 1/2 hits.'});assert.match(game.getMessage(),/Collected/)
 now+=6000;assert.match(game.getMessage(),/fruit/i,'the panel returns to the current step')
 const snapshot=level=>handlers.get('playerSnapshot')({coins:0,level,xp:0,wood:0,stone:0,fruit:0,defeated:0,chests:0,collected:0,nextCoinAt:0,profileJson:'{}'})
 snapshot(1);snapshot(2);handlers.get('pandoraFeedback')({text:'Collected 5 fruit.'})
 assert.match(game.getMessage(),/LEVEL UP.*level 2/i);now+=4500;assert.doesNotMatch(game.getMessage(),/LEVEL UP/)
})

test('a second sword press right after a swing plays the backhand, then the combo starts over',()=>{
 let now=0;const played=[]
 const anim=load('src/punchAnimation.ts',id=>id.includes('/ecs')?{engine:{PlayerEntity:1,addSystem(){}},Transform:{getOrNull:()=>({position:{x:0,y:0,z:0}})}}:id.includes('avatarTools')?{getEquippedAvatarTool:()=>'sword',hideAvatarTools(){},isAvatarToolPresentationHidden:()=>false,showAvatarTool(){}}:id.includes('RestrictedActions')?{triggerSceneEmote:async({src})=>{played.push(src.split('/').pop());return {success:true}}}:{},{Date:{now:()=>now},console})
 anim.playToolAttack('sword');now+=900;anim.playToolAttack('sword');now+=900;anim.playToolAttack('sword');now+=3000;anim.playToolAttack('sword')
 assert.deepEqual(played,['Sword_Attack_Fast_emote.glb','Sword_Attack_Back_emote.glb','Sword_Attack_Fast_emote.glb','Sword_Attack_Fast_emote.glb'])
 const glb=f=>{const b=fs.readFileSync('assets/scene/modelos/animaciones/'+f);return JSON.parse(b.subarray(20,20+b.readUInt32LE(12)))}
 assert.equal(glb('Sword_Attack_Back_emote.glb').animations.length,1)
})

test('the memory screen stays until E is pressed and shows a picture and an agent record',()=>{
 let locked=false,pressed=false;const systems=[]
 const ecs={engine:{addSystem:fn=>systems.push(fn)},InputAction:{IA_PRIMARY:1},PointerEventType:{PET_DOWN:1},inputSystem:{isTriggered:()=>pressed}}
 const milestone=load('src/villageMilestone.ts',id=>id.includes('/ecs')?ecs:id.includes('cinematicLock')?{isCinematicLocked:()=>locked,setCinematicLocked:v=>{locked=v}}:id.includes('shared/testEnemy')?{SENTINELS:[{id:'Aegis_Core',name:'Aegis Core',combatStyle:'ranged',attackRange:6}]}:id.includes('enemyTiers')?{AGENT_SIZES:{Aegis_Core:'medium'}}:{})
 milestone.setupVillageMilestoneInput();milestone.showVillageMilestone(3);milestone.advanceVillageMilestone(.1)
 const screen=milestone.getVillageMilestone();assert.equal(screen.active,true);assert.equal(locked,true,'play is paused behind the screen')
 assert.match(screen.image,/story\/(.+\/)?memory-02\.png/);assert.match(screen.agent.image,/agents\/Aegis_Core\.png/);assert.match(screen.agent.ability,/6 metres/)
 for(let i=0;i<100;i++)milestone.advanceVillageMilestone(.1);assert.equal(milestone.getVillageMilestone().active,true,'no timeout')
 pressed=true;systems.forEach(fn=>fn());pressed=false;milestone.advanceVillageMilestone(1);assert.equal(milestone.getVillageMilestone().active,false);assert.equal(locked,false)
 for(let i=1;i<=8;i++)assert.ok(fs.existsSync(`assets/images/story/memory-0${i}.png`),'memory picture '+i)
})

test('community feed lines last twelve seconds, fade over the last one, and only the latest five stay',()=>{
 const src=fs.readFileSync('src/gameState.ts','utf8')
 assert.match(src,/room\.onMessage\('communityEvent'/)
 assert.match(src,/COMMUNITY_FEED_SIZE = 5, COMMUNITY_FEED_SECONDS = 12/)
 const ui=fs.readFileSync('src/ui.tsx','utf8');assert.match(ui,/getCommunityFeed\(\)\.map/)
})
test('phones get a slim HUD: thin bottom panel, small tree badge, no compact enlargement',()=>{
 const ui=fs.readFileSync('src/ui.tsx','utf8')
 assert.match(ui,/const compact = !mobile &&/)
 assert.match(ui,/const height = S\(122, 96, 50\)/)
 assert.match(ui,/width: S\(180, 150, 64\), height: S\(180, 150, 64\)/)
 assert.match(fs.readFileSync('src/platform.ts','utf8'),/info\.platform === 'mobile'/)
 // Tool keys: a small number in the corner, clear of the icon; hero panel text a little larger than the first slim pass.
 assert.match(ui,/width: mobile \? 13 : 26, height: mobile \? 13 : 26/);assert.match(ui,/fontSize=\{mobile \? 8 : 16\}/)
 assert.match(ui,/fontSize=\{S\(23, 18, 15\)\} color=\{Color4\.create\(1, 0\.88, 0\.6, 1\)\}/)
})


test('online player levels are distributed from the beginner area to the map edge regardless of agent order',()=>{
 const r=load('src/shared/agentLevels.ts'),homes=[{x:137,z:82.5},{x:100,z:82.5},{x:121.5,z:82.5},{x:129,z:82.5}]
 assert.deepEqual([...r.assignAgentLevelsByDistance(homes,[1,30])],[32,1,16,30])
 assert.deepEqual([...r.assignAgentLevelsByDistance(homes,[30])],[32,30,30,30])
 assert.deepEqual([...r.assignAgentLevelsByDistance(homes,[])],[3,1,1,1])
 const sorted=Array.from({length:58},(_,radius)=>({x:80+radius,z:82.5}))
 const levels=r.assignAgentLevelsByDistance(sorted,[1,8,30]);for(let i=1;i<levels.length;i++)assert.ok(levels[i]>=levels[i-1])
})
