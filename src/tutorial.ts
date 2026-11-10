import { playGameMusic, stopGameMusic, playIntroNarration, stopIntroNarration } from './audio'
import { setVillageGuideOpen } from './villageGuide'
import { inputSystem, InputAction, PointerEventType, engine, Entity, Transform, VirtualCamera, MainCamera, InputModifier, GltfContainerLoadingState, LoadingState } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'
import { movePlayerTo } from '~system/RestrictedActions'
import { room } from './shared/pandoraMessages'
import { GUIDE_POINT, ARRIVAL_POINT, TUTORIAL_DONE, tutorialInstruction, tutorialActionPrompt } from './shared/tutorial'
let stage = -1, elapsed = 0, started = false, finishing = false
let camera: Entity | undefined, focus: Entity | undefined
type IntroPhase = 'cinematic' | 'fade' | 'title' | 'starting' | 'completing' | 'settling' | 'wayfinding' | 'reveal' | 'done'
let phase: IntroPhase = 'title', phaseTime = 0
let introSeen=false,menuInputLocked=false
export function getIntroFade() { return phase === 'fade' ? ease(phaseTime / 1.2) : phase === 'title' || phase === 'starting' || phase === 'completing' || phase === 'settling' ? 1 : phase === 'wayfinding' ? Math.max(1-ease(phaseTime/.7),ease((phaseTime-6.25)/.25)) : phase === 'reveal' ? 1-ease((phaseTime-.3)/.35) : 0 }
// The tree shot ends on the native camera pose; a short dip to black hides the switch and the Explorer's own camera reset when controls return.
export function isArrivalScreen() { return false }
export function isIntroTitle() { return phase === 'title' || phase === 'starting' }
export function isIntroStarting() { return phase === 'starting' || stage<0 }
const TOTAL = 33
const SPEECH_SECONDS = 36.048
let speechElapsed = 0, skippedSpeech = false
let preparing = false, arrivalReady = false, settleTime = 0
let placementDone = false, stillFrames = 0, lastPose: { position: Vector3; rotation: Quaternion } | undefined
// Seconds since control was handed back; the native camera is compared with the last cinematic frame to diagnose any jump.
let handoffWatch = -1, handoffReported = 0
let handoffPosition = Vector3.create(ARRIVAL_POINT.x, 5.8, ARRIVAL_POINT.z + 5)
let handoffRotation = Quaternion.lookRotation(Vector3.create(GUIDE_POINT.x-ARRIVAL_POINT.x, -1.1, GUIDE_POINT.z-ARRIVAL_POINT.z-5))
const GUIDE = GUIDE_POINT
// The cinematic ends on the Explorer's own camera pose behind the avatar. Some clients (mobile) report it before their
// camera has settled behind the arrival point; a pose that is not near the avatar, or does not look towards the central
// tree, keeps the default third-person framing instead of steering the last shot somewhere else.
export function plausibleHandoff(position: {x:number;y:number;z:number}, rotation: {x:number;y:number;z:number;w:number}) {
 if (Math.hypot(position.x-ARRIVAL_POINT.x, position.z-ARRIVAL_POINT.z) > 9 || position.y < ARRIVAL_POINT.y-1 || position.y > ARRIVAL_POINT.y+8) return false
 const forward = Vector3.rotate(Vector3.Forward(), rotation), toGuide = Vector3.normalize(Vector3.create(GUIDE_POINT.x-position.x, 0, GUIDE_POINT.z-position.z))
 const flat = Math.hypot(forward.x, forward.z)
 return flat > .3 && (forward.x*toGuide.x+forward.z*toGuide.z)/flat > .5
}
function recordHandoff(position: {x:number;y:number;z:number}, rotation: {x:number;y:number;z:number;w:number}) {
 if (!plausibleHandoff(position, rotation)) { console.log('[Pandora] Native camera pose ignored for the intro handoff: '+JSON.stringify(position)); return }
 handoffPosition = Vector3.create(position.x, position.y, position.z); handoffRotation = { ...rotation }
}
const ease = (t: number) => { t = Math.max(0, Math.min(1, t)); return t*t*t*(t*(t*6-15)+10) }
const introAssets: Entity[] = []
export function registerIntroAsset(entity: Entity) { introAssets.push(entity) }
export function isIntroRunning() { return started }
export function getTutorialStage() { return stage }
export function isIntroActive() { return stage<0 || phase!=='done' }
let controlsOpen=false
export function isIntroControls(){return controlsOpen&&isIntroTitle()}
export function showIntroControls(value:boolean){if(phase==='title')controlsOpen=value}
let guideMet = false, nextGuideCheck = 0
export function isGoingToGuide() { return stage === 1 && !guideMet }
export function getTutorialInstruction() { return tutorialInstruction(stage, guideMet) }
export function getTutorialActionPrompt() { return tutorialActionPrompt(stage, guideMet) }
// afterObjective: the explanation follows a just-completed objective, so the cut waits a moment after the pickup.
const explanationListeners = new Set<(stage:number, afterObjective:boolean)=>void>()
export function requestTutorialExplanation() {
 if(stage<1||stage>=TUTORIAL_DONE||!explanationListeners.size)return false
 for(const listener of explanationListeners)listener(stage,false)
 return true
}
export function subscribeTutorialExplanations(listener:(stage:number, afterObjective:boolean)=>void) { explanationListeners.add(listener) }
export function syncTutorial(value: number, met = true, seen = value>0) {
 introSeen=seen
 const next = Math.max(0, Math.min(TUTORIAL_DONE, value))
 const enteringIntro = next === 0 && stage !== 0
 if (enteringIntro) { controlsOpen=false; elapsed = 0; started = false; finishing = false; preparing = false; arrivalReady = false; settleTime = 0; phase = 'title'; menuInputLocked=false; phaseTime = 0; speechElapsed = 0; skippedSpeech = false }
 // A skipped tutorial jumps straight to the end without Pandora's explanations.
 const explain = !skipping && stage !== -1 && next > 0 && ((next > stage && next >= 2) || (next === 1 && met && !guideMet))
 if (next >= TUTORIAL_DONE) skipping = false
 stage = next; guideMet = met
 if (explain) {
  if(explanationListeners.size)for(const listener of explanationListeners)listener(next,true)
  else setVillageGuideOpen(true)
 }
 if (next === 0) setVillageGuideOpen(false)
 if(phase==='title')playGameMusic()
}
let skipping = false
export function canSkipTutorial() { return stage >= 1 && stage < TUTORIAL_DONE && !isIntroActive() }
// Explorers still in the tutorial (or not yet known) play apart from the village's level-ups.
export function isInTutorial() { return stage < TUTORIAL_DONE }
export async function skipTutorial() {
 if (!canSkipTutorial()) return
 skipping = true
 try { await room.send('skipTutorialRequest', { ready: true }) } catch (error) { skipping = false; throw error }
}
export async function restartIntro() {
 if (isIntroActive()) return
 await room.send('restartIntroRequest', { ready: true })
}
// Cue timing across the supplied 36-second narration.
export const INTRO_SUBTITLES = [
 { start: 0, end: 3, text: 'This is Pangea.' },
 { start: 5, end: 8, text: 'The Ancients built an extraordinary world…' },
 { start: 8, end: 10, text: 'and lost everything.' },
 { start: 10, end: 13, text: 'Now…' },
 { start: 13, end: 18, text: 'among their ruins, something is still awake.' },
 { start: 18, end: 21.5, text: 'I am one of their last agents.' },
 { start: 21.5, end: 23, text: 'Come closer,' },
 { start: 23, end: 26, text: 'explorer.' },
 { start: 26, end: 36, text: 'Novaterra begins with you.' }
] as const
export function getIntroCaption() {
 if (stage < 0) return 'Connecting to Pangea...'
 if (!started) return 'Loading Novaterra...'
 if (phase === 'wayfinding') return 'GO TO THE CENTRAL TREE'
 if (phase !== 'cinematic') return ''
 return INTRO_SUBTITLES.find(cue => elapsed >= cue.start && elapsed < cue.end)?.text ?? ''
}
const lerp = (a: {x:number;y:number;z:number}, b: {x:number;y:number;z:number}, t:number) => Vector3.create(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,a.z+(b.z-a.z)*t)
export async function finishIntro(skip = true) {
 if (stage !== 0 || phase !== 'cinematic') return
 InputModifier.createOrReplace(engine.PlayerEntity,{mode:InputModifier.Mode.Standard({disableAll:true})})
 if(skip){stopIntroNarration();skippedSpeech=true}
 phase = 'fade'; phaseTime = 0
}
// Under the black cover, put the avatar and the native camera where play begins, so the last cinematic frame can match them.
function beginWayfinding(){
 MainCamera.createOrReplace(engine.CameraEntity,{})
 InputModifier.createOrReplace(engine.PlayerEntity,{mode:InputModifier.Mode.Standard({disableAll:true})})
 phase='settling';phaseTime=0;placementDone=false;stillFrames=0;lastPose=undefined
 void movePlayerTo({newRelativePosition:ARRIVAL_POINT,cameraTarget:GUIDE,avatarTarget:GUIDE}).then(()=>{placementDone=true}).catch(error=>{placementDone=true;console.error('[Pandora] Start placement failed:',error)})
}
function startWayfinding(){
 if(camera===undefined){camera=engine.addEntity();Transform.create(camera,{position:{...handoffPosition}})}
 // An instant transition: the shot is cut in under the cover and handed back on an identical pose.
 VirtualCamera.createOrReplace(camera,{defaultTransition:{transitionMode:{$case:'time',time:0}}})
 MainCamera.createOrReplace(engine.CameraEntity,{virtualCameraEntity:camera})
 phase='wayfinding';phaseTime=0;started=true;playGameMusic()
}
export async function startIntroGame() {
 if(phase!=='title'||controlsOpen||stage<0)return
 controlsOpen=false
 if(!introSeen&&stage===0){
  // A first visit plays the existing narrated cinematic after choosing Start Game.
  phase='cinematic';phaseTime=0;elapsed=0;started=false;finishing=false
  preparing=false;arrivalReady=false;settleTime=0;speechElapsed=0;skippedSpeech=false
  stopGameMusic();return
 }
 // Returning explorers keep their saved tutorial stage and enter the native camera directly.
 phase='starting';finishing=true
 try{
  await room.send('introCompleteRequest',{ready:true})
  MainCamera.createOrReplace(engine.CameraEntity,{})
  if(camera!==undefined)engine.removeEntity(camera)
  if(focus!==undefined)engine.removeEntity(focus)
  camera=focus=undefined;phase='done';phaseTime=0;started=true;menuInputLocked=false
  InputModifier.deleteFrom(engine.PlayerEntity);playGameMusic()
 }catch(error){finishing=false;phase='title';console.error('[Pandora] Start game failed:',error)}
}
export function setupTutorialIntro() {
 engine.addSystem(dt => {
  if(started && (phase==='cinematic' || phase==='fade'))speechElapsed+=Math.max(0,dt)
  if (!isIntroActive() && isGoingToGuide()) {
   nextGuideCheck -= dt
   const player = Transform.getOrNull(engine.PlayerEntity)?.position
   if (nextGuideCheck <= 0 && player && Math.hypot(player.x-GUIDE.x,player.z-GUIDE.z) <= 5.5) {
    nextGuideCheck = 1
    void room.send('guideArrivalRequest',{ready:true}).catch(error=>console.error('[Pandora] Guide arrival failed:',error))
   }
  }
  if (handoffWatch >= 0) {
   handoffWatch += Math.max(0,dt)
   const checks=[.05,.5,1.5],native=Transform.getOrNull(engine.CameraEntity),avatar=Transform.getOrNull(engine.PlayerEntity)
   if (native?.position && native.rotation && handoffWatch >= checks[handoffReported]) {
    const angle=2*Math.acos(Math.min(1,Math.abs(Quaternion.dot(native.rotation,handoffRotation))))*180/Math.PI
    console.log('[Pandora] Camera handoff +'+checks[handoffReported]+'s: offset '+Vector3.distance(native.position,handoffPosition).toFixed(3)+' m, turn '+angle.toFixed(1)+' deg, last frame '+JSON.stringify(handoffPosition)+', native '+JSON.stringify(native.position)+', avatar '+JSON.stringify(avatar?.position))
    if (++handoffReported >= checks.length) handoffWatch = -1
   }
  }
  if (phase === 'settling') {
   phaseTime += Math.max(0,Math.min(dt,0.1))
   const native=Transform.getOrNull(engine.CameraEntity)
   if (!placementDone || !native?.position || !native.rotation) { if (phaseTime >= 4) startWayfinding(); return }
   // Record the pose only once Explorer's own camera has stopped easing.
   const pose={position:Vector3.create(native.position.x,native.position.y,native.position.z),rotation:{...native.rotation}}
   const still=lastPose!==undefined&&Vector3.distance(lastPose.position,pose.position)<.002&&Math.abs(Quaternion.dot(lastPose.rotation,pose.rotation))>.99999
   stillFrames=still?stillFrames+1:0;lastPose=pose
   if (stillFrames >= 4 || phaseTime >= 4) { recordHandoff(pose.position,pose.rotation);startWayfinding() }
   return
  }
  if (phase === 'wayfinding') {
   phaseTime += Math.max(0,Math.min(dt,0.1))
   const from=Vector3.create(ARRIVAL_POINT.x+6,13.8,ARRIVAL_POINT.z+6)
   const destination=Vector3.create(GUIDE.x+6,12,GUIDE.z+19)
   const target=Vector3.create(GUIDE.x,5,GUIDE.z)
   let position=lerp(from,destination,ease(phaseTime/2))
   let rotation=Quaternion.lookRotation(Vector3.create(target.x-position.x,target.y-position.y,target.z-position.z))
   if(phaseTime>3.2){
    const t=ease((phaseTime-3.2)/3.3)
    position=lerp(destination,handoffPosition,t)
    const facing=Quaternion.lookRotation(Vector3.create(target.x-destination.x,target.y-destination.y,target.z-destination.z))
    rotation=Quaternion.slerp(facing,handoffRotation,t)
   }
   if(camera!==undefined){const transform=Transform.getMutable(camera);transform.position=position;transform.rotation=rotation}
   if(phaseTime>=6.5 && stage>=1){
    // The screen is fully black here: hand back the camera and the controls together, since the Explorer
    // repositions its camera when input returns; the black holds 0.3 s so that reset is never seen.
    MainCamera.createOrReplace(engine.CameraEntity,{})
    if(camera!==undefined)engine.removeEntity(camera)
    if(focus!==undefined)engine.removeEntity(focus)
    camera=focus=undefined
    phase='reveal';phaseTime=0;handoffWatch=0;handoffReported=0;InputModifier.deleteFrom(engine.PlayerEntity)
   }
   return
  }
  if (phase === 'reveal') {
   phaseTime += Math.max(0,Math.min(dt,0.1))
   if (phaseTime >= .65) { phase='done';phaseTime=0 }
   return
  }
  if (phase === 'fade') {
   phaseTime += dt
   if(!finishing&&phaseTime>=1.2&&(skippedSpeech||speechElapsed>=SPEECH_SECONDS+.25)){
    finishing=true;phase='completing'
    void room.send('introCompleteRequest',{ready:true}).then(beginWayfinding).catch(error=>{finishing=false;phase='fade';console.error('[Pandora] Intro completion failed:',error)})
   }
   return
  }
  if(phase==='completing')return
  if (phase === 'title') {
   if(!menuInputLocked&&Transform.getOrNull(engine.PlayerEntity)){InputModifier.createOrReplace(engine.PlayerEntity,{mode:InputModifier.Mode.Standard({disableAll:true})});menuInputLocked=true}
   if (inputSystem.isTriggered(InputAction.IA_PRIMARY, PointerEventType.PET_DOWN)) void startIntroGame()
   return
  }
  if (stage !== 0 || finishing) return
  if (!started) {
   if (!Transform.getOrNull(engine.PlayerEntity) || introAssets.some(entity => GltfContainerLoadingState.getOrNull(entity)?.currentState !== LoadingState.FINISHED)) return
   if (!preparing) {
    preparing = true
    InputModifier.createOrReplace(engine.PlayerEntity,{mode:InputModifier.Mode.Standard({disableAll:true})})
    void movePlayerTo({newRelativePosition:ARRIVAL_POINT, cameraTarget:GUIDE, avatarTarget:GUIDE}).then(() => { arrivalReady = true }).catch(error=>{ preparing = false; console.error('[Pandora] Arrival move failed:',error) })
    return
   }
   if (!arrivalReady) return
   // Let Explorer settle its own spawn camera before recording the exact handoff pose.
   settleTime += dt
   if (settleTime < 0.5) return
   const nativeCamera = Transform.getOrNull(engine.CameraEntity)
   if (nativeCamera?.position && nativeCamera.rotation) recordHandoff(nativeCamera.position, nativeCamera.rotation)
   started = true
   playIntroNarration()
   focus = engine.addEntity(); Transform.create(focus,{position:{...GUIDE}})
   // The shot sets its own rotation every frame instead of a look-at target, and the virtual camera is created once:
   // mobile Explorers do not follow lookAtEntity reliably, and replacing the component restarts its transition.
   camera = engine.addEntity(); Transform.create(camera,{position:Vector3.create(GUIDE.x,GUIDE.y+0.25,GUIDE.z+3.5),rotation:Quaternion.lookRotation(Vector3.create(0,GUIDE.y-(GUIDE.y+0.25),-3.5))})
   VirtualCamera.create(camera,{defaultTransition:{transitionMode:{$case:'time',time:0}}})
   MainCamera.createOrReplace(engine.CameraEntity,{virtualCameraEntity:camera})
  }
  elapsed += Math.max(0,Math.min(dt,0.1))
  if (camera === undefined || focus === undefined) return
  const orbitEnd=Vector3.create(GUIDE.x,18.8,GUIDE.z+24)
  const panoramaEnd=Vector3.create(ARRIVAL_POINT.x+8,24.8,ARRIVAL_POINT.z+10)
  const panoramaTarget=Vector3.create(ARRIVAL_POINT.x,4.2,ARRIVAL_POINT.z)
  let position=Vector3.create(GUIDE.x,GUIDE.y+0.25,GUIDE.z+3.5), target={...GUIDE}
  if (elapsed > 4 && elapsed <= 18) {
   const t=ease((elapsed-4)/14), angle=t*Math.PI*2, radius=3.5+20.5*t
   position=Vector3.create(GUIDE.x+Math.sin(angle)*radius,GUIDE.y+0.25+(18.8-GUIDE.y-0.25)*t,GUIDE.z+Math.cos(angle)*radius)
  } else if (elapsed > 18 && elapsed <= 28) {
   const t=ease((elapsed-18)/10)
   position=lerp(orbitEnd,panoramaEnd,t)
   target=lerp(GUIDE,panoramaTarget,t)
  } else if (elapsed > 28) {
   const t=ease((elapsed-28)/5)
   position=lerp(panoramaEnd,handoffPosition,t)
   target=panoramaTarget
  }
  const transform=Transform.getMutable(camera)
  transform.position=position
  if (elapsed <= 28) transform.rotation=Quaternion.lookRotation(Vector3.create(target.x-position.x,target.y-position.y,target.z-position.z))
  else {
   // Interpolate orientation, not a moving look-at point: that point can cross
   // the camera near arrival and cause a sudden 180-degree turn.
   const direction=Vector3.create(panoramaTarget.x-panoramaEnd.x,panoramaTarget.y-panoramaEnd.y,panoramaTarget.z-panoramaEnd.z)
   transform.rotation=Quaternion.slerp(Quaternion.lookRotation(direction),handoffRotation,ease((elapsed-28)/5))
  }
  Transform.getMutable(focus).position=target
  if (elapsed >= TOTAL) void finishIntro(false)
 },undefined,'pandora-tutorial-intro')
}
