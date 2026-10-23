import { clamp, WORLD, type AttackAction, type Box, type FighterState, type Identity, type InputFrame, type Move, type MotionId } from '../core/types';
import { MotionBuffer } from '../input/MotionBuffer';

export class Fighter {
  x: number; y = WORLD.floor; vx = 0; vy = 0; facing: 1 | -1;
  hp: number; sp = 0; ego = 35; guardMeter = 100; state: FighterState = 'idle'; age = 0;
  attack: Move | null = null; attackAge = 0; attackSerial = 0; hitTargets = new Set<number>();
  connected = false; stun = 0; invuln = 0; combo = 0; comboDamage = 0; comboTimer = 0;
  cooldowns: Record<string, number> = {}; statuses = { burn: 0, rupture: 0 };
  dashTimer = 0; airDash = false; knockdown = false; buffer: { action: AttackAction; command?:MotionId; ttl: number } | null = null;
  motion=new MotionBuffer();
  lastMove = ''; totalDamage = 0; totalHits = 0;
  constructor(public readonly index: number, public identity: Identity) {
    this.x = index === 0 ? 650 : 1110; this.facing = index === 0 ? 1 : -1; this.hp = identity.hp;
  }
  get grounded() { return this.y >= WORLD.floor; }
  get active() { return !!this.attack && this.attackAge >= this.attack.startup && this.attackAge < this.attack.startup + this.attack.active; }
  get hitIndex(){if(!this.active||!this.attack)return -1;return this.attack.hits?this.attack.hits.findIndex(hit=>this.attackAge-this.attack!.startup>=hit.frame&&this.attackAge-this.attack!.startup<hit.frame+hit.duration):0;}
  get appearance(){return this.attack?.appearance??'lcb';}
  targetKey(index:number){return index+Math.max(0,this.hitIndex)*2;}
  get hurtbox(): Box { const h = this.state === 'crouch' ? 67 : this.state === 'down' ? 34 : 114; return { x: this.x - 23, y: this.y - h, w: 46, h }; }
  get hitbox(): Box | null {
    if (!this.active || !this.attack || this.hitIndex<0 || this.attack.projectile) return null;
    const b = this.attack.box;
    return { x: this.facing === 1 ? this.x + b.x : this.x - b.x - b.w, y: this.y + b.y, w: b.w, h: b.h };
  }
  setState(state: FighterState) { if (this.state !== state) { this.state = state; this.age = 0; } }
  canCancel(action: AttackAction) {
    return !!this.attack && this.connected && this.attackAge >= this.attack.cancel[0] && this.attackAge <= this.attack.cancel[1] && this.attack.into.includes(action);
  }
  beginAttack(action: AttackAction, input: InputFrame,command?:MotionId): boolean {
    const cancel = this.canCancel(action);
    if (this.stun || this.state === 'down' || this.state === 'rise' || this.hp <= 0 || (this.attack && !cancel)) return false;
    let key: string = action;
    if (action === 'light') {
      if (cancel && this.attack?.id === 'light') key = 'light2';
      else if (cancel && this.attack?.id === 'light2') key = 'light3';
      else if (!this.grounded) key = 'air';
      else if (this.dashTimer > 0 || input.held[this.facing === 1 ? 'right' : 'left']) key = 'dashAttack';
    }
    // Down + heavy is an explicit launcher; heavy itself also launches.
    const move = command?this.identity.commandMoves?.[command]:this.identity.moves[key];
    if (!move || this.ego < move.cost || (this.cooldowns[move.id] ?? 0) > 0) return false;
    this.ego = clamp(this.ego - move.cost, 0, 100);
    this.attack = move; this.attackAge = 0; this.attackSerial++; this.hitTargets.clear(); this.connected = false;
    this.cooldowns[move.id] = move.cooldown; this.dashTimer = 0; this.buffer = null;
    this.lastMove = move.name; this.setState('attack'); return true;
  }
  interrupt(frames: number) { this.attack = null; this.dashTimer = 0; this.buffer = null; this.stun = frames; this.setState('hit'); }
  step(input: InputFrame, enemy: Fighter) {
    this.age++;
    const directions=input.directionChanges??[];
    this.motion.record(directions[0]??input.held,this.facing);
    for(const held of directions.slice(1))this.motion.record(held,this.facing,false);
    if(directions.length)this.motion.record(input.held,this.facing,false);
    for (const key in this.cooldowns) this.cooldowns[key] = Math.max(0, this.cooldowns[key] - 1);
    if (this.invuln > 0) this.invuln--;
    if (this.comboTimer > 0) this.comboTimer--; else { this.combo = 0; this.comboDamage = 0; }
    if (this.hp <= 0) { this.setState('ko'); this.attack = null; this.vx *= .9; this.physics(); return; }
    if (!this.attack && !this.stun && !this.dashTimer && Math.abs(enemy.x - this.x) > 6) this.facing = enemy.x > this.x ? 1 : -1;
    this.guardMeter = Math.min(100, this.guardMeter + .13);
    this.ego = Math.min(100, this.ego + .018);
    if (this.stun > 0) { this.stun--; this.vx *= .92; this.physics(); if (!this.stun && this.grounded && this.knockdown) { this.setState('down'); this.knockdown = false; } return; }
    if (this.knockdown && !this.grounded) { this.vx *= .98; this.physics(); if(this.grounded){this.setState('down');this.knockdown=false;} return; }
    if (this.state === 'down') { this.vx *= .8; this.physics(); if (this.age >= 32) { this.setState('rise'); this.invuln = 30; } return; }
    if (this.state === 'rise') { if (this.age >= 18) this.setState('idle'); return; }
    const command=input.command??this.motion.recognize(input.pressed);
    if(command){this.buffer={action:'special',command,ttl:12};this.motion.clear();}
    else for (const a of ['ego', 'heavy', 'light'] as const) if (input.pressed[a]) { this.buffer = { action: a, ttl: 9 }; break; }
    if (this.buffer) { this.buffer.ttl--; if (this.buffer.ttl < 0) this.buffer = null; else this.beginAttack(this.buffer.action, input,this.buffer.command); }
    if (this.attack) {
      this.attackAge++;
      if(this.attackAge===this.attack.startup){
        if(this.attack.teleport)this.x=clamp(this.x+this.facing*this.attack.teleport,WORLD.left,WORLD.right);
        if(this.attack.effect==='uppercut'&&this.grounded)this.vy=-9;
      }
      this.vx = this.active ? this.facing * this.attack.lunge : this.vx * .68;
      // Jump-cancel a connected launcher for an air pursuit.
      if (input.pressed.jump && this.connected && this.attack.launch >= 7 && this.grounded) { this.attack = null; this.vy = -this.identity.jump; this.setState('jump'); }
      else if (this.attackAge >= this.attack.startup + this.attack.active + this.attack.recovery) { this.attack = null; this.setState(this.grounded ? 'idle' : 'fall'); }
      this.physics(); return;
    }
    if (input.pressed.jump && this.grounded && !input.held.guard) { this.vy = -this.identity.jump; this.setState('jump'); }
    if (input.pressed.dash && !this.dashTimer && (this.grounded || !this.airDash) && !input.held.guard) {
      this.dashTimer = 12; if (!this.grounded) { this.airDash = true; this.vy = -1; }
      if (input.held.left) this.facing = -1; else if (input.held.right) this.facing = 1;
    }
    const direction = Number(!!input.held.right) - Number(!!input.held.left);
    if (this.dashTimer > 0) { this.dashTimer--; this.vx = this.facing * 13; this.setState('dash'); }
    else if (input.held.guard && this.grounded) { this.vx = 0; this.setState('guard'); }
    else if (input.held.crouch && this.grounded) { this.vx = 0; this.setState('crouch'); }
    else { this.vx = direction * this.identity.speed * (this.grounded ? 1 : .85); this.setState(this.grounded ? (direction ? 'run' : 'idle') : this.vy < 0 ? 'jump' : 'fall'); }
    this.physics();
  }
  physics() {
    this.x = clamp(this.x + this.vx, WORLD.left, WORLD.right);
    if (!this.grounded || this.vy < 0) { this.y += this.vy; this.vy += .62; }
    if (this.y >= WORLD.floor) { this.y = WORLD.floor; this.vy = 0; this.airDash = false; }
  }
}
