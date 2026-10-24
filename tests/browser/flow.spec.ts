import {test,expect,type Page} from '@playwright/test';

async function step(page:Page,count=1){
  return page.evaluate(count=>{
    const a=(window as any).__LIMBUS__;
    for(let i=0;i<count;i++)a.scene.update(performance.now(),1000/60+.001);
    const m=a.match,f=m.fighters[0];return {stop:m.hitstop,id:f.attack?.id,age:f.attackAge,hits:m.totals[0].hits,combo:f.combo,appearance:f.appearance,buffer:f.buffer};
  },count);
}
async function toHit(page:Page,hits:number){
  for(let i=0;i<90;i++){const s=await step(page);if(s.hits>=hits)return s;}
  throw new Error(`Contact ${hits} missed`);
}
async function reset(page:Page,sinner='don'){
  await page.evaluate(sinner=>{
    const a=(window as any).__LIMBUS__;a.app.controls.clear();
    a.scene.startMatch({...a.match.options,p1:a.app.equipped(0,`${sinner}-lcb`),mode:'local',clash:false});
    const m=a.match;m.phase='fight';m.fighters[0].x=650;m.fighters[1].x=725;m.fighters[0].ego=100;m.fighters[1].hp=10000;
  },sinner);
}
test('real keyboard motions remain ordered across hitstop for all twelve sinners',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.waitForFunction(()=>(window as any).__LIMBUS__?.scene.ready);
  const sinners=await page.evaluate(()=>{
    const a=(window as any).__LIMBUS__;a.start({mode:'local',clash:false});a.scene.game.loop.sleep();
    return ['yi','faust','don','ryoshu','meur','hong','heath','ish','rod','sin','outis','greg'];
  });
  for(const sinner of sinners){
    await reset(page,sinner);await page.keyboard.press('j');await step(page);const hit=await toHit(page,1);expect(hit.stop).toBe(2);
    await page.keyboard.down('s');expect((await step(page)).age).toBe(hit.age);
    await page.keyboard.down('d');expect((await step(page)).age).toBe(hit.age);
    await page.keyboard.up('s');await page.keyboard.press('j');const cast=await step(page);await page.keyboard.up('d');
    const expected=await page.evaluate(()=>(window as any).__LIMBUS__.match.fighters[0].identity.commandMoves.qcf);
    expect(cast.id,`${sinner}: lost a direction during freeze`).toBe(expected.id);expect(cast.appearance).toBe(expected.appearance);
    // Repeat with normal chains and a genuine slower motion after the launcher.
    await reset(page,sinner);await page.keyboard.press('j');await step(page);let contact=await toHit(page,1);
    await step(page,contact.stop+8);await page.keyboard.press('k');contact=await toHit(page,2);
    await step(page,contact.stop+5);await page.keyboard.press('l');contact=await toHit(page,3);
    await step(page,contact.stop+4);
    const back=['heath','ryoshu','outis'].includes(sinner),horizontal=back?'a':'d';
    await page.keyboard.down('s');await step(page,2);await page.keyboard.down(horizontal);await step(page,2);
    await page.keyboard.up('s');await page.keyboard.press(back?'k':'j');await step(page);await page.keyboard.up(horizontal);
    const final=await toHit(page,4);expect(final.combo,`${sinner}: real-input chain broke`).toBeGreaterThanOrEqual(4);
  }
  expect(errors).toEqual([]);
});

test('stable HUD values do not rebuild combo and win nodes every frame',async({page})=>{
  await page.goto('/');await page.waitForFunction(()=>(window as any).__LIMBUS__?.scene.ready);
  await page.evaluate(()=>{const a=(window as any).__LIMBUS__;a.start({mode:'training'});a.match.phase='fight';});
  await page.waitForTimeout(100);
  const changes=await page.evaluate(async()=>{
    let count=0;const observer=new MutationObserver(records=>{count+=records.length;});
    for(const selector of ['#combo0','#combo1','#wins0','#wins1','#hptext0','#timer'])observer.observe(document.querySelector(selector)!,{childList:true,subtree:true});
    await new Promise(resolve=>setTimeout(resolve,350));observer.disconnect();return count;
  });
  expect(changes).toBe(0);
});

test('mobile touch can queue a weapon cancel during hitstop',async({browser})=>{
  const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
  const page=await context.newPage();await page.goto('/');await page.waitForFunction(()=>(window as any).__LIMBUS__?.scene.ready);
  await page.evaluate(()=>{const a=(window as any).__LIMBUS__;a.start({mode:'training',clash:false});a.scene.game.loop.sleep();});await reset(page);
  const client=await context.newCDPSession(page);
  async function touch(selector:string){const b=await page.locator(selector).boundingBox();expect(b).toBeTruthy();await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b!.x+b!.width/2,y:b!.y+b!.height/2,id:1}]});}
  const release=()=>client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await touch('.attack-light');await step(page);await release();const first=await toHit(page,1);
  await touch('.attack-heavy');const frozen=await step(page);await release();expect(frozen.age).toBe(first.age);expect(frozen.buffer?.action).toBe('heavy');
  const second=await toHit(page,2);expect(second.id).toBe('heavy');expect(second.combo).toBe(2);
  await context.close();
});
