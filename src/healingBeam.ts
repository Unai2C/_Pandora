import { engine, Material, MaterialTransparencyMode, MeshRenderer, Transform } from '@dcl/sdk/ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'
import { healingTreeForLevel } from './shared/recovery'
import { getVillage } from './gameState'

export function setupHealingBeam(){
 const centre=healingTreeForLevel(getVillage().level)
 const bands=Array.from({length:12},(_,index)=>{
  const entity=engine.addEntity();MeshRenderer.setCylinder(entity,1,1)
  Transform.create(entity,{position:Vector3.create(centre.x,centre.y+index*1.6,centre.z),scale:Vector3.create(centre.radius,1.7,centre.radius)})
  return entity
 })
 let time=0
 engine.addSystem(dt=>{
  time+=Math.max(0,dt)
  const centre=healingTreeForLevel(getVillage().level)
  bands.forEach((entity,index)=>{
   const t=(index/12+time*.09)%1,opacity=.055*(1-t)*(1-t)
   Transform.getMutable(entity).position=Vector3.create(centre.x,centre.y+t*19,centre.z)
   Material.setPbrMaterial(entity,{albedoColor:Color4.create(.32,.95,.8,opacity),emissiveColor:Color4.create(.25,.7,.6,1),emissiveIntensity:.18,transparencyMode:MaterialTransparencyMode.MTM_ALPHA_BLEND,castShadows:false})
  })
 },undefined,'pandora-healing-beam')
}
