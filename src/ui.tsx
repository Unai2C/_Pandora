import { MAX_VILLAGE_LEVEL } from './shared/visualRules'
import { getBoundaryDialogue } from './sceneBoundary'
import { renderStartMenu } from './startMenu'
import { dismissVillageMilestone, getVillageMilestone } from './villageMilestone'
import { getRecoveryMessage } from './animatedEffects'
import { getTutorialCinematic, continueTutorialCinematic } from './tutorialCinematics'
import { playInteractionSound } from './audio'
import { isArrivalScreen, isGoingToGuide, getIntroFade, isIntroTitle, isIntroStarting, startIntroGame, restartIntro, skipTutorial, canSkipTutorial, isInTutorial, finishIntro, getIntroCaption, getTutorialInstruction, getTutorialStage, isIntroActive, isIntroRunning } from './tutorial'
import { toolUnlocked } from './shared/tutorial'
import { isVillageGuideOpen, setVillageGuideOpen, subscribeVillageGuide } from './villageGuide'
import { equipTool, getEquippedTool, setupEquipmentControls } from './equipment'
import { getAttackStyle, toggleAttackStyle, playPunchAnimation, getAvatarAnimationStatus } from './punchAnimation'
import { UiCanvasInformation, engine } from '@dcl/sdk/ecs'
import { Color4 } from '@dcl/sdk/math'
import ReactEcs, { ReactEcsRenderer, UiEntity, Label } from '@dcl/sdk/react-ecs'
import { getCommunityFeed, getGatherProgress, getMessage, getPlayer, getVillage, subscribe, testVillageLevelUp } from './gameState'
import { isMobile } from './platform'
import { TEST_TOOLS } from './shared/testTools'
import { continueAfterDeath, getDeathScreen } from './playerDeath'

type RpgSkin = 'panel' | 'hud' | 'header' | 'button' | 'button-active' | 'slot'

// Preserve ornate corners while stretching the quiet center to fit each widget.
function rpgBackground(skin: RpgSkin, color = Color4.create(1, 1, 1, 1)) {
  const square = skin === 'panel' || skin === 'slot'
  return {
    texture: { src: `assets/images/ui-rpg/${skin}.png`, filterMode: 'bi-linear' as const },
    textureMode: 'nine-slices' as const,
    textureSlices: { top: 0.2, bottom: 0.2, left: square ? 0.16 : 0.08, right: square ? 0.16 : 0.08 },
    color
  }
}

const RESOURCE_ICONS = [
  { kind: 'wood', label: 'WOOD', image: 'assets/images/madera.png' },
  { kind: 'stone', label: 'STONE', image: 'assets/images/piedra.png' },
  { kind: 'fruit', label: 'FRUIT', image: 'assets/images/fruta.png' }
] as const

// Translucent dark surfaces preserve contrast over the world.
const HUD_INK = Color4.create(0.025, 0.045, 0.075, 0.84)
const HUD_EDGE = Color4.create(0.48, 0.35, 0.16, 1)

function resourceCounters(values: { wood: number; stone: number; fruit: number }, iconSize: number, fontSize: number) {
  return RESOURCE_ICONS.map(({ kind, image }) => (
    <UiEntity key={`resource-${kind}`} uiTransform={{ width: '32%', height: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <UiEntity uiTransform={{ width: iconSize * 1.5, height: iconSize * 1.5, flexShrink: 0, margin: { right: 5 } }} uiBackground={{ texture: { src: image, filterMode: 'bi-linear' }, textureMode: 'stretch' }} />
      <Label value={`${values[kind]}`} fontSize={fontSize + 2} textAlign="middle-left" color={Color4.create(1, 0.9, 0.65, 1)} uiTransform={{ height: 30, flexGrow: 1 }} />
    </UiEntity>
  ))
}

function framedMeter(label: string, value: number, maximum: number, percent: number, compact: boolean, mobile: boolean, fill: ReturnType<typeof Color4.create>) {
  return <UiEntity uiTransform={{ width: '100%', height: compact ? 24 : 20, flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
    <Label value={label} fontSize={compact ? 18 : mobile ? 14 : 13} textAlign="middle-left" color={Color4.create(0.94, 0.94, 1, 1)} uiTransform={{ width: compact ? 78 : 60, height: '100%', flexShrink: 0 }} />
    <UiEntity uiTransform={{ flexGrow: 1, height: compact ? 9 : 6.75, margin: { left: 8, right: 8 } }} uiBackground={{ color: Color4.create(0.1, 0.13, 0.18, 1) }}>
      <UiEntity uiTransform={{ width: `${percent}%`, height: '100%' }} uiBackground={{ color: fill }} />
    </UiEntity>
    <Label value={`${Math.ceil(value)}/${maximum}`} fontSize={compact ? 18 : mobile ? 14 : 13} textAlign="middle-right" color={Color4.create(0.94, 0.94, 1, 1)} uiTransform={{ width: compact ? 112 : 86, height: '100%', flexShrink: 0 }} />
  </UiEntity>
}

function menuArt(asset: 'menu-panel-v3' | 'skill-node-v3' | 'inventory-card-v3') {
  return {
    texture: { src: `assets/images/ui-rpg/${asset}.png`, filterMode: 'bi-linear' as const },
    textureMode: 'nine-slices' as const,
    textureSlices: { top: 0.1, bottom: 0.1, left: 0.08, right: 0.08 }
  }
}

function menuButton(text: string, action: () => void, width: number, compact: boolean, enabled = true) {
  return <UiEntity uiTransform={{ width, height: compact ? 36 : 30, flexShrink: 0, margin: { left: 4 }, alignItems: 'center', justifyContent: 'center' }} uiBackground={{ color: enabled ? Color4.create(0.08, 0.25, 0.28, 1) : Color4.create(0.065, 0.08, 0.1, 1) }} onMouseDown={() => { playInteractionSound(); if (enabled) action() }}>
    <Label value={text} fontSize={compact ? 16 : 12} color={enabled ? Color4.create(0.95, 1, 1, 1) : Color4.create(0.45, 0.5, 0.55, 1)} textAlign="middle-center" uiTransform={{ width: '100%', height: '100%' }} />
  </UiEntity>
}

let revision = 0
subscribe(() => { revision++ })
subscribeVillageGuide(() => { revision++ })

export function setupPandoraUI() {
  setupEquipmentControls()
  ReactEcsRenderer.setUiRenderer(() => {
    void revision
    const canvas = UiCanvasInformation.getOrNull(engine.RootEntity)
    const screenWidth=canvas?.width??1920,screenHeight=canvas?.height??1080
    const captionWidth=Math.min(1120,Math.max(240,screenWidth-160)),captionLeft=(screenWidth-captionWidth)/2
    const logoWidth=Math.min(800,screenWidth*.75),logoHeight=logoWidth*.5

    if(isIntroTitle())return renderStartMenu(screenWidth,screenHeight)
    const briefing = getTutorialCinematic()
    if (briefing.active) return <UiEntity uiTransform={{ width: '100%', height: '100%' }}>
      <UiEntity uiTransform={{ positionType: 'absolute', position: { top: 0, left: 0 }, width: '100%', height: 65 }} uiBackground={{ color: Color4.Black() }} />
      <UiEntity uiTransform={{ positionType: 'absolute', position: { bottom: 0, left: 0 }, width: '100%', height: 230 }} uiBackground={{ color: Color4.Black() }} />
      <UiEntity uiTransform={{ positionType: 'absolute', position: { bottom: 0, left: captionLeft }, width: captionWidth, height: 230, padding: { left: 24, right: 24, top: 12, bottom: 8 }, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} uiBackground={{ color: Color4.Black() }}>
        <Label value={briefing.title} fontSize={22} textAlign="middle-center" color={Color4.create(0.6,1,0.9,1)} uiTransform={{ width: captionWidth, height: 32 }} />
        <Label value={briefing.text} fontSize={22} textAlign="middle-center" textWrap="wrap" color={Color4.White()} uiTransform={{ width: captionWidth, height: 125 }} />
        {briefing.canContinue ? <UiEntity uiTransform={{ width: 250, height: 42 }} onMouseDown={() => continueTutorialCinematic()}><Label value="E · CONTINUE" fontSize={18} textAlign="middle-center" color={Color4.create(1,.85,.5,1)} uiTransform={{ width: '100%', height: '100%' }} /></UiEntity> : null}
      </UiEntity>
      <UiEntity uiTransform={{ positionType: 'absolute', position: { top: 0, left: 0 }, width: '100%', height: '100%' }} uiBackground={{ color: Color4.create(0,0,0,briefing.fade) }} />
    </UiEntity>
    if (isArrivalScreen()) {
      const alpha = getIntroFade()
      return <UiEntity uiTransform={{ width: '100%', height: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} uiBackground={{ color: Color4.create(0, 0, 0, alpha) }}>
        <UiEntity uiTransform={{ positionType: 'absolute', position: { left: (screenWidth-logoWidth)/2, top: (screenHeight-logoHeight-140)/2 }, width: logoWidth, height: logoHeight }} uiBackground={{ texture: { src: 'assets/images/ui-rpg/pangea-agents-title.png' }, textureMode: 'stretch', color: Color4.create(1, 1, 1, alpha) }} />
        <Label value="WELCOME TO NOVATERRA" fontSize={36} textAlign="middle-center" color={Color4.create(0.85, 1, 0.95, alpha)} uiTransform={{ positionType: 'absolute', position: { left: captionLeft, top: (screenHeight+logoHeight-140)/2+15 }, width: captionWidth, height: 60 }} />
        <Label value="Find Pandora beside the central tree." fontSize={26} textAlign="middle-center" color={Color4.create(0.85, 0.88, 0.92, alpha)} uiTransform={{ positionType: 'absolute', position: { left: captionLeft, top: (screenHeight+logoHeight-140)/2+80 }, width: captionWidth, height: 50 }} />
      </UiEntity>
    }
    if (isIntroActive()) return <UiEntity uiTransform={{ width: '100%', height: '100%', flexDirection: 'column', justifyContent: 'space-between' }} uiBackground={{ color: Color4.create(0, 0, 0, isIntroRunning() ? 0 : 1) }}>
      {!isIntroTitle() ? <UiEntity uiTransform={{ positionType: 'absolute', position: { top: 0, left: 0 }, width: '100%', height: 100, alignItems: 'center', justifyContent: 'center' }} uiBackground={{ color: Color4.Black() }}><Label value="PANGEA · NOVATERRA" textAlign="middle-center" uiTransform={{ positionType:'absolute',position:{left:captionLeft,top:20},width:captionWidth,height:60 }} fontSize={28} color={Color4.create(0.85, 1, 0.95, 1)} /></UiEntity> : null}
      {!isIntroTitle() ? <UiEntity uiTransform={{ positionType: 'absolute', position: { bottom: 0, left: 0 }, width: '100%', height: 130, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} uiBackground={{ color: Color4.Black() }}>
        <Label value={getIntroCaption()} fontSize={30} textAlign="middle-center" textWrap="wrap" color={Color4.White()} uiTransform={{ positionType:'absolute', position:{left:captionLeft,top:8}, width:captionWidth, height:84, flexShrink:0 }} />
        {getTutorialStage() === 0 ? <UiEntity uiTransform={{ positionType:'absolute', position:{left:(screenWidth-160)/2,bottom:6}, width:160, height:34 }} onMouseDown={() => { void finishIntro() }}><Label value="SKIP INTRO" textAlign="middle-center" uiTransform={{ width: '100%', height: '100%' }} fontSize={14} color={Color4.create(0.7, 0.8, 0.8, 1)} /></UiEntity> : null}
      </UiEntity> : null}
      <UiEntity uiTransform={{ positionType: 'absolute', position: { top: 0, left: 0 }, width: '100%', height: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} uiBackground={{ color: Color4.create(0, 0, 0, getIntroFade()) }}>
        {isIntroTitle() ? <UiEntity uiTransform={{ positionType: 'absolute', position: { left: (screenWidth-logoWidth)/2, top: (screenHeight-logoHeight-100)/2 }, width: logoWidth, height: logoHeight+100, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <UiEntity uiTransform={{ width: logoWidth, height: logoHeight }} uiBackground={{ texture: { src: 'assets/images/ui-rpg/pangea-agents-title.png' }, textureMode: 'stretch' }} />
          <UiEntity uiTransform={{ width: 300, height: 54, margin: { top: 24 } }} onMouseDown={() => { void startIntroGame() }}><Label value={isIntroStarting() ? 'STARTING...' : 'PRESS E TO START'} textAlign="middle-center" uiTransform={{ width: '100%', height: '100%' }} fontSize={24} color={Color4.create(0.9, 1, 0.95, 1)} /></UiEntity>
        </UiEntity> : null}
      </UiEntity>
    </UiEntity>
    const player = getPlayer()
    const village = getVillage()
    // Phones get their own slim layout; high-density desktop screens get the larger 'compact' one.
    const mobile = isMobile()
    const compact = !mobile && canvas !== null && (canvas.width < 1500 || canvas.height < 850 || canvas.devicePixelRatio >= 1.75)
    const S = (compactValue: number, desktopValue: number, mobileValue: number) => compact ? compactValue : mobile ? mobileValue : desktopValue
    const topPanelWidth = compact ? 740 : 520
    const topPanelLeft = Math.max(0, Math.round(((canvas?.width ?? 1920) - topPanelWidth) / 2))
    const sidePanelWidth = S(555, 380, 290)
    const sidePanelRight = S(18, 48, 12)
    const baseResourcePanelWidth = Math.min(sidePanelWidth, Math.max(0, (canvas?.width ?? 1920) - sidePanelRight * 2))
    const previousTrackWidth = Math.max(0, baseResourcePanelWidth - 4 - (compact ? 24 : 16) - (compact ? 78 : 60) - (compact ? 112 : 86) - 16)
    const resourcePanelWidth = baseResourcePanelWidth - previousTrackWidth * 0.25
    const resourceFontSize = mobile ? 13 : resourcePanelWidth < 400 ? 13 : compact ? 22 : 16
    // Center the shared village panel within the available canvas.
    const width = Math.min(S(1312, 1000, 720), Math.max(0, (canvas?.width ?? 1920) - (mobile ? 24 : 96)))
    const height = S(122, 96, 50)
    const left = Math.max(0, ((canvas?.width ?? 1920) - width) / 2)
    // Leave room above the Explorer bottom controls. Shared panel, feedback and hotbar move together.
    const bottom = S(14, 18, 8)
    const messageWidth = mobile ? Math.min(420, width - 200) : Math.min(compact ? 660 : 500, Math.max(0, width - (compact ? 660 : 512)))
    const messageLeft = Math.max(0, ((canvas?.width ?? 1920) - messageWidth) / 2)
    const thresholds = [village.targets.wood, village.targets.stone, village.targets.fruit, village.targets.coins]
    const progress = [village.stock.wood, village.stock.stone, village.stock.fruit, village.stock.coins]
    const activeCategories = thresholds.reduce((count, target) => count + (target > 0 ? 1 : 0), 0)
    const percent = village.level >= MAX_VILLAGE_LEVEL ? 100 : activeCategories ? Math.round(progress.reduce((sum, value, i) => sum + (thresholds[i] > 0 ? Math.min(value, thresholds[i]) / thresholds[i] : 0), 0) / activeCategories * 100) : 0
    const personalPercent = player.needed > 0 ? Math.min(100, Math.round(player.intoLevel / player.needed * 100)) : 100
    const healthPercent = player.maxHealth > 0 ? Math.min(100, Math.round(player.health / player.maxHealth * 100)) : 0
    // During the tutorial the bottom panel is the explorer's own checklist instead of the village's level and stock:
    // fruit, wood, stone and a memory shard, each lit once its step is done, then the delivery at an altar.
    const tutorialStage = getTutorialStage(), inTutorial = tutorialStage >= 0 && isInTutorial()
    const tutorialSteps = [{ kind: 'fruit' as const, step: 1 }, { kind: 'wood' as const, step: 2 }, { kind: 'stone' as const, step: 3 }, { kind: 'coins' as const, step: 4 }]
    const tutorialPercent = Math.round(Math.max(0, Math.min(5, tutorialStage - 1)) / 5 * 100)
    const needed = [
      `WOOD ${Math.max(0, thresholds[0] - village.stock.wood)}`,
      `STONE ${Math.max(0, thresholds[1] - village.stock.stone)}`,
      `FRUIT ${Math.max(0, thresholds[2] - village.stock.fruit)}`
    ].join(' · ')
    const death = getDeathScreen()
    const gathering = getGatherProgress()
    const story = getVillageMilestone()
    // The memory picture takes most of the width; the agent card sits beside it.
    const storyCardWidth = Math.min(280, Math.max(180, screenWidth * .18)), storyImageWidth = Math.max(260, Math.min(760, screenWidth - storyCardWidth - 140))

    return (
      <UiEntity uiTransform={{ width: '100%', height: '100%' }}>
        {TEST_TOOLS ? <UiEntity uiTransform={{ width: '100%', height: '100%', positionType: 'absolute' }}>
        <UiEntity uiTransform={{ positionType: 'absolute', position: { top: 18, right: 18 }, width: 174, height: 36, alignItems: 'center', justifyContent: 'center' }} uiBackground={{ color: HUD_INK }} onMouseDown={() => { void restartIntro().catch(error => console.error('[Pandora] Restart intro failed:', error)) }}>
          <Label value="RESTART INTRO" fontSize={14} color={Color4.White()} />
        </UiEntity>
        {canSkipTutorial() && !getTutorialCinematic().active ? <UiEntity uiTransform={{ positionType: 'absolute', position: { top: 18, right: 200 }, width: 174, height: 36, alignItems: 'center', justifyContent: 'center' }} uiBackground={{ color: HUD_INK }} onMouseDown={() => { void skipTutorial().catch(error => console.error('[Pandora] Skip tutorial failed:', error)) }}>
          <Label value="SKIP TUTORIAL" fontSize={14} color={Color4.White()} />
        </UiEntity> : null}
        <UiEntity uiTransform={{ positionType: 'absolute', position: { top: S(306, 194, 176), right: sidePanelRight }, width: S(210, 210, 170), height: S(36, 36, 26), padding: 1, alignItems: 'center', justifyContent: 'center' }} uiBackground={{ color: HUD_EDGE }} onMouseDown={testVillageLevelUp}>
          <UiEntity uiTransform={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }} uiBackground={{ color: HUD_INK }}>
            <Label value={village.level >= MAX_VILLAGE_LEVEL ? 'MAX VILLAGE LEVEL · 100' : 'TEST · LEVEL UP VILLAGE'} fontSize={13} textAlign="middle-center" color={Color4.create(1, .88, .6, 1)} uiTransform={{ width: '100%', height: '100%' }} />
          </UiEntity>
        </UiEntity>
        </UiEntity> : null}
        {/* Community feed: what other explorers do, under the hero panel, newest at the bottom, fading out. */}
        <UiEntity uiTransform={{ positionType: 'absolute', position: { top: S(306, 194, 176) + (TEST_TOOLS ? S(44, 44, 32) : 0), right: sidePanelRight }, width: resourcePanelWidth, flexDirection: 'column', alignItems: 'flex-end' }}>
          {getCommunityFeed().map((line, index) => <UiEntity key={`feed-${index}-${line.text}`} uiTransform={{ height: S(35, 28, 21), margin: { bottom: 3 }, padding: { left: 8, right: 8 }, alignItems: 'center', maxWidth: '100%' }} uiBackground={{ color: Color4.create(0.02, 0.04, 0.07, 0.72 * line.alpha) }}>
            <Label value={line.text} fontSize={S(19.5, 15, 11.5)} textAlign="middle-right" color={Color4.create(0.86, 0.95, 1, line.alpha)} uiTransform={{ height: '100%' }} />
          </UiEntity>)}
        </UiEntity>
        {getTutorialStage() < 6 ? <UiEntity uiTransform={{ positionType: 'absolute', position: { top: mobile ? 10 : 26, left: Math.max(0, ((canvas?.width ?? 1920) - Math.min(mobile ? 420 : 640, (canvas?.width ?? 1920) - 24)) / 2) }, width: Math.min(mobile ? 420 : 640, (canvas?.width ?? 1920) - 24), height: S(70, 70, 44), padding: mobile ? 4 : 8, flexDirection: 'column' }} uiBackground={{ color: HUD_INK }}>
          <Label value={getTutorialInstruction().title} textAlign="middle-center" fontSize={S(28, 24, 16)} color={Color4.create(1, 0.87, 0.6, isGoingToGuide() ? 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(Date.now() / 300)) : 1)} uiTransform={{ width: '100%', height: 54 }} />
        </UiEntity> : null}
        <UiEntity uiTransform={{ positionType: 'absolute', position: { left, bottom }, width, height, padding: 1 }} uiBackground={{ color: HUD_EDGE }}>
          <UiEntity uiTransform={{ width: '100%', height: '100%', padding: mobile ? { left: 8, right: 8, top: 3, bottom: 3 } : { left: 16, right: 16, top: 8, bottom: 8 }, flexDirection: 'column' }} uiBackground={{ color: Color4.create(0.025, 0.045, 0.075, 0.94) }}>
            <UiEntity uiTransform={{ width: '100%', height: S(80, 60, 36), flexShrink: 0, flexDirection: 'row', alignItems: 'center' }}>
              <UiEntity uiTransform={{ width: S(180, 150, 64), height: '100%', margin: { right: mobile ? 6 : 12 }, flexShrink: 0 }}>
                <UiEntity uiTransform={{ positionType: 'absolute', position: { left: mobile ? -4 : -8, bottom: S(-25, -22, -8) }, width: S(180, 150, 64), height: S(180, 150, 64) }} uiBackground={{ texture: { src: 'assets/images/ui-rpg/novaterra.png' }, textureMode: 'stretch' }} />
              </UiEntity>
              <UiEntity uiTransform={{ width: '27%', height: '100%', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
                <Label value={inTutorial ? (tutorialStage >= 5 ? 'TUTORIAL · DELIVER' : `TUTORIAL · STEP ${Math.max(1, tutorialStage)}/5`) : `NOVATERRA · LV ${village.level} · ${percent}%`} textAlign="middle-left" fontSize={S(23, 17, 12)} color={Color4.create(0.85, 1, 0.87, 1)} uiTransform={{ width: '100%', height: S(30, 24, 18) }} />
                {mobile ? null : <Label value={inTutorial ? (tutorialStage >= 5 ? 'BRING IT ALL TO A CORNER ALTAR' : 'YOUR TUTORIAL · RESOURCES CARRIED') : 'COMMUNITY RESOURCES · STOCK / GOAL'} textAlign="middle-left" fontSize={compact ? 17 : 12} color={Color4.create(0.85, 0.88, 0.92, 1)} uiTransform={{ width: '100%', height: compact ? 26 : 20 }} />}
              </UiEntity>
              <UiEntity uiTransform={{ flexGrow: 1, height: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                {[...RESOURCE_ICONS, { kind: 'coins' as const, image: 'assets/images/ui-rpg/memory-shard-flat.png' }].map(({ kind, image }) => {
                  // Tutorial: done steps shine, the current one pulses, later ones wait dimmed.
                  const step = tutorialSteps.find(s => s.kind === kind)!.step, done = tutorialStage > step, current = tutorialStage === step
                  const alpha = !inTutorial || done ? 1 : current ? 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(Date.now() / 300)) : 0.3
                  const carried = kind === 'coins' ? player.coins : player.carried[kind]
                  return <UiEntity key={`shared-${kind}`} uiTransform={{ width: '24%', height: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <UiEntity uiTransform={{ width: S(60, 44, 24), height: S(72, 54, 29), flexShrink: 0, margin: { right: mobile ? 4 : 8 } }} uiBackground={{ texture: { src: image }, textureMode: 'stretch', color: Color4.create(1, 1, 1, alpha) }} />
                    <Label value={inTutorial ? `${carried}${done ? ' OK' : ''}` : `${village.stock[kind]}/${village.targets[kind]}`} fontSize={S(21, 16, 11)} color={inTutorial && done ? Color4.create(0.55, 1, 0.65, 1) : Color4.create(1, 0.9, 0.65, alpha)} uiTransform={{ height: 30, flexGrow: 1 }} />
                  </UiEntity>
                })}
              </UiEntity>
            </UiEntity>
            <UiEntity uiTransform={{ width: '100%', height: S(12, 9, 4), flexShrink: 0, margin: { top: mobile ? 2 : 4 } }} uiBackground={{ color: Color4.create(0.1, 0.16, 0.17, 1) }}>
              <UiEntity uiTransform={{ width: `${inTutorial ? tutorialPercent : percent}%`, height: '100%' }} uiBackground={{ color: inTutorial ? Color4.create(1, 0.78, 0.35, 1) : Color4.create(0.27, 0.86, 0.48, 1) }} />
            </UiEntity>
          </UiEntity>
        </UiEntity>
        <UiEntity uiTransform={{ positionType: 'absolute', position: { top: S(112, 36, 60), right: sidePanelRight }, width: resourcePanelWidth, height: S(182, 146, 110), flexDirection: 'column', padding: 2 }} uiBackground={{ color: Color4.create(0.48, 0.35, 0.16, 0.18) }}>
          <UiEntity uiTransform={{ width: '100%', height: '100%', padding: S(12, 8, 4), flexDirection: 'column', alignItems: 'center' }} uiBackground={{ color: HUD_INK }}>
            <UiEntity uiTransform={{ width: '100%', height: S(40, 32, 24), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <UiEntity uiTransform={{ width: '100%', height: '100%', flexDirection: 'row', alignItems: 'center', padding: { left: 10, right: 10 } }} uiBackground={{ color: Color4.create(0.045, 0.075, 0.115, 0.12) }}>
                <Label value={`HERO · LV ${player.level}`} textAlign="middle-left" fontSize={S(23, 18, 15)} color={Color4.create(1, 0.88, 0.6, 1)} uiTransform={{ width: '48%', height: '100%' }} />
                <UiEntity uiTransform={{ width: '52%', height: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <UiEntity uiTransform={{ width: S(38, 30, 21), height: S(38, 30, 21), margin: { right: 6 }, flexShrink: 0 }} uiBackground={{ texture: { src: 'assets/images/ui-rpg/memory-shard-flat.png' }, textureMode: 'stretch' }} />
                  <Label value={`SHARDS ${player.coins}`} fontSize={S(20, 15, 14)} color={Color4.create(1, 0.83, 0.39, 1)} uiTransform={{ height: 28 }} />
                </UiEntity>
              </UiEntity>
            </UiEntity>
            <UiEntity uiTransform={{width:'100%',height:compact?18:14,flexShrink:0,flexDirection:'row',alignItems:'center',margin:{top:2,bottom:2}}}><Label value="XP" fontSize={compact?13:mobile?12:10} textAlign="middle-left" color={Color4.create(.65,1,.85,1)} uiTransform={{width:26,height:'100%',flexShrink:0}} /><UiEntity uiTransform={{flexGrow:1,height:compact?7:5}} uiBackground={{color:Color4.create(.1,.14,.18,1)}}><UiEntity uiTransform={{width:`${personalPercent}%`,height:'100%'}} uiBackground={{color:Color4.create(.3,.8,.66,1)}} /></UiEntity></UiEntity>
            <UiEntity uiTransform={{ width: '100%', height: S(63, 45, 30), flexShrink: 0, flexDirection: 'row', justifyContent: 'space-between' }}>
              {resourceCounters(player.carried, S(42, 30, 20), resourceFontSize)}
            </UiEntity>
            <UiEntity uiTransform={{ width: '100%', height: compact ? 24 : 20, flexShrink: 0, margin: { top: 2 } }}>
              <UiEntity uiTransform={{ width: '100%', height: '100%', flexDirection: 'column', justifyContent: 'center' }}>
            {framedMeter('Health', player.health, player.maxHealth, healthPercent, compact, mobile, healthPercent < 25 ? Color4.create(1, 0.12, 0.15, 1) : Color4.create(0.82, 0.2, 0.25, 1))}
              </UiEntity>
            </UiEntity>
          </UiEntity>
        </UiEntity>
        <UiEntity uiTransform={{ positionType: 'absolute', position: { bottom: bottom + height + (mobile ? 4 : 8), left: left + width - S(312, 240, 168) }, width: S(312, 240, 168), height: S(100, 80, 54), flexDirection: 'row', justifyContent: 'space-between' }}>
          {(['sword', 'axe', 'pickaxe'] as const).map((tool, index) => <UiEntity key={tool} uiTransform={{ width: '32%', height: '100%', padding: 2 }} uiBackground={{ color: getEquippedTool() === tool ? Color4.create(0.9, 0.7, 0.3, 1) : HUD_EDGE }} onMouseDown={() => { playInteractionSound(); equipTool(tool) }}>
            <UiEntity uiTransform={{ width: '100%', height: '100%', flexDirection: 'column', alignItems: 'center' }} uiBackground={{ color: HUD_INK }}>
              <UiEntity uiTransform={{ positionType: 'absolute', position: mobile ? { top: 1, left: 1 } : { top: 4, left: 4 }, width: mobile ? 13 : 26, height: mobile ? 13 : 26, padding: mobile ? 1 : 2, zIndex: 2 }} uiBackground={{ color: Color4.create(0.65, 0.7, 0.75, 1) }}>
                <UiEntity uiTransform={{ width: '100%', height: '100%' }} uiBackground={{ color: Color4.create(0.12, 0.16, 0.2, 1) }}><Label value={String(index + 1)} fontSize={mobile ? 8 : 16} textAlign="middle-center" color={Color4.White()} uiTransform={{ width: '100%', height: '100%' }} /></UiEntity>
              </UiEntity>
              <UiEntity uiTransform={{ width: S(64, 48, 32), height: S(64, 48, 32), margin: { top: mobile ? 3 : 0 } }} uiBackground={{ texture: { src: 'assets/images/ui-rpg/' + tool + '-icon.png' }, textureMode: 'stretch', color: Color4.create(1, 1, 1, toolUnlocked(getTutorialStage(), tool) ? 1 : 0.25) }} />
              <Label value={toolUnlocked(getTutorialStage(), tool) ? tool.toUpperCase() + (getEquippedTool() === tool ? ' · E' : '') : 'LOCKED'} fontSize={compact ? 14 : mobile ? 9 : 11} textAlign="middle-center" color={Color4.create(1, 0.94, 0.8, 1)} uiTransform={{ width: '100%', height: mobile ? 15 : 24 }} />
            </UiEntity>
          </UiEntity>)}
        </UiEntity>
        <UiEntity uiTransform={{ positionType: 'absolute', position: { bottom: bottom + height + (mobile ? 4 : 10), left: mobile ? left : messageLeft }, width: messageWidth, height: S(84, 66, 40), padding: { left: 12, right: 12 }, alignItems: 'center', justifyContent: 'center' }} uiBackground={{ color: Color4.create(0.025, 0.045, 0.075, 0.94) }}>
          <Label value={getRecoveryMessage() || getMessage()} textAlign="middle-center" textWrap="wrap" fontSize={S(28, 22, 13)} color={Color4.create(1, 1, 1, 1)} uiTransform={{ width: '100%', height: '100%' }} />
        </UiEntity>
        {gathering ? <UiEntity uiTransform={{ positionType: 'absolute', position: { top: screenHeight * .58, left: (screenWidth - 260) / 2 }, width: 260, height: 44, flexDirection: 'column', alignItems: 'center' }}>
          <Label value={`${gathering.kind === 'wood' ? 'TREE' : gathering.kind === 'stone' ? 'ROCK' : 'BUSH'} · ${gathering.hits}/${gathering.required} HITS`} fontSize={14} textAlign="middle-center" color={Color4.create(1, .94, .8, 1)} uiTransform={{ width: '100%', height: 22 }} />
          <UiEntity uiTransform={{ width: 220, height: 12, padding: 2 }} uiBackground={{ color: Color4.create(.02, .03, .05, .85) }}>
            <UiEntity uiTransform={{ width: `${Math.round(gathering.remaining * 100)}%`, height: '100%' }} uiBackground={{ color: Color4.create(.2, .85, .65, 1) }} />
          </UiEntity>
        </UiEntity> : null}
        {isVillageGuideOpen() ? <UiEntity uiTransform={{ positionType: 'absolute', position: { top: '22%', left: Math.max(12, ((canvas?.width ?? 1920) - Math.min(860, (canvas?.width ?? 1920) - 24)) / 2) }, width: Math.min(860, (canvas?.width ?? 1920) - 24), height: 430, padding: 2, zIndex: 400 }} uiBackground={{ color: HUD_EDGE }}>
          <UiEntity uiTransform={{ width: '100%', height: '100%', padding: 20, flexDirection: 'column' }} uiBackground={{ color: Color4.create(0.025, 0.045, 0.075, 0.98) }}>
            <Label value="PANDORA · NOVATERRA" fontSize={32} color={Color4.create(1, 0.87, 0.6, 1)} uiTransform={{ width: '100%', height: 52 }} />
            <Label value={getTutorialInstruction().body} fontSize={26} textAlign="middle-left" textWrap="wrap" uiTransform={{ width: '100%', height: 280 }} />
            <UiEntity uiTransform={{ width: 150, height: 46, alignSelf: 'flex-end', justifyContent: 'center', alignItems: 'center' }} uiBackground={{ color: Color4.create(0.08, 0.25, 0.28, 1) }} onMouseDown={() => { playInteractionSound(); setVillageGuideOpen(false) }}><Label value="CLOSE" fontSize={22} /></UiEntity>
          </UiEntity>
        </UiEntity> : null}
        {getBoundaryDialogue().active ? <UiEntity uiTransform={{positionType:'absolute',position:{left:(screenWidth-Math.min(780,screenWidth-48))/2,bottom:bottom+height+116},width:Math.min(780,screenWidth-48),height:156,padding:14,flexDirection:'column',zIndex:450,borderWidth:1,borderColor:Color4.create(.25,1,.8,getBoundaryDialogue().alpha)}} uiBackground={{color:Color4.create(.015,.045,.05,.95*getBoundaryDialogue().alpha)}}>
          <Label value="PANDORA · YOUR GUIDE" fontSize={23} textAlign="middle-center" color={Color4.create(.35,1,.85,getBoundaryDialogue().alpha)} uiTransform={{width:'100%',height:34,flexShrink:0}} />
          <Label value={getBoundaryDialogue().text} fontSize={21} textAlign="middle-center" textWrap="wrap" color={Color4.create(1,1,1,getBoundaryDialogue().alpha)} uiTransform={{width:'100%',height:94}} />
        </UiEntity> : null}
        {story.active ? <UiEntity uiTransform={{positionType:'absolute',position:{left:0,top:0},width:'100%',height:'100%',justifyContent:'center',alignItems:'center',flexDirection:'row',zIndex:600}} uiBackground={{color:Color4.create(0,0,0,story.alpha)}} onMouseDown={dismissVillageMilestone}>
          <UiEntity uiTransform={{width:storyImageWidth,flexDirection:'column',alignItems:'center',flexShrink:0}}>
            <Label value={`NOVATERRA · LEVEL ${story.level}`} textAlign="middle-center" fontSize={34} color={Color4.create(.6,1,.85,story.alpha)} uiTransform={{width:'100%',height:56}} />
            <Label value="MEMORY RESTORED" textAlign="middle-center" fontSize={20} color={Color4.create(1,.85,.55,story.alpha)} uiTransform={{width:'100%',height:34}} />
            <UiEntity uiTransform={{width:storyImageWidth,height:storyImageWidth*9/16,margin:{top:8,bottom:12}}} uiBackground={{texture:{src:story.image,filterMode:'bi-linear'},textureMode:'stretch',color:Color4.create(1,1,1,story.alpha)}} />
            <Label value={story.text} textAlign="middle-center" textWrap="wrap" fontSize={24} color={Color4.create(1,1,1,story.alpha)} uiTransform={{width:'100%',height:84}} />
            <Label value={story.canContinue ? 'PRESS E TO CONTINUE' : ''} textAlign="middle-center" fontSize={18} color={Color4.create(1,.85,.5,story.alpha*(.6+.4*Math.sin(Date.now()/300)))} uiTransform={{width:'100%',height:36}} />
          </UiEntity>
          <UiEntity uiTransform={{width:storyCardWidth,margin:{left:28},padding:12,flexDirection:'column',alignItems:'center',flexShrink:0,borderWidth:1,borderColor:Color4.create(.48,.35,.16,story.alpha)}} uiBackground={{color:Color4.create(.03,.05,.08,story.alpha)}}>
            <Label value="AGENT RECORD" fontSize={15} textAlign="middle-center" color={Color4.create(1,.85,.55,story.alpha)} uiTransform={{width:'100%',height:26}} />
            <UiEntity uiTransform={{width:storyCardWidth-24,height:storyCardWidth-24,margin:{top:4,bottom:8}}} uiBackground={{texture:{src:story.agent.image,filterMode:'bi-linear'},textureMode:'stretch',color:Color4.create(1,1,1,story.alpha)}} />
            <Label value={story.agent.name} fontSize={19} textAlign="middle-center" textWrap="wrap" color={Color4.create(.6,1,.85,story.alpha)} uiTransform={{width:'100%',height:30}} />
            <Label value={story.agent.role} fontSize={13} textAlign="middle-center" color={Color4.create(.85,.88,.92,story.alpha)} uiTransform={{width:'100%',height:22}} />
            <Label value={story.agent.ability} fontSize={15} textAlign="middle-center" textWrap="wrap" color={Color4.create(1,1,1,story.alpha)} uiTransform={{width:'100%',height:44}} />
          </UiEntity>
        </UiEntity> : null}
        {death.alpha > 0 ? <UiEntity uiTransform={{ positionType: 'absolute', position: { top: 0, left: 0 }, width: '100%', height: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} uiBackground={{ color: Color4.create(0, 0, 0, death.alpha) }}>
          {death.menu ? <UiEntity uiTransform={{ width: 620, height: 300, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Label value="GAME OVER" fontSize={compact ? 76 : 60} textAlign="middle-center" color={Color4.create(0.86, 0.14, 0.16, 1)} uiTransform={{ width: '100%', height: 96 }} />
            <Label value={`Defeated by ${death.killer}`} fontSize={compact ? 24 : 18} textAlign="middle-center" color={Color4.create(0.85, 0.88, 0.92, 1)} uiTransform={{ width: '100%', height: 36 }} />
            <Label value="Your carried items and progression are safe." fontSize={compact ? 20 : 15} textAlign="middle-center" color={Color4.create(0.85, 0.88, 0.92, 1)} uiTransform={{ width: '100%', height: 34, margin: { bottom: 24 } }} />
            <UiEntity uiTransform={{ width: 340, height: 58, padding: 2 }} uiBackground={{ color: HUD_EDGE }} onMouseDown={continueAfterDeath}>
              <UiEntity uiTransform={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }} uiBackground={{ color: Color4.create(0.08, 0.25, 0.28, 1) }}><Label value="PRESS E TO CONTINUE" fontSize={compact ? 24 : 19} textAlign="middle-center" color={Color4.White()} uiTransform={{ width: '100%', height: '100%' }} /></UiEntity>
            </UiEntity>
          </UiEntity> : null}
        </UiEntity> : null}
      </UiEntity>
    )
  })
}
