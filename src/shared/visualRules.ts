export const MAX_VILLAGE_LEVEL = 100
// Visual forms alternate at every level; village progression itself never loops. This is the published behaviour
// (every level-up transforms the tree), despite the TEST_ name.
export const TEST_TREE_EVERY_LEVEL = true
export function treeStageForLevel(level:number) {
 return TEST_TREE_EVERY_LEVEL ? (Math.max(1,Math.floor(level))-1)%4 : level>=13?3:level>=9?2:level>=5?1:0
}
export type VillageLevelEffect = 'none' | 'burst' | 'transform'
export function villageLevelEffect(previous: number | null, level: number): VillageLevelEffect {
 if (previous === null || level <= previous) return 'none'
 return TEST_TREE_EVERY_LEVEL || [5,9,13].includes(level) ? 'transform' : 'burst'
}
export const AGENT_CLIPS = ['Idle','Greet','Attack','Disappear','Appear','Look','Alert','Hit','Doze']
const PRIORITY: Record<string,number> = { Idle:0, Look:1, Doze:1, Greet:2, Alert:3, Hit:4, Attack:5, Appear:6, Disappear:7 }
export function canInterruptAgentClip(current:string,next:string,remaining:number) { return remaining<=0 || (PRIORITY[next]??0)>(PRIORITY[current]??0) }

// A stable identity seed keeps each agent's rhythm distinct across clients. Agents strike slowly (every 4.4-6.2 s) and
// wait 1.8-2.6 s after engaging before the first wind-up, so an explorer who reacts always lands the first hit.
export function agentPersonality(id:string){let hash=2166136261;for(let i=0;i<id.length;i++){hash^=id.charCodeAt(i);hash=Math.imul(hash,16777619)}const seed=hash>>>0;return {seed,idleSpeed:.82+(seed%97)/96*.35,idleDelay:.1+((seed>>>7)%101)/100*2.7,patrolSpeed:.85+((seed>>>13)%101)/100*.65,pause:((seed>>>3)%101)/100*3.7,cadence:4.4+((seed>>>17)%101)/100*1.8,attackDelay:1800+(seed%801)}}
