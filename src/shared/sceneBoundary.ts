export const SCENE_LIMITS={minX:6,maxX:154,minZ:6,maxZ:154,wallThickness:.6,height:128,centreY:40}
export const BOUNDARY_DIALOGUE='Explorer, you gave your word to help restore Novaterra. We need you here. Stay within these lands—the ground beyond this boundary is unsafe.'
export function boundaryContact(p:{x:number;z:number}){
 const b=SCENE_LIMITS,edges=[{distance:p.x-b.minX,x:-1,z:0},{distance:b.maxX-p.x,x:1,z:0},{distance:p.z-b.minZ,x:0,z:-1},{distance:b.maxZ-p.z,x:0,z:1}]
 const nearest=edges.reduce((a,b)=>a.distance<b.distance?a:b)
 return nearest.distance<=.85?nearest:undefined
}
export function boundaryWalls(){const b=SCENE_LIMITS,width=b.maxX-b.minX,depth=b.maxZ-b.minZ;return [
 {position:{x:b.minX,y:b.centreY,z:(b.minZ+b.maxZ)/2},scale:{x:b.wallThickness,y:b.height,z:depth+b.wallThickness}},
 {position:{x:b.maxX,y:b.centreY,z:(b.minZ+b.maxZ)/2},scale:{x:b.wallThickness,y:b.height,z:depth+b.wallThickness}},
 {position:{x:(b.minX+b.maxX)/2,y:b.centreY,z:b.minZ},scale:{x:width+b.wallThickness,y:b.height,z:b.wallThickness}},
 {position:{x:(b.minX+b.maxX)/2,y:b.centreY,z:b.maxZ},scale:{x:width+b.wallThickness,y:b.height,z:b.wallThickness}}
]}
