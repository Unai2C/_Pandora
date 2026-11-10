import { Schemas } from '@dcl/sdk/ecs'
import { registerMessages } from '@dcl/sdk/network'

export const Messages = {
  connectPandora: Schemas.Map({ ready: Schemas.Boolean }),
  gatherRequest: Schemas.Map({ kind: Schemas.String, nodeId: Schemas.String }),
  deliverRequest: Schemas.Map({ requested: Schemas.Boolean }),
  defeatRequest: Schemas.Map({ enemyId: Schemas.String }),
  attackRequest: Schemas.Map({ enemyId: Schemas.String, tool: Schemas.String }),
  skillRequest: Schemas.Map({ skillId: Schemas.String, enemyId: Schemas.String }),
  menuActionRequest: Schemas.Map({ action: Schemas.String, value: Schemas.String, slot: Schemas.Int }),
  treasureRequest: Schemas.Map({ chestId: Schemas.String }),
  waypointVisit: Schemas.Map({ id: Schemas.String }),
  testVillageLevelUpRequest: Schemas.Map({ requested: Schemas.Boolean }),
  restartIntroRequest: Schemas.Map({ ready: Schemas.Boolean }),
  tutorialBriefingRequest: Schemas.Map({ active: Schemas.Boolean, stage: Schemas.Int }),
  guideArrivalRequest: Schemas.Map({ ready: Schemas.Boolean }),
  introCompleteRequest: Schemas.Map({ ready: Schemas.Boolean }),
  skipTutorialRequest: Schemas.Map({ ready: Schemas.Boolean }),
  continueRequest: Schemas.Map({ ready: Schemas.Boolean }),
  // The tool in an explorer's hand ('' for none), shown on their avatar for everyone else.
  toolEquipped: Schemas.Map({ tool: Schemas.String }),
  playerTool: Schemas.Map({ address: Schemas.String, tool: Schemas.String }),
  playerSnapshot: Schemas.Map({ coins: Schemas.Float, level: Schemas.Int, xp: Schemas.Int, wood: Schemas.Int, stone: Schemas.Int, fruit: Schemas.Int, defeated: Schemas.Int, chests: Schemas.Int, collected: Schemas.Int, nextCoinAt: Schemas.Int, profileJson: Schemas.String }),
  villageSnapshot: Schemas.Map({ treeTransitionAt: Schemas.String, coins: Schemas.Float, level: Schemas.Int, wood: Schemas.Int, stone: Schemas.Int, fruit: Schemas.Int, defeats: Schemas.Int, revision: Schemas.Int, cycle: Schemas.Int, targetWood: Schemas.Int, targetStone: Schemas.Int, targetFruit: Schemas.Int, targetCoins: Schemas.Int, targetDefeats: Schemas.Int }),
  resourceSnapshot: Schemas.Map({ nodesJson: Schemas.String }),
  enemySnapshot: Schemas.Map({ enemiesJson: Schemas.String }),
  pandoraFeedback: Schemas.Map({ text: Schemas.String }),
  communityEvent: Schemas.Map({ text: Schemas.String }),
  playerDefeated: Schemas.Map({ enemyName: Schemas.String }),
  shardDropped: Schemas.Map({ x: Schemas.Float, y: Schemas.Float, z: Schemas.Float })
}

export const room = registerMessages(Messages)
