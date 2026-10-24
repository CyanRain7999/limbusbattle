import {test,expect} from '@playwright/test';

test('all twelve LCB bodies and weapon contact poses keep their ground origin and clear frames',async({page})=>{
  test.setTimeout(90000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.waitForFunction(()=>(window as any).__LIMBUS__?.scene.ready);
  for(const sinner of ['yi','faust','don','ryoshu','meur','hong','heath','ish','rod','sin','outis','greg']){
    await page.locator('#choose').click();await page.locator(`[data-sinner="${sinner}"]`).click();await page.locator('#mode-select').selectOption('training');await page.locator('#deploy').click();
    const poses=await page.evaluate(()=>{
      const a=(window as any).__LIMBUS__,m=a.match,f=m.fighters[0],scene=a.scene;m.phase='fight';m.paused=true;f.x=700;m.fighters[1].x=1450;const result:number[]=[];
      for(const stance of ['stand','crouch','air'])for(const action of ['light','heavy','special','lightAlt','mediumAlt','heavyAlt']){
        f.attack=null;f.y=stance==='air'?350:570;f.vy=f.vx=f.stun=f.landingLag=0;f.airNormals.clear();f.cooldowns={};f.buffer=null;
        if(!f.beginAttack(action,{held:stance==='crouch'?{crouch:true}:{},pressed:{}}))throw Error('Normal unavailable');
        f.attackAge=f.attack.startup;scene.update(performance.now(),0);
        const sprite=scene.sprites[0];if(sprite.texture.key!==f.identity.sinner+'-normals')throw Error('Wrong LCB weapon sheet');
        if(sprite.x!==700||sprite.y!==f.y)throw Error('Sprite body origin drift');result.push(Number(sprite.frame.name));
      }
      f.attack=null;f.y=570;m.paused=false;return result;
    });
    expect(poses).toEqual(Array.from({length:18},(_,i)=>i));
    await page.keyboard.press('Escape');await page.locator('#exit').click();
  }
  expect(errors).toEqual([]);
});
