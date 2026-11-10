import { movePlayerTo } from '~system/RestrictedActions'
import { playToolReceive, toolReceiveContactSeconds, toolReceiveSeconds } from './punchAnimation'
import { setAvatarToolPresentationHidden } from './avatarTools'
import { Animator, engine, Entity, GltfContainer, InputAction, inputSystem, InputModifier, MainCamera, PointerEventType, Transform, VirtualCamera } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'
import { getEnemies, getVillage, isResourceAvailable } from './gameState'
import { TOOL_RECEIVE_POINT, GUIDE_POINT, deliveryPointFor, tutorialInstruction } from './shared/tutorial'
import { WORLD_RESOURCES } from './shared/worldLayout'
import { groundHeight, groundKind } from './shared/terrainGrid'
import { tutorialObjective } from './tutorialObjective'
import { getTutorialStage, isIntroActive, subscribeTutorialExplanations } from './tutorial'
import { isPlayerDown } from './playerDeath'
import { isCinematicLocked, setCinematicLocked } from './cinematicLock'
import { setVillageGuideOpen } from './villageGuide'
import { greetVillageGuide } from './agents'
import { room } from './shared/pandoraMessages'
import { playInteractionSound } from './audio'

type Phase = 'idle'|'guide'|'closeup'|'give'|'receive'|'travel'|'target'|'fade'|'cover'|'reveal'
let placementReady=true,placementVersion=0,orientationReady=true,orientationStarted=false
// After a completed objective the cut to Pandora waits a second, so the pickup lands before the camera moves.
const OBJECTIVE_PAUSE=1
// After the tutorial delivery the closing words wait until the altars' Deliver animation (ambientLife DELIVER_TIME, 4.344 s) has played out.
const DELIVERY_PAUSE=4.6
let phase:Phase='idle',timer=0,stage=0,pending:number|undefined,pendingWait=0,heartbeat=0
let camera:Entity|undefined,origin=Vector3.Zero(),tool:Entity|undefined,toolOrigin=Vector3.Zero()
let travelStart=Vector3.Zero(),travelRotation=Quaternion.Identity()
let giveStart=Vector3.Zero(),giveRotation=Quaternion.Identity(),receiveStarted=false
// The player Transform sits at chest height, about 0.88 m above the feet.
// The thrown tool hangs in front of the avatar for HOVER_SECONDS before the hand reaches for it.
const PLAYER_ORIGIN_HEIGHT=.88,THROW_SECONDS=1.3,HOVER_SECONDS=1
const receivedTool=()=>stage===2?'axe':stage===3?'pickaxe':'sword'
const playerAxes=()=>{const q=Transform.getOrNull(engine.PlayerEntity)?.rotation??Quaternion.Identity();const fx=2*(q.x*q.z+q.w*q.y),fz=1-2*(q.x*q.x+q.y*q.y);return {fx,fz}}
// Where the open right hand is when the reception closes it: 0.26 m right, 0.45 m ahead, 1.24 m above the feet (1.28 for the sword).
// The reception emotes swing the right arm out to the side for the catch, so the hand meets the tool 0.37 m to the right.
const catchPoint=()=>{const {fx,fz}=playerAxes(),up=stage===4?1.28:1.24;return Vector3.create(origin.x+fx*.41+fz*.37,origin.y-PLAYER_ORIGIN_HEIGHT+up,origin.z+fz*.41-fx*.37)}
// The thrown tool stops and floats well above that hand, in front of the face, and vanishes there in a flash while the
// avatar's reception plays; the equipped copy appears in the hand at the same moment.
const FLOAT_ABOVE_HAND=.75
const presentPoint=()=>{const p=catchPoint();return Vector3.create(p.x,p.y+FLOAT_ABOVE_HAND,p.z)}
let flash:Entity|undefined,flashLeft=0
const receiveView=()=>{const {fx,fz}=playerAxes();return Vector3.create(origin.x+fx*4.5+fz*2,origin.y+1.8,origin.z+fz*4.5-fx*2)}
// The objective shot is worked out once, when the objective is chosen: the camera flies there and then holds still,
// even if the objective (an agent) walks on.
let goal:{point:Vector3;label:string;id?:string;enemy?:boolean;view:Vector3;look:Vector3}|undefined
const guideCamera=()=>Vector3.create(GUIDE_POINT.x+.7,GUIDE_POINT.y+.8,GUIDE_POINT.z+5.8)
const guideFocus=()=>Vector3.create(GUIDE_POINT.x+.7,GUIDE_POINT.y+.2,GUIDE_POINT.z)
const toolDisplayPosition=()=>Vector3.create(GUIDE_POINT.x+2,GUIDE_POINT.y+.1,GUIDE_POINT.z+.35)
const facing=(from:Vector3,to:Vector3)=>Quaternion.lookRotation(Vector3.subtract(to,from))
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*t*(t*(t*6-15)+10)}
const mix=(a:Vector3,b:Vector3,t:number)=>Vector3.create(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,a.z+(b.z-a.z)*t)
// A viewpoint with a clear line to the target: nothing between them (other resources, rocks, the ground). Sides facing
// the player come first, so the shot relates to where they stand.
function clearView(target:Vector3,id?:string){
 const blocked=(from:Vector3)=>{
  if(groundKind(from.x,from.z)===3||from.y<groundHeight(from.x,from.z)+1.5)return true
  const length=Vector3.distance(from,target)
  for(let d=.6;d<length-1;d+=.3){const k=d/length,x=from.x+(target.x-from.x)*k,y=from.y+(target.y-from.y)*k,z=from.z+(target.z-from.z)*k
   if(groundKind(x,z)!==3&&y<groundHeight(x,z)+.3)return true
   for(const r of WORLD_RESOURCES){if(r.id===id||!r.visualBounds||!isResourceAvailable(r.id))continue
    const b=r.visualBounds,cx=r.position.x+(b.min.x+b.max.x)/2,cz=r.position.z+(b.min.z+b.max.z)/2,radius=Math.max(b.max.x-b.min.x,b.max.z-b.min.z)*.42
    if(Math.abs(x-cx)<radius&&Math.abs(z-cz)<radius&&Math.hypot(x-cx,z-cz)<radius&&y>r.position.y+b.min.y&&y<r.position.y+b.max.y)return true}}
  return false}
 const side=Math.atan2(origin.z-target.z,origin.x-target.x)
 for(const step of [0,1,-1,2,-2,3,-3,4,-4,5,-5,6,-6,7,-7,8])for(const [distance,height] of [[8,4],[6.5,3],[10,5.5],[5,2.4]]){
  const angle=side+step*Math.PI/8,view=Vector3.create(target.x+Math.cos(angle)*distance,target.y+height,target.z+Math.sin(angle)*distance)
  if(!blocked(view))return view}
 return Vector3.create(target.x+5,target.y+4,target.z+7)
}
export function getTutorialCinematic(){
 const instruction=tutorialInstruction(stage,true)
 return {active:phase!=='idle',phase,title:phase==='closeup'?(stage===2?'AXE':stage===3?'PICKAXE':'SWORD'):phase==='guide'||phase==='give'?'PANDORA':phase==='receive'?instruction.title:goal?.label??instruction.title,
  text:phase==='closeup'?'Your next tool. Ready to rebuild Novaterra.':phase==='guide'||phase==='give'?instruction.body:phase==='receive'?'Your new tool is ready. Let’s put it to use.':stage===4?'These agents have lost control. Recover their shards to rebuild Novaterra’s memory.':stage===5?'Deliver your resources and memory shards at any of the four corner altars. Their stock is shared by all explorers.':`This is your next objective. ${instruction.body.split('. ').slice(-1)[0]}`,
  canContinue:phase==='guide'&&timer>=1.2&&placementReady,
  fade:phase==='fade'?smooth(timer/.7):phase==='cover'?1:phase==='reveal'?1-smooth(timer/.8):phase==='guide'?1-smooth(timer/.5):0}
}
function chooseGoal(){
 if(stage>=6)return undefined
 if(stage===5){const p=deliveryPointFor(getVillage().level,origin),point=Vector3.create(p.x,p.y+1,p.z);return {point,look:point,view:clearView(point),label:'DELIVER TO NOVATERRA'}}
 if(stage===4){
  const enemy=getEnemies().filter(e=>e.health>0&&!e.respawnAt).sort((a,b)=>Math.hypot(a.position.x-origin.x,a.position.z-origin.z)-Math.hypot(b.position.x-origin.x,b.position.z-origin.z))[0]
  if(!enemy)return undefined
  const look=Vector3.create(enemy.position.x,enemy.position.y+.4,enemy.position.z)
  return {point:{...enemy.position},label:'RECOVER MEMORY SHARDS',id:enemy.id,enemy:true,look,view:clearView(look,enemy.id)}
 }
 // The same resource the world highlight lights up.
 const node=tutorialObjective(stage===1?'fruit':stage===2?'wood':'stone',origin,isResourceAvailable)
 if(!node)return undefined
 const point=Vector3.create(node.position.x,node.position.y+Math.min(2,node.collider.y*.6),node.position.z)
 return {point,look:point,view:clearView(point,node.id),label:stage===1?'GATHER FRUIT':stage===2?'GATHER WOOD':'MINE STONE',id:node.id}
}
export function continueTutorialCinematic(){
 if(phase!=='guide'||timer<1.2||!placementReady)return
 playInteractionSound();goal=chooseGoal();orientationStarted=false;orientationReady=true;phase=tool!==undefined?'closeup':stage>=6?'fade':'travel';timer=0
 if(camera!==undefined){travelStart={...Transform.getMutable(camera).position};travelRotation={...Transform.getMutable(camera).rotation}} 
}
function notify(active:boolean){void room.send('tutorialBriefingRequest',{active,stage}).catch(error=>console.error('[Pandora] Tutorial briefing:',error))}
function release(restore:boolean){
 placementVersion++;placementReady=true
 MainCamera.createOrReplace(engine.CameraEntity,{})
 if(camera!==undefined)engine.removeEntity(camera)
 camera=undefined
 if(tool!==undefined)engine.removeEntity(tool);tool=undefined
 if(flash!==undefined)engine.removeEntity(flash);flash=undefined
 setAvatarToolPresentationHidden(false)
 if(restore)InputModifier.deleteFrom(engine.PlayerEntity)
 setCinematicLocked(false);notify(false);phase='idle';timer=0
}
export function setupTutorialCinematics(){
 subscribeTutorialExplanations((value,afterObjective)=>{pending=value;pendingWait=afterObjective?(value>=6?DELIVERY_PAUSE:OBJECTIVE_PAUSE):0;setVillageGuideOpen(false)})
 engine.addSystem(dt=>{
  const seconds=Math.max(0,Math.min(dt,.1))
  if(isIntroActive()||isPlayerDown()){
   if(phase!=='idle')release(false)
   if(getTutorialStage()===0)pending=undefined
   return
  }
  if(phase==='idle'){
   if(pending===undefined||isCinematicLocked())return
   if(pendingWait>0){pendingWait-=seconds;return}
   // An explanation queued for a stage the explorer has already left (a skipped tutorial) is dropped.
   if(pending!==getTutorialStage()){pending=undefined;return}
   const native=Transform.getOrNull(engine.CameraEntity),player=Transform.getOrNull(engine.PlayerEntity)
   if(!native||!player)return
   stage=pending;pending=undefined;origin={...player.position}
   camera=engine.addEntity();Transform.create(camera,{position:guideCamera(),rotation:facing(guideCamera(),guideFocus())})
   VirtualCamera.create(camera,{})
   MainCamera.createOrReplace(engine.CameraEntity,{virtualCameraEntity:camera})
   InputModifier.createOrReplace(engine.PlayerEntity,{mode:InputModifier.Mode.Standard({disableAll:true})})
   setCinematicLocked(true);setVillageGuideOpen(false);greetVillageGuide(guideCamera());notify(true)
   const toolName=stage===2?'Axe':stage===3?'Pickaxe':stage===4?'Sword':undefined
   placementReady=true
   if(toolName){
    placementReady=false
    const version=++placementVersion
    // The active virtual camera stays on Pandora while the avatar moves.
    setAvatarToolPresentationHidden(true)
    // The avatar faces the tool beside Pandora, so the throw arrives in front of its right hand.
    void movePlayerTo({newRelativePosition:TOOL_RECEIVE_POINT,cameraTarget:GUIDE_POINT,avatarTarget:{...toolDisplayPosition(),y:TOOL_RECEIVE_POINT.y}}).then(()=>{
     if(version!==placementVersion)return
     origin={...(Transform.getOrNull(engine.PlayerEntity)?.position??TOOL_RECEIVE_POINT)};placementReady=true
    }).catch(error=>{if(version===placementVersion)placementReady=true;console.error('[Pandora] Tool reception placement:',error)})
    tool=engine.addEntity();Transform.create(tool,{position:toolDisplayPosition(),scale:Vector3.create(1.5,1.5,1.5)})
    GltfContainer.create(tool,{src:'assets/scene/modelos/'+toolName+'.glb',visibleMeshesCollisionMask:0,invisibleMeshesCollisionMask:0})
   }
   phase='guide';timer=0;heartbeat=0;goal=undefined
   return
  }
  if(flash!==undefined&&(flashLeft-=seconds)<=0){engine.removeEntity(flash);flash=undefined}
  timer+=seconds;heartbeat+=seconds
  if(heartbeat>=5){heartbeat=0;notify(true)}
  if(phase==='closeup'){
   const base=toolDisplayPosition(),target=Vector3.create(base.x,base.y+.55,base.z)
   const close=Vector3.create(base.x+.45,base.y+.75,base.z+2.8),t=smooth(timer/.7)
   if(tool!==undefined)Transform.getMutable(tool).position=base
   const transform=Transform.getMutable(camera!)
   transform.position=mix(travelStart,close,t);transform.rotation=Quaternion.slerp(travelRotation,facing(close,target),t)
   if(timer>=1.6){if(tool!==undefined)toolOrigin={...Transform.getMutable(tool).position};giveStart={...transform.position};giveRotation={...transform.rotation};phase='give';timer=0;receiveStarted=false}
   return
  }
  if(phase==='give'){
   // The tool flies in, floats in front of the avatar, and the reception starts so the hand closes as the float ends.
   const kind=receivedTool(),handover=THROW_SECONDS+HOVER_SECONDS
   if(!receiveStarted&&timer>=handover-toolReceiveContactSeconds(kind)){receiveStarted=true;playToolReceive(kind)}
   const t=smooth(timer/THROW_SECONDS),position=mix(toolOrigin,presentPoint(),t);position.y+=Math.sin(t*Math.PI)*1.2
   if(timer>THROW_SECONDS)position.y+=Math.sin((timer-THROW_SECONDS)/HOVER_SECONDS*Math.PI*2)*.035
   if(tool!==undefined){const transform=Transform.getMutable(tool);transform.position=position;const size=1.5-.5*t;transform.scale=Vector3.create(size,size,size)}
   const view=mix(giveStart,receiveView(),t),look=mix(Vector3.create(position.x,position.y+.55*(1-t),position.z),Vector3.create(origin.x,origin.y+.6,origin.z),smooth((timer-.5)/.8))
   const cameraTransform=Transform.getMutable(camera!);cameraTransform.position=view;cameraTransform.rotation=Quaternion.slerp(giveRotation,facing(view,look),t)
   if(timer>=handover){
    if(tool!==undefined){
     flash=engine.addEntity();Transform.create(flash,{position:{...Transform.getMutable(tool).position},scale:Vector3.create(1.6,1.6,1.6)})
     GltfContainer.create(flash,{src:'assets/scene/modelos/fx/Tool_Flash.glb',visibleMeshesCollisionMask:0,invisibleMeshesCollisionMask:0})
     Animator.create(flash,{states:[{clip:'Flash',playing:true,loop:false,shouldReset:true}]});flashLeft=.6
     engine.removeEntity(tool)
    }
    tool=undefined
    if(!receiveStarted){receiveStarted=true;playToolReceive(kind)}
    // The equipped copy appears in the closing hand; the emote then lifts it to show it.
    setAvatarToolPresentationHidden(false)
    travelStart={...cameraTransform.position};travelRotation={...cameraTransform.rotation};phase='receive';timer=0
   }
   return
  }
  if(phase==='receive'){
   const view=receiveView()
   const target=Vector3.create(origin.x,origin.y+.6,origin.z),t=smooth(timer/.45)
   const transform=Transform.getMutable(camera!);transform.position=mix(travelStart,view,t);transform.rotation=Quaternion.slerp(travelRotation,facing(view,target),t)
   if(timer>=toolReceiveSeconds(receivedTool())-toolReceiveContactSeconds(receivedTool())+.1){travelStart={...transform.position};travelRotation={...transform.rotation};phase='travel';timer=0}
   return
  }
  if(phase==='guide'){
   if(tool!==undefined&&placementReady){const player=Transform.getOrNull(engine.PlayerEntity);if(player)origin={...player.position}}
   if(tool!==undefined){const transform=Transform.getMutable(tool);transform.position.y=GUIDE_POINT.y+.1+Math.sin(timer*2)*.08;transform.rotation=Quaternion.fromEulerDegrees(-10,Math.sin(timer*.8)*20,12)}
   if(placementReady&&timer>=1.2&&inputSystem.isTriggered(InputAction.IA_PRIMARY,PointerEventType.PET_DOWN))continueTutorialCinematic()
   return
  }
  if(phase==='travel'||phase==='target'){
   if(!goal)goal=chooseGoal()
   if(goal&&!goal.enemy&&stage<4&&!isResourceAvailable(goal.id!))goal=chooseGoal()
   if(goal){
    const t=phase==='travel'?smooth(timer/3):1
    const transform=Transform.getMutable(camera!)
    transform.position=mix(travelStart,goal.view,t)
    transform.rotation=Quaternion.slerp(travelRotation,facing(goal.view,goal.look),t)
   }
   if(phase==='travel'&&timer>=3){phase='target';timer=0}
   else if(phase==='target'&&timer>=2.4){phase='fade';timer=0}
   return
  }
  if(phase==='fade'&&timer>=.7){phase='cover';timer=0;return}
  if(phase==='cover'){
   if(!orientationStarted){
    orientationStarted=true;orientationReady=false
    const version=placementVersion,player=Transform.getOrNull(engine.PlayerEntity)
    if(player&&goal){
     void movePlayerTo({newRelativePosition:{...player.position},cameraTarget:goal.point}).then(()=>{if(version===placementVersion)orientationReady=true}).catch(error=>{if(version===placementVersion)orientationReady=true;console.error('[Pandora] Objective orientation:',error)})
    }else orientationReady=true
   }
   MainCamera.createOrReplace(engine.CameraEntity,{})
   if(timer>=.8&&orientationReady){
    if(camera!==undefined)engine.removeEntity(camera);camera=undefined
    phase='reveal';timer=0
   }
   return
  }
  if(phase==='reveal'&&timer>=.8)release(true)
 },undefined,'pandora-tutorial-cinematics')
}
