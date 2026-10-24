import {test,expect} from '@playwright/test';
import fs from 'node:fs';

test('three weapon-normal tiers render distinct trails and bounded hit effects',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.waitForFunction(()=>(window as any).__LIMBUS__?.scene.ready);
  await page.locator('#choose').click();await page.locator('#mode-select').selectOption('training');await page.locator('#deploy').click();
  fs.mkdirSync('docs/screenshots',{recursive:true});
  const tiers=[];
  for(const [i,action] of ['light','heavy','heavyAlt'].entries()){
    tiers.push(await page.evaluate(({action})=>{
      const api=(window as any).__LIMBUS__,s=api.scene,m=api.match,f=m.fighters[0];
      m.phase='fight';m.paused=true;m.hitstop=0;m.fighters[1].x=1400;
      s.cameras.main.scrollX=480;
      f.attack=null;f.stun=f.landingLag=0;f.x=860;f.y=570;f.vx=f.vy=0;f.facing=1;
      s.combatFX.clear();f.beginAttack(action,{held:{},pressed:{}});f.attackAge=f.attack.startup+Math.floor(f.attack.active*.65);
      s.game.step(performance.now(),0);return f.attack.normal.strength;
    },{action}));
    await page.locator('#game canvas').screenshot({path:`docs/screenshots/normal-tier-${i+1}.png`});
    const count=await page.evaluate(()=>{
      const a=(window as any).__LIMBUS__,f=a.match.fighters[0];a.scene.combatFX.event({type:'hit',x:f.x+95,y:f.y-70,source:0,value:50},a.match);
      a.scene.game.step(performance.now(),0);return a.scene.combatFX.diagnostics.particles;
    });
    expect(count).toBe([4,9,16][i]);
  }
  expect(tiers).toEqual([1,2,3]);expect(errors).toEqual([]);
});
