import {describe,it,expect} from 'vitest';
import {Match} from '../src/combat/Match';
import {getIdentity} from '../src/characters/registry';
import {neutral,WORLD,type InputFrame,type MotionId} from '../src/core/types';

function fight(sinner:string,distance=75){const m=new Match({p1:getIdentity(sinner+'-lcb'),p2:getIdentity('heath-lcb'),mode:'local',difficulty:'normal',clash:false,stage:'depot'});m.phase='fight';m.fighters[0].x=650;m.fighters[1].x=650+distance;m.fighters[0].ego=100;m.fighters[1].hp=10000;return m;}
function tick(m:Match,n:number,defense:InputFrame=neutral()){for(let i=0;i<n;i++)m.step([neutral(),defense]);}
function cast(m:Match,slot:MotionId){const a=m.fighters[0];expect(a.beginAttack('special',neutral(),slot)).toBe(true);a.attackAge=a.attack!.startup-1;}
function contact(m:Match){const hits=m.totals[0].hits;for(let i=0;i<100&&m.totals[0].hits===hits;i++)m.step();expect(m.totals[0].hits).toBeGreaterThan(hits);tick(m,m.hitstop);}

describe('different ranges, movement and defenses',()=>{
  it.each([['faust','qcbl',64,190],['yi','qcfk',64,210],['hong','ddj',64,210]] as [string,MotionId,number,number][])('%s big blade has a real inner blind spot', (s,slot,near,far)=>{
    const a=fight(s,near),b=fight(s,far);cast(a,slot);cast(b,slot);a.step();b.step();expect(a.totals[0].hits).toBe(0);expect(b.totals[0].hits).toBe(1);
    const f=b.fighters[0],box=f.hitbox!;f.facing=-1;expect(f.hitbox!.x).toBeCloseTo(f.x-(box.x-f.x)-box.w);
  });
  it('Hong Lu pulls with S rope but pushes away with Cinq palm',()=>{
    const pull=fight('hong'),push=fight('hong');cast(pull,'qcfk');cast(push,'qcbl');pull.step();push.step();
    expect(pull.fighters[1].vx).toBeLessThan(0);expect(push.fighters[1].vx).toBeGreaterThan(0);
    tick(pull,12);tick(push,12);expect(push.fighters[1].x-push.fighters[0].x).toBeGreaterThan(pull.fighters[1].x-pull.fighters[0].x);
  });
  it('Butler retreats during windup while the W short blade advances',()=>{
    const a=fight('faust',500),b=fight('yi',500);a.fighters[0].beginAttack('special',neutral(),'qcb');b.fighters[0].beginAttack('special',neutral(),'ddj');tick(a,6);tick(b,6);
    expect(a.fighters[0].x).toBeLessThan(650);expect(b.fighters[0].x).toBeGreaterThan(650);
  });
  it.each(['mid','low','projectile','back','throw'])('Meursault guard point distinguishes %s',kind=>{
    const m=fight('meur',70),[a,b]=m.fighters;cast(m,'qcf');a.attackAge=3;
    if(kind==='throw'){b.beginAttack('throw',neutral());b.attackAge=b.attack!.startup-1;m.step();expect(a.state).toBe('thrown');return;}
    if(kind==='projectile'){const shot={...b.identity.commandMoves!.qcf,projectile:undefined,damage:100};m.projectiles.push({id:1,source:1,x:a.x+40,y:490,vx:-15,vy:0,width:30,height:20,life:10,move:shot});}
    else{if(kind==='back'){b.x=580;b.facing=1;}b.beginAttack(kind==='low'?'mediumAlt':'light',{held:kind==='low'?{crouch:true}:{},pressed:{}});b.attackAge=b.attack!.startup-1;}
    const hp=a.hp;m.step();
    if(kind==='mid'){expect(a.hp).toBe(hp);expect(a.attack).not.toBeNull();expect(a.traitCount).toBe(1);expect(a.guardMeter).toBeLessThan(100);}
    else{expect(a.hp).toBeLessThan(hp);expect(a.attack).toBeNull();}
  });
  it('low-profile shoe slide avoids a high shot but is still hit by a sweep',()=>{
    const high=fight('ryoshu'),low=fight('ryoshu');
    for(const m of [high,low]){m.fighters[0].beginAttack('special',neutral(),'qcbl');m.fighters[0].attackAge=3;}
    const b=high.fighters[1];high.projectiles.push({id:1,source:1,x:680,y:485,vx:-15,vy:0,width:30,height:15,life:10,move:{...b.identity.commandMoves!.qcf,projectile:undefined,damage:100}});
    const sweep=low.fighters[1];sweep.beginAttack('mediumAlt',{held:{crouch:true},pressed:{}});sweep.attackAge=sweep.attack!.startup-1;
    high.step();low.step();expect(high.fighters[0].hp).toBe(high.fighters[0].identity.hp);expect(low.fighters[0].hp).toBeLessThan(low.fighters[0].identity.hp);
  });
  it.each(['correct','back','late'])('Ishmael timed reflection handles %s timing/facing',mode=>{
    const m=fight('ish',220),[a,b]=m.fighters;cast(m,'ddj');a.attackAge=mode==='late'?18:4;if(mode==='back')a.facing=-1;
    const hp=a.hp;const shot={...b.identity.commandMoves!.qcf,projectile:undefined,damage:100};
    m.projectiles.push({id:1,source:1,x:a.x+42,y:490,vx:-20,vy:0,width:30,height:20,life:30,move:shot});m.step();
    if(mode==='correct'){expect(a.hp).toBe(hp);expect(m.projectiles[0].source).toBe(0);expect(m.projectiles[0].vx).toBeGreaterThan(0);tick(m,30);expect(m.totals[0].hits).toBe(1);}
    else{expect(a.hp).toBeLessThan(hp);expect(m.projectiles).toHaveLength(0);}
  });
  it('fan second contact is a real low, requiring a change from standing to crouch guard',()=>{
    for(const adapt of [false,true]){
      const m=fight('ish'),a=m.fighters[0];a.beginAttack('special',neutral(),'qcfk');let blocked=false;
      for(let i=0;i<55;i++){m.step([neutral(),{held:{right:true,crouch:adapt&&blocked},pressed:{}}]);blocked ||= m.events.some(e=>e.type==='block');}
      expect(blocked).toBe(true);expect(m.totals[0].hits).toBe(adapt?0:1);
    }
  });
});

describe('charge, wall bounce and feints',()=>{
  it('Heathcliff can hold and release Middle, without mutating the base skill',()=>{
    const m=fight('heath',700),a=m.fighters[0],base=a.identity.commandMoves!.ddj;cast(m,'ddj');
    const age=a.attackAge;for(let i=0;i<18;i++)a.step({held:{light:true},pressed:{}},m.fighters[1]);
    expect(a.attackAge).toBe(age);expect(a.moveCharge).toBe(18);a.step(neutral(),m.fighters[1]);
    expect(a.active).toBe(true);expect(a.attack!.damage).toBeGreaterThan(base.damage);expect(a.attack!.wallBounce).toBe(true);expect(base.damage).toBe(220);expect(base.wallBounce).toBeUndefined();
  });
  it('heavy bat bounces once per continuous hitstun, then resets on a fresh hit',()=>{
    const m=fight('heath'),[a,b]=m.fighters;a.x=1600;b.x=1670;a.beginAttack('heavyAlt',neutral());a.attackAge=a.attack!.startup-1;m.step();tick(m,m.hitstop+1);
    expect(b.bouncesUsed).toBe(1);expect(b.vx).toBeLessThan(0);expect(b.knockdown).toBe(false);
    a.attack=null;b.x=1670;b.y=570;a.beginAttack('heavyAlt',neutral());a.attackAge=a.attack!.startup-1;m.step();tick(m,m.hitstop+1);expect(b.bouncesUsed).toBe(1);expect(b.wallBouncePending).toBe(false);
    a.attack=null;b.stun=0;b.knockdown=false;b.x=1670;b.y=570;a.beginAttack('heavyAlt',neutral());a.attackAge=a.attack!.startup-1;m.step();tick(m,m.hitstop+1);expect(b.bouncesUsed).toBe(1);expect(b.vx).toBeLessThan(0);
  });
  it.each(['ddj','qcfk','qcbl'] as MotionId[])('Faust can feint %s windup but not its active frames',slot=>{
    const m=fight('faust',700),[a,b]=m.fighters;a.beginAttack('special',neutral(),slot);a.attackAge=4;const ego=a.ego;
    a.step({held:{left:true},pressed:{dash:true}},b);expect(a.attack).toBeNull();expect(a.ego).toBeCloseTo(ego+.018-12);expect(a.invuln).toBe(0);
    const n=fight('faust',700),f=n.fighters[0];cast(n,slot);f.attackAge=f.attack!.startup;f.step({held:{left:true},pressed:{dash:true}},n.fighters[1]);expect(f.attack).not.toBeNull();
  });
});

describe('fixed fields and health/sigil decisions',()=>{
  it('Outis leaves a fixed delayed ground trap; jumping clears it, landing triggers slow',()=>{
    const m=fight('outis',190),[a,b]=m.fighters;cast(m,'qcbl');m.step();expect(a.hitbox).toBeNull();expect(m.delayedStrikes).toHaveLength(1);
    const x=m.delayedStrikes[0].x;a.interrupt(5);a.x=300;b.y=300;b.vy=0;tick(m,20);
    expect(m.totals[0].hits).toBe(0);expect(m.delayedStrikes[0].x).toBe(x);b.y=570;b.vy=0;m.step();
    expect(m.totals[0].hits).toBe(1);expect(m.delayedStrikes).toHaveLength(0);expect(b.slowScale).toBe(.5);
    tick(m,m.hitstop);b.stun=0;const before=b.x;m.step([neutral(),{held:{right:true},pressed:{}}]);expect(b.x-before).toBeCloseTo(b.identity.speed*.5*.65);
    tick(m,105);expect(b.slowScale).toBe(1);
  });
  it('hammer aftershock stays at contact position and can be escaped',()=>{
    const m=fight('ryoshu');cast(m,'qcb');contact(m);expect(m.delayedStrikes[0].kind).toBe('aftershock');const x=m.delayedStrikes[0].x;
    m.fighters[1].x=x+250;m.fighters[0].x=300;tick(m,40);expect(m.totals[0].hits).toBe(1);expect(m.delayedStrikes).toHaveLength(0);
  });
  it.each([false,true])('K repair is once per two-hit cast, blocked=%s',blocked=>{
    const m=fight('hong'),a=m.fighters[0];a.hp=400;cast(m,'qcb');tick(m,40,blocked?{held:{right:true,crouch:true},pressed:{}}:neutral());expect(a.hp).toBe(blocked?400:465);expect(m.totals[0].hits).toBe(blocked?0:2);
  });
  it.each(['hit','block','whiff','lowhp'])('Gregor priest pays HP and only heals on actual contact: %s',mode=>{
    const m=fight('greg',mode==='whiff'?800:100),a=m.fighters[0];a.hp=mode==='lowhp'?70:500;const ego=a.ego;
    const started=a.beginAttack('special',neutral(),'qcfk');expect(started).toBe(mode!=='lowhp');
    if(mode==='lowhp'){expect(a.hp).toBe(70);expect(a.ego).toBe(ego);return;}
    expect(a.hp).toBe(430);a.attackAge=a.attack!.startup-1;tick(m,60,mode==='block'?{held:{right:true,crouch:true},pressed:{}}:neutral());expect(a.hp).toBe(mode==='hit'?545:430);
  });
  it('Sinclair applies sigils, then a real Cinq hit consumes them for damage',()=>{
    const deltas=[];
    for(const consume of [false,true]){const m=fight('sin'),a=m.fighters[0],b=m.fighters[1];cast(m,'qcb');contact(m);expect(b.seals[0]).toBe(2);if(!consume)b.seals[0]=0;a.attack=null;const damage=m.totals[0].damage;cast(m,'dp');contact(m);expect(b.seals[0]).toBe(0);deltas.push(m.totals[0].damage-damage);}
    expect(deltas[1]).toBeGreaterThan(deltas[0]);
  });
  it('blocked talisman attacks do not apply or consume sigils',()=>{
    const apply=fight('sin');cast(apply,'qcb');tick(apply,35,{held:{right:true,crouch:true},pressed:{}});expect(apply.fighters[1].seals[0]).toBe(0);
    const consume=fight('sin');consume.fighters[1].seals[0]=4;cast(consume,'dp');tick(consume,35,{held:{right:true,crouch:true},pressed:{}});expect(consume.fighters[1].seals[0]).toBe(4);
  });
  it('Crimson HP cost and blood-link cost are checked together before spending anything',()=>{
    const m=fight('sin'),a=m.fighters[0];cast(m,'qcb');contact(m);a.hp=130;const ego=a.ego;
    expect(a.beginAttack('special',neutral(),'qcbl')).toBe(false);expect(a.hp).toBe(130);expect(a.ego).toBe(ego);
    a.hp=200;expect(a.beginAttack('special',neutral(),'qcbl')).toBe(true);expect(a.hp).toBe(60);
  });
  it('mirror fields and sigils reset between rounds',()=>{
    const m=fight('sin');m.fighters[1].seals[0]=4;m.fighters[1].slowTimer=90;m.phase='roundover';m.phaseTimer=1;m.wins=[1,0];m.step();expect(m.fighters[1].seals).toEqual([0,0]);expect(m.fighters[1].slowTimer).toBe(0);
  });
});
