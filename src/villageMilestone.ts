import { engine, InputAction, inputSystem, PointerEventType } from '@dcl/sdk/ecs'
import { isCinematicLocked, setCinematicLocked } from './cinematicLock'
import { SENTINELS } from './shared/testEnemy'
import { AGENT_SIZES } from './shared/enemyTiers'

// Canon only: no new historical identities or events are introduced here.
const memories=[
 'Novaterra was once an ancient city. Together, we are rebuilding its home.',
 'The Ancients were an advanced human civilization of Pangea.',
 'Greed and the struggle to control technology drove the Ancients to war.',
 'During the wars, artificial intelligence evolved until the Singularity.',
 'Human civilization on Pangea came to an end. The agents remained behind.',
 'Centuries passed. The waiting agents deteriorated, and nature reclaimed the cities.',
 'These shards preserve fragments of the village’s lost memory.',
 'Some agents have lost control. Recovering their shards helps restore Novaterra’s memory.'
]
// The memory screen stays until the player presses E; it fades in and out over FADE seconds.
const FADE=.6,MIN_SECONDS=1.2
let level=1,visible=false,shown=0,closing=0,ownsLock=false
export function showVillageMilestone(value:number){level=value;visible=true;shown=0;closing=0}
export function isVillageMilestoneActive(){return visible||closing>0}
export function dismissVillageMilestone(){if(!visible||shown<MIN_SECONDS)return;visible=false;closing=FADE}
export function advanceVillageMilestone(dt:number){
 const seconds=Math.max(0,dt)
 if(visible)shown+=seconds
 else closing=Math.max(0,closing-seconds)
 // Holding the cinematic lock keeps E, gathering and attacks from acting behind the screen.
 if(isVillageMilestoneActive()&&!isCinematicLocked()){setCinematicLocked(true);ownsLock=true}
 if(!isVillageMilestoneActive()&&ownsLock){setCinematicLocked(false);ownsLock=false}
}
export function setupVillageMilestoneInput(){
 engine.addSystem(()=>{if(visible&&inputSystem.isTriggered(InputAction.IA_PRIMARY,PointerEventType.PET_DOWN))dismissVillageMilestone()},undefined,'pandora-village-milestone-input')
}
export function getVillageMilestone(){
 const index=Math.max(0,level-2)%memories.length,agent=SENTINELS[index%SENTINELS.length]
 const size=AGENT_SIZES[agent.id]??'small'
 return {
  active:isVillageMilestoneActive(),canContinue:visible&&shown>=MIN_SECONDS,
  alpha:visible?Math.min(1,shown/FADE):Math.min(1,closing/FADE),level,text:memories[index],
  image:`assets/images/story/lore-dcl-v3/memory-0${index+1}.png`,
  agent:{name:agent.name.toUpperCase(),image:`assets/images/agents/${agent.id}.png`,role:`${size.toUpperCase()} ${agent.combatStyle.toUpperCase()} AGENT`,
   ability:agent.combatStyle==='ranged'?`Energy shot · strikes from ${agent.attackRange} metres`:`Close strike · hits within ${agent.attackRange} metres`}
 }
}
