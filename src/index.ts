import { setupSceneBoundary } from './sceneBoundary'
import { setupTutorialCinematics } from './tutorialCinematics'
import { setupAnimatedEffects } from './animatedEffects'
import { setupTutorialIntro } from './tutorial'
import { setupAvatarTools } from './avatarTools'
import { setupToolHold } from './punchAnimation'
import { engine } from '@dcl/sdk/ecs'
import { isServer } from '@dcl/sdk/network'
import { setupPandoraServer } from './server/pandoraServer'
import { setupPandoraWorld } from './world'
import { setupPandoraUI } from './ui'
import { connectPandora } from './gameState'
import { setupPandoraAudio } from './audio'
import { setupImpactEffects } from './impactEffects'
import { setupPlayerDeath } from './playerDeath'
import { setupShardDrops } from './shardDrop'
import { setupVillageMilestoneInput } from './villageMilestone'
import { detectPlatform } from './platform'

export function main() {
  if (isServer()) {
    setupPandoraServer()
    return
  }
  detectPlatform()
  connectPandora()
  setupPandoraAudio()
  setupPandoraWorld()
  setupAnimatedEffects()
  setupAvatarTools()
  setupToolHold()
  setupImpactEffects()
  setupPlayerDeath()
  setupShardDrops()
  setupVillageMilestoneInput()
  setupTutorialIntro()
  setupTutorialCinematics()
  setupPandoraUI()
  setupSceneBoundary()
  engine.addSystem(() => {})
}
