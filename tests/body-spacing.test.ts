import {it,expect} from 'vitest';
import {Match} from '../src/combat/Match';
import {getIdentity,playableSinners} from '../src/characters/registry';
import {neutral,WORLD} from '../src/core/types';

it.each(playableSinners)('%s keeps bodies separated when both fighters dash into each other',s=>{
  const m=new Match({p1:getIdentity(s+'-lcb'),p2:getIdentity('heath-lcb'),mode:'local',difficulty:'normal',stage:'depot',clash:false});m.phase='fight';
  const[a,b]=m.fighters;a.x=700;b.x=765;
  for(let i=0;i<20;i++){m.step([{held:{right:true},pressed:i===0?{dash:true}:{}},{held:{left:true},pressed:i===0?{dash:true}:{}}]);expect(b.x-a.x).toBeGreaterThanOrEqual(64);}
  a.x=WORLD.left;b.x=WORLD.left+10;m.step();expect(a.x).toBe(WORLD.left);expect(b.x-a.x).toBeGreaterThanOrEqual(64);
  a.x=WORLD.right-10;b.x=WORLD.right;m.step();expect(b.x).toBe(WORLD.right);expect(b.x-a.x).toBeGreaterThanOrEqual(64);
});

it.each(playableSinners)('%s can still throw at the closest standing distance',s=>{
  const m=new Match({p1:getIdentity(s+'-lcb'),p2:getIdentity('heath-lcb'),mode:'local',difficulty:'normal',stage:'depot',clash:false});m.phase='fight';
  m.fighters[0].x=700;m.fighters[1].x=764;m.step([{held:{},pressed:{throw:true}},neutral()]);
  for(let i=0;i<45&&!m.totals[0].hits;i++)m.step();
  expect(m.totals[0].hits).toBe(1);
});
