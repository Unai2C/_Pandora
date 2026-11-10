import ReactEcs, { UiEntity, Label } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'
import { isIntroControls, isIntroStarting, showIntroControls, startIntroGame } from './tutorial'
import { playInteractionSound } from './audio'
import { isMobile } from './platform'
const image='assets/images/ui-rpg/controls-gameplay.jpg'
const ink=Color4.create(.015,.03,.05,.94),gold=Color4.create(1,.85,.5,1),white=Color4.White()
export function renderStartMenu(w:number,h:number){
 const controls=isIntroControls(),fw=Math.min(w-40,(h-220)*1.6,1280),fh=fw/1.6,left=(w-fw)/2,top=(h-fh)/2+10,font=Math.max(11,Math.min(17,fw/70))
 // On phones the Explorer's touch controls cover the lower corners, so the menu sits centred in the upper part of the
 // screen (everything above 70% of the height) instead of to the left or low down.
 const mobile=isMobile(),wide=!mobile&&w>=900&&w/h>=1.25,menuCenter=wide?w*.235:w/2
 const menuWidth=mobile?Math.min(360,w*.42,h*.5):Math.min(520,w*(wide?.38:.84),h*.65),titleHeight=menuWidth*.5
 const buttonHeight=mobile?Math.max(34,Math.min(44,h*.075)):Math.max(38,Math.min(56,h*.085)),buttonWidth=mobile?Math.min(240,w*.3):Math.min(300,w-40)
 const menuTop=mobile?Math.max(8,h*.04):Math.max(12,(h-(titleHeight+112+buttonHeight*2))/2)
 const gap=mobile?8:12,captionY=menuTop+titleHeight+8,startY=captionY+(mobile?40:56),controlsY=startY+buttonHeight+gap,hintY=controlsY+buttonHeight+gap
 const artWidth=Math.max(w,h*1672/941),artHeight=artWidth*941/1672
 const button=(text:string,y:number,action:()=>void,cx=w/2)=> <UiEntity uiTransform={{positionType:'absolute',position:{left:cx-buttonWidth/2,top:y},width:buttonWidth,height:buttonHeight,justifyContent:'center',alignItems:'center',borderWidth:1,borderColor:gold}} uiBackground={{color:ink}} onMouseDown={()=>{playInteractionSound();action()}}><Label value={text} fontSize={23} textAlign="middle-center" color={gold} uiTransform={{width:'100%',height:'100%'}} /></UiEntity>
 const callout=(id:number,title:string,body:string,x:number,y:number,cw:number,ch:number)=> <UiEntity key={'help-'+id} uiTransform={{positionType:'absolute',position:{left:x*fw,top:y*fh},width:cw*fw,height:ch*fh,padding:10,flexDirection:'column',borderWidth:1,borderColor:gold}} uiBackground={{color:ink}}><Label value={id+' · '+title} fontSize={font+1} textAlign="middle-left" color={gold} uiTransform={{width:'100%',height:font*1.8,flexShrink:0}} /><Label value={body} fontSize={font} textAlign="top-left" textWrap="wrap" color={white} uiTransform={{width:'100%',flexGrow:1}} /></UiEntity>
 return <UiEntity uiTransform={{width:'100%',height:'100%'}} uiBackground={{color:Color4.create(.015,.03,.05,1)}}>
  {controls ? <UiEntity uiTransform={{width:'100%',height:'100%'}}>
   <Label value="CONTROLS · YOUR EXPLORER GUIDE" fontSize={28} textAlign="middle-center" color={gold} uiTransform={{positionType:'absolute',position:{left:0,top:10},width:w,height:48}} />
   <UiEntity uiTransform={{positionType:'absolute',position:{left,top},width:fw,height:fh,borderWidth:1,borderColor:gold}} uiBackground={{texture:{src:image},textureMode:'stretch'}}>
    {callout(1,'YOUR OBJECTIVE','Follow this instruction. Pandora guides you through the tutorial.',.025,.11,.30,.17)}
    {callout(2,'HERO · YOUR RESOURCES','Your level, XP, health and the resources YOU carry. Delivering adds your carried resources to Novaterra’s shared stock and resets your carried counters to 0. Heal beside the central tree.',.67,.19,.30,.26)}
    {callout(3,'TOOL SELECTOR','1 Sword · 2 Axe · 3 Pickaxe. Press E to use the selected tool. Unlock tools during the tutorial.',.67,.49,.30,.22)}
    {callout(4,'NOVATERRA · SHARED STOCK','The bottom panel belongs to everyone. Deliver at any corner altar. Each number shows STOCK / GOAL.',.025,.54,.32,.22)}
    {callout(5,'ACTION FEEDBACK','Collection, combat and delivery messages appear above the village panel.',.36,.35,.29,.18)}
    {[[1,.355,.075],[2,.78,.11],[3,.73,.77],[4,.31,.88],[5,.49,.80]].map(([id,x,y])=>{
     const size=Math.max(34,Math.min(48,fw*.04))
     return <UiEntity key={'pin-'+id} uiTransform={{positionType:'absolute',position:{left:fw*x-size/2,top:fh*y-size/2},width:size,height:size,borderRadius:size/2,borderWidth:3,borderColor:Color4.create(.005,.015,.04,1),alignItems:'center',justifyContent:'center'}} uiBackground={{color:Color4.create(.1,.92,1,1)}}><Label value={String(id)} fontSize={Math.max(20,size*.57)} textAlign="middle-center" color={Color4.create(.005,.015,.04,1)} uiTransform={{width:'100%',height:'100%'}} /></UiEntity>
    })}
   </UiEntity>
   <Label value="W A S D · MOVE     MOUSE · LOOK     SPACE · JUMP     CLICK · INTERACT / AUTO-SELECT TOOL" fontSize={Math.max(12,font)} textAlign="middle-center" color={white} uiTransform={{positionType:'absolute',position:{left:15,top:h-92},width:w-30,height:30}} />
   {button('BACK',h-60,()=>showIntroControls(false))}
  </UiEntity> : <UiEntity uiTransform={{width:'100%',height:'100%'}}>
   <UiEntity uiTransform={{positionType:'absolute',position:{left:(w-artWidth)/2,top:(h-artHeight)/2},width:artWidth,height:artHeight}} uiBackground={{texture:{src:mobile?'assets/images/ui-rpg/start-menu-background-mobile.png':'assets/images/ui-rpg/start-menu-background.png'},textureMode:'stretch',color:Color4.White()}} />
   <UiEntity uiTransform={{positionType:'absolute',position:{left:menuCenter-menuWidth/2,top:menuTop},width:menuWidth,height:titleHeight}} uiBackground={{texture:{src:'assets/images/ui-rpg/pangea-agents-title.png'},textureMode:'stretch'}} />
   <Label value="REBUILD NOVATERRA · TOGETHER" fontSize={Math.max(14,Math.min(22,menuWidth/19))} textAlign="middle-center" color={white} uiTransform={{positionType:'absolute',position:{left:menuCenter-menuWidth/2,top:captionY},width:menuWidth,height:32}} />
   {button(isIntroStarting()?'STARTING...':'START GAME',startY,()=>{void startIntroGame()},menuCenter)}
   {button('CONTROLS',controlsY,()=>showIntroControls(true),menuCenter)}
   <Label value="E · START GAME" fontSize={16} textAlign="middle-center" color={gold} uiTransform={{positionType:'absolute',position:{left:menuCenter-menuWidth/2,top:hintY},width:menuWidth,height:24}} />
  </UiEntity>}
 </UiEntity>
}
