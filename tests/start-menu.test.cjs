const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),ts=require('typescript')
function harness(mobile=false){let controls=false,starts=0;const exports={},react={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat()})};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/startMenu.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.React,jsxFactory:'ReactEcs.createElement',esModuleInterop:true}}).outputText,{exports,Math,require:id=>id.includes('react-ecs')?{__esModule:true,default:react,UiEntity:'entity',Label:'label'}:id.includes('/math')?{Color4:{create:(...v)=>v,White:()=>[1,1,1,1]}}:id==='./audio'?{playInteractionSound(){}}:id==='./platform'?{isMobile:()=>mobile}:{isIntroControls:()=>controls,isIntroStarting:()=>false,showIntroControls:v=>{controls=v},startIntroGame:()=>{starts++}}});const flatten=n=>!n||typeof n!=='object'?[]:[n,...n.children.flatMap(flatten)];return {render:(w=1280,h=720)=>flatten(exports.renderStartMenu(w,h)),starts:()=>starts}}
test('console menu opens the screenshot controls guide and returns without starting gameplay',()=>{
 const h=harness(),nodes=h.render(),button=value=>nodes.find(n=>n.props.onMouseDown&&n.children.some(c=>c.props?.value===value));assert.ok(button('START GAME'));button('CONTROLS').props.onMouseDown();const guide=h.render();for(const text of ['YOUR OBJECTIVE','HERO · YOUR RESOURCES','TOOL SELECTOR','NOVATERRA · SHARED STOCK','ACTION FEEDBACK'])assert.ok(guide.some(n=>n.props.value?.includes(text)),text);assert.ok(guide.some(n=>n.props.uiBackground?.texture?.src==='assets/images/ui-rpg/controls-gameplay.jpg'));assert.equal(guide.filter(n=>n.props.uiTransform?.borderRadius>0).length,5);assert.ok(guide.some(n=>n.props.value?.includes('resets your carried counters to 0')));assert.equal(h.starts(),0);guide.find(n=>n.props.onMouseDown&&n.children.some(c=>c.props?.value==='BACK')).props.onMouseDown();const menu=h.render();menu.find(n=>n.props.onMouseDown&&n.children.some(c=>c.props?.value==='START GAME')).props.onMouseDown();assert.equal(h.starts(),1)
})


test('start menu has opaque custom art, preserves image proportions and keeps both actions inside the screen',()=>{
 for(const [w,h] of [[1920,1080],[1280,720],[640,360],[390,844]]){
  const nodes=harness().render(w,h),art=nodes.find(n=>n.props.uiBackground?.texture?.src==='assets/images/ui-rpg/start-menu-background.png')
  assert.ok(art);assert.equal(nodes[0].props.uiBackground.color[3],1);assert.equal(art.props.uiBackground.color[3],1)
  const t=art.props.uiTransform;assert.ok(t.width>=w&&t.height>=h);assert.ok(Math.abs(t.width/t.height-1672/941)<1e-9)
  assert.equal(nodes.some(n=>n.props.uiBackground?.texture?.src==='assets/images/ui-rpg/controls-gameplay.jpg'),false)
  for(const name of ['START GAME','CONTROLS']){const button=nodes.find(n=>n.props.onMouseDown&&n.children.some(c=>c.props?.value===name)),b=button.props.uiTransform;assert.ok(b.position.left>=0&&b.position.left+b.width<=w);assert.ok(b.position.top>=0&&b.position.top+b.height<=h)}
 }
})
test('on phones the menu buttons sit centred in the upper part of the screen, clear of the touch controls',()=>{
 for(const [w,h] of [[844,390],[1280,720],[1920,1080]]){const nodes=harness(true).render(w,h),buttons=nodes.filter(n=>n.props.onMouseDown)
  assert.equal(buttons.length,2)
  for(const b of buttons){const t=b.props.uiTransform;assert.ok(Math.abs(t.position.left+t.width/2-w/2)<1,'centred');assert.ok(t.position.top+t.height<=h*.7,'above the touch controls at '+w+'x'+h);assert.ok(t.width<=w*.3+1)}}
})


test('mobile and desktop use separate landscape covers while the mobile actions remain centred',()=>{
 for(const [mobile,w,h] of [[true,844,390],[true,1280,720],[false,1920,1080]]){
  const nodes=harness(mobile).render(w,h),path=mobile?'assets/images/ui-rpg/start-menu-background-mobile.png':'assets/images/ui-rpg/start-menu-background.png'
  const art=nodes.find(n=>n.props.uiBackground?.texture?.src===path);assert.ok(art)
  const t=art.props.uiTransform;assert.ok(Math.abs(t.width/t.height-1672/941)<1e-9);assert.equal(art.props.uiBackground.color[3],1)
  if(mobile)for(const name of ['START GAME','CONTROLS']){const b=nodes.find(n=>n.props.onMouseDown&&n.children.some(c=>c.props?.value===name)).props.uiTransform;assert.ok(Math.abs(b.position.left+b.width/2-w/2)<1)}
 }
})
