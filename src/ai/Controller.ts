import { neutral, type Difficulty, type InputFrame,type MotionId } from '../core/types';
import type { Fighter } from '../combat/Fighter';

const presets = { easy: { reaction: 28, mistake: .3, guard: .2, chain: .3 }, normal: { reaction: 17, mistake: .15, guard: .47, chain: .62 }, hard: { reaction: 10, mistake: .06, guard: .72, chain: .88 } };
export class AIController {
  private timer = 0; private held: InputFrame['held'] = {}; private sequence = 0;
  private observed = { x: 0, y: 0, attacking: false, recovering:false,seals:0 }; private seed = 90210;
  constructor(public difficulty: Difficulty) {}
  private random() { this.seed = (Math.imul(this.seed,1664525)+1013904223)>>>0; return this.seed/4294967296; }
  reset() { this.timer = 0; this.held = {}; this.sequence = 0; }
  sample(self: Fighter, enemy: Fighter): InputFrame {
    const frame = neutral(); frame.held = { ...this.held };
    if (--this.timer > 0) return frame;
    const p = presets[this.difficulty]; this.timer = p.reaction + Math.floor(this.random()*9);
    // Decisions use the previous observation: the CPU cannot inspect future input.
    const observed = this.observed;
    this.observed = {x:enemy.x,y:enemy.y,attacking:!!enemy.attack,recovering:!!enemy.attack&&enemy.attackAge>=enemy.attack.startup+enemy.attack.active,seals:enemy.seals[self.index]};
    this.held = {}; this.sequence++;
    const delta = (observed.x || enemy.x) - self.x, distance = Math.abs(delta), forward = delta > 0 ? 'right' : 'left', backward = delta > 0 ? 'left' : 'right';
    if (self.stun || self.state === 'down') return frame;
    // Optional trait decisions use confirmed contacts / previous observations only.
    if(self.grounded&&self.attack&&this.random()<p.chain){
      if(self.identity.sinner==='faust'&&(self.attack.normal?.strength===3||self.attack.feint)&&self.attackAge<self.attack.startup-1&&observed.attacking&&self.ego>=12&&!self.traitTimer){this.held[backward]=true;return {held:{...this.held},pressed:{dash:true}};}
      if(self.identity.sinner==='hong'&&self.attack.normal&&self.hitConfirmed&&self.traitTimer>0&&!self.traitUsed.has('flow')&&self.ego>=8){this.held[forward]=true;return {held:{...this.held},pressed:{dash:true}};}
      if(self.identity.sinner==='sin'&&self.attack.source&&self.hitConfirmed&&!self.traitUsed.has('blood-link')&&self.hp>self.identity.hp*.35&&self.ego>=22)return {held:{},pressed:{},command:self.attack.appearance==='redsheet'?'dp':'qcb'};
      if(self.attack.limb&&distance>120&&!observed.attacking&&self.limbCharge<12&&self.attack.normal){this.held[self.attack.normal.button]=true;return {held:{...this.held},pressed:{}};}
      if(self.attack.charge&&self.moveCharge<12&&!observed.attacking){this.held.light=true;return {held:{...this.held},pressed:{}};}
    }
    if(!self.attack&&self.grounded&&self.identity.sinner==='yi'&&!self.mirror&&distance>220&&self.ego>=30&&this.random()<p.chain)return {held:{},pressed:{},command:'dpj'};
    if(!self.attack&&self.grounded&&self.identity.sinner==='outis'&&distance>240&&self.ego>=20&&this.random()<p.chain)return {held:{},pressed:{},command:'qcf'};
    const preferred=self.identity.sinner==='outis'?260:self.identity.sinner==='yi'?200:self.identity.sinner==='meur'?85:self.identity.sinner==='don'?145:112;
    if (observed.attacking && distance < 210 && this.random() < p.guard && !self.attack) this.held[backward] = true;
    else if (distance > preferred) { this.held[forward] = true; if (distance > 340 && this.random() < .4) frame.pressed.dash = true; }
    else if (distance < preferred*.5 && !self.attack && this.random() < .3) this.held[backward] = true;
    if (this.random() > p.mistake && !this.held[backward]) {
      if (self.attack && self.connected && this.random() < p.chain) { const strength=self.attack.normal?.strength??3;if(strength<3)frame.pressed[strength===1?'heavy':'special']=true;else frame.command=self.grounded?this.chooseCommand(self,observed,distance):'qcf'; }
      else if (distance < 380 && self.ego >= 80 && this.random() < .3) frame.pressed.ego = true;
      else if (self.ego >= 16 && this.random() < .32) frame.command=this.chooseCommand(self,observed,distance);
      else if(distance<65&&self.grounded&&this.random()<.15)frame.pressed.throw=true;else if(distance<140)frame.pressed[observed.y<self.y-35?'special':this.random()<.3?'mediumAlt':distance<90?'light':'heavy']=true;
        if ((observed.y < self.y - 45 || (distance > 200 && this.random() < .12)) && self.grounded) frame.pressed.jump = true;
    }
    frame.held = { ...this.held }; return frame;
  }
  /** Each kit chooses a useful verb from the previous observation, not opponent input. */
  private chooseCommand(self:Fighter,seen:typeof this.observed,distance:number):MotionId|undefined{
    let choices:MotionId[]=[];
    switch(self.identity.sinner){
      case 'don':choices=distance>330?['qcbl']:distance>150?['dp','qcf']:['qcf','ddj','qcfk'];break;
      case 'heath':choices=distance>300?['qcf','dpj']:seen.attacking?['dp','qcbl']:['qcb','ddj','qcfk'];break;
      case 'ryoshu':choices=seen.recovering?['qcfk','dp']:distance>185?['ddj','qcfk']:['qcbl','dp','qcf'];break;
      case 'meur':choices=distance<95&&!self.combo?['qcfk','qcf']:distance>260?['qcbl']:seen.y<520?['dp']:['qcf','qcb','ddj'];break;
      case 'ish':choices=seen.attacking&&distance>220?['ddj']:distance>175?['dp','qcbl']:self.traitTimer?['qcf']:['qcb','qcfk','qcf'];break;
      case 'rod':choices=self.hp<self.identity.hp*.7&&distance<220?['dp']:self.traitCount===3?['qcf','ddj']:distance>250?['qcbl']:['qcb','qcfk','qcf'];break;
      case 'yi':choices=distance>260?['qcb']:seen.y<520?['dp']:self.mirror?['qcbl','qcf']:['ddj','qcfk'];break;
      case 'outis':choices=distance>280?['qcf']:distance>155?['qcbl','qcf']:seen.attacking?['dp']:['qcb','ddj'];break;
      case 'greg':choices=self.hp<self.identity.hp*.7&&self.hp>70&&distance>105?['qcfk']:seen.y<520?['dp']:distance>190?['qcbl','ddj']:['qcf','qcb'];break;
      case 'faust':choices=seen.attacking&&distance<160?['qcb']:distance>190?['qcbl','qcfk']:['qcf','ddj'];break;
      case 'hong':choices=self.hp<self.identity.hp*.5&&distance<150?['qcbl','qcb']:distance>300?['dp']:distance>175?['qcfk','ddj']:['qcf','qcb'];break;
      case 'sin':choices=seen.seals?self.hp>300?['dp','qcfk','qcbl']:['dp','qcfk']:['qcb','ddj'];break;
    }
    return choices.find(slot=>{const move=self.identity.commandMoves?.[slot];return move&&self.ego>=move.cost&&!self.cooldowns[move.id]&&self.hp>(move.lifeCost??0)&&(!move.throwRange||distance<=move.throwRange)&&distance<(move.projectile?950:move.field?340:move.box.w+130);});
  }
}
