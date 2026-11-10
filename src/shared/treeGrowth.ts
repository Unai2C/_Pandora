import { treeStageForLevel, MAX_VILLAGE_LEVEL } from './visualRules'

// Measured body bounds in the existing GLBs, excluding their collider meshes.
const ROOTS = [
 {x:-.70620197057724,y:1.6245012283325195,z:-.13632047176361084},
 {x:-.03294026106595993,y:1.7156212329864502,z:-1.4084560871124268},
 {x:-1.4991445541381836,y:2.0154078006744385,z:.9307258129119873},
 {x:-1.4254231452941895,y:1.6461341381072998,z:.41213348507881165}
]
const TOPS = [12.748275756835938,16.939476013183594,20.121051788330078,24.129661560058594]
const ORIGIN = {x:81.55,y:1.3,z:79.94}, BASE_SCALE=.94
const INITIAL_HEIGHT=(TOPS[0]-ROOTS[0].y)*BASE_SCALE

export function treeHeightForLevel(value:number) {
 const level=Math.max(1,Math.min(MAX_VILLAGE_LEVEL,Math.floor(value)))
 // Strong early growth (2.2x at 15), then ten times slower (2.5x at 50), then a plateau.
 const growth=level<=15?1+1.2*(level-1)/14:level<=50?2.2+.3*(level-15)/35:2.5
 return INITIAL_HEIGHT*growth
}
export function treePlacementForLevel(level:number) {
 const stage=treeStageForLevel(level),root=ROOTS[stage]
 const size=treeHeightForLevel(level)/(TOPS[stage]-root.y)
 // Scaling about the authored root prevents the trunk and collider lifting off the platform.
 return {position:{x:ORIGIN.x+root.x*(BASE_SCALE-size),y:ORIGIN.y+root.y*(BASE_SCALE-size),z:ORIGIN.z+root.z*(BASE_SCALE-size)},scale:{x:size,y:size,z:size}}
}
