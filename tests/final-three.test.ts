import {describe,it,expect} from 'vitest';
import {Match} from '../src/combat/Match';
import {getIdentity} from '../src/characters/registry';
import {normalButtons} from '../src/characters/normals';
import {neutral,type Action,type InputFrame,type MotionId} from '../src/core/types';

const input=(a:Action,held:InputFrame['held']={}):InputFrame=>({held,pressed:{[a]:true}});
function match(sinner:string,distance=75){const m=new Match({p1:getIdentity(sinner+'-lcb'),p2:getIdentity('heath-lcb'),mode:'local',difficulty:'normal',clash:false,stage:'depot'});m.phase='fight';const[a,b]=m.fighters;a.x=650;b.x=650+distance;a.ego=100;b.hp=10000;return m;}
function tick(m:Match,n:number){for(let i=0;i<n;i++)m.step();}
function stop(m:Match){tick(m,m.hitstop);}
function hit(m:Match,frame:InputFrame){const before=m.totals[0].hits;let gap=false;m.step([frame,neutral()]);for(let i=0;i<100&&m.totals[0].hits===before;i++){if(before&&!m.hitstop&&!m.fighters[1].stun&&!m.fighters[1].knockdown)gap=true;m.step();}expect(m.totals[0].hits,m.fighters[0].lastMove).toBeGreaterThan(before);expect(gap,'opponent became actionable').toBe(false);stop(m);}

describe('last three complete weapon kits and usable routes',()=>{
  it.each(['faust','hong','sin'])('%s equips six requested personas, LCB and two air commands',s=>{const id=getIdentity(s+'-lcb');expect(new Set(Object.values(id.commandMoves!).map(m=>m.appearance)).size).toBe(7);expect(Object.values(id.airCommandMoves!)).toHaveLength(2);for(const stance of ['stand','crouch','air'])for(const b of normalButtons){const m=id.moves[stance==='stand'?b:stance+'-'+b];expect(m.normal).toBeDefined();expect(m.cost).toBe(0);}});
  it.each([['faust','qcf'],['hong','qcf'],['sin','qcb']] as [string,MotionId][])('%s confirms three weapon normals into persona with no gap',(s,command)=>{const m=match(s);hit(m,input('light'));hit(m,input('heavy'));hit(m,input('special'));hit(m,{held:{},pressed:{},command});expect(m.fighters[0].combo).toBeGreaterThanOrEqual(4);});
  it.each(['faust','hong','sin'])('%s keeps takeoff direction and one aerial persona per jump',s=>{for(const c of ['qcf','qcb']as const){const m=match(s,500),[a,b]=m.fighters;a.step(input('jump',{right:true}),b);const vx=a.vx;a.step({held:{left:true},pressed:{},command:c},b);expect(a.attack?.airOnly).toBe(true);expect(a.vx).toBe(vx);a.attack=null;expect(a.beginAttack('special',neutral(),c==='qcf'?'qcb':'qcf')).toBe(false);}});
});

describe('Faust sword feints',()=>{
  it('pays once to retreat eight frames during ground heavy windup without invulnerability',()=>{const m=match('faust',500),[a,b]=m.fighters;a.beginAttack('special',neutral());a.attackAge=3;a.step(input('dash',{left:true}),b);expect(a.attack).toBeNull();expect(a.state).toBe('dash');expect(a.ego).toBe(88);expect(a.traitTimer).toBe(90);expect(a.invuln).toBe(0);for(let i=0;i<7;i++)a.step(neutral(),b);expect(650-a.x).toBe(64);expect(a.dashTimer).toBe(0);});
  it.each(['active','stun','cooldown','resource','medium','air'])('cannot feint when %s',reason=>{const m=match('faust',500),[a,b]=m.fighters;a.beginAttack(reason==='medium'?'heavy':'special',neutral());a.attackAge=3;if(reason==='active')a.attackAge=a.attack!.startup;if(reason==='stun')a.stun=4;if(reason==='cooldown')a.traitTimer=60;if(reason==='resource')a.ego=11;if(reason==='air')a.y=400;a.step(input('dash',{left:true}),b);expect(a.attack).not.toBeNull();expect(a.traitTimer).not.toBe(90);});
});

describe('Hong Lu confirmed-hit glide',()=>{
  it('opens on a real normal hit, consumes one glide and preserves vulnerability',()=>{const m=match('hong'),[a,b]=m.fighters;hit(m,input('light'));expect(a.hitConfirmed).toBe(true);expect(a.traitTimer).toBeGreaterThan(0);const x=a.x,ego=a.ego;a.step(input('dash',{right:true}),b);expect(a.traitUsed.has('flow')).toBe(true);expect(a.ego).toBeCloseTo(Math.min(100,ego+.018)-8);expect(a.attack).toBeNull();expect(a.invuln).toBe(0);for(let i=0;i<5;i++)a.step(neutral(),b);expect(a.x-x).toBe(78);expect(a.dashTimer).toBe(0);});
  it.each(['block','whiff','air','expired','resource','used'])('cannot glide on %s',reason=>{const m=match('hong'),[a,b]=m.fighters;if(reason==='block'){a.beginAttack('light',neutral());a.attackAge=a.attack!.startup-1;m.step([neutral(),{held:{right:true},pressed:{}}]);stop(m);expect(a.connected).toBe(true);expect(a.hitConfirmed).toBe(false);}else if(reason==='whiff'){a.beginAttack('light',neutral());a.attackAge=a.attack!.startup;}else{hit(m,input('light'));if(reason==='air')a.y=400;if(reason==='expired')a.traitTimer=0;if(reason==='resource')a.ego=7;if(reason==='used')a.traitUsed.add('flow');}a.step(input('dash',{right:true}),b);expect(a.attack).not.toBeNull();});
  it('converts a true normal hit into a close-range flame palm through glide',()=>{const m=match('hong',95);hit(m,input('light'));hit(m,input('heavy'));m.step([input('dash',{right:true}),neutral()]);stop(m);hit(m,{held:{},pressed:{},command:'qcf'});expect(m.fighters[0].combo).toBeGreaterThanOrEqual(3);});
});

describe('Sinclair blood links',()=>{
  it('links Red Sheet to Cinq on hit, paying 60 HP plus normal cost once',()=>{const m=match('sin'),a=m.fighters[0];hit(m,{held:{},pressed:{},command:'qcb'});const hp=a.hp,ego=a.ego;expect(a.beginAttack('special',neutral(),'dp')).toBe(true);expect(a.hp).toBe(hp-60);expect(a.ego).toBe(ego-a.identity.commandMoves!.dp.cost);expect(a.traitUsed.has('blood-link')).toBe(true);const count=m.totals[0].hits;for(let i=0;i<50&&m.totals[0].hits===count;i++){expect(m.fighters[1].stun>0||m.hitstop>0).toBe(true);m.step();}expect(m.totals[0].hits).toBeGreaterThan(count);stop(m);expect(a.beginAttack('special',neutral(),'qcf')).toBe(false);});
  it.each(['block','whiff','lowhp','cooldown','resource','air','same'])('rejects blood link on %s without taking HP',reason=>{const m=match('sin'),a=m.fighters[0];if(reason==='block'){a.beginAttack('special',neutral(),'qcb');a.attackAge=a.attack!.startup-1;m.step([neutral(),{held:{right:true},pressed:{}}]);stop(m);}else if(reason==='whiff'){a.beginAttack('special',neutral(),'qcb');a.attackAge=a.attack!.startup;}else{hit(m,{held:{},pressed:{},command:'qcb'});if(reason==='lowhp')a.hp=60;if(reason==='cooldown')a.cooldowns[a.identity.commandMoves!.dp.id]=50;if(reason==='resource')a.ego=0;if(reason==='air')a.y=400;}const hp=a.hp;expect(a.beginAttack('special',neutral(),reason==='same'?'qcb':'dp')).toBe(false);expect(a.hp).toBe(hp);});
});
