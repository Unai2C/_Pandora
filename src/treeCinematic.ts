import { treePlacementForLevel } from './shared/treeGrowth'
import { showVillageMilestone, advanceVillageMilestone } from './villageMilestone'
import { Animator, ColliderLayer, engine, Entity, GltfContainer, GltfContainerLoadingState, GltfNodeModifiers, InputModifier, LightSource, LoadingState, MainCamera, Material, MaterialTransparencyMode, Transform, VirtualCamera, VisibilityComponent } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'
import { showLocalMessage, getVillage, hasVillageSnapshot, subscribeVillageSnapshots } from './gameState'
import { TREE_STAGES } from './shared/worldLayout'
import { treeRootForLevel } from './shared/recovery'
import { treeStageForLevel, villageLevelEffect } from './shared/visualRules'
import { isIntroActive, isInTutorial } from './tutorial'
import { isPlayerDown } from './playerDeath'
import { fadeTreeCelebration, playActionSound, playTreeCelebration } from './audio'
import { isCinematicLocked, setCinematicLocked } from './cinematicLock'

const smooth = (v:number) => { const t=Math.max(0,Math.min(1,v)); return t*t*(3-2*t) }
// The change is a cross-fade in light over seven seconds, both trees standing in place at full size: the old tree
// glows and turns transparent, the new one rises out of that light from transparent to opaque. Timings in seconds.
const OLD_FADE={start:.6,end:4.2},NEW_FADE={start:2.2,end:5.8},GLOW_PEAK=3.2
const GLOW={r:1,g:.9,b:.55}
// Each stage's own base colour (copied out by scripts/tree-fade-textures.cjs) keeps the tree recognisable while it fades.
const fadeModifier=(stage:number,alpha:number,glow:number)=>({modifiers:[{path:`Armature/Tree_0${stage+1}`,castShadows:alpha>.5,material:{material:{$case:'pbr' as const,pbr:{
 texture:Material.Texture.Common({src:`assets/scene/modelos/arbol-central/fade/Tree_0${stage+1}_base.jpg`}),
 albedoColor:{r:1,g:1,b:1,a:alpha},emissiveColor:GLOW,emissiveIntensity:2.5*glow,transparencyMode:MaterialTransparencyMode.MTM_ALPHA_BLEND
}}}}]})
const mix = (a:Vector3,b:Vector3,t:number) => Vector3.create(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,a.z+(b.z-a.z)*t)
export function setupCentralTree() {
 let tree=engine.addEntity(), phase='idle', timer=0, transition:Entity|undefined, incoming:Entity|undefined, camera:Entity|undefined
 let previous0=1,previousStage=0,sharedStart=0,playbackSpan=7,raysStarted=false,light:Entity|undefined
 let source='', desiredLevel=getVillage().level, hasSnapshot=hasVillageSnapshot(), targetStage=0
 let nativePosition=Vector3.Zero(), nativeRotation=Quaternion.Identity(), returnPosition=Vector3.Zero(), returnRotation=Quaternion.Identity()
 const stageFor=treeStageForLevel
 const showTree=(entity:Entity,index:number,level:number) => {
  GltfContainer.createOrReplace(entity,{src:TREE_STAGES[index].src,visibleMeshesCollisionMask:0,invisibleMeshesCollisionMask:ColliderLayer.CL_PHYSICS})
  Transform.createOrReplace(entity,treePlacementForLevel(level))
  VisibilityComponent.createOrReplace(entity,{visible:true})
  Animator.createOrReplace(entity,{states:[{clip:'Wind',playing:true,loop:true,shouldReset:false}]})
 }
 const apply=()=>{targetStage=Math.max(0,stageFor(desiredLevel));const nextSource=TREE_STAGES[targetStage].src;source=nextSource;showTree(tree,targetStage,desiredLevel)}
 apply()
 const burst=engine.addEntity()
 Transform.create(burst,{position:treeRootForLevel(desiredLevel),scale:Vector3.Zero()})
 GltfContainer.create(burst,{src:'assets/scene/modelos/fx/Tree_Transform_Rays.glb',visibleMeshesCollisionMask:0,invisibleMeshesCollisionMask:0})
 Animator.create(burst,{states:[{clip:'Burst',playing:false,loop:false}]})
 let burstLeft=0
 const clean=(restore=true)=>{
  const ownedInput=camera!==undefined
  if(transition!==undefined)engine.removeEntity(transition)
  if(incoming!==undefined)engine.removeEntity(incoming)
  if(light!==undefined)engine.removeEntity(light);light=undefined
  if(camera!==undefined){MainCamera.createOrReplace(engine.CameraEntity,{});engine.removeEntity(camera)}
  transition=incoming=camera=undefined
  if(ownedInput&&restore&&!isPlayerDown()&&!isIntroActive())InputModifier.deleteFrom(engine.PlayerEntity)
  if(ownedInput)setCinematicLocked(false);phase='idle';timer=0
 }
 const begin=(level:number,previous:number|null,start=0)=>{
  sharedStart=start
  if(previous===level)return
  previous0=previous??level
  desiredLevel=level
  if(phase!=='idle'){clean();apply();return}
  const effect=villageLevelEffect(previous,level)
  const index=Math.max(0,stageFor(level))
  if(effect==='none'||(start>0&&Date.now()>=start+7000)){apply();return}
  if(effect==='burst'){
   apply();Transform.getMutable(burst).position=treeRootForLevel(level);Transform.getMutable(burst).scale=Vector3.create(6,6,6)
   Animator.createOrReplace(burst,{states:[{clip:'Burst',playing:true,loop:false,shouldReset:true}]});burstLeft=2.2;playActionSound('levelUp');return
  }
  targetStage=index
  previousStage=stageFor(previous??level)
  // A visual copy of the current tree fades out; the real one keeps its collider and stays hidden meanwhile.
  transition=engine.addEntity();Transform.create(transition,{...treePlacementForLevel(previous0),scale:Vector3.Zero()})
  GltfContainer.create(transition,{src:TREE_STAGES[previousStage].src,visibleMeshesCollisionMask:0,invisibleMeshesCollisionMask:0})
  Animator.create(transition,{states:[{clip:'Wind',playing:false,loop:true}]})
  incoming=engine.addEntity();Transform.create(incoming,{...treePlacementForLevel(level),scale:Vector3.Zero()})
  GltfContainer.create(incoming,{src:TREE_STAGES[index].src,visibleMeshesCollisionMask:0,invisibleMeshesCollisionMask:0})
  phase='loading';timer=0;raysStarted=false
 }
 // An explorer in the tutorial plays apart: the tree they arrived with stays as it is (a lower level, from a restart, still
 // applies at once) and the village's growth meanwhile is shown in one transformation when the tutorial ends.
 let heldLevel:number|undefined
 subscribeVillageSnapshots(({previousLevel,level,treeTransitionAt})=>{
  hasSnapshot=true
  if(previousLevel!==null&&isInTutorial()){
   if(level<(heldLevel??desiredLevel)){heldLevel=undefined;if(phase!=='idle')clean();desiredLevel=level;apply()}
   else if(level!==desiredLevel)heldLevel=level
   return
  }
  heldLevel=undefined;begin(level,previousLevel,treeTransitionAt)
 })
 engine.addSystem(dt=>{
  advanceVillageMilestone(dt)
  if(burstLeft>0){burstLeft=Math.max(0,burstLeft-dt);if(!burstLeft)Transform.getMutable(burst).scale=Vector3.Zero()}
  if(!hasSnapshot&&getVillage().level!==desiredLevel){desiredLevel=getVillage().level;apply()}
  if(heldLevel!==undefined&&!isInTutorial()&&!isIntroActive()&&!isCinematicLocked()){const level=heldLevel;heldLevel=undefined;begin(level,desiredLevel,0)}
  if(phase==='idle')return
  if(camera!==undefined&&(isPlayerDown()||isIntroActive())){clean(false);apply();return}
  timer+=Math.max(0,dt)
  if(phase==='loading'){
   const status=GltfContainerLoadingState.getOrNull(transition!)?.currentState
   if(status===LoadingState.NOT_FOUND||status===LoadingState.FINISHED_WITH_ERROR||timer>=5){clean();apply();return}
   if(status!==LoadingState.FINISHED||GltfContainerLoadingState.getOrNull(incoming!)?.currentState!==LoadingState.FINISHED)return
   if(sharedStart>0&&Date.now()<sharedStart)return
   playbackSpan=sharedStart>0?Math.max(0,(sharedStart+7000-Date.now())/1000):7
   if(playbackSpan<.2){clean();apply();return}
   const native=Transform.getOrNull(engine.CameraEntity)
   if(native){nativePosition={...native.position};nativeRotation={...native.rotation}}
   VisibilityComponent.createOrReplace(tree,{visible:false}) // Static Tree_collider remains active.
   Transform.getMutable(transition!).scale=treePlacementForLevel(previous0).scale
   Animator.createOrReplace(transition!,{states:[{clip:'Wind',playing:true,loop:true,shouldReset:false}]})
   Animator.createOrReplace(incoming!,{states:[{clip:'Wind',playing:true,loop:true,shouldReset:false}]})
   // A point light between both trunks carries the glow; it swells to the crossover and dies away.
   const from=treeRootForLevel(previous0),to=treeRootForLevel(desiredLevel)
   light=engine.addEntity();Transform.create(light,{position:Vector3.create((from.x+to.x)/2,(from.y+to.y)/2+4,(from.z+to.z)/2)})
   LightSource.create(light,{type:LightSource.Type.Point({}),color:GLOW,intensity:0,range:22,shadow:false})
   if(native&&!isPlayerDown()&&!isIntroActive()&&!isCinematicLocked()){
   const root=treeRootForLevel(desiredLevel)
   camera=engine.addEntity();Transform.create(camera,{position:{x:root.x,y:15.8,z:root.z+30}})
   VirtualCamera.create(camera,{defaultTransition:{transitionMode:{$case:'time',time:1.2}}})
   MainCamera.createOrReplace(engine.CameraEntity,{virtualCameraEntity:camera})
   InputModifier.createOrReplace(engine.PlayerEntity,{mode:InputModifier.Mode.Standard({disableAll:true})});setCinematicLocked(true)
   }
   playTreeCelebration();phase='playing';timer=0
  }
  if(phase==='playing'){
   const progress=timer/playbackSpan*7
   if(progress>=2.4&&!raysStarted){
    raysStarted=true;Transform.getMutable(burst).position=treeRootForLevel(desiredLevel);Transform.getMutable(burst).scale=Vector3.create(4,3,4)
    Animator.createOrReplace(burst,{states:[{clip:'Burst',playing:true,loop:false,shouldReset:true,speed:.65}]});burstLeft=3.4
   }
   const glow=Math.max(0,1-Math.abs(progress-GLOW_PEAK)/2.6)
   const oldAlpha=1-smooth((progress-OLD_FADE.start)/(OLD_FADE.end-OLD_FADE.start)),newAlpha=smooth((progress-NEW_FADE.start)/(NEW_FADE.end-NEW_FADE.start))
   // Until the fade starts the old copy keeps its own material; the new tree is invisible until its fade begins.
   if(progress>=OLD_FADE.start)GltfNodeModifiers.createOrReplace(transition!,fadeModifier(previousStage,oldAlpha,glow))
   Transform.getMutable(transition!).scale=oldAlpha>0?treePlacementForLevel(previous0).scale:Vector3.Zero()
   GltfNodeModifiers.createOrReplace(incoming!,fadeModifier(targetStage,newAlpha,glow))
   Transform.getMutable(incoming!).scale=newAlpha>0?treePlacementForLevel(desiredLevel).scale:Vector3.Zero()
   if(light!==undefined)LightSource.getMutable(light).intensity=24000*glow*glow
   const root=treeRootForLevel(desiredLevel),angle=Math.min(timer,7)*0.055,center=Vector3.create(root.x,9,root.z)
   const position=Vector3.create(center.x+Math.sin(angle)*30,18,center.z+Math.cos(angle)*30)
   const transform=camera!==undefined?Transform.getMutable(camera):undefined
   if(transform){transform.position=position;transform.rotation=Quaternion.lookRotation(Vector3.subtract(center,position))}
   if(timer>=playbackSpan){
    showTree(tree,targetStage,desiredLevel);engine.removeEntity(incoming!);incoming=undefined;source=TREE_STAGES[targetStage].src
    engine.removeEntity(transition!);transition=undefined
    if(light!==undefined)engine.removeEntity(light);light=undefined
    fadeTreeCelebration(2)
    showLocalMessage('NOVATERRA HAS REACHED LEVEL '+desiredLevel+'!')
    showVillageMilestone(desiredLevel)
    if(transform){returnPosition={...transform.position};returnRotation={...transform.rotation};phase='return';timer=0}else clean()
   }
  }else if(phase==='return'){
   const t=smooth(timer/.8),transform=Transform.getMutable(camera!)
   transform.position=mix(returnPosition,nativePosition,t);transform.rotation=Quaternion.slerp(returnRotation,nativeRotation,t)
   if(timer>=.8)clean()
  }
 },undefined,'pandora-tree-transition')
 return tree
}
