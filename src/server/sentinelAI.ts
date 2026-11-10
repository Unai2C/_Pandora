import { inVillageSafeZone, SentinelMode } from '../shared/testEnemy'
type Point = { x: number; y: number; z: number }
export interface PatrolState { position: Point; route: Point[]; waypoint: number; mode: SentinelMode; target: string; attackRange?: number; pauseRemaining?: number; patrolSpeed?:number; pauseSeed?:number }
export function updatePatrol(state: PatrolState, players: { address: string; position: Point }[], dt: number) {
  const home = state.route[0]
  const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z)
  const candidates = players.filter(p => !inVillageSafeZone(p.position) && Math.abs(p.position.y - state.position.y) < 4 && distance(p.position, home) <= 24)
  let target = state.mode === 'return' ? undefined : candidates.find(p => p.address === state.target && distance(p.position, state.position) <= 16)
  if (!target && state.mode !== 'return') target = candidates.filter(p => distance(p.position, state.position) <= 10).sort((a,b) => distance(a.position,state.position)-distance(b.position,state.position))[0]
  const wasChasing = state.mode === 'chase' || state.mode === 'attack'
  if (target) { state.target = target.address; state.mode = distance(target.position,state.position) <= (state.attackRange ?? 2.2) ? 'attack' : 'chase' }
  else { state.target = ''; if (wasChasing) state.mode = 'return' }
  let goal = target?.position ?? (state.mode === 'return' ? home : state.route[state.waypoint])
  if (state.mode === 'return' && distance(state.position,home) < 0.15) { state.mode = 'patrol'; state.waypoint = 1; goal = state.route[1] }
  if (state.mode === 'attack') return target
  if(state.mode==='patrol'&&(state.pauseRemaining??0)>0){state.pauseRemaining=Math.max(0,(state.pauseRemaining??0)-dt);return target}
  if(state.mode!=='patrol')state.pauseRemaining=0
  const d = distance(state.position,goal)
  const step = Math.min(target ? Math.max(0,d-(state.attackRange??2.2)) : d, (state.mode === 'chase' ? 3.2 : (state.patrolSpeed??1.25)) * Math.max(0, Math.min(dt,0.1)))
  if (d > 0.001) {
    const next = { x: state.position.x + (goal.x-state.position.x)/d*step, y: home.y, z: state.position.z + (goal.z-state.position.z)/d*step }
    if (!inVillageSafeZone(next)) state.position = next
    else { state.mode = 'return'; state.target = '' }
  }
  if (state.mode === 'patrol' && d < 0.2) { state.waypoint = (state.waypoint+1)%state.route.length;state.pauseSeed=((state.pauseSeed??73)*1664525+1013904223)>>>0;state.pauseRemaining=1.5+state.pauseSeed/4294967296*5 }
  return target
}
