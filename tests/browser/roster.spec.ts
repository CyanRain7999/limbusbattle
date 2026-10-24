import {test,expect} from '@playwright/test';
import fs from 'node:fs';

test('four new sinners load every ground/air persona, render all phases, and keep running',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().includes('/characters/'))errors.push(`${r.status()} ${r.url()}`);});
  await page.goto('/');await page.waitForFunction(()=>(window as any).__LIMBUS__?.scene.ready);
  fs.mkdirSync('docs/screenshots',{recursive:true});
  for(const sinner of ['ryoshu','meur','ish','rod']){
    await page.locator('#choose').click();await expect(page.locator('[data-sinner]')).toHaveCount(6);
    await page.locator(`[data-sinner="${sinner}"]`).click();await expect(page.locator('.trait-guide')).toBeVisible();
    await page.locator('#mode-select').selectOption('training');await page.locator('#deploy').click();
    const result=await page.evaluate(()=>{
      const a=(window as any).__LIMBUS__,m=a.match,f=m.fighters[0],scene=a.scene,checked:string[]=[];
      m.phase='fight';m.paused=true;m.hitstop=0;m.fighters[1].x=1500;
      for(const air of [false,true])for(const command of Object.keys(air?f.identity.airCommandMoves:f.identity.commandMoves)){
        f.attack=null;f.ego=100;f.cooldowns={};f.x=650;f.y=air?360:570;f.vx=f.vy=f.stun=0;f.airSpecialUsed=false;f.buffer=null;f.landingLag=0;
        if(!f.beginAttack('special',{held:{},pressed:{}},command))throw new Error(`Cannot use ${command}, air=${air}`);
        const key=f.attack.visualKey??`${f.identity.sinner}-premium`;
        for(const age of [0,f.attack.startup,f.attack.startup+f.attack.active-1,f.attack.startup+f.attack.active+3]){
          f.attackAge=age;scene.update(performance.now(),0);
          if(scene.sprites[0].texture.key!==key)throw new Error(`Wrong texture for ${f.attack.id}`);
          const frame=scene.sprites[0].frame;if(frame.width!==224||frame.height!==128)throw new Error(`Missing atlas ${key}`);
        }
        if(f.attack.projectile){f.attackAge=f.attack.startup-1;m.paused=false;m.step();m.paused=true;if(m.projectiles.length!==1)throw new Error(`Wrong projectile count for ${f.attack.id}`);scene.update(performance.now(),0);m.projectiles=[];}
        checked.push(f.attack.id);
      }
      f.attack=null;f.y=570;m.paused=false;return checked;
    });
    expect(result).toHaveLength(9);
    await expect(page.locator('#trait0')).not.toBeEmpty();
    const frame=await page.evaluate(()=>(window as any).__LIMBUS__.match.frame);await page.waitForTimeout(180);
    expect(await page.evaluate(()=>(window as any).__LIMBUS__.match.frame)).toBeGreaterThan(frame+3);
    for(const command of sinner==='meur'?['qcbl']:sinner==='ish'?['qcfk']:sinner==='rod'?['dp','qcbl']:['dp']){
      await page.evaluate(command=>{const a=(window as any).__LIMBUS__,m=a.match,f=m.fighters[0];m.paused=true;f.attack=null;f.cooldowns={};f.ego=100;f.x=700;f.y=570;f.stun=f.landingLag=0;f.beginAttack('special',{held:{},pressed:{}},command);f.attackAge=f.attack.startup+f.attack.active-1;a.scene.game.step(performance.now(),0);},command);
      await page.screenshot({path:`docs/screenshots/roster-${sinner}-${command}.png`});
    }
    await page.evaluate(()=>{const a=(window as any).__LIMBUS__;a.match.paused=false;a.match.fighters[0].attack=null;});
    await page.keyboard.press('Escape');await page.locator('#exit').click();
  }
  expect(errors).toEqual([]);
});
