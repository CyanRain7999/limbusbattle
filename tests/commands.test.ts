import { describe,it,expect } from 'vitest';
import { MotionBuffer } from '../src/input/MotionBuffer';
import { Match } from '../src/combat/Match';
import { getIdentity } from '../src/characters/registry';
import { motionIds, defaultLoadouts, equipSkills } from '../src/skills/catalog';
import { neutral, type Action, type MotionId, type InputFrame } from '../src/core/types';

const sequence:Record<MotionId,number[]>={qcf:[2,3,6],qcb:[2,1,4],dp:[6,2,3],ddj:[2,5,2],qcfk:[2,3,6],qcbl:[2,1,4],dpj:[6,2,3]};
const buttons:Record<MotionId,'light'|'heavy'|'special'>={qcf:'light',qcb:'heavy',dp:'special',ddj:'light',qcfk:'heavy',qcbl:'special',dpj:'light'};
function direction(n:number,facing:1|-1=1){const held:Partial<Record<Action,boolean>>={};if([1,2,3].includes(n))held.crouch=true;if([1,4,7].includes(n))held[facing===1?'left':'right']=true;if([3,6,9].includes(n))held[facing===1?'right':'left']=true;return held;}
function match(sinner='don') {const m=new Match({p1:getIdentity(`${sinner}-lcb`),p2:getIdentity(sinner==='don'?'heath-lcb':'don-lcb'),mode:'local',difficulty:'normal',clash:false,stage:'depot'});m.phase='fight';m.fighters[0].ego=100;return m;}
function command(m:Match,id:MotionId){m.step([{held:{},pressed:{},command:id},neutral()]);}
function ticks(m:Match,count:number){for(let i=0;i<count;i++)m.step();}

describe('motion recognition and persona loadouts',()=>{
  it.each(motionIds)('recognizes %s with real directions in both facing directions',motion=>{for(const facing of [1,-1] as const){const b=new MotionBuffer();for(const d of sequence[motion])b.record(direction(d,facing),facing);expect(b.recognize({[buttons[motion]]:true})).toBe(motion);}});
  it('rejects missing diagonals, wrong final direction and expired motion',()=>{const b=new MotionBuffer();for(const n of [2,6])b.record(direction(n),1);expect(b.recognize({light:true})).toBeUndefined();b.clear();for(const n of [2,3,6,4])b.record(direction(n),1);expect(b.recognize({light:true})).toBeUndefined();b.clear();for(const n of [2,3,6])b.record(direction(n),1);for(let i=0;i<28;i++)b.record({},1);expect(b.recognize({light:true})).toBeUndefined();});
  it.each(motionIds)('accepts a slower %s and a late button in both facing directions',motion=>{for(const facing of [1,-1] as const){const b=new MotionBuffer(),holds=motion==='ddj'?[7,7,9]:[13,11,9];sequence[motion].forEach((d,i)=>{for(let j=0;j<holds[i];j++)b.record(direction(d,facing),facing);});expect(b.recognize({[buttons[motion]]:true})).toBe(motion);}});
  it.each(['qcf','qcb','dp','qcfk','qcbl','dpj'] as MotionId[])('allows a small final roll after the complete %s',motion=>{for(const facing of [1,-1] as const){const b=new MotionBuffer(),tail=motion==='dp'||motion==='dpj'?6:motion==='qcb'||motion==='qcbl'?1:3;for(const d of [...sequence[motion],tail])b.record(direction(d,facing),facing);expect(b.recognize({[buttons[motion]]:true})).toBe(motion);}});
  it('keeps the whole-motion, direction-gap and button grace bounded',()=>{
    const b=new MotionBuffer();b.record(direction(2),1);for(let i=0;i<16;i++)b.record(direction(2),1);for(const n of [3,6])b.record(direction(n),1);expect(b.recognize({light:true})).toBeUndefined();
    b.clear();for(const n of [2,3,6])b.record(direction(n),1);for(let i=0;i<13;i++)b.record({},1);expect(b.recognize({light:true})).toBeUndefined();
    b.clear();for(const n of [2,3,6]){b.record(direction(n),1);for(let i=0;i<12;i++)b.record(direction(n),1);}expect(b.recognize({light:true})).toBeUndefined();
  });
  it('does not turn ordinary crouch, diagonal crouch or walking attacks into a special',()=>{for(const nums of [[2],[3],[6],[2,3],[2,1],[2,6],[6,3]]){const b=new MotionBuffer();for(const n of nums)b.record(direction(n),1);expect(b.recognize({light:true})).toBeUndefined();expect(b.recognize({heavy:true})).toBeUndefined();expect(b.recognize({special:true})).toBeUndefined();}});
  it.each([{nums:[6,3,6]},{nums:[3,2,3]}])('accepts the common DP shortcut $nums for both buttons and facings',({nums})=>{for(const facing of [1,-1] as const)for(const [button,id] of [['special','dp'],['light','dpj']] as const){const b=new MotionBuffer();for(const n of nums)b.record(direction(n,facing),facing);expect(b.recognize({[button]:true})).toBe(id);}});
  it('gives DP its own slower window without making quarter circles stale',()=>{const b=new MotionBuffer();for(const [i,n] of [6,2,3].entries())for(let f=0;f<[16,10,14][i];f++)b.record(direction(n),1);expect(b.recognize({special:true})).toBe('dp');b.record({},1);b.record({},1);expect(b.recognize({special:true})).toBeUndefined();});
  it.each(['don','heath'])('%s has seven distinct equipped commands and sources',sinner=>{const moves=Object.values(getIdentity(`${sinner}-lcb`).commandMoves!);expect(moves).toHaveLength(7);expect(new Set(moves.map(m=>m.id)).size).toBe(7);expect(new Set(moves.map(m=>m.appearance)).size).toBe(7);expect(defaultLoadouts[sinner]).toHaveLength(7);});
  it('executes actual keyboard motion, charges once, changes appearance and returns after recovery',()=>{const m=match(),a=m.fighters[0];for(const d of [2,1,4])m.step([{held:direction(d),pressed:{}},neutral()]);m.step([{held:direction(4),pressed:{heavy:true}},neutral()]);expect(a.attack?.id).toBe('don-n-purge');expect(a.appearance).toBe('n');expect(a.ego).toBe(80);ticks(m,70);expect(a.appearance).toBe('lcb');expect(a.attack).toBeNull();expect(a.beginAttack('special',neutral(),'qcb')).toBe(false);});
  it('single L performs a free weapon launcher without bypassing persona motion',()=>{const m=match();m.step([{held:{},pressed:{special:true}},neutral()]);expect(m.fighters[0].attack?.normal?.strength).toBe(3);expect(m.fighters[0].attack?.source).toBeUndefined();expect(m.fighters[0].ego).toBe(100);});
  it('preserves intermediate directions that arrive between rendered frames',()=>{const m=match();m.step([{held:{},pressed:{special:true},directionChanges:[direction(6),direction(5),direction(2),direction(3)]},neutral()]);expect(m.fighters[0].attack?.id).toBe('don-cinq-duel');});
  it('custom loadouts preserve all other command slots',()=>{const ids=[...defaultLoadouts.don];ids[0]='don-justice-charge';const id=equipSkills(getIdentity('don-lcb'),ids);expect(id.commandMoves!.qcf.id).toBe('don-justice-charge');expect(id.commandMoves!.qcbl.id).toBe('don-queen-beam');});
  it('interrupting a persona immediately restores the LCB appearance',()=>{const m=match();command(m,'qcb');m.fighters[0].interrupt(15);expect(m.fighters[0].appearance).toBe('lcb');});
});

describe('distinct persona mechanics',()=>{
  it('W cleanup rush connects all three separate strike windows at close range',()=>{const m=match();m.fighters[1].x=760;command(m,'qcf');ticks(m,140);expect(m.totals[0].hits).toBe(3);});
  it('queen beam connects three times at long range without active-frame duplicates',()=>{const m=match();m.fighters[1].x=1150;command(m,'qcbl');ticks(m,150);expect(m.totals[0].hits).toBe(3);expect(m.totals[0].damage).toBeGreaterThan(150);});
  it('fullstop fires one projectile that travels and hits outside melee range',()=>{const m=match('heath');m.fighters[1].x=1300;command(m,'qcf');ticks(m,23);expect(m.projectiles).toHaveLength(1);expect(m.fighters[0].hitbox).toBeNull();ticks(m,90);expect(m.totals[0].hits).toBe(1);expect(m.projectiles).toHaveLength(0);});
  it('rabbit fires three separate projectiles',()=>{const m=match('heath');m.fighters[1].x=1100;command(m,'dpj');ticks(m,150);expect(m.totals[0].hits).toBe(3);});
  it('seven parries an incoming strike during its counter window',()=>{const m=match('heath');const [a,b]=m.fighters;a.x=650;b.x=740;a.beginAttack('special',neutral(),'dp');a.attackAge=3;b.beginAttack('light',neutral());b.attackAge=b.attack!.startup-1;m.step();expect(a.hp).toBe(a.identity.hp);expect(b.attack).toBeNull();expect(a.attack?.id).toBe('heath-seven-parry');expect(m.events.some(e=>e.text==='识破反击')).toBe(true);});
  it('middle armor takes damage but preserves the charged attack',()=>{const m=match('heath'),[a,b]=m.fighters;a.x=650;b.x=740;a.beginAttack('special',neutral(),'ddj');a.attackAge=3;b.beginAttack('light',neutral());b.attackAge=b.attack!.startup-1;m.step();expect(a.hp).toBeLessThan(a.identity.hp);expect(a.stun).toBe(0);expect(a.attack?.id).toBe('heath-middle-revenge');});
  it('blade lineage advances once on the first active frame',()=>{const m=match();command(m,'qcfk');const a=m.fighters[0],x=a.x;ticks(m,13);expect(a.x-x).toBeGreaterThanOrEqual(78);expect(a.x-x).toBeLessThan(85);});
  it('N hammer breaks a full guard meter',()=>{const m=match();m.fighters[1].x=760;command(m,'qcb');let broken=false;for(let i=0;i<90;i++){m.step([neutral(),{held:{right:true},pressed:{}}]);broken ||= m.events.some(e=>e.type==='guardbreak');}expect(broken).toBe(true);});
});

