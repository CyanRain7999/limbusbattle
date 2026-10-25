import {test,expect} from '@playwright/test';
import fs from 'node:fs';

test('guard, reflection, charge, fixed trap and sigils render their actual runtime states',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.waitForFunction(()=>(window as any).__LIMBUS__?.scene.ready);
  await page.evaluate(()=>{const a=(window as any).__LIMBUS__;a.start({mode:'training',clash:false});a.scene.game.loop.sleep();});
  fs.mkdirSync('docs/screenshots',{recursive:true});
  for(const [sinner,slot,kind] of [['outis','qcbl','trap'],['meur','qcf','guard'],['ish','ddj','reflect'],['heath','ddj','charge'],['sin','qcb','seals']]){
    const state=await page.evaluate(({sinner,slot,kind})=>{
      const a=(window as any).__LIMBUS__,scene=a.scene;a.app.controls.clear();
      a.start({...a.match.options,p1:a.app.equipped(0,sinner+'-lcb'),mode:'local',clash:false});
      const m=a.match,f=m.fighters[0],b=m.fighters[1];m.phase='fight';f.x=700;b.x=kind==='trap'?1300:765;f.ego=100;a.app.refreshSkillBar(f.identity);
      if(!f.beginAttack('special',{held:{},pressed:{}},slot))throw Error('Could not cast '+kind);
      if(kind==='trap'){f.attackAge=f.attack.startup-1;for(let i=0;i<20;i++)scene.update(performance.now(),1000/60+.001);}
      if(kind==='guard')f.attackAge=4;
      if(kind==='reflect'){
        f.attackAge=4;m.projectiles.push({id:1,source:1,x:742,y:490,vx:-20,vy:0,width:30,height:20,life:30,move:{...b.identity.commandMoves.qcf,projectile:undefined,damage:100}});
        scene.update(performance.now(),1000/60+.001);
      }
      if(kind==='charge'){f.attackAge=f.attack.startup-1;for(let i=0;i<18;i++)f.step({held:{light:true},pressed:{}},b);}
      if(kind==='seals'){f.attackAge=f.attack.startup-1;scene.update(performance.now(),1000/60+.001);}
      m.paused=true;scene.cameras.main.scrollX=240;scene.update(performance.now(),0);scene.game.step(performance.now(),0);
      return {seals:b.seals[0],charge:f.moveCharge,guard:f.attack?.guardPoint,field:m.delayedStrikes.map((s:any)=>({kind:s.kind,x:s.x,delay:s.delay})),projectile:m.projectiles.map((p:any)=>({source:p.source,vx:p.vx})),texture:scene.sprites[0].texture.key,expected:f.attack.visualKey};
    },{sinner,slot,kind});
    expect(state.texture).toBe(state.expected);
    if(kind==='trap'){expect(state.field).toHaveLength(1);expect(state.field[0].kind).toBe('snare');expect(state.field[0].delay).toBe(0);}
    if(kind==='guard')expect(state.guard).toEqual([3,9]);
    if(kind==='reflect'){expect(state.projectile[0].source).toBe(0);expect(state.projectile[0].vx).toBeGreaterThan(0);}
    if(kind==='charge')expect(state.charge).toBe(18);
    if(kind==='seals'){expect(state.seals).toBe(2);await expect(page.locator('#status1')).toContainText('朱符 2');await expect(page.locator('#skill-cost-qcbl')).toContainText('140体力');}
    await page.locator('#game canvas').screenshot({path:`docs/screenshots/kit-${kind}.png`});
  }
  expect(errors).toEqual([]);
});

test('landscape touch shows HP costs and refuses an unaffordable Crimson cast',async({browser})=>{
  const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const page=await context.newPage();
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.waitForFunction(()=>(window as any).__LIMBUS__?.scene.ready);
  await page.evaluate(()=>{const a=(window as any).__LIMBUS__;a.start({p1:a.app.equipped(0,'sin-lcb'),mode:'local',clash:false});a.match.phase='fight';a.match.fighters[0].hp=70;a.match.fighters[0].ego=100;});
  await page.locator('#persona-toggle').tap();await expect(page.locator('.command-qcbl')).toHaveAttribute('aria-disabled','true');
  await expect(page.locator('#skill-cost-qcbl')).toContainText('80体力');await page.locator('.command-qcbl').tap({force:true});
  await page.waitForTimeout(100);expect(await page.evaluate(()=>(window as any).__LIMBUS__.match.fighters[0].hp)).toBe(70);
  expect(await page.evaluate(()=>(window as any).__LIMBUS__.match.fighters[0].attack)).toBeNull();expect(errors).toEqual([]);await context.close();
});
