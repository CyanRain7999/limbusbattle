import {test,expect} from '@playwright/test';

test('last three are selectable in landscape touch and cast ground/air personas',async({browser})=>{
  test.setTimeout(60000);
  const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
  const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.waitForFunction(()=>(window as any).__LIMBUS__?.scene.ready);
  for(const sinner of ['faust','hong','sin']){
    await page.locator('#choose').tap();await expect(page.locator('[data-sinner]')).toHaveCount(12);
    await page.locator(`[data-sinner="${sinner}"]`).tap();await page.locator('#mode-select').selectOption('training');await page.locator('#deploy').tap();
    await page.waitForFunction(()=>(window as any).__LIMBUS__.match.phase==='fight');
    await expect(page.locator('.normal-grid button:visible')).toHaveCount(6);
    const groundExpected=await page.evaluate(()=>{const a=(window as any).__LIMBUS__,f=a.match.fighters[0];f.x=500;a.match.fighters[1].x=1500;return f.identity.commandMoves.qcf.id;});
    if(await page.locator('#persona-toggle').getAttribute('aria-expanded')!=='true')await page.locator('#persona-toggle').tap();
    await expect(page.locator('.touch-command:visible')).toHaveCount(7);
    await page.locator('.command-qcf').tap();
    await expect.poll(()=>page.evaluate(()=>(window as any).__LIMBUS__.match.fighters[0].attack?.id),{intervals:[5]}).toBe(groundExpected);
    await page.waitForFunction(()=>(window as any).__LIMBUS__.match.fighters[0].attack===null);
    const expected=await page.evaluate(()=>{const a=(window as any).__LIMBUS__,f=a.match.fighters[0];f.y=330;f.vy=-1;f.landingLag=0;f.airSpecialUsed=false;f.cooldowns={};return f.identity.airCommandMoves.qcb.id;});
    await expect(page.locator('.touch-command:visible')).toHaveCount(2);await page.locator('.command-qcb').tap();
    await expect.poll(()=>page.evaluate(()=>(window as any).__LIMBUS__.match.fighters[0].attack?.id),{intervals:[5]}).toBe(expected);
    await page.evaluate(()=>{const a=(window as any).__LIMBUS__;a.match.paused=true;});
    await page.screenshot({path:`docs/screenshots/mobile-${sinner}.png`});
    await page.keyboard.press('Escape');await page.locator('#exit').tap();
  }
  expect(errors).toEqual([]);await context.close();
});

test('archive explains all twelve roles and links to character selection',async({page})=>{
  await page.goto('/');await page.waitForFunction(()=>(window as any).__LIMBUS__?.scene.ready);
  await page.locator('[data-open="archives"]').first().click();
  await expect(page.locator('.archive-card.available')).toHaveCount(12);
  await expect(page.locator('.roster-comparison tbody tr')).toHaveCount(12);
  await expect(page.locator('.roster-comparison')).toContainText('前摇诈势');
  await page.locator('[data-archive="sin"]').click();await expect(page.locator('[data-sinner="sin"]')).toHaveClass(/chosen/);await expect(page.locator('.trait-guide')).toContainText('贴符与献血');
});
