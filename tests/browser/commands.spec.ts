import {test,expect,type Page} from '@playwright/test';

async function motion(page:Page,nums:number[],button:string){
  let held=new Set<string>();
  for(const n of nums){const next=new Set<string>();if([1,2,3].includes(n))next.add('s');if([1,4,7].includes(n))next.add('a');if([3,6,9].includes(n))next.add('d');for(const k of held)if(!next.has(k))await page.keyboard.up(k);for(const k of next)if(!held.has(k))await page.keyboard.down(k);held=next;await page.waitForTimeout(34);}
  await page.keyboard.down(button);await page.waitForTimeout(34);await page.keyboard.up(button);for(const k of held)await page.keyboard.up(k);
}
test('all fourteen commands use real keyboard motions and the correct temporary persona texture',async({page})=>{
  test.setTimeout(60000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.waitForFunction(()=>(window as any).__LIMBUS__?.scene.ready);
  const commands=[{id:'qcf',nums:[2,3,6],button:'j'},{id:'qcb',nums:[2,1,4],button:'k'},{id:'dp',nums:[6,2,3],button:'l'},{id:'ddj',nums:[2,5,2],button:'j'},{id:'qcfk',nums:[2,3,6],button:'k'},{id:'qcbl',nums:[2,1,4],button:'l'},{id:'dpj',nums:[6,2,3],button:'j'}];
  for(const sinner of ['don','heath']){
    await page.locator('#choose').click();await page.locator(`[data-sinner="${sinner}"]`).click();await page.locator('#mode-select').selectOption('training');await page.locator('#deploy').click();await page.waitForFunction(()=>(window as any).__LIMBUS__.match.phase==='fight');
    for(const c of commands){
      const expected=await page.evaluate(id=>{const api=(window as any).__LIMBUS__,m=api.match,f=m.fighters[0];api.app.controls.clear();f.attack=null;f.stun=0;f.vx=0;f.vy=0;f.y=570;f.x=500;f.facing=1;f.ego=100;f.cooldowns={};f.motion.clear();m.fighters[1].x=1450;m.hitstop=0;return {id:f.identity.commandMoves[id].id,key:f.identity.commandMoves[id].visualKey??`${f.identity.sinner}-premium`};},c.id);
      await motion(page,c.nums,c.button);
      await expect.poll(()=>page.evaluate(()=>{const api=(window as any).__LIMBUS__;return {id:api.match.fighters[0].attack?.id,key:api.scene.sprites[0].texture.key};}),{timeout:1000,intervals:[10]}).toEqual(expected);
      await page.waitForFunction(()=>(window as any).__LIMBUS__.match.fighters[0].attack===null);
      expect(await page.evaluate(()=>(window as any).__LIMBUS__.scene.sprites[0].texture.key)).toBe(`${sinner}-premium`);
    }
    await page.keyboard.press('Escape');await page.locator('#exit').click();
  }
  expect(errors).toEqual([]);
});
