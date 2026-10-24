import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const personaArt=JSON.parse(readFileSync(new URL('../../src/data/persona-art.json',import.meta.url),'utf8')) as {key:string}[];

test('project-path PWA precaches, launches offline and retains all persona textures',async({page,context})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('./?debug=1');await page.waitForFunction(()=>(window as any).__LIMBUS__?.scene.ready);
  const manifest=await (await page.request.get('./manifest.webmanifest')).json();expect(manifest.orientation).toBe('landscape');expect(manifest.start_url).toBe('./');expect(manifest.scope).toBe('./');expect(manifest.display).toBe('standalone');
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await context.setOffline(true);
  try{
    await page.reload();await page.waitForFunction(()=>(window as any).__LIMBUS__?.scene.ready);
    expect(await page.locator('[data-pwa-status]').textContent()).toContain('离线');
    const sinners=['yi','faust','don','ryoshu','meur','hong','heath','ish','rod','sin','outis','greg'];
    const keys=[...personaArt.map(p=>p.key),...sinners.flatMap(s=>[s+'-premium',s+'-normals'])];
    expect(keys).toHaveLength(97);
    expect(await page.evaluate(keys=>keys.every(key=>(window as any).__LIMBUS__.scene.textures.exists(key)),keys)).toBe(true);
    await page.locator('#choose').click();await page.locator('#mode-select').selectOption('training');await page.locator('#deploy').click();await page.waitForFunction(()=>(window as any).__LIMBUS__.match.phase==='fight');
    await expect(page.locator('#touch-controls')).toBeVisible();await page.waitForTimeout(250);await page.screenshot({path:'docs/screenshots/pwa-offline-mobile.png'});
  }finally{await context.setOffline(false);}
  expect(errors).toEqual([]);
});

test('touch joystick produces a real diagonal motion, attack finishes and rotation pauses safely',async({page,context})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('./?debug=1');await page.waitForFunction(()=>(window as any).__LIMBUS__?.scene.ready);await page.locator('#choose').click();await page.locator('#mode-select').selectOption('training');await page.locator('#deploy').click();await page.waitForFunction(()=>(window as any).__LIMBUS__.match.phase==='fight');
  await page.evaluate(()=>{const m=(window as any).__LIMBUS__.match;m.fighters[0].x=500;m.fighters[1].x=1450;});
  const stick=(await page.locator('.touch-directions').boundingBox())!,attack=(await page.locator('.attack-light').boundingBox())!,client=await context.newCDPSession(page);
  const center={x:stick.x+stick.width/2,y:stick.y+stick.height/2},r=stick.width*.34;
  const down={x:center.x,y:center.y+r,id:1},diagonal={x:center.x+r*.8,y:center.y+r*.8,id:1},right={x:center.x+r,y:center.y,id:1};
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[down]});await page.waitForTimeout(40);
  await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[diagonal]});await page.waitForTimeout(40);
  await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[right]});await page.waitForTimeout(40);
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[right,{x:attack.x+attack.width/2,y:attack.y+attack.height/2,id:2}]});
  await expect.poll(()=>page.evaluate(()=>(window as any).__LIMBUS__.match.fighters[0].attack?.id)).toBe('don-rip-space');
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForFunction(()=>(window as any).__LIMBUS__.match.fighters[0].attack===null);
  const frame=await page.evaluate(()=>(window as any).__LIMBUS__.match.frame);await page.waitForTimeout(400);expect(await page.evaluate(()=>(window as any).__LIMBUS__.match.frame)).toBeGreaterThan(frame+8);
  await page.evaluate(async()=>{if(document.fullscreenElement)await document.exitFullscreen();});
  await page.setViewportSize({width:390,height:844});await expect(page.locator('.rotate-note')).toBeVisible();expect(await page.evaluate(()=>(window as any).__LIMBUS__.match.paused)).toBe(true);
  await page.setViewportSize({width:844,height:390});await expect(page.locator('.rotate-note')).toBeHidden();expect(await page.evaluate(()=>(window as any).__LIMBUS__.match.paused)).toBe(false);
  expect(errors).toEqual([]);
});

test('installation prompt works and a waiting update cannot reload an active fight',async({page})=>{
  await page.goto('./?debug=1');await page.waitForFunction(()=>(window as any).__LIMBUS__?.scene.ready);
  await page.evaluate(()=>{const event=new Event('beforeinstallprompt');Object.assign(event,{prompt:async()=>{(window as any).installationPrompts=((window as any).installationPrompts??0)+1;},userChoice:Promise.resolve({outcome:'accepted'})});window.dispatchEvent(event);});
  await page.locator('[data-pwa-install]').first().click();expect(await page.evaluate(()=>(window as any).installationPrompts)).toBe(1);await page.evaluate(()=>window.dispatchEvent(new Event('appinstalled')));await expect(page.locator('[data-install-label]')).toHaveText('已安装');
  await page.locator('#choose').click();await page.locator('#mode-select').selectOption('training');await page.locator('#deploy').click();
  await page.evaluate(()=>{const app=(window as any).__LIMBUS__.app;app.pwa.updateAvailable=true;app.open('install');});await expect(page.locator('[data-pwa-update]')).toBeVisible();await expect(page.locator('[data-pwa-update]')).toBeDisabled();
  await page.locator('#close-modal').click();await page.locator('#exit').click();await page.locator('[data-pwa-install]').first().click();await expect(page.locator('[data-pwa-update]')).toBeEnabled();
});
