import { Animator, engine, Entity, GltfContainer, Transform } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
// Agent models are normalised to a 1.88 unit body whose underside is 0.94 below the origin.
// Five rings stacked up to 0.9 units breathe gently in their looping Hover clip and never vanish; squeezed into a short,
// narrow column that ends just under the body, they read as the energy holding the agent up: blue for friends, red for
// agents that have lost control.
const RING_WIDTH=.36,RING_HEIGHT=.4,BODY_BOTTOM=-.94
export function createAgentHalo(parent:Entity,friendly:boolean){
 const entity=engine.addEntity()
 Transform.create(entity,{parent,position:Vector3.create(0,BODY_BOTTOM-.03-.9*RING_HEIGHT,0),scale:Vector3.create(RING_WIDTH,RING_HEIGHT,RING_WIDTH)})
 GltfContainer.create(entity,{src:'assets/scene/modelos/fx/'+(friendly?'Agent_Rings_Friendly':'Agent_Rings_Corrupt')+'.glb',visibleMeshesCollisionMask:0,invisibleMeshesCollisionMask:0})
 Animator.create(entity,{states:[{clip:'Hover',playing:true,loop:true,shouldReset:false,speed:friendly?1:1.35}]})
 return entity
}
// 0 hides the column only while the agent's body itself is gone; otherwise it stays at full size.
export function setAgentHaloStrength(halo:Entity,strength:number){
 Transform.getMutable(halo).scale=strength>0?Vector3.create(RING_WIDTH*strength,RING_HEIGHT,RING_WIDTH*strength):Vector3.Zero()
}
