import { Animator, ColliderLayer, engine, Entity, GltfContainer, MeshCollider, Transform } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'
import { createAgentHalo } from './agentIdentity'
import { BOUNDARY_DIALOGUE, boundaryContact, boundaryWalls, SCENE_LIMITS } from './shared/sceneBoundary'
import { isIntroActive } from './tutorial'
import { isCinematicLocked } from './cinematicLock'
import { isPlayerDown } from './playerDeath'
import { playInteractionSound } from './audio'
let elapsed=0,active=false
export function getBoundaryDialogue(){return {active:active&&elapsed<9.1,text:BOUNDARY_DIALOGUE,alpha:active?Math.min(1,elapsed/.25,Math.max(0,(9.1-elapsed)/.4)):0}}
export function setupSceneBoundary(){
 for(const wall of boundaryWalls()){const entity=engine.addEntity();Transform.create(entity,wall);MeshCollider.setBox(entity,ColliderLayer.CL_PHYSICS)}
 // The projection only exists while it is on screen: hidden models still count towards the triangle budget.
 // It uses Pandora's own model, which the guide already keeps loaded, so it appears without a loading delay.
 let projection:Entity|undefined,halo:Entity|undefined
 const spawn=(position:Vector3)=>{
  despawn()
  projection=engine.addEntity();Transform.create(projection,{position,scale:Vector3.create(.9,.9,.9)})
  GltfContainer.create(projection,{src:'assets/scene/modelos/Agentes/Sentinel_Core_anim.glb',visibleMeshesCollisionMask:0,invisibleMeshesCollisionMask:0})
  halo=createAgentHalo(projection,true)
 }
 const despawn=()=>{if(halo!==undefined)engine.removeEntity(halo);if(projection!==undefined)engine.removeEntity(projection);projection=halo=undefined}
 let cooldown=0,wasNear=false,clip=''
 const play=(name:string)=>{if(clip===name||projection===undefined)return;clip=name;Animator.createOrReplace(projection,{states:[{clip:name,playing:true,loop:name==='Idle',shouldReset:name!=='Disappear'}]})}
 engine.addSystem(dt=>{
  const seconds=Math.max(0,dt);cooldown=Math.max(0,cooldown-seconds)
  const player=Transform.getOrNull(engine.PlayerEntity)?.position
  if(!player)return
  if(isIntroActive()||isCinematicLocked()||isPlayerDown()){active=false;elapsed=0;wasNear=false;despawn();return}
  const edge=boundaryContact(player)
  if(edge&&!wasNear&&cooldown===0){
   active=true;elapsed=0;cooldown=15;clip=''
   spawn(Vector3.create(Math.max(SCENE_LIMITS.minX-.8,Math.min(SCENE_LIMITS.maxX+.8,player.x+edge.x*1.2)),player.y+1.6,Math.max(SCENE_LIMITS.minZ-.8,Math.min(SCENE_LIMITS.maxZ+.8,player.z+edge.z*1.2))))
   play('Appear');playInteractionSound()
  }
  wasNear=!!edge
  if(!active||projection===undefined)return
  elapsed+=seconds
  const t=Transform.getMutable(projection);t.rotation=Quaternion.lookRotation(Vector3.subtract(Vector3.create(player.x,t.position.y,player.z),t.position))
  if(elapsed>=10){active=false;despawn()}
  else if(elapsed>=9.1)play('Disappear')
  else if(elapsed>=2.4)play('Idle')
  else if(elapsed>=.9)play('Greet')
 },undefined,'pandora-scene-boundary')
}
