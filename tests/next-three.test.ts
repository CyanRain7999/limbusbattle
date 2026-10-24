import {describe,it,expect} from 'vitest';
import {Match} from '../src/combat/Match';
import {getIdentity} from '../src/characters/registry';
import {neutral,type Action,type Move,type MotionId} from '../src/core/types';
import {motionIds} from '../src/skills/catalog';

function fight(sinner:string,distance=80){const m=new Match({p1:getIdentity(sinner+'-lcb'),p2:getIdentity('don-lcb'),mode:'local',difficulty:'normal',clash:false,stage:'depot'});m.phase='fight';m.fighters[0].x=650;m.fighters[1].x=650+distance;m.fighters[0].ego=100;m.fighters[1].hp=10000;return m;}
function tick(m:Match,n:number){for(let i=0;i<n;i++)m.step();}
function hit(m:Match,action?:Action,command?:MotionId){const before=m.totals[0].hits;let gap=false;m.step([{held:{},pressed:action?{[action]:true}:{},command},neutral()]);for(let i=0;i<100&&m.totals[0].hits===before;i++){if(before&&!m.hitstop&&!m.fighters[1].stun)gap=true;m.step();}expect(m.totals[0].hits,m.fighters[0].lastMove).toBeGreaterThan(before);expect(gap,'actionable combo gap').toBe(false);while(m.hitstop)m.step();}

describe('Yi Sang, Outis and Gregor complete their own kits',()=>{
  it.each(['yi','outis','greg'])('%s equips six requested personas, LCB and two air commands',s=>{
    const m=fight(s,800),f=m.fighters[0];
    expect(new Set(Object.values(f.identity.commandMoves!).map(x=>x.appearance)).size).toBe(7);
    expect(Object.values(f.identity.moves).filter(x=>x.normal&&x.id!=='dashAttack')).toHaveLength(18);
    for(const slot of motionIds){f.attack=null;f.cooldowns={};f.ego=100;expect(f.beginAttack('special',neutral(),slot)).toBe(true);expect(f.appearance).toBe(f.identity.commandMoves![slot].appearance);f.interrupt(1);f.stun=0;expect(f.appearance).toBe('lcb');}
    expect(Object.keys(f.identity.airCommandMoves!)).toEqual(['qcf','qcb']);
  });
  it.each([['yi','dp'],['outis','qcb'],['greg','qcb']] as [string,MotionId][])('%s has a real light → medium → launcher → persona route',(s,slot)=>{const m=fight(s,65);hit(m,'light');hit(m,'heavy');hit(m,'special');hit(m,undefined,slot);expect(m.fighters[0].combo).toBeGreaterThanOrEqual(4);});
  it.each(['yi','outis','greg'])('%s air commands keep the fixed takeoff velocity',s=>{for(const command of ['qcf','qcb'] as const){const m=fight(s);m.step([{held:{right:true},pressed:{jump:true}},neutral()]);const f=m.fighters[0],vx=f.vx;m.step([{held:{left:true},pressed:{},command},neutral()]);expect(f.attack?.airOnly).toBe(true);expect(f.vx).toBe(vx);expect(f.airSpecialUsed).toBe(true);}});
});

describe('mirror placement is a fixed delayed attack',()=>{
  it('triggers only at persona active frames, hits once at the original mark, and then disappears',()=>{
    const m=fight('yi',214),[a,b]=m.fighters;a.beginAttack('special',neutral(),'dpj');a.attackAge=a.attack!.startup-1;m.step();expect(a.mirror?.x).toBe(815);
    a.attack=null;a.cooldowns={};a.beginAttack('special',neutral(),'qcf');a.attackAge=a.attack!.startup-2;m.step();expect(a.mirror).not.toBeNull();expect(m.delayedStrikes).toHaveLength(0);
    m.step();expect(a.mirror).toBeNull();expect(m.delayedStrikes).toHaveLength(1);expect(m.totals[0].hits).toBe(0);
    a.x=350;tick(m,11);expect(m.totals[0].hits).toBe(0);tick(m,2);expect(m.totals[0].hits).toBe(1);expect(m.delayedStrikes).toHaveLength(0);expect(b.hp).toBe(10000-Math.round(55*b.identity.defense));tick(m,30);expect(m.totals[0].hits).toBe(1);
  });
  it('expires, is not consumed by normals/air moves, and resets between rounds',()=>{
    const m=fight('yi',700),[a,b]=m.fighters;a.mirror={x:815,y:570,life:210};a.beginAttack('light',neutral());a.attackAge=a.attack!.startup-1;m.step();expect(a.mirror).not.toBeNull();
    a.attack=null;a.y=350;a.beginAttack('special',neutral(),'qcf');a.attackAge=a.attack!.startup-1;m.step();expect(a.mirror).not.toBeNull();
    a.attack=null;a.mirror!.life=1;a.step(neutral(),b);expect(a.mirror).toBeNull();
    m.phase='roundover';m.phaseTimer=1;m.wins=[1,0];m.step();tick(m,80);const fresh=m.fighters[0];fresh.ego=100;fresh.beginAttack('special',neutral(),'dpj');fresh.attackAge=fresh.attack!.startup-1;m.step();expect(fresh.mirror).not.toBeNull();
  });
  it('uses the mark position for blocking and knockback after the owner crosses sides',()=>{
    const m=fight('yi',214),[a,b]=m.fighters;a.x=1200;a.facing=-1;
    const move={...a.identity.commandMoves!.qcf,id:'mirror-test',damage:55,box:{x:-52,y:-115,w:104,h:115},hits:undefined};
    m.delayedStrikes.push({source:0,x:815,y:570,delay:0,life:6,move});m.step([neutral(),{held:{right:true},pressed:{}}]);
    expect(m.events.some(e=>e.type==='block')).toBe(true);expect(m.totals[0].hits).toBe(0);expect(b.vx).toBeGreaterThan(0);
  });
});

describe('Outis shared magazine and interruptible reload',()=>{
  it('spends exactly one round per shot, reloads without a projectile, and returns to LCB',()=>{
    const m=fight('outis',800),a=m.fighters[0];for(let i=0;i<3;i++){a.attack=null;a.cooldowns={};a.ego=100;expect(a.beginAttack('special',neutral(),'qcf')).toBe(true);expect(a.ammo).toBe(2-i);}
    a.attack=null;expect(a.beginAttack('special',neutral(),'qcf')).toBe(true);const reload=a.attack as Move|null;expect(reload?.reload).toBe(true);expect(reload?.projectile).toBeUndefined();tick(m,27);expect(a.ammo).toBe(0);m.step();expect(a.ammo).toBe(3);expect(m.projectiles).toHaveLength(0);tick(m,15);expect(a.appearance).toBe('lcb');
  });
  it('does not grant ammo on interruption and cannot reload in the air',()=>{
    const m=fight('outis',800),a=m.fighters[0];a.ammo=0;a.beginAttack('special',neutral(),'qcf');tick(m,12);a.interrupt(4);tick(m,20);expect(a.ammo).toBe(0);
    a.y=350;a.stun=0;expect(a.beginAttack('special',neutral(),'qcf')).toBe(false);expect(a.airSpecialUsed).toBe(false);expect(a.beginAttack('special',neutral(),'qcb')).toBe(true);
  });
});

describe('Gregor charges attached insect arm with a punishable limb',()=>{
  it('holding a ground heavy delays release and reaches a target beyond the uncharged attack',()=>{
    const m=fight('greg',220),a=m.fighters[0];a.beginAttack('heavyAlt',neutral());const start=a.attack!.startup;
    const plain=fight('greg',220),f=plain.fighters[0];f.beginAttack('heavyAlt',neutral());f.attackAge=f.attack!.startup-1;plain.step();expect(plain.totals[0].hits).toBe(0);
    for(let i=0;i<start+17;i++)m.step([{held:{heavyAlt:true},pressed:{}},neutral()]);
    expect(a.limbCharge).toBe(18);expect(a.attackReach).toBe(225);expect(m.totals[0].hits).toBe(0);m.step();expect(m.totals[0].hits).toBe(1);
  });
  it('releasing early gives partial reach; the extra arm can be hit during early recovery',()=>{
    const m=fight('greg',230),[a,b]=m.fighters;a.beginAttack('heavyAlt',neutral());a.attackAge=a.attack!.startup-1;
    for(let i=0;i<6;i++)m.step([{held:{heavyAlt:true},pressed:{}},neutral()]);expect(a.attackAge).toBe(a.attack!.startup-1);m.step();expect(a.limbCharge).toBe(6);expect(a.active).toBe(true);
    a.limbCharge=18;a.attackAge=a.attack!.startup+a.attack!.active+1;b.beginAttack('light',neutral());b.attackAge=b.attack!.startup-1;
    expect(a.limbHurtbox).not.toBeNull();m.step();expect(m.totals[1].hits).toBe(1);expect(a.attack).toBeNull();
  });
  it('air normals do not charge or expose a separate limb hurtbox',()=>{const m=fight('greg'),a=m.fighters[0];a.y=350;a.beginAttack('special',neutral());expect(a.attack?.limb).toBeUndefined();expect(a.limbHurtbox).toBeNull();});
});
