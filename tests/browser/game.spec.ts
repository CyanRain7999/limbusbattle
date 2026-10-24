import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';

test.beforeEach(async({page})=>{await page.goto('/');await page.waitForFunction(()=>(window as any).__LIMBUS__?.scene.ready);});
async function start(page:Page,mode='local'){
  await page.locator(`[data-mode="${mode}"]`).click();await page.locator('#choose').click();
  if(mode==='cpu')await page.locator('#difficulty-select').selectOption('easy');
  await page.locator('#deploy').click();await page.waitForFunction(()=>(window as any).__LIMBUS__.scene.match?.phase==='fight');
}

test('selection, identity, stage, two keyboards, jump, hit, pause and restart',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='warning'||m.type()==='error')errors.push(m.text());});
  await page.locator('#choose').click();await page.locator('[data-sinner="heath"]').click();await expect(page.locator('[data-loadout]')).toHaveCount(7);await expect(page.locator('[data-loadout="1"]')).toHaveValue('heath-wild-burial');
  await page.locator('#stage-select').selectOption('bridge');await page.locator('#mode-select').selectOption('local');
  fs.mkdirSync('docs/screenshots',{recursive:true});await page.waitForTimeout(200);await page.screenshot({path:'docs/screenshots/select.png'});
  await page.locator('#deploy').click();await page.waitForFunction(()=>(window as any).__LIMBUS__.scene.match.phase==='fight');
  const before=await page.evaluate(()=>(window as any).__LIMBUS__.scene.match.fighters.map((f:any)=>f.x));
  await page.keyboard.down('a');await page.keyboard.down('ArrowRight');await page.waitForTimeout(200);await page.keyboard.up('a');await page.keyboard.up('ArrowRight');
  const after=await page.evaluate(()=>(window as any).__LIMBUS__.scene.match.fighters.map((f:any)=>f.x));expect(after[0]).toBeLessThan(before[0]);expect(after[1]).toBeGreaterThan(before[1]);
  await page.keyboard.press('w');await page.waitForTimeout(150);expect(await page.evaluate(()=>(window as any).__LIMBUS__.scene.match.fighters[0].y)).toBeLessThan(570);await page.waitForTimeout(1000);
  await page.evaluate(()=>{const m=(window as any).__LIMBUS__.scene.match;m.fighters[0].x=800;m.fighters[1].x=900;});
  await page.keyboard.press('j');await page.waitForTimeout(250);expect(await page.evaluate(()=>(window as any).__LIMBUS__.scene.match.totals[0].hits)).toBe(1);
  await page.screenshot({path:'docs/screenshots/battle.png'});
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveAttribute('aria-label','行动暂缓');const timer=await page.locator('#timer').textContent();await page.waitForTimeout(200);expect(await page.locator('#timer').textContent()).toBe(timer);
  await page.locator('#restart').click();expect(await page.evaluate(()=>(window as any).__LIMBUS__.scene.match.wins)).toEqual([0,0]);
  expect(errors).toEqual([]);
});

test('key rebinding persists and conflicting bindings are rejected',async({page})=>{
  await page.getByRole('button',{name:'游戏设置'}).click();await page.locator('[data-rebind="light"]').click();await page.keyboard.press('f');await expect(page.locator('[data-rebind="light"]')).toContainText('F');
  await page.locator('[data-rebind="heavy"]').click();await page.keyboard.press('f');await expect(page.locator('[data-rebind="heavy"]')).toContainText('K');
  await page.reload();await page.waitForFunction(()=>(window as any).__LIMBUS__?.scene.ready);await page.getByRole('button',{name:'游戏设置'}).click();await expect(page.locator('[data-rebind="light"]')).toContainText('F');
});

test('a keyboard player defeats the easy CPU over a complete best-of-three and rematches',async({page})=>{
  test.setTimeout(150000);await start(page,'cpu');
  let held='';const deadline=Date.now()+120000;let state:any;
  while(Date.now()<deadline){
    state=await page.evaluate(()=>{const m=(window as any).__LIMBUS__.scene.match;return {phase:m.phase,winner:m.winner,wins:m.wins,damage:m.totals.map((t:any)=>t.damage),fighters:m.fighters.map((f:any)=>({x:f.x,y:f.y,hp:f.hp,stun:f.stun,ego:f.ego,attack:f.attack?{id:f.attack.id,action:f.attack.action,cancel:f.attack.cancel}:null,age:f.attackAge,connected:f.connected}))};});
    if(state.phase==='finished')break;
    const [a,b]=state.fighters,delta=b.x-a.x;let direction=Math.abs(delta)>104?(delta>0?'d':'a'):'';
    if(a.attack||a.stun||state.phase!=='fight')direction='';
    if(direction!==held){if(held)await page.keyboard.up(held);held=direction;if(held)await page.keyboard.down(held);}
    if(state.phase==='fight'&&!a.stun){
      if(!a.attack&&Math.abs(delta)<150)await page.keyboard.press(a.ego>=80?'h':'j');
      else if(a.connected&&a.attack&&a.age>=a.attack.cancel[0]&&a.age<=a.attack.cancel[1]){
        if(a.attack.id==='light')await page.keyboard.press('k');
        else if(a.attack.id==='heavy')await page.keyboard.press('l');
        else if(a.attack.id==='special'&&a.y>=570&&b.y<560)await page.keyboard.press('w');
        else await page.keyboard.press(a.ego>=80?'h':'l');
      }
    }
    await page.waitForTimeout(35);
  }
  if(held)await page.keyboard.up(held);
  expect(state.phase,JSON.stringify(state)).toBe('finished');expect(state.winner,JSON.stringify(state)).toBe(0);expect(state.damage[0]).toBeGreaterThan(2000);
  await expect(page.locator('#rematch')).toBeVisible();await page.screenshot({path:'docs/screenshots/results.png'});await page.locator('#rematch').click();expect(await page.evaluate(()=>(window as any).__LIMBUS__.scene.match.fighters[1].hp)).toBe(1150);expect(await page.evaluate(()=>(window as any).__LIMBUS__.scene.match.wins)).toEqual([0,0]);
});

test('mobile landscape handles two concurrent real touch contacts',async({browser})=>{
  const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const page=await context.newPage();await page.goto('/');await page.waitForFunction(()=>(window as any).__LIMBUS__?.scene.ready);await start(page,'training');await expect(page.locator('#touch-controls')).toBeVisible();
  const client=await context.newCDPSession(page),move=await page.locator('.dir-right').boundingBox(),attack=await page.locator('.attack-light').boundingBox();expect(move).toBeTruthy();expect(attack).toBeTruthy();
  const point=(box:NonNullable<typeof move>,id:number)=>({x:box.x+box.width/2,y:box.y+box.height/2,id});
  const x=await page.evaluate(()=>(window as any).__LIMBUS__.scene.match.fighters[0].x);
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(move!,1)]});await page.waitForTimeout(180);
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(move!,1),point(attack!,2)]});await page.waitForTimeout(100);
  const during=await page.evaluate(()=>{const f=(window as any).__LIMBUS__.scene.match.fighters[0];return {x:f.x,attack:f.attack?.id};});expect(during.x).toBeGreaterThan(x);expect(during.attack).toBe('light');
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(500);expect(await page.locator('.touch-key.pressed').count()).toBe(0);
  await page.screenshot({path:'docs/screenshots/mobile.png'});await context.close();
});
