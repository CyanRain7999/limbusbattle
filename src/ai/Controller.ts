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
    if (observed.attacking && distance < 210 && this.random() < p.guard && !self.attack) this.held.guard = true;
    else if (distance > 112) { this.held[forward] = true; if (distance > 340 && this.random() < .4) frame.pressed.dash = true; }
    else if (distance < 58 && !self.attack && this.random() < .23) this.held[backward] = true;
    if (this.random() > p.mistake && !this.held.guard) {
      if (self.attack && self.connected && this.random() < p.chain) { const next = self.attack.action === 'light' ? (this.sequence%3 ? 'light':'heavy') : 'special'; if(next==='special')frame.command=this.sequence%2?'qcf':'qcb';else frame.pressed[next]=true; }
      else if (distance < 380 && self.ego >= 80 && this.random() < .3) frame.pressed.ego = true;
      else if (self.ego >= 23 && this.random() < .27 && distance < (self.identity.sinner==='heath'?580:185)) frame.command=distance>210?'qcf':observed.y<self.y-40?'dp':this.sequence%2?'qcf':'qcb';
      else if (distance < 129) frame.pressed[this.random() < .3 ? 'heavy' : 'light'] = true;
        if ((observed.y < self.y - 45 || (distance > 200 && this.random() < .12)) && self.grounded) frame.pressed.jump = true;
    }
    frame.held = { ...this.held }; return frame;
  }
}
