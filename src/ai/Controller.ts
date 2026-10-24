import { neutral, type Difficulty, type InputFrame } from '../core/types';
import type { Fighter } from '../combat/Fighter';

const presets = { easy: { reaction: 28, mistake: .3, guard: .2, chain: .3 }, normal: { reaction: 17, mistake: .15, guard: .47, chain: .62 }, hard: { reaction: 10, mistake: .06, guard: .72, chain: .88 } };
export class AIController {
  private timer = 0; private held: InputFrame['held'] = {}; private sequence = 0;
  private observed = { x: 0, y: 0, attacking: false }; private seed = 90210;
  constructor(public difficulty: Difficulty) {}
  private random() { this.seed = (Math.imul(this.seed,1664525)+1013904223)>>>0; return this.seed/4294967296; }
  reset() { this.timer = 0; this.held = {}; this.sequence = 0; }
  sample(self: Fighter, enemy: Fighter): InputFrame {
    const frame = neutral(); frame.held = { ...this.held };
    if (--this.timer > 0) return frame;
    const p = presets[this.difficulty]; this.timer = p.reaction + Math.floor(this.random()*9);
    // Decisions use the previous observation: the CPU cannot inspect future input.
    const observed = this.observed;
    this.observed = {x:enemy.x,y:enemy.y,attacking:!!enemy.attack};
    this.held = {}; this.sequence++;
    const delta = (observed.x || enemy.x) - self.x, distance = Math.abs(delta), forward = delta > 0 ? 'right' : 'left', backward = delta > 0 ? 'left' : 'right';
    if (self.stun || self.state === 'down') return frame;
    // Optional trait decisions use confirmed contacts / previous observations only.
    if(self.grounded&&self.attack&&this.random()<p.chain){
      if(self.identity.sinner==='faust'&&self.attack.normal?.strength===3&&self.attackAge<self.attack.startup-1&&observed.attacking&&self.ego>=12&&!self.traitTimer){this.held[backward]=true;return {held:{...this.held},pressed:{dash:true}};}
      if(self.identity.sinner==='hong'&&self.attack.normal&&self.hitConfirmed&&self.traitTimer>0&&!self.traitUsed.has('flow')&&self.ego>=8){this.held[forward]=true;return {held:{...this.held},pressed:{dash:true}};}
      if(self.identity.sinner==='sin'&&self.attack.source&&self.hitConfirmed&&!self.traitUsed.has('blood-link')&&self.hp>self.identity.hp*.35&&self.ego>=22)return {held:{},pressed:{},command:self.attack.appearance==='redsheet'?'dp':'qcb'};
      if(self.attack.limb&&distance>120&&!observed.attacking&&self.limbCharge<12&&self.attack.normal){this.held[self.attack.normal.button]=true;return {held:{...this.held},pressed:{}};}
    }
    if(!self.attack&&self.grounded&&self.identity.sinner==='yi'&&!self.mirror&&distance>220&&self.ego>=30&&this.random()<p.chain)return {held:{},pressed:{},command:'dpj'};
    if(!self.attack&&self.grounded&&self.identity.sinner==='outis'&&distance>240&&self.ego>=20&&this.random()<p.chain)return {held:{},pressed:{},command:'qcf'};
    if (observed.attacking && distance < 210 && this.random() < p.guard && !self.attack) this.held[backward] = true;
    else if (distance > 112) { this.held[forward] = true; if (distance > 340 && this.random() < .4) frame.pressed.dash = true; }
    else if (distance < 58 && !self.attack && this.random() < .23) this.held[backward] = true;
    if (this.random() > p.mistake && !this.held[backward]) {
      if (self.attack && self.connected && this.random() < p.chain) { const strength=self.attack.normal?.strength??3;if(strength<3)frame.pressed[strength===1?'heavy':'special']=true;else frame.command=self.grounded?(this.sequence%2?'qcf':'qcb'):'qcf'; }
      else if (distance < 380 && self.ego >= 80 && this.random() < .3) frame.pressed.ego = true;
      else if (self.ego >= 23 && this.random() < .27 && distance < (self.identity.sinner==='heath'?580:185)) frame.command=distance>210?'qcf':observed.y<self.y-40?'dp':this.sequence%2?'qcf':'qcb';
      else if(distance<65&&self.grounded&&this.random()<.15)frame.pressed.throw=true;else if(distance<140)frame.pressed[observed.y<self.y-35?'special':this.random()<.3?'mediumAlt':distance<90?'light':'heavy']=true;
        if ((observed.y < self.y - 45 || (distance > 200 && this.random() < .12)) && self.grounded) frame.pressed.jump = true;
    }
    frame.held = { ...this.held }; return frame;
  }
}
