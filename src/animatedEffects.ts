import { treeStageForLevel } from './shared/visualRules'
import { Animator, engine, Entity, GltfContainer, Transform } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'
import { getPlayer, getVillage, subscribePlayerSnapshots } from './gameState'
import { nearHealingTree, treeRootForLevel } from './shared/recovery'
import { isPlayerDown } from './playerDeath'
import { playActionSound } from './audio'
import { BirdLoop, createBirdLoop, updateBirdLoop } from './birdLoop'

let recoveryMessage=''
export function getRecoveryMessage(){return recoveryMessage}
export function setupAnimatedEffects() {
 const ambient:{entity:Entity;scale:number;speed:number;clip:string;leaves:boolean;active:boolean;held?:boolean}[]=[]
 const create=(asset:string,clip:string,position:Vector3,scale:number,speed=1,rotation=0,leaves=false)=>{
  const entity=engine.addEntity();Transform.create(entity,{position,scale:Vector3.create(scale,scale,scale),rotation:Quaternion.fromEulerDegrees(0,rotation,0)})
  GltfContainer.create(entity,{src:'assets/scene/modelos/fx/'+asset+'.glb',visibleMeshesCollisionMask:0,invisibleMeshesCollisionMask:0})
  Animator.create(entity,{states:[{clip,playing:true,loop:true,speed,shouldReset:false}]})
  ambient.push({entity,scale,speed,clip,leaves,active:true})
 }
 // Each flock keeps circling in the sky; below it three Turquoise Tweet birds go round their own loop on a flat patch of
 // ground (fly a lap, land, peck, take off again), never disappearing.
 const groundBirds:BirdLoop[]=[]
 // The last entry holds each ground bird's own ground height (from the terrain), so none floats or sinks while pecking.
 for(const [x,y,z,scale,speed,angle,gx,gy,gz,heights] of [[65,22,65,.8,.8,10,65,.82,65,[.82,1.06,.88]],[108,28,65,1.3,1.15,95,110,1.09,63.5,[1.09,1.04,1.07]],[62,25,112,1.1,.95,205,62,1.24,112,[1.24,1.27,1.24]],[112,20,113,.9,1.05,285,112,1.25,113,[1.25,1.06,1.22]],[42,24,75,1.1,.92,140,42,1.77,75,[1.77,1.84,1.7]],[120,23,90,1.8,.72,15,120,1.54,90,[1.54,1.69,1.46]],[81,32,116,2.2,.68,210,81,1.14,116,[1.14,1.17,1.3]],[77,20,49,.7,1.25,300,77,1.68,49,[1.68,1.74,1.51]],[45,28,114,1.2,1.05,45,45,1.05,114,[1.05,1.02,1]]] as [number,number,number,number,number,number,number,number,number,number[]][]){
  create('Bird_Flock','Fly',Vector3.create(x,y,z),scale,speed,angle)
  ;[[0,0],[.8,.3],[-.6,.7]].forEach(([dx,dz],index)=>groundBirds.push(createBirdLoop(Vector3.create(gx+dx,heights[index],gz+dz),angle+index*110,x*31+z*17+index*7919,5+index,3.5+index*.6)))
 }
 for(const [x,z] of [[80,78],[88,86],[74,90],[83,111],[52,65],[113,64],[115,111],[47,111]])create('Ambient_Motes','Drift',Vector3.create(x,1,z),1,.85+ambient.length*.015)
 const root=treeRootForLevel(getVillage().level)
 create('Falling_Leaves','Fall',Vector3.create(root.x,root.y,root.z),1,1,0,true)
 const playerFx=(asset:string,clip:string)=>{
  const entity=engine.addEntity();Transform.create(entity,{parent:engine.PlayerEntity,position:Vector3.create(0,-0.9,0),scale:Vector3.Zero()})
  GltfContainer.create(entity,{src:'assets/scene/modelos/fx/'+asset+'.glb',visibleMeshesCollisionMask:0,invisibleMeshesCollisionMask:0})
  Animator.create(entity,{states:[{clip,playing:false,loop:clip==='Heal',shouldReset:false}]});return entity
 }
 const heal=playerFx('Heal_Rings','Heal'),levelUp=playerFx('LevelUp_Rings','Burst')
 let burstLeft=0,healing=false,lastSnapshotAt=0,wasFull=false,fullPulse=0
 subscribePlayerSnapshots(({previousLevel,level})=>{
  lastSnapshotAt=Date.now()
  if(previousLevel!==null&&level>previousLevel&&!isPlayerDown()){
   Transform.getMutable(levelUp).scale=Vector3.create(1,1,1)
   Animator.createOrReplace(levelUp,{states:[{clip:'Burst',playing:true,loop:false,shouldReset:true}]});burstLeft=2.2;playActionSound('levelUp')
  }
 })
 engine.addSystem(dt=>{
  const position=Transform.getOrNull(engine.PlayerEntity)?.position
  for(const bird of groundBirds)updateBirdLoop(bird,dt,!!position&&Math.hypot(position.x-bird.spot.x,position.z-bird.spot.z)<6)
  for(const effect of ambient){
   if(effect.held)continue
   const transform=Transform.getMutable(effect.entity)
   const active=!!position&&Vector3.distance(position,transform.position)<=60
   if(effect.active!==active){Animator.getMutable(effect.entity).states[0].playing=active;effect.active=active}
   const scale=effect.leaves?[1,1.2,1.35,1.5][treeStageForLevel(getVillage().level)]:effect.scale
   if(effect.leaves){const root=treeRootForLevel(getVillage().level);transform.position=Vector3.create(root.x,root.y,root.z)}
   transform.scale=active?Vector3.create(scale,scale,scale):Vector3.Zero()
  }
  const player=getPlayer(),active=player.healingActive===true&&player.health<player.maxHealth&&!isPlayerDown()&&Date.now()-lastSnapshotAt<2000
  if(active!==healing){
   healing=active;if(active)fullPulse=0;Transform.getMutable(heal).scale=active?Vector3.create(1,1,1):Vector3.Zero()
   Animator.createOrReplace(heal,{states:[{clip:'Heal',playing:active,loop:true,shouldReset:active}]})
  }
  const full=!!position&&nearHealingTree(position,getVillage().level)&&player.health>=player.maxHealth&&!isPlayerDown()
  if(full&&!wasFull){
   fullPulse=1.2;Transform.getMutable(heal).scale=Vector3.create(1.25,1.25,1.25)
   Animator.createOrReplace(heal,{states:[{clip:'Heal',playing:true,loop:false,shouldReset:true,speed:1.7}]})
  }
  wasFull=full
  if(isPlayerDown()&&fullPulse>0){fullPulse=0;Transform.getMutable(heal).scale=Vector3.Zero();Animator.getMutable(heal).states[0].playing=false}
  if(fullPulse>0){fullPulse=Math.max(0,fullPulse-dt);if(!fullPulse){Transform.getMutable(heal).scale=Vector3.Zero();Animator.getMutable(heal).states[0].playing=false}}
  recoveryMessage=fullPulse>0?'HEALTH FULL':active?'RECOVERING HEALTH':''
  if(burstLeft>0){burstLeft=Math.max(0,burstLeft-dt);if(!burstLeft||isPlayerDown()){burstLeft=0;Transform.getMutable(levelUp).scale=Vector3.Zero();Animator.getMutable(levelUp).states[0].playing=false}}
 },undefined,'pandora-animated-effects')
}
