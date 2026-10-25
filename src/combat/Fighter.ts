import {clamp,WORLD,type AttackAction,type Box,type FighterState,type Identity,type InputFrame,type Move,type MotionId} from '../core/types';
import {MotionBuffer} from '../input/MotionBuffer';
import {normalButtons} from '../characters/normals';
import {prepareTraitMove} from './Traits';

export class Fighter {
  x:number;y=WORLD.floor;vx=0;vy=0;facing:1|-1;
  hp:number;sp=0;ego=35;guardMeter=100;state:FighterState='idle';age=0;
  attack:Move|null=null;attackAge=0;attackSerial=0;hitTargets=new Set<number>();
  connected=false;hitConfirmed=false;stun=0;invuln=0;combo=0;comboDamage=0;comboTimer=0;
  cooldowns:Record<string,number>={};statuses={burn:0,rupture:0};
  dashTimer=0;dashDirection:1|-1=1;backDash=false;airVelocity=0;knockdown=false;
  buffer:{action:AttackAction;command?:MotionId;ttl:number;held?:InputFrame['held']}|null=null;motion=new MotionBuffer();
  private movementBuffer:{action:'jump'|'dash';ttl:number}|null=null;
  backHeld=false;lowGuard=false;held:InputFrame['held']={};landingLag=0;
  throwLock=0;throwTechTimer=0;throwInvuln=0;airSpecialUsed=false;private airNormals=new Set<string>();
  traitCount=0;traitTimer=0;traitFlash='';traitUsed=new Set<string>();
  ammo=3;limbCharge=0;mirror:{x:number;y:number;life:number}|null=null;
  moveCharge=0;private chargeButton:AttackAction='special';
  wallBouncePending=false;bouncesUsed=0;slowTimer=0;slowScale=1;seals:[number,number]=[0,0];
  contactRewards=new Set<string>();
  lastMove='';totalDamage=0;totalHits=0;
  constructor(public readonly index:number,public identity:Identity){this.x=index===0?650:1110;this.facing=index===0?1:-1;this.hp=identity.hp;}
  get grounded(){return this.y>=WORLD.floor;}
  get active(){return !!this.attack&&this.attackAge>=this.attack.startup&&this.attackAge<this.attack.startup+this.attack.active;}
  get hitIndex(){if(!this.active||!this.attack)return -1;return this.attack.hits?this.attack.hits.findIndex(h=>this.attackAge-this.attack!.startup>=h.frame&&this.attackAge-this.attack!.startup<h.frame+h.duration):0;}
  get appearance(){return this.attack?.appearance??'lcb';}
  targetKey(index:number){return index+Math.max(0,this.hitIndex)*2;}
  get hurtbox():Box{const crouched=this.attack?.normal?.stance==='crouch'||this.state==='crouch'||this.state==='block'&&this.lowGuard;const h=this.state==='down'?34:this.attack?.lowProfileUntil&&this.attackAge<=this.attack.lowProfileUntil?54:crouched?67:114;return {x:this.x-23,y:this.y-h,w:46,h};}
  get attackReach(){const m=this.attack;if(!m)return 0;if(m.limb)return m.box.w+m.limb.reach*this.limbCharge/Math.max(1,m.limb.charge);if(!m.extend)return m.box.w;const [near,far]=m.extend,frame=this.attackAge-m.startup;const progress=frame<0?0:frame<m.active?frame/Math.max(1,m.active-1):Math.max(0,1-(frame-m.active)/8);return near+(far-near)*progress;}
  get limbHurtbox():Box|null{const m=this.attack;if(!m?.limb||this.attackAge<m.startup||this.attackAge>=m.startup+m.active+6)return null;const w=Math.max(0,this.attackReach-25);return {x:this.facing===1?this.x+20:this.x-20-w,y:this.y-83,w,h:30};}
  get hitbox():Box|null{if(!this.active||!this.attack||this.hitIndex<0||this.attack.projectile||this.attack.throwRange||this.attack.field?.trigger==='cast')return null;const b=this.attack.hitBoxes?.[this.hitIndex]??this.attack.box,inner=this.attack.minRange??0,w=Math.max(0,(this.attack.extend||this.attack.limb?this.attackReach:b.w)-inner);return {x:this.facing===1?this.x+b.x+inner:this.x-b.x-inner-w,y:this.y+b.y,w,h:b.h};}
  setState(state:FighterState){if(this.state!==state){this.state=state;this.age=0;}}
  canCancel(action:AttackAction,command?:MotionId){
    if(this.canBloodLink(command))return true;
    const m=this.attack;if(!m||!this.connected||this.attackAge<m.cancel[0]||this.attackAge>m.cancel[1])return false;
    if(command)return m.into.includes('special');
    if(action==='ego')return m.into.includes('ego');
    if(!m.normal||!normalButtons.includes(action as typeof normalButtons[number]))return false;
    const strength=normalButtons.indexOf(action as typeof normalButtons[number])%3+1;
    return strength>m.normal.strength;
  }
  private canBloodLink(command?:MotionId){
    const m=this.attack,target=command&&this.identity.commandMoves?.[command];
    return !!(this.identity.sinner==='sin'&&command&&target&&m&&m.source&&!m.throwRange&&!m.airOnly&&m.action==='special'&&this.grounded&&this.hitConfirmed&&this.hp>60&&!this.traitUsed.has('blood-link')&&m.id!==target.id&&this.attackAge>=m.startup&&this.attackAge<=m.startup+m.active+Math.min(12,m.recovery));
  }
  lifeCostFor(move:Move,command?:MotionId){return (move.lifeCost??0)+(this.canBloodLink(command)?60:0);}
  beginAttack(action:AttackAction,input:InputFrame,command?:MotionId):boolean{
    if(this.stun||this.throwLock||this.landingLag||['down','rise','thrown'].includes(this.state)||this.hp<=0||this.attack&&!this.canCancel(action,command))return false;
    let key:string=action;
    if(command){if(!this.grounded&&this.airSpecialUsed)return false;}
    else if(action==='ego'||action==='throw'){if(!this.grounded)return false;}
    else if(!this.grounded)key=`air-${action}`;
    else if(input.held.crouch)key=`crouch-${action}`;
    else if(action==='light'&&this.dashTimer>0&&!this.backDash)key='dashAttack';
    let move=command?(this.grounded?this.identity.commandMoves?.[command]:this.identity.airCommandMoves?.[command]):this.identity.moves[key];
    if(!move)return false;
    if(move.ammoCost&&this.ammo<move.ammoCost){
      if(!this.grounded)return false;
      move={...move,id:move.id+'-reload',name:'魔弹·装填',startup:28,active:1,recovery:13,cost:0,cooldown:0,damage:0,lunge:0,box:{x:0,y:0,w:0,h:0},projectile:undefined,ammoCost:undefined,reload:true,cancel:[0,0],into:[],effect:undefined};
    }
    if(this.ego<move.cost||(this.cooldowns[move.id]??0)>0||this.hp<=this.lifeCostFor(move,command))return false;
    if(!this.grounded&&move.normal&&this.airNormals.has(move.normal.button))return false;
    if(!this.grounded){if(command)this.airSpecialUsed=true;else if(move.normal)this.airNormals.add(move.normal.button);}
    const bloodLink=this.canBloodLink(command);
    move=prepareTraitMove(this,move);
    if(bloodLink){this.hp-=60;this.traitUsed.add('blood-link');this.traitFlash='破限 · 支付 60 体力';}
    this.ego=clamp(this.ego-move.cost,0,100);this.hp-=move.lifeCost??0;if(move.ammoCost)this.ammo-=move.ammoCost;this.limbCharge=0;this.moveCharge=0;this.chargeButton=command?({qcf:'light',qcb:'heavy',dp:'special',ddj:'light',qcfk:'heavy',qcbl:'special',dpj:'light'} as const)[command]:action;this.contactRewards.clear();this.attack=move;this.attackAge=0;this.attackSerial++;this.hitTargets.clear();this.connected=false;this.hitConfirmed=false;
    this.cooldowns[move.id]=move.cooldown;this.dashTimer=0;this.buffer=null;this.lastMove=move.name;this.setState('attack');return true;
  }
  interrupt(frames:number){this.attack=null;this.hitConfirmed=false;this.dashTimer=0;this.buffer=null;this.movementBuffer=null;this.wallBouncePending=false;this.stun=frames;this.setState('hit');}
  private takeoff(direction:number){this.movementBuffer=null;this.airVelocity=direction*this.identity.speed*.95;this.vx=this.airVelocity;this.vy=-this.identity.jump;this.dashTimer=0;this.setState('jump');}
  /** Hitstop freezes combat time, but directions and button edges still arrive. */
  receiveInput(input:InputFrame){
    this.held=input.held;
    const directions=input.directionChanges??[];this.motion.record(directions[0]??input.held,this.facing);for(const held of directions.slice(1))this.motion.record(held,this.facing,false);if(directions.length)this.motion.record(input.held,this.facing,false);
    let command=input.command??this.motion.recognize(input.pressed);
    if(command&&!this.grounded&&!this.identity.airCommandMoves?.[command])command=undefined;
    if(command){this.buffer={action:'special',command,ttl:18};this.motion.clear();}
    else for(const action of ['throw','ego','heavyAlt','special','mediumAlt','heavy','lightAlt','light'] as const)if(input.pressed[action]){this.buffer={action,ttl:10,held:{...input.held}};break;}
    if(input.pressed.jump)this.movementBuffer={action:'jump',ttl:8};
    else if(input.pressed.dash)this.movementBuffer={action:'dash',ttl:8};
    if(input.pressed.throw)this.throwTechTimer=7;
  }
  step(input:InputFrame,enemy:Fighter){
    this.age++;this.traitFlash='';if(this.traitTimer>0){this.traitTimer--;if(!this.traitTimer&&this.identity.sinner==='heath')this.traitCount=0;}
    if(this.mirror&&--this.mirror.life<=0)this.mirror=null;
    if(this.slowTimer>0){if(!--this.slowTimer)this.slowScale=1;}
    if(this.grounded&&!this.attack&&!this.throwLock&&(!this.stun||this.state==='block')&&!this.dashTimer&&Math.abs(enemy.x-this.x)>6)this.facing=enemy.x>this.x?1:-1;
    this.backHeld=!!input.held[this.facing===1?'left':'right']&&!input.held[this.facing===1?'right':'left'];this.lowGuard=!!input.held.crouch;
    this.receiveInput(input);
    for(const key in this.cooldowns)this.cooldowns[key]=Math.max(0,this.cooldowns[key]-1);
    this.invuln=Math.max(0,this.invuln-1);this.throwInvuln=Math.max(0,this.throwInvuln-1);this.throwTechTimer=Math.max(0,this.throwTechTimer-1);if(input.pressed.throw)this.throwTechTimer=7;
    if(this.comboTimer>0)this.comboTimer--;else{this.combo=0;this.comboDamage=0;}
    this.guardMeter=Math.min(100,this.guardMeter+.13);this.ego=Math.min(100,this.ego+.018);
    if(this.hp<=0){this.setState('ko');this.attack=null;this.mirror=null;this.vx*=.9;this.physics();return;}
    if(this.buffer&&--this.buffer.ttl<0)this.buffer=null;
    if(this.movementBuffer&&--this.movementBuffer.ttl<0)this.movementBuffer=null;
    if(this.throwLock>0){this.throwLock--;return;}
    if(this.stun>0){this.stun--;this.vx*=.92;this.airVelocity=this.vx;this.physics();if(!this.stun&&this.grounded&&this.knockdown){this.setState('down');this.knockdown=false;}return;}
    if(this.knockdown&&!this.grounded){this.vx*=.98;this.airVelocity=this.vx;this.physics();if(this.grounded){this.setState('down');this.knockdown=false;}return;}
    if(this.state==='down'){this.vx*=.8;this.physics();if(this.age>=32){this.setState('rise');this.invuln=30;this.throwInvuln=40;}return;}
    if(this.state==='rise'){if(this.age>=18)this.setState('idle');return;}
    if(this.landingLag>0){this.landingLag--;this.physics();return;}
    const direction=Number(!!input.held.right)-Number(!!input.held.left);
    if(this.grounded&&this.attack&&this.movementBuffer?.action==='dash'){
      const normal=this.attack.normal;
      if(this.identity.sinner==='faust'&&(normal?.strength===3||this.attack.feint)&&this.attackAge>=2&&this.attackAge<this.attack.startup-1&&this.backHeld&&this.ego>=12&&this.traitTimer<=0){
        this.ego-=12;this.traitTimer=90;this.traitFlash='虚实取消';this.attack=null;this.buffer=null;this.movementBuffer=null;this.dashDirection=this.facing===1?-1:1;this.backDash=true;this.dashTimer=7;this.vx=this.dashDirection*8;this.setState('dash');this.physics();return;
      }
      if(this.identity.sinner==='hong'&&normal&&this.hitConfirmed&&this.traitTimer>0&&!this.traitUsed.has('flow')&&direction===this.facing&&this.ego>=8){
        this.ego-=8;this.traitTimer=0;this.traitUsed.add('flow');this.traitFlash='游龙 · 滑步';this.attack=null;this.buffer=null;this.movementBuffer=null;this.dashDirection=this.facing;this.backDash=false;this.dashTimer=5;this.vx=this.facing*13;this.setState('dash');this.physics();return;
      }
    }
    if(this.attack&&this.movementBuffer?.action==='jump'&&this.connected&&(this.attack.normal?.launcher||this.attack.jumpCancel)&&this.grounded&&this.attackAge<=this.attack.cancel[1]){this.attack=null;this.takeoff(direction||this.facing);this.physics();return;}
    // Consume a buffered follow-up on the first actionable frame, with no idle tick.
    if(this.attack&&this.attackAge>=this.attack.startup+this.attack.active+this.attack.recovery-1){this.attack=null;this.setState(this.grounded?'idle':'fall');}
    if(this.buffer)this.beginAttack(this.buffer.action,{...input,held:this.buffer.held??input.held},this.buffer.command);
    if(this.attack){
      if(this.grounded&&this.attack.charge&&this.attackAge===this.attack.startup-1){
        const charge=this.attack.charge;
        if(this.moveCharge<charge.frames&&input.held[this.chargeButton]){this.moveCharge++;this.vx=0;this.physics();return;}
        if(this.moveCharge){const amount=this.moveCharge/charge.frames;this.attack={...this.attack,damage:Math.round(this.attack.damage*(1+charge.damage*amount)),knockback:this.attack.knockback+charge.push*amount,wallBounce:this.moveCharge>=charge.frames/2};this.traitFlash='蓄势释放';}
      }
      if(this.grounded&&this.attack.limb&&this.attack.normal&&this.attackAge===this.attack.startup-1&&this.limbCharge<this.attack.limb.charge&&input.held[this.attack.normal.button]){this.limbCharge++;this.vx=0;this.physics();return;}
      this.attackAge++;
      if(this.attackAge===this.attack.startup&&this.grounded){
        if(this.attack.reload){this.ammo=3;this.traitFlash='装填完成';}
        if(this.attack.limb&&this.limbCharge)this.traitFlash='展臂释放';
        if(this.attack.teleport)this.x=clamp(this.x+this.facing*this.attack.teleport,WORLD.left,WORLD.right);
        if(this.attack.effect==='uppercut'&&!this.attack.normal){this.airVelocity=this.facing*this.attack.lunge;this.vy=-9;}
      }
      const travel=this.attack.travel,phase=this.attackAge<this.attack.startup?'startup':this.active?'active':'recovery';
      this.vx=!this.grounded||this.vy<0?this.airVelocity:travel?.[phase]!==undefined?this.facing*travel[phase]!:this.active?this.facing*this.attack.lunge:this.vx*.5;
      if(this.attackAge>=this.attack.startup+this.attack.active+this.attack.recovery){this.attack=null;this.setState(this.grounded?'idle':'fall');}
      this.physics();return;
    }
    if(this.movementBuffer?.action==='jump'&&this.grounded){this.takeoff(direction);this.physics();return;}
    if(!this.grounded){this.vx=this.airVelocity;this.setState(this.vy<0?'jump':'fall');this.physics();return;}
    if(this.movementBuffer?.action==='dash'&&!this.dashTimer){this.movementBuffer=null;this.dashDirection=(direction||this.facing) as 1|-1;this.backDash=this.dashDirection!==this.facing;this.dashTimer=this.backDash?8:12;}
    if(this.dashTimer>0){this.dashTimer--;this.vx=this.dashDirection*(this.backDash?8:13)*this.slowScale;this.setState('dash');}
    else if(input.held.crouch){this.vx=0;this.setState('crouch');}
    else{this.vx=direction*this.identity.speed*(this.backHeld?.65:1)*this.slowScale;this.setState(direction?'run':'idle');}
    this.physics();
  }
  physics(){
    const airborne=!this.grounded||this.vy<0;
    const nextX=this.x+this.vx;this.x=clamp(nextX,WORLD.left,WORLD.right);
    if(this.hp>0&&this.wallBouncePending&&(nextX<=WORLD.left||nextX>=WORLD.right)){
      this.wallBouncePending=false;this.bouncesUsed++;this.vx=nextX<=WORLD.left?7:-7;this.airVelocity=this.vx;this.vy=-7;this.stun=Math.max(20,this.stun);this.knockdown=false;this.traitFlash='撞墙反弹';
    }
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
