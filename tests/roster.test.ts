import {describe,it,expect} from 'vitest';
import {Match} from '../src/combat/Match';
import {getIdentity,playableIdentities,playableSinners} from '../src/characters/registry';
import {motionIds} from '../src/skills/catalog';
import {neutral,type Action,type InputFrame,type MotionId} from '../src/core/types';

const input=(a:Action,held:InputFrame['held']={}):InputFrame=>({held,pressed:{[a]:true}});
function match(sinner='don',distance=80){const m=new Match({p1:getIdentity(sinner+'-lcb'),p2:getIdentity(sinner==='heath'?'don-lcb':'heath-lcb'),mode:'local',difficulty:'normal',clash:false,stage:'depot'});m.phase='fight';m.fighters[0].x=650;m.fighters[1].x=650+distance;m.fighters[0].ego=100;m.fighters[1].hp=10000;return m;}
function clearStop(m:Match){while(m.hitstop)m.step();}
function hit(m:Match,frame:InputFrame){const n=m.totals[0].hits;let gap=false;m.step([frame,neutral()]);for(let i=0;i<100&&m.totals[0].hits===n;i++){if(n&&!m.hitstop&&!m.fighters[1].stun&&!m.fighters[1].knockdown)gap=true;m.step();}expect(m.totals[0].hits,m.fighters[0].lastMove).toBeGreaterThan(n);expect(gap,'combo has an actionable gap').toBe(false);clearStop(m);}

describe('six playable sinners and unique kits',()=>{
  it('unlocks exactly the requested four alongside the original two',()=>{expect(playableSinners).toEqual(['don','heath','ryoshu','meur','ish','rod']);expect(new Set(playableIdentities.map(i=>i.sprite)).size).toBe(6);});
  it.each(['ryoshu','meur','ish','rod'])('%s equips all six requested personas plus LCB and two air commands',s=>{const id=getIdentity(s+'-lcb');const moves=Object.values(id.commandMoves!);expect(moves).toHaveLength(7);expect(new Set(moves.map(m=>m.appearance)).size).toBe(7);expect(Object.keys(id.airCommandMoves!)).toEqual(['qcf','qcb']);expect(Object.values(id.moves).filter(m=>m.normal&&m.id!=='dashAttack')).toHaveLength(18);});
  it.each(['ryoshu','meur','ish','rod'])('%s ground command data is executable with temporary persona and cooldown',s=>{for(const slot of motionIds){const m=match(s),f=m.fighters[0],move=f.identity.commandMoves![slot];expect(f.beginAttack('special',neutral(),slot)).toBe(true);expect(f.appearance).toBe(move.appearance);expect(f.ego).toBe(100-move.cost);f.attack=null;expect(f.beginAttack('special',neutral(),slot)).toBe(false);f.interrupt(5);expect(f.appearance).toBe('lcb');}});
  it.each([['ryoshu','dp'],['meur','qcb'],['ish','qcf'],['rod','qcf']] as [string,MotionId][])('%s has a true light → medium → launcher → persona route', (s,command)=>{const m=match(s,70);hit(m,input('light'));hit(m,input('heavy'));hit(m,input('special'));hit(m,{held:{},pressed:{},command});expect(m.fighters[0].combo).toBeGreaterThanOrEqual(4);});
  it.each(['ryoshu','meur','ish','rod'])('%s air moves keep fixed takeoff velocity',s=>{for(const command of ['qcf','qcb'] as const){const m=match(s);m.step([input('jump',{right:true}),neutral()]);const f=m.fighters[0],vx=f.vx;m.step([{held:{left:true},pressed:{},command},neutral()]);expect(f.attack?.airOnly).toBe(true);expect(f.vx).toBe(vx);expect(f.airSpecialUsed).toBe(true);}});
});

describe('distinct sinner traits affect real combat',()=>{
  it('Don gets extra damage and hitstun only at the outer spear',()=>{const near=match('don',65),far=match('don',105);hit(near,input('light'));hit(far,input('light'));expect(far.totals[0].damage).toBeGreaterThan(near.totals[0].damage);expect(far.fighters[1].stun-near.fighters[1].stun).toBe(4);expect(far.fighters[0].traitTimer).toBeGreaterThan(0);expect(near.fighters[0].traitTimer).toBe(0);});
  it('Heath gains anger from a hit, spends it on a heavy contact, and it expires',()=>{const m=match('don',65);hit(m,input('light'));const h=m.fighters[1];expect(h.traitCount).toBe(1);h.stun=0;h.attack=null;m.fighters[0].attack=null;m.fighters[0].stun=0;m.fighters[0].x=650;h.x=725;h.beginAttack('special',neutral());h.attackAge=h.attack!.startup-1;m.step();expect(h.traitCount).toBe(0);expect(m.totals[1].damage).toBeGreaterThan(h.identity.moves.special.damage);h.traitCount=3;h.traitTimer=1;h.step(neutral(),m.fighters[0]);expect(h.traitCount).toBe(0);});
  it('Ryoshu punishes enemy recovery with extra damage and stun',()=>{const m=match('ryoshu',70),[a,b]=m.fighters;b.beginAttack('heavy',neutral());b.attackAge=b.attack!.startup+b.attack!.active;a.beginAttack('light',neutral());a.attackAge=a.attack!.startup-1;m.step();expect(m.totals[0].damage).toBe(Math.round(a.identity.moves.light.damage*1.2*b.identity.defense));expect(b.stun).toBe(a.identity.moves.light.hitstun+6);expect(a.traitFlash).toBe('见切');});
  it('Meursault builds fortitude by blocking then cashes it out through a throw',()=>{const m=match('meur',65),[a,b]=m.fighters;for(let i=0;i<3;i++){m.hitstop=0;a.attack=b.attack=null;a.stun=b.stun=0;a.x=650;b.x=715;b.beginAttack('light',neutral());b.attackAge=b.attack!.startup-1;m.step([{held:{left:true},pressed:{}},neutral()]);}expect(a.traitCount).toBe(3);m.hitstop=0;a.stun=b.stun=0;a.attack=b.attack=null;a.x=650;b.x=715;a.beginAttack('throw',neutral());a.attackAge=a.attack!.startup-1;for(let i=0;i<35&&!m.totals[0].hits;i++)m.step();expect(m.totals[0].damage).toBe(Math.round((175+60)*b.identity.defense));expect(a.traitCount).toBe(0);});
  it('Ishmael gets one faster, stronger attack after guarding without mutating shared frame data',()=>{const m=match('ish',65),[a,b]=m.fighters;b.beginAttack('light',neutral());b.attackAge=b.attack!.startup-1;m.step([{held:{left:true},pressed:{}},neutral()]);expect(a.traitTimer).toBe(90);a.stun=0;const original=a.identity.moves.light;a.beginAttack('light',neutral());expect(a.attack!.startup).toBe(original.startup-2);expect(a.attack!.damage).toBe(Math.round(original.damage*1.15));expect(a.traitTimer).toBe(0);expect(original.startup).toBe(5);});
  it('Rodion rewards different normals then enhances a persona even on a whiff',()=>{const m=match('rod',70),a=m.fighters[0];hit(m,input('light'));expect(a.traitCount).toBe(1);hit(m,input('heavy'));expect(a.traitCount).toBe(2);hit(m,input('special'));expect(a.traitCount).toBe(3);const original=a.identity.commandMoves!.qcf;expect(a.beginAttack('special',neutral(),'qcf')).toBe(true);expect(a.attack!.damage).toBe(Math.round(original.damage*1.25));expect(a.attack!.guardDamage).toBeCloseTo(original.guardDamage!*1.8);expect(a.traitCount).toBe(0);expect(original.guardDamage).toBe(1.5);});
});

describe('persona weapons keep their own combat behavior',()=>{
  it.each([false,true])('Hornet fires one solid slug (air=%s)',air=>{
    const m=match('meur',800),f=m.fighters[0],seen=new Set<number>();
    if(air){f.y=300;f.vy=-3;}
    expect(f.beginAttack('special',neutral(),'qcbl')).toBe(!air);
    if(air)expect(f.beginAttack('special',neutral(),'qcb')).toBe(true);
    expect(f.attack?.effect).toBe('slug');
    for(let i=0;i<90;i++){m.step();for(const p of m.projectiles){seen.add(p.id);expect(p.width).toBe(24);expect(p.height).toBe(14);}}
    expect(seen.size).toBe(1);
  });
  it('the extending sword cannot hit distant targets before the blade reaches them',()=>{
    const m=match('rod',360),f=m.fighters[0];f.beginAttack('special',neutral(),'qcbl');
    expect(f.attack!.projectile).toBeUndefined();
    f.attackAge=f.attack!.startup-1;m.step();
    expect(f.hitbox!.w).toBe(140);expect(m.totals[0].hits).toBe(0);
    for(let i=0;i<12&&!m.totals[0].hits;i++)m.step();
    expect(m.totals[0].hits).toBe(1);expect(f.attackReach).toBeGreaterThan(300);expect(m.projectiles).toHaveLength(0);
    f.facing=-1;expect(f.hitbox!.x+f.hitbox!.w).toBe(f.x-f.attack!.box.x);
    f.attackAge=f.attack!.startup+f.attack!.active+8;expect(f.attackReach).toBe(140);expect(f.hitbox).toBeNull();
  });
  it('Xichun uses a two-contact folding fan and the princess uses her parasol in air and on ground',()=>{
    const fan=getIdentity('ish-lcb').commandMoves!.qcfk,rod=getIdentity('rod-lcb');
    expect(fan.effect).toBe('fan');expect(fan.hits).toHaveLength(2);expect(fan.projectile).toBeUndefined();
    expect(rod.commandMoves!.dp.effect).toBe('parasol');expect(rod.airCommandMoves!.qcf!.effect).toBe('parasol');
  });
});
