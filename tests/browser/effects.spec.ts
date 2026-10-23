import {test,expect} from '@playwright/test';

test('all persona effects render without freezing and transient effects remain bounded',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.waitForFunction(()=>(window as any).__LIMBUS__?.scene.ready);
  for(const sinner of ['don','heath']){
    await page.locator('#choose').click();await page.locator(`[data-sinner="${sinner}"]`).click();await page.locator('#mode-select').selectOption('training');await page.locator('#deploy').click();
    const commands=['qcf','qcb','dp','ddj','qcfk','qcbl','dpj'];
    for(const command of commands){
      const key=await page.evaluate(command=>{const api=(window as any).__LIMBUS__,scene=api.scene,m=api.match,f=m.fighters[0];m.phase='fight';m.paused=true;m.hitstop=0;f.attack=null;f.ego=100;f.cooldowns={};f.x=680;m.fighters[1].x=1110;f.facing=1;f.y=570;f.vy=0;f.stun=0;f.beginAttack('special',{held:{},pressed:{}},command);
        for(const age of [Math.max(1,f.attack.startup-2),f.attack.startup+3,f.attack.startup+f.attack.active+3]){f.attackAge=age;scene.update(performance.now(),0);scene.game.renderer.snapshotPixel(0,0,()=>{});}
        f.attackAge=f.attack.startup+Math.min(8,f.attack.active-1);scene.game.step(performance.now(),0);return f.appearance;},command);
      if(['queen','w','t','n','wild','middle'].includes(key))await page.screenshot({path:`docs/screenshots/fx-${key}.png`});
    }
    await page.evaluate(()=>{const a=(window as any).__LIMBUS__;a.match.paused=false;a.match.fighters[0].attack=null;});
    const frame=await page.evaluate(()=>(window as any).__LIMBUS__.match.frame);await page.waitForTimeout(350);expect(await page.evaluate(()=>(window as any).__LIMBUS__.match.frame)).toBeGreaterThan(frame+5);
    await page.keyboard.press('Escape');await page.locator('#exit').click();
  }
  await page.locator('#choose').click();await page.locator('#deploy').click();
  const counts=await page.evaluate(()=>{const a=(window as any).__LIMBUS__,fx=a.scene.combatFX,m=a.match;m.paused=false;m.phase='fight';for(let i=0;i<400;i++)fx.event({type:'hit',x:750,y:500,source:0,value:150},m);fx.update(16,m,a.scene.sprites,false);const peak=fx.diagnostics;for(let i=0;i<70;i++)fx.update(16,m,a.scene.sprites,false);return {peak,after:fx.diagnostics};});
  expect(counts.peak.particles).toBeLessThanOrEqual(240);expect(counts.peak.bursts).toBeLessThanOrEqual(28);expect(counts.after).toEqual({particles:0,bursts:0,ghosts:0});expect(errors).toEqual([]);
});
