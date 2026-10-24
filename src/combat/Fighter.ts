import {clamp,WORLD,type AttackAction,type Box,type FighterState,type Identity,type InputFrame,type Move,type MotionId} from '../core/types';
import {MotionBuffer} from '../input/MotionBuffer';
import {normalButtons} from '../characters/normals';
import {prepareTraitMove} from './Traits';

export class Fighter {
  x:number;y=WORLD.floor;vx=0;vy=0;facing:1|-1;
  hp:number;sp=0;ego=35;guardMeter=100;state:FighterState='idle';age=0;
  attack:Move|null=null;attackAge=0;attackSerial=0;hitTargets=new Set<number>();
  connected=false;stun=0;invuln=0;combo=0;comboDamage=0;comboTimer=0;
  cooldowns:Record<string,number>={};statuses={burn:0,rupture:0};
  dashTimer=0;dashDirection:1|-1=1;backDash=false;airVelocity=0;knockdown=false;
  buffer:{action:AttackAction;command?:MotionId;ttl:number}|null=null;motion=new MotionBuffer();
  backHeld=false;lowGuard=false;held:InputFrame['held']={};landingLag=0;
  throwLock=0;throwTechTimer=0;throwInvuln=0;airSpecialUsed=false;private airNormals=new Set<string>();
  traitCount=0;traitTimer=0;traitFlash='';traitUsed=new Set<string>();
  lastMove='';totalDamage=0;totalHits=0;
  constructor(public readonly index:number,public identity:Identity){this.x=index===0?650:1110;this.facing=index===0?1:-1;this.hp=identity.hp;}
  get grounded(){return this.y>=WORLD.floor;}
  get active(){return !!this.attack&&this.attackAge>=this.attack.startup&&this.attackAge<this.attack.startup+this.attack.active;}
  get hitIndex(){if(!this.active||!this.attack)return -1;return this.attack.hits?this.attack.hits.findIndex(h=>this.attackAge-this.attack!.startup>=h.frame&&this.attackAge-this.attack!.startup<h.frame+h.duration):0;}
  get appearance(){return this.attack?.appearance??'lcb';}
  targetKey(index:number){return index+Math.max(0,this.hitIndex)*2;}
  get hurtbox():Box{const crouched=this.attack?.normal?.stance==='crouch'||this.state==='crouch'||this.state==='block'&&this.lowGuard;const h=this.state==='down'?34:crouched?67:114;return {x:this.x-23,y:this.y-h,w:46,h};}
  get attackReach(){const m=this.attack;if(!m)return 0;if(!m.extend)return m.box.w;const [near,far]=m.extend,frame=this.attackAge-m.startup;const progress=frame<0?0:frame<m.active?frame/Math.max(1,m.active-1):Math.max(0,1-(frame-m.active)/8);return near+(far-near)*progress;}
  get hitbox():Box|null{if(!this.active||!this.attack||this.hitIndex<0||this.attack.projectile||this.attack.throwRange)return null;const b=this.attack.box,w=this.attackReach;return {x:this.facing===1?this.x+b.x:this.x-b.x-w,y:this.y+b.y,w,h:b.h};}
  setState(state:FighterState){if(this.state!==state){this.state=state;this.age=0;}}
  canCancel(action:AttackAction,command?:MotionId){
    const m=this.attack;if(!m||!this.connected||this.attackAge<m.cancel[0]||this.attackAge>m.cancel[1])return false;
    if(command)return m.into.includes('special');
    if(action==='ego')return m.into.includes('ego');
    if(!m.normal||!normalButtons.includes(action as typeof normalButtons[number]))return false;
    const strength=normalButtons.indexOf(action as typeof normalButtons[number])%3+1;
    return strength>m.normal.strength;
  }
  beginAttack(action:AttackAction,input:InputFrame,command?:MotionId):boolean{
    if(this.stun||this.throwLock||this.landingLag||['down','rise','thrown'].includes(this.state)||this.hp<=0||this.attack&&!this.canCancel(action,command))return false;
    let key:string=action;
    if(command){if(!this.grounded&&this.airSpecialUsed)return false;}
    else if(action==='ego'||action==='throw'){if(!this.grounded)return false;}
    else if(!this.grounded)key=`air-${action}`;
    else if(input.held.crouch)key=`crouch-${action}`;
    else if(action==='light'&&this.dashTimer>0&&!this.backDash)key='dashAttack';
    let move=command?(this.grounded?this.identity.commandMoves?.[command]:this.identity.airCommandMoves?.[command]):this.identity.moves[key];
    if(!move||this.ego<move.cost||(this.cooldowns[move.id]??0)>0)return false;
    if(!this.grounded&&move.normal&&this.airNormals.has(move.normal.button))return false;
    if(!this.grounded){if(command)this.airSpecialUsed=true;else if(move.normal)this.airNormals.add(move.normal.button);}
    move=prepareTraitMove(this,move);
    this.ego=clamp(this.ego-move.cost,0,100);this.attack=move;this.attackAge=0;this.attackSerial++;this.hitTargets.clear();this.connected=false;
    this.cooldowns[move.id]=move.cooldown;this.dashTimer=0;this.buffer=null;this.lastMove=move.name;this.setState('attack');return true;
  }
  interrupt(frames:number){this.attack=null;this.dashTimer=0;this.buffer=null;this.stun=frames;this.setState('hit');}
  private takeoff(direction:number){this.airVelocity=direction*this.identity.speed*.95;this.vx=this.airVelocity;this.vy=-this.identity.jump;this.dashTimer=0;this.setState('jump');}
  step(input:InputFrame,enemy:Fighter){
    this.age++;this.held=input.held;this.traitFlash='';if(this.traitTimer>0){this.traitTimer--;if(!this.traitTimer&&this.identity.sinner==='heath')this.traitCount=0;}
    if(this.grounded&&!this.attack&&!this.throwLock&&(!this.stun||this.state==='block')&&!this.dashTimer&&Math.abs(enemy.x-this.x)>6)this.facing=enemy.x>this.x?1:-1;
    this.backHeld=!!input.held[this.facing===1?'left':'right']&&!input.held[this.facing===1?'right':'left'];this.lowGuard=!!input.held.crouch;
    const directions=input.directionChanges??[];this.motion.record(directions[0]??input.held,this.facing);for(const held of directions.slice(1))this.motion.record(held,this.facing,false);if(directions.length)this.motion.record(input.held,this.facing,false);
    for(const key in this.cooldowns)this.cooldowns[key]=Math.max(0,this.cooldowns[key]-1);
    this.invuln=Math.max(0,this.invuln-1);this.throwInvuln=Math.max(0,this.throwInvuln-1);this.throwTechTimer=Math.max(0,this.throwTechTimer-1);if(input.pressed.throw)this.throwTechTimer=7;
    if(this.comboTimer>0)this.comboTimer--;else{this.combo=0;this.comboDamage=0;}
    this.guardMeter=Math.min(100,this.guardMeter+.13);this.ego=Math.min(100,this.ego+.018);
    if(this.hp<=0){this.setState('ko');this.attack=null;this.vx*=.9;this.physics();return;}
    let command=input.command??this.motion.recognize(input.pressed);
    if(command&&!this.grounded&&!this.identity.airCommandMoves?.[command])command=undefined;
    if(command){this.buffer={action:'special',command,ttl:12};this.motion.clear();}
    else for(const action of ['throw','ego','heavyAlt','special','mediumAlt','heavy','lightAlt','light'] as const)if(input.pressed[action]){this.buffer={action,ttl:12};break;}
    if(this.buffer&&--this.buffer.ttl<0)this.buffer=null;
    if(this.throwLock>0){this.throwLock--;return;}
    if(this.stun>0){this.stun--;this.vx*=.92;this.airVelocity=this.vx;this.physics();if(!this.stun&&this.grounded&&this.knockdown){this.setState('down');this.knockdown=false;}return;}
    if(this.knockdown&&!this.grounded){this.vx*=.98;this.airVelocity=this.vx;this.physics();if(this.grounded){this.setState('down');this.knockdown=false;}return;}
    if(this.state==='down'){this.vx*=.8;this.physics();if(this.age>=32){this.setState('rise');this.invuln=30;this.throwInvuln=40;}return;}
    if(this.state==='rise'){if(this.age>=18)this.setState('idle');return;}
    if(this.landingLag>0){this.landingLag--;this.physics();return;}
    const direction=Number(!!input.held.right)-Number(!!input.held.left);
    if(this.attack&&input.pressed.jump&&this.connected&&this.attack.normal?.launcher&&this.grounded&&this.attackAge<=this.attack.cancel[1]){this.attack=null;this.takeoff(direction||this.facing);this.physics();return;}
    if(this.buffer)this.beginAttack(this.buffer.action,input,this.buffer.command);
    if(this.attack){
      this.attackAge++;
      if(this.attackAge===this.attack.startup&&this.grounded){
        if(this.attack.teleport)this.x=clamp(this.x+this.facing*this.attack.teleport,WORLD.left,WORLD.right);
        if(this.attack.effect==='uppercut'&&!this.attack.normal){this.airVelocity=this.facing*this.attack.lunge;this.vy=-9;}
      }
      this.vx=!this.grounded||this.vy<0?this.airVelocity:this.active?this.facing*this.attack.lunge:this.vx*.5;
      if(this.attackAge>=this.attack.startup+this.attack.active+this.attack.recovery){this.attack=null;this.setState(this.grounded?'idle':'fall');}
      this.physics();return;
    }
    if(input.pressed.jump&&this.grounded){this.takeoff(direction);this.physics();return;}
    if(!this.grounded){this.vx=this.airVelocity;this.setState(this.vy<0?'jump':'fall');this.physics();return;}
    if(input.pressed.dash&&!this.dashTimer){this.dashDirection=(direction||this.facing) as 1|-1;this.backDash=this.dashDirection!==this.facing;this.dashTimer=this.backDash?8:12;}
    if(this.dashTimer>0){this.dashTimer--;this.vx=this.dashDirection*(this.backDash?8:13);this.setState('dash');}
    else if(input.held.crouch){this.vx=0;this.setState('crouch');}
    else if(this.backHeld&&enemy.attack&&Math.abs(enemy.x-this.x)<(enemy.attack.projectile?750:enemy.attack.box.w+90)){this.vx=0;this.setState('guard');}
    else{this.vx=direction*this.identity.speed*(this.backHeld?.65:1);this.setState(direction?'run':'idle');}
    this.physics();
  }
  physics(){
    const airborne=!this.grounded||this.vy<0;
    this.x=clamp(this.x+this.vx,WORLD.left,WORLD.right);
    if(airborne){this.y+=this.vy;this.vy+=.62;}
    if(this.y>=WORLD.floor){
      this.y=WORLD.floor;this.vy=0;
      if(airborne){this.airVelocity=0;this.vx=0;this.airNormals.clear();this.airSpecialUsed=false;this.throwInvuln=Math.max(6,this.throwInvuln);
        if(this.attack?.airOnly){this.attack=null;this.landingLag=4;this.setState('idle');}
        else if(!this.attack&&['jump','fall'].includes(this.state))this.setState('idle');
      }
    }
  }
}
