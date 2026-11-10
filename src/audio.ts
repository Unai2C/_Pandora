import { ACTION_SOUNDS, ActionSound } from './shared/actionSounds'
import { MUSIC_TRACKS, CELEBRATION_TRACK } from './shared/musicTracks'
import { AudioSource, Entity, Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

function createVoice() {
  const entity = engine.addEntity()
  Transform.create(entity, { parent: engine.PlayerEntity, position: Vector3.Zero() })
  return entity
}

export function setupPandoraAudio() { setupMusicSystem() }

// A source starts from the top with currentTime 0, but that field must not stay on the component: every later update
// (volume fades) resends the whole component, and a client that applies currentTime on each update (mobile) restarts
// the clip dozens of times a second, which is heard as noise. It is removed one frame after the start, and volumes
// are only written when they actually change.
const startedThisFrame = new Set<Entity>()
function start(entity: Entity, value: { audioClipUrl: string; loop: boolean; volume: number }) {
 AudioSource.createOrReplace(entity, { ...value, playing: true, currentTime: 0, global: true })
 startedThisFrame.add(entity)
}
function settleStarts() {
 for (const entity of startedThisFrame) { const source = AudioSource.getMutableOrNull(entity); if (source) delete source.currentTime }
 startedThisFrame.clear()
}
function setVolume(entity: Entity, volume: number) {
 const source = AudioSource.getOrNull(entity)
 if (source && Math.abs((source.volume ?? 1) - volume) > .005) AudioSource.getMutable(entity).volume = volume
}

export function playInteractionSound() { playActionSound('click') }

let narrationVoice: Entity | undefined
export function playIntroNarration() {
 stopGameMusic()
 stopCelebration()
 if (narrationVoice === undefined) narrationVoice = createVoice()
 start(narrationVoice,{audioClipUrl:'assets/sounds/Novaterra Begins.mp3',loop:false,volume:0.9})
}
export function stopIntroNarration() {
 if (narrationVoice !== undefined) AudioSource.createOrReplace(narrationVoice,{audioClipUrl:'assets/sounds/Novaterra Begins.mp3',playing:false,loop:false,volume:0.9,global:true})
}

const MUSIC_VOLUME = 0.38, CROSSFADE = 1.5
let musicSystemReady=false, musicVoices: Entity[] = [], musicRequested=false
let musicIndex=0, musicElapsed=0, activeMusicVoice=0, crossfade=-1, fadeIn=0
let celebrationVoice:Entity|undefined, celebrationLeft=0, musicDuck=1
let celebrationFade=-1
function musicSource(entity:Entity,index:number,volume:number) {
 start(entity,{audioClipUrl:MUSIC_TRACKS[index].src,loop:false,volume})
}
export function playGameMusic() {
 setupPandoraAudio()
 if(musicRequested)return
 if(!musicVoices.length)musicVoices=[createVoice(),createVoice()]
 musicRequested=true;musicIndex=0;musicElapsed=0;activeMusicVoice=0;crossfade=-1;fadeIn=0
 musicSource(musicVoices[0],0,0)
}
export function stopGameMusic() {
 musicRequested=false;crossfade=-1
 for(const voice of musicVoices){const source=AudioSource.getMutableOrNull(voice);if(source)source.playing=false}
}
export function playTreeCelebration() {
 setupPandoraAudio()
 if(celebrationVoice===undefined)celebrationVoice=createVoice()
 start(celebrationVoice,{audioClipUrl:CELEBRATION_TRACK.src,loop:false,volume:0.8})
 celebrationLeft=CELEBRATION_TRACK.seconds;celebrationFade=-1
}
export function fadeTreeCelebration(seconds=2) { celebrationFade=Math.max(.1,seconds);celebrationLeft=Math.min(celebrationLeft,celebrationFade) }
function stopCelebration() {
 if(celebrationVoice!==undefined){const source=AudioSource.getMutableOrNull(celebrationVoice);if(source)source.playing=false}
 celebrationLeft=0
}
function setupMusicSystem() {
 if(musicSystemReady)return
 musicSystemReady=true
 engine.addSystem(dt=>{
  updateActionSounds(dt)
  // Starts from earlier frames have reached the client: drop their currentTime before anything else is written.
  settleStarts()
  const wasCelebrating=celebrationLeft>0
  celebrationLeft=Math.max(0,celebrationLeft-Math.max(0,dt))
  if(celebrationFade>0&&celebrationVoice!==undefined)setVolume(celebrationVoice,.8*Math.min(1,celebrationLeft/celebrationFade))
  if(wasCelebrating&&celebrationLeft===0&&celebrationVoice!==undefined)AudioSource.getMutable(celebrationVoice).playing=false
  if(!musicRequested)return
  const seconds=Math.max(0,dt)
  musicElapsed+=seconds;fadeIn=Math.min(1,fadeIn+seconds/0.8)
  const duckTarget=celebrationLeft>0?0.12:1
  musicDuck+=(duckTarget-musicDuck)*Math.min(1,seconds*(duckTarget<musicDuck?5:1.5))
  const volume=MUSIC_VOLUME*fadeIn*musicDuck
  const activeVoice=musicVoices[activeMusicVoice]
  let startedCrossfade=false
  if(crossfade<0&&musicElapsed>=MUSIC_TRACKS[musicIndex].seconds-CROSSFADE){
   crossfade=0;startedCrossfade=true
   musicSource(musicVoices[1-activeMusicVoice],(musicIndex+1)%MUSIC_TRACKS.length,0)
  }
  if(crossfade>=0){
   if(!startedCrossfade)crossfade+=seconds
   const t=Math.min(1,crossfade/CROSSFADE)
   setVolume(activeVoice,volume*(1-t))
   setVolume(musicVoices[1-activeMusicVoice],volume*t)
   if(t>=1){AudioSource.getMutable(activeVoice).playing=false;activeMusicVoice=1-activeMusicVoice;musicIndex=(musicIndex+1)%MUSIC_TRACKS.length;musicElapsed=crossfade;crossfade=-1}
  }else setVolume(activeVoice,volume)
 },undefined,'pandora-music-playlist')
}

let deliveryVoice:Entity|undefined
const actionVoices:Entity[]=[]
const actionTimers=new Map<Entity,{left:number;volume:number}>()
const lastVariant=new Map<ActionSound,number>()
let actionCursor=0
export function playActionSound(kind:ActionSound) {
 setupPandoraAudio()
 const config=ACTION_SOUNDS[kind]
 if(kind==='delivery'){
  if(deliveryVoice===undefined)deliveryVoice=createVoice()
  start(deliveryVoice,{audioClipUrl:config.clips[0],loop:false,volume:config.volume})
  actionTimers.set(deliveryVoice,{left:config.seconds,volume:config.volume});return
 }
 let index=Math.floor(Math.random()*config.clips.length)
 if(config.clips.length>1&&index===lastVariant.get(kind))index=(index+1)%config.clips.length
 lastVariant.set(kind,index)
 if(actionVoices.length<8)actionVoices.push(createVoice())
 const voice=actionVoices[actionCursor%actionVoices.length];actionCursor++
 start(voice,{audioClipUrl:config.clips[index],loop:false,volume:config.volume})
 actionTimers.set(voice,{left:config.seconds,volume:config.volume})
}
function updateActionSounds(dt:number) {
 for(const [voice,event]of actionTimers){
  event.left-=Math.max(0,dt)
  if(event.left<=0){AudioSource.getMutable(voice).playing=false;actionTimers.delete(voice)}
  else setVolume(voice,event.volume*Math.min(1,event.left/(voice===deliveryVoice ? .65 : .12)))
 }
}
