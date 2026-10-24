import {test,expect} from '@playwright/test';

test('six keyboard weapon normals render dedicated lance/bat poses and Space starts a throw',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.waitForFunction(()=>(window as any).__LIMBUS__?.scene.ready);
  for(const sinner of ['don','heath']){
    await page.locator('#choose').click();await page.locator(`[data-sinner="${sinner}"]`).click();await page.locator('#mode-select').selectOption('training');await page.locator('#deploy').click();await page.waitForFunction(()=>(window as any).__LIMBUS__.match.phase==='fight');
    for(const [pose,key] of ['j','k','l','u','i','o'].entries()){
      await page.evaluate(()=>{const a=(window as any).__LIMBUS__,f=a.match.fighters[0];a.app.controls.clear();f.attack=null;f.motion.clear();f.x=500;f.y=570;f.vx=f.vy=f.stun=0;f.buffer=null;a.match.fighters[1].x=1450;});
      await page.keyboard.press(key);
      await expect.poll(()=>page.evaluate(()=>{const a=(window as any).__LIMBUS__,s=a.scene.sprites[0];return s.texture.key.endsWith('-normals')?Number(s.frame.name):-1;}),{intervals:[5],timeout:1000}).toBe(pose);
    }
    await page.waitForFunction(()=>(window as any).__LIMBUS__.match.fighters[0].attack===null);
    await page.evaluate(()=>{const m=(window as any).__LIMBUS__.match;m.fighters[0].x=650;m.fighters[1].x=710;});await page.keyboard.press('Space');
    await expect.poll(()=>page.evaluate(()=>(window as any).__LIMBUS__.match.fighters[1].state),{intervals:[5]}).toBe('thrown');
    await page.keyboard.press('Escape');await page.locator('#exit').click();
  }
  expect(errors).toEqual([]);
});

test('landscape touch offers six weapon buttons, throw, and a folding persona panel that switches in air',async({browser})=>{
  const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.waitForFunction(()=>(window as any).__LIMBUS__?.scene.ready);await page.locator('#choose').click();await page.locator('#mode-select').selectOption('training');await page.locator('#deploy').click();await page.waitForFunction(()=>(window as any).__LIMBUS__.match.phase==='fight');
  await expect(page.locator('.normal-grid button:visible')).toHaveCount(6);await expect(page.locator('.attack-throw')).toBeVisible();await expect(page.locator('.touch-command-grid')).toBeHidden();await page.locator('#persona-toggle').tap();await expect(page.locator('.touch-command:visible')).toHaveCount(7);
  await page.evaluate(()=>{const a=(window as any).__LIMBUS__,f=a.match.fighters[0];f.y=390;f.vy=-2;a.match.paused=true;});
  await expect(page.locator('.touch-command:visible')).toHaveCount(2);await expect(page.locator('.command-qcf')).toContainText('空');await expect(page.locator('.attack-ego')).toBeHidden();
  await page.evaluate(()=>{const a=(window as any).__LIMBUS__,f=a.match.fighters[0];f.y=570;f.vy=0;f.beginAttack('heavy',{held:{},pressed:{}});f.attackAge=f.attack.startup;});await page.waitForTimeout(80);await page.screenshot({path:'docs/screenshots/weapon-mobile.png'});
  expect(errors).toEqual([]);await context.close();
});
