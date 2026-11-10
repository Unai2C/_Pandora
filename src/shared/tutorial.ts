import type { ToolKind } from './tools'
export const GUIDE_POINT = { x: 84.8, y: 4.7, z: 85.5 }
// Fixed spots on the lower ground just outside the four platform corners, each on the flattest patch near its mark.
export const DELIVERY_POINTS = [
 {x:90.75,y:1.59,z:87.7},
 {x:73.13,y:1.76,z:89.58},
 {x:74.49,y:1.58,z:70.13},
 {x:90.69,y:1.51,z:70.61}
] as const
export const DELIVERY_POINT = DELIVERY_POINTS[0]
export function deliveryPointFor(_level:number,from?:{x:number;z:number}) {
 return from ? DELIVERY_POINTS.reduce((nearest,p)=>Math.hypot(p.x-from.x,p.z-from.z)<Math.hypot(nearest.x-from.x,nearest.z-from.z)?p:nearest,DELIVERY_POINTS[0] as typeof DELIVERY_POINTS[number]) : DELIVERY_POINT
}
export const TOOL_RECEIVE_POINT = { x: 84.5, y: 2.8, z: 98 }
export const ARRIVAL_POINT = { x: 85.93, y: 2.8, z: 129.05 }
export function toolUnlocked(stage: number, tool: ToolKind) { return stage >= ({ axe: 2, pickaxe: 3, sword: 4 }[tool]) }
export function canGatherKind(stage: number, kind: string) { return kind === 'fruit' ? stage >= 1 : kind === 'wood' ? stage >= 2 : kind === 'stone' ? stage >= 3 : false }
// Stages: 0 intro, 1 fruit, 2 wood, 3 stone, 4 agent, 5 first delivery at an altar, 6 done. Until stage 6 the explorer
// plays apart from the village: no level-up transformations and a tutorial checklist instead of the village panel.
export const TUTORIAL_DONE = 6
export function nextTutorialStage(stage: number, action: string) {
 return action === ({ 0: 'intro', 1: 'fruit', 2: 'wood', 3: 'stone', 4: 'enemy', 5: 'deliver' } as Record<number, string>)[stage] ? Math.min(TUTORIAL_DONE, stage + 1) : stage
}
export function tutorialInstruction(stage: number, guideMet = true) {
 if (stage === 1 && !guideMet) return { title: 'GO TO THE CENTRAL TREE', body: 'A lone agent is waiting beside the central tree. Go to the heart of Novaterra.' }
 return ([
  { title: 'WELCOME TO NOVATERRA', body: 'A new journey begins.' },
  { title: 'GATHER FRUIT', body: 'I am Pandora. We agents come from Novaterra, an ancient city now in ruins. Together we can rebuild it. First, gather fruit: the settlement needs food. Click a marked bush.' },
  { title: 'GATHER WOOD', body: 'Food is the first step toward a living community. Take this axe. Gather wood to rebuild Novaterra’s shelters. Select 2 and press E near a tree, or click it.' },
  { title: 'MINE STONE', body: 'Wood gives us shelter; stone will give us lasting foundations. Take this pickaxe and mine stone to restore our city. Select 3 and press E near a rock, or click it.' },
  { title: 'RECOVER MEMORY SHARDS', body: 'Some agents have lost control. Recover their memory shards to restore Novaterra’s past. Take this sword: select 1 and press E near an agent outside the village. If you are hurt, return to the central tree’s aura. It heals you quickly whatever your maximum health. Wait for HEALTH FULL before heading out again.' },
  { title: 'DELIVER TO NOVATERRA', body: 'Every resource helps rebuild Novaterra. The shards recovered from agents that have lost control let us piece the village’s memory back together. Bring what you have gathered to any of the four delivery altars at the corners of the central platform. Their resources are shared by the whole village.' },
  { title: 'TUTORIAL COMPLETE', body: 'Well done, explorer. Your first offering has reached Novaterra and your training is over. From now on you rebuild the village alongside every other explorer: each delivery brings Novaterra closer to its next level, and the central tree grows with it.' }
 ][Math.max(0, Math.min(TUTORIAL_DONE, stage))])
}
// The short action line under the objective: one step at a time, never the whole delivery list before its turn.
export function tutorialActionPrompt(stage: number, guideMet = true) {
 if (stage === 1 && !guideMet) return 'Walk to the central tree and talk to Pandora.'
 return (['', 'Gather fruit: click the glowing bush.', 'Chop wood: select 2 and click the glowing tree.', 'Mine stone: select 3 and click the glowing rock.', 'Recover a memory shard: select 1 and defeat the glowing agent.', 'Deliver your wood, stone, fruit and memory shards at a corner altar.', ''] as const)[Math.max(0, Math.min(TUTORIAL_DONE, stage))]
}
