import {describe,it,expect} from 'vitest';
import {Match} from '../src/combat/Match';
import {getIdentity,playableSinners} from '../src/characters/registry';
import {neutral,type Action,type InputFrame,type MotionId} from '../src/core/types';

const input=(pressed:Action[]=[],held:Action[]=[]):InputFrame=>({pressed:Object.fromEntries(pressed.map(a=>[a,true])),held:Object.fromEntries(held.map(a=>[a,true]))});
function match(sinner='don'){
  const m=new Match({p1:getIdentity(`${sinner}-lcb`),p2:getIdentity('heath-lcb'),mode:'local',difficulty:'normal',clash:false,stage:'depot'});
  m.phase='fight';m.fighters[0].x=650;m.fighters[1].x=725;m.fighters[0].ego=100;m.fighters[1].hp=10000;return m;
}
function tick(m:Match,count:number,frame=neutral()){for(let i=0;i<count;i++)m.step([i===0?frame:{held:frame.held,pressed:{}},neutral()]);}
function nextHit(m:Match,frame=neutral()){
  const hits=m.totals[0].hits;let gap=false;
  for(let i=0;i<100&&m.totals[0].hits===hits;i++){
    if(hits&&!m.hitstop&&!m.fighters[1].stun&&!m.fighters[1].knockdown)gap=true;
    m.step([i===0?frame:neutral(),neutral()]);
  }
  expect(m.totals[0].hits,`${m.fighters[0].identity.sinner}: ${m.fighters[0].lastMove} missed`).toBeGreaterThan(hits);
  expect(gap,'defender recovered between contacts').toBe(false);
}
const endStop=(m:Match)=>tick(m,m.hitstop);

describe('responsive inputs and human-paced cancels',()=>{
  it.each(playableSinners)('%s accepts the next weapon button during hitstop',sinner=>{
    const m=match(sinner),a=m.fighters[0];nextHit(m,input(['light']));
    const age=a.attackAge,x=a.x,cd={...a.cooldowns},stun=m.fighters[1].stun;
    m.step([input(['heavy']),neutral()]);expect(a.attackAge).toBe(age);expect(a.x).toBe(x);
    expect(a.cooldowns).toEqual(cd);expect(m.fighters[1].stun).toBe(stun);expect(a.buffer?.action).toBe('heavy');
    endStop(m);nextHit(m);expect(a.attack?.normal?.strength).toBe(2);expect(a.combo).toBe(2);
  });
  it.each(playableSinners)('%s records a real 236 across frozen and active frames',sinner=>{
    const m=match(sinner),a=m.fighters[0];nextHit(m,input(['light']));
    m.step([input([],['crouch']),neutral()]);m.step([input([],['crouch','right']),neutral()]);
    m.step([input(['light'],['right']),neutral()]);expect(a.attack?.id).toBe(a.identity.commandMoves!.qcf.id);
    expect(a.buffer).toBeNull();
  });
  it.each(playableSinners)('%s permits a late light → medium confirmation',sinner=>{
    const m=match(sinner);nextHit(m,input(['light']));endStop(m);tick(m,8);
    nextHit(m,input(['heavy']));expect(m.fighters[0].combo).toBe(2);
  });
  it.each(playableSinners)('%s links a launcher to a manually entered persona with reaction time',sinner=>{
    const m=match(sinner),a=m.fighters[0];nextHit(m,input(['special']));endStop(m);tick(m,4);
    const slot:MotionId=['heath','ryoshu','outis'].includes(sinner)?'qcb':'qcf';
    tick(m,2,input([],['crouch']));tick(m,2,input([],['crouch',slot==='qcb'?'left':'right']));
    nextHit(m,input([slot==='qcb'?'heavy':'light'],[slot==='qcb'?'left':'right']));
    expect(a.attack?.id).toBe(a.identity.commandMoves![slot].id);expect(a.combo).toBeGreaterThanOrEqual(2);
  });
  it('buffers a launcher jump cancel during its hitstop',()=>{
    const m=match(),a=m.fighters[0];nextHit(m,input(['special']));
    m.step([input(['jump'],['right']),neutral()]);expect(a.y).toBe(570);endStop(m);m.step();
    expect(a.attack).toBeNull();expect(a.y).toBeLessThan(570);expect(a.airVelocity).toBeGreaterThan(0);
  });
  it('keeps the posture of an early normal through landing recovery',()=>{
    const m=match(),a=m.fighters[0];a.landingLag=3;
    m.step([input(['mediumAlt'],['crouch']),neutral()]);tick(m,3);
    expect(a.attack?.id).toBe('crouch-mediumAlt');
  });
  it('does not turn buffered inputs into a whiff cancel or an infinite repeat',()=>{
    const m=match(),a=m.fighters[0];m.fighters[1].x=1500;
    m.step([input(['heavyAlt']),neutral()]);m.step([input(['heavy']),neutral()]);
    expect(a.attack?.id).toBe('heavyAlt');tick(m,60);expect(a.attack).toBeNull();expect(a.attackSerial).toBe(1);
  });
  it('lets back-walking continue while the opponent winds up or whiffs',()=>{
    const m=match(),[a,b]=m.fighters;b.x=850;b.beginAttack('heavyAlt',neutral());
    m.step([input([],['left']),neutral()]);expect(a.vx).toBe(-a.identity.speed*.65);expect(a.x).toBeLessThan(650);
  });
  it('gives rapid multi-hit contacts shorter stops than the finisher',()=>{
    const m=match(),a=m.fighters[0];nextHit(m,{held:{},pressed:{},command:'qcf'});expect(m.hitstop).toBe(1);
    nextHit(m);expect(m.hitstop).toBe(1);nextHit(m);expect(m.hitstop).toBeGreaterThan(1);expect(a.combo).toBe(3);
  });
});
