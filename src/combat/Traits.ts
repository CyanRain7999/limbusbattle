import type {Fighter} from './Fighter';
import type {Move} from '../core/types';

/** Per-sinner mechanics are applied only to real move starts / contacts. */
export function prepareTraitMove(f:Fighter,move:Move):Move{
  if(f.identity.sinner==='ish'&&f.traitTimer>0&&move.action!=='ego'&&!move.throwRange){
    f.traitTimer=0;f.traitFlash='盾反发动';
    const startup=Math.max(3,move.startup-2),shift=move.startup-startup;
    return {...move,startup,damage:Math.round(move.damage*1.15),cancel:[Math.max(0,move.cancel[0]-shift),Math.max(0,move.cancel[1]-shift)]};
  }
  if(f.identity.sinner==='rod'&&f.traitCount===3&&f.grounded&&move.source&&move.action!=='ego'){
    f.traitCount=0;f.traitFlash='豪赌 · 破阵';
    return {...move,damage:Math.round(move.damage*1.25),guardDamage:(move.guardDamage??1)*1.8};
  }
  return move;
}

export function traitContact(a:Fighter,b:Fighter,move:Move,blocked:boolean):Move{
  if(a.identity.sinner==='heath'&&a.traitCount>0&&!move.throwRange&&move.action!=='ego'&&(move.source||move.normal?.strength===3)){
    const count=a.traitCount;a.traitCount=0;a.traitTimer=0;a.traitFlash=`怒意释放 ×${count}`;
    move={...move,damage:move.damage*(1+count*.08),guardDamage:(move.guardDamage??1)*(1+count*.15)};
  }
  if(blocked){
    if(b.identity.sinner==='meur')b.traitCount=Math.min(3,b.traitCount+1);
    if(b.identity.sinner==='ish')b.traitTimer=90;
    return move;
  }
  if(a.identity.sinner==='don'&&move.normal&&Math.abs(a.x-b.x)-b.hurtbox.w/2>=move.box.x+move.box.w*.65){
    a.traitTimer=45;a.traitFlash='枪尖命中';move={...move,damage:move.damage*1.15,hitstun:move.hitstun+4};
  }
  if(a.identity.sinner==='ryoshu'&&b.attack&&b.attackAge>=b.attack.startup+b.attack.active&&!move.throwRange&&move.action!=='ego'){
    a.traitTimer=60;a.traitFlash='见切';move={...move,damage:move.damage*1.2,hitstun:move.hitstun+6};
  }
  if(a.identity.sinner==='meur'&&move.throwRange&&a.traitCount){
    move={...move,damage:move.damage+a.traitCount*20};a.traitCount=0;a.traitFlash='稳固擒投';
  }
  if(b.identity.sinner==='heath'){b.traitCount=Math.min(3,b.traitCount+1);b.traitTimer=240;}
  return move;
}

export function traitHit(a:Fighter,move:Move){
  if((a.identity.sinner==='hong'||a.identity.sinner==='sin')&&a.combo===1)a.traitUsed.clear();
  if(a.identity.sinner==='hong'&&move.normal&&!a.traitUsed.has('flow'))a.traitTimer=24;
  if(a.identity.sinner==='rod'&&move.normal){
    if(a.combo===1)a.traitUsed.clear();
    if(!a.traitUsed.has(move.normal.button)){a.traitUsed.add(move.normal.button);a.traitCount=Math.min(3,a.traitCount+1);}
  }
}
