import { Fighter } from './Fighter';
import { clamp, intersects, neutral, type CombatEvent, type InputFrame, type MatchOptions, type Move } from '../core/types';
export interface Projectile {id:number;source:number;x:number;y:number;vx:number;vy:number;width:number;height:number;life:number;move:Move}

export class Match {
  fighters: [Fighter, Fighter]; frame = 0; hitstop = 0; timer = 99 * 60; round = 1;
  wins = [0, 0]; phase: 'intro' | 'fight' | 'roundover' | 'finished' = 'intro'; phaseTimer = 95;
  events: CombatEvent[] = []; winner = -1; roundWinner = -1; paused = false; clashes = 0;
  totals = [{damage:0,hits:0,maxCombo:0},{damage:0,hits:0,maxCombo:0}];
  projectiles:Projectile[]=[];private projectileSerial=0;
  private clashPairs = new Set<string>(); private rng: number;
  private grab:{source:number;target:number;age:number;direction:1|-1;move:Move}|null=null;
  constructor(public options: MatchOptions) { this.fighters = [new Fighter(0, options.p1), new Fighter(1, options.p2)]; this.rng = options.seed ?? 1023; }
  random() { this.rng = (Math.imul(1664525, this.rng) + 1013904223) >>> 0; return this.rng / 4294967296; }
  emit(event: CombatEvent) { this.events.push(event); }
  step(inputs: [InputFrame, InputFrame] = [neutral(), neutral()]) {
    this.events = [];
    if (this.paused || this.phase === 'finished') return;
    this.frame++;
    if (this.hitstop > 0) { this.hitstop--; return; }
    if (this.phase === 'intro') { if (--this.phaseTimer <= 0) { this.phase = 'fight'; this.emit({ type: 'round', x: 880, y: 330, source: 0, text: '交锋开始' }); } return; }
    if (this.phase === 'roundover') {
      for (const f of this.fighters) { if (f.hp <= 0) { f.vx *= .9; f.physics(); } else f.setState('win'); f.age++; }
      if (--this.phaseTimer <= 0) {
        if (this.wins.some(w => w >= 2)) { this.phase = 'finished'; this.winner = this.wins[0] >= 2 ? 0 : 1; }
        else { this.round++; this.fighters = [new Fighter(0, this.options.p1), new Fighter(1, this.options.p2)]; this.timer = 99 * 60; this.phase = 'intro'; this.phaseTimer = 80; this.clashPairs.clear(); }
      } return;
    }
    if (this.options.mode !== 'training') this.timer--;
    const previous = this.fighters.map(f => ({ serial: f.attackSerial, dash: f.dashTimer, ground: f.grounded }));
    for (let i = 0; i < 2; i++) this.fighters[i].step(inputs[i], this.fighters[1 - i]);
    for (let i = 0; i < 2; i++) {
      const f = this.fighters[i];
      if(f.attackSerial!==previous[i].serial&&f.attack?.source)this.emit({type:'skill',x:f.x,y:f.y-120,source:i,text:`${f.attack.source}\n${f.attack.name}`,color:f.attack.color??f.identity.color});
      if (f.attackSerial !== previous[i].serial && f.attack?.action === 'ego') { this.hitstop = 16; this.emit({ type: 'ego', x: f.x, y: f.y - 65, source: i, text: f.attack.name, color: f.identity.color }); }
      if (f.dashTimer > previous[i].dash) this.emit({ type: 'dash', x: f.x, y: f.y, source: i });
      if (!f.grounded && previous[i].ground) this.emit({ type: 'jump', x: f.x, y: f.y, source: i });
      if (f.statuses.burn > 0) { f.statuses.burn--; if (this.frame % 45 === 0) { f.hp = Math.max(1, f.hp - 8); this.emit({ type: 'status', x: f.x, y: f.y - 90, source: i, text: '灼烧 8' }); } }
      if (f.statuses.rupture > 0) f.statuses.rupture--;
    }
    this.pushboxes();
    this.stepProjectiles();
    if (!this.resolveThrows()&&!this.resolveClash()) this.resolveHits();
    if (this.options.mode === 'training') for (const f of this.fighters) { f.ego = 100; if (f.hp < 200 && !f.stun) f.hp = f.identity.hp; }
    if (this.fighters.some(f => f.hp <= 0) || this.timer <= 0) this.endRound();
  }
  private pushboxes() {
    const [a,b] = this.fighters;
    if (this.grab||Math.abs(a.y - b.y) > 90 || a.state === 'down' || b.state === 'down') return;
    const d = b.x - a.x, overlap = 49 - Math.abs(d);
    if (overlap > 0) {
      const s = d >= 0 ? 1 : -1;
      a.x = clamp(a.x - overlap / 2 * s, 85, 1675); b.x = clamp(b.x + overlap / 2 * s, 85, 1675);
      // Distribute residual penetration when a fighter is against the wall.
      const rest = 49 - Math.abs(b.x - a.x);
      if (rest > 0) { if (a.x <= 85 || a.x >= 1675) b.x = clamp(a.x + 49 * s,85,1675); else a.x = clamp(b.x - 49 * s,85,1675); }
    }
  }
  private resolveClash(): boolean {
    const [a,b] = this.fighters, ah = a.hitbox, bh = b.hitbox;
    if (!this.options.clash || !ah || !bh || !a.attack || !b.attack || a.hitTargets.has(a.targetKey(1)) || b.hitTargets.has(b.targetKey(0)) || !intersects(ah,bh)) return false;
    const key = `${a.attackSerial}:${b.attackSerial}`;
    if (this.clashPairs.has(key)) return false;
    this.clashPairs.add(key); this.clashes++;
    const scores = [a.attack.power + Math.floor(a.sp / 15) + Math.floor(this.random()*5), b.attack.power + Math.floor(b.sp/15) + Math.floor(this.random()*5)];
    this.hitstop = 6;
    this.emit({ type:'clash', x:(a.x+b.x)/2, y:Math.min(a.y,b.y)-85, source:scores[0] >= scores[1] ? 0 : 1, text:`${scores[0]} : ${scores[1]}` });
    if (scores[0] === scores[1]) { for (const f of this.fighters) { f.interrupt(13); f.vx = -f.facing * 4; } }
    else { const win = scores[0] > scores[1] ? a : b, lose = win === a ? b : a; lose.interrupt(17); lose.vx = -lose.facing * 3; win.sp = clamp(win.sp + 4,-45,45); lose.sp = clamp(lose.sp - 3,-45,45); }
    return true;
  }
  private resolveHits() {
    // Snapshot both strikes before applying reactions so simultaneous hits can trade.
    const hits: { a: Fighter; b: Fighter; move: Move; key:number }[] = [];
    for (const a of this.fighters) { const b = this.fighters[1-a.index]; const box = a.hitbox;
      if (box && a.attack && !a.hitTargets.has(a.targetKey(b.index)) && !b.invuln && b.hp > 0 && b.state !== 'down' && intersects(box,b.hurtbox)) {const scale=a.attack.hits?.[a.hitIndex]?.scale??1;hits.push({a,b,move:scale===1?a.attack:{...a.attack,damage:a.attack.damage*scale},key:a.targetKey(b.index)});}
    }
    for (const {a,b,move,key} of hits) {a.hitTargets.add(key);this.hit(a,b,move);}
  }
  private hit(a: Fighter, b: Fighter, move: Move) {
    if(a.attack?.id===move.id)a.connected = true;
    const defending=b.attack;
    if(defending?.counter&&b.attackAge>=defending.counter[0]&&b.attackAge<=defending.counter[1]){
      a.interrupt(20);a.vx=-a.facing*2;b.attackAge=defending.startup-1;b.invuln=7;b.sp=clamp(b.sp+4,-45,45);this.hitstop=5;
      this.emit({type:'block',x:b.x,y:b.y-85,source:b.index,target:a.index,text:'识破反击'});return;
    }
    const back=a.x>b.x?'left':'right';
    const defendingBack=!!b.held[back]&&!b.held[back==='left'?'right':'left'];
    const guardLevel=move.hitLevel??'mid';
    const blocking = !move.throwRange&&!b.attack&&b.grounded&&defendingBack&&(!b.stun||b.state==='block')&&!['down','rise','thrown'].includes(b.state)&&(guardLevel==='low'?b.lowGuard:guardLevel==='overhead'?!b.lowGuard:true);
    if (blocking) {
      a.combo=0;a.comboDamage=0;b.facing=a.x>b.x?1:-1;
      b.guardMeter -= move.damage * .34*(move.guardDamage??1);
      b.hp = Math.max(1, b.hp - Math.round(move.damage*.06));
      b.vx = a.facing * move.knockback * .45; b.stun = 12; b.setState('block'); a.ego = clamp(a.ego+4,0,100);
      this.hitstop = 3;
      if (b.guardMeter <= 0) { b.guardMeter = 40; b.interrupt(48); this.emit({type:'guardbreak',x:b.x,y:b.y-75,source:a.index,text:'防御崩解'}); }
      else this.emit({type:'block',x:b.x-b.facing*25,y:b.y-80,source:a.index,target:b.index});
      return;
    }
    if(!b.stun&&!b.knockdown||move.throwRange){a.combo=0;a.comboDamage=0;}
    const scaling = Math.max(.35, 1 - a.combo*.1);
    const rupture = b.statuses.rupture > 0 ? 16 : 0;
    const damage = Math.round((move.damage * scaling + rupture) * b.identity.defense);
    b.hp = Math.max(0,b.hp-damage); b.statuses.rupture = 0;
    a.combo++; a.comboTimer = move.hitstun + 42; a.comboDamage += damage; a.totalDamage += damage; a.totalHits++;
    this.totals[a.index].damage+=damage;this.totals[a.index].hits++;this.totals[a.index].maxCombo=Math.max(this.totals[a.index].maxCombo,a.combo);
    a.sp = clamp(a.sp+3,-45,45); b.sp = clamp(b.sp-2,-45,45);
    a.ego = clamp(a.ego+8+damage*.035,0,100); b.ego = clamp(b.ego+5+damage*.025,0,100);
    const armored=defending?.armorUntil&&b.attackAge<=defending.armorUntil;
    if(!armored){b.interrupt(move.hitstun);b.vx=a.facing*move.knockback;b.airVelocity=b.vx;if(move.launch>0)b.vy=-move.launch;b.knockdown=!!move.knockdown||move.launch>=13;}
    if (move.status) b.statuses[move.status] = move.status === 'burn' ? 240 : 300;
    this.hitstop = Math.max(this.hitstop,move.hitstop);
    this.emit({type:'hit',x:b.x,y:b.y-70,source:a.index,target:b.index,value:damage,color:move.color??a.identity.color,text:move.name});
  }
  private endRound() {
    this.projectiles=[];this.grab=null;
    const [a,b] = this.fighters;
    const score = a.hp/a.identity.hp-b.hp/b.identity.hp;
    this.roundWinner = score === 0 ? -1 : score > 0 ? 0 : 1;
    if (this.roundWinner >= 0) this.wins[this.roundWinner]++; else { this.wins[0]++; this.wins[1]++; }
    this.phase = 'roundover'; this.phaseTimer = 150;
    this.emit({type:'ko',x:(a.x+b.x)/2,y:300,source:this.roundWinner,text:this.timer<=0?'TIME UP':'K.O.'});
  }
  private stepProjectiles(){
    for(const f of this.fighters){const move=f.attack,p=move?.projectile;
      if(move&&p&&p.frames.includes(f.attackAge-move.startup))this.projectiles.push({id:++this.projectileSerial,source:f.index,x:f.x+f.facing*(move.airOnly?24:54),y:f.y-(move.airOnly?50:80),vx:f.facing*p.speed,vy:p.vy??0,width:p.width,height:p.height,life:p.life,move:{...move,projectile:undefined}});
    }
    for(const p of this.projectiles){p.x+=p.vx;p.y+=p.vy;p.life--;const a=this.fighters[p.source],b=this.fighters[1-p.source];
      if(b.hp>0&&!b.invuln&&b.state!=='down'&&intersects({x:p.x-p.width/2,y:p.y-p.height/2,w:p.width,h:p.height},b.hurtbox)){this.hit(a,b,p.move);p.life=0;}
      if(p.x<30||p.x>1730||p.y>600)p.life=0;
    }
    this.projectiles=this.projectiles.filter(p=>p.life>0);
  }
  private techThrow(a:Fighter,b:Fighter){
    this.grab=null;for(const f of [a,b]){f.throwLock=0;f.invuln=5;f.throwInvuln=35;f.y=570;f.interrupt(12);f.vx=-f.facing*4;}
    this.hitstop=5;this.emit({type:'throwtech',x:(a.x+b.x)/2,y:495,source:a.index,target:b.index,text:'拆投'});
  }
  private resolveThrows():boolean {
    if(this.grab){
      const g=this.grab,a=this.fighters[g.source],b=this.fighters[g.target];g.age++;b.x=clamp(a.x+g.direction*35,85,1675);b.y=564;
      if(g.age<=7&&b.throwTechTimer>0){this.techThrow(a,b);return true;}
      if(g.age>=13){this.grab=null;a.throwLock=b.throwLock=0;a.invuln=b.invuln=0;b.y=570;a.facing=g.direction;b.x=clamp(a.x+g.direction*67,85,1675);a.attackAge=g.move.startup+g.move.active;a.setState('attack');b.throwInvuln=35;this.hit(a,b,g.move);}
      return true;
    }
    for(const a of this.fighters){const b=this.fighters[1-a.index],move=a.attack;
      if(!move?.throwRange||!a.active||a.hitTargets.has(b.index)||!a.grounded||!b.grounded||b.stun||b.invuln||b.throwInvuln||['down','rise','thrown','ko'].includes(b.state)||Math.abs(a.x-b.x)>move.throwRange)continue;
      a.hitTargets.add(b.index);
      if(b.throwTechTimer>0){this.techThrow(a,b);return true;}
      this.grab={source:a.index,target:b.index,age:0,direction:a.backHeld?(a.facing===1?-1:1):a.facing,move};
      for(const f of [a,b]){f.throwLock=20;f.invuln=20;f.vx=f.vy=0;f.buffer=null;}
      a.setState('throw');b.attack=null;b.setState('thrown');
      this.emit({type:'throw',x:(a.x+b.x)/2,y:500,source:a.index,target:b.index,text:move.name});return true;
    }return false;
  }
}
