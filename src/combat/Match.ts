import { Fighter } from './Fighter';
import {traitContact,traitHit} from './Traits';
import { clamp, intersects, neutral, type CombatEvent, type InputFrame, type MatchOptions, type Move } from '../core/types';
export interface Projectile {id:number;source:number;x:number;y:number;vx:number;vy:number;width:number;height:number;life:number;move:Move}
export interface DelayedStrike {source:number;x:number;y:number;delay:number;life:number;move:Move;kind?:'snare'|'aftershock'}

export class Match {
  fighters: [Fighter, Fighter]; frame = 0; hitstop = 0; timer = 99 * 60; round = 1;
  wins = [0, 0]; phase: 'intro' | 'fight' | 'roundover' | 'finished' = 'intro'; phaseTimer = 95;
  events: CombatEvent[] = []; winner = -1; roundWinner = -1; paused = false; clashes = 0;
  totals = [{damage:0,hits:0,maxCombo:0},{damage:0,hits:0,maxCombo:0}];
  projectiles:Projectile[]=[];private projectileSerial=0;
  delayedStrikes:DelayedStrike[]=[];private activated=[-1,-1];
  private clashPairs = new Set<string>(); private rng: number;
  private grab:{source:number;target:number;age:number;direction:1|-1;move:Move}|null=null;
  constructor(public options: MatchOptions) { this.fighters = [new Fighter(0, options.p1), new Fighter(1, options.p2)]; this.rng = options.seed ?? 1023; }
  random() { this.rng = (Math.imul(1664525, this.rng) + 1013904223) >>> 0; return this.rng / 4294967296; }
  emit(event: CombatEvent) { this.events.push(event); }
  step(inputs: [InputFrame, InputFrame] = [neutral(), neutral()]) {
    this.events = [];
    if (this.paused || this.phase === 'finished') return;
    this.frame++;
    if (this.hitstop > 0) {
      if(this.phase==='fight')for(let i=0;i<2;i++)this.fighters[i].receiveInput(inputs[i]);
      this.hitstop--; return;
    }
    if (this.phase === 'intro') { if (--this.phaseTimer <= 0) { this.phase = 'fight'; this.emit({ type: 'round', x: 880, y: 330, source: 0, text: '交锋开始' }); } return; }
    if (this.phase === 'roundover') {
      for (const f of this.fighters) { if (f.hp <= 0) { f.vx *= .9; f.physics(); } else f.setState('win'); f.age++; }
      if (--this.phaseTimer <= 0) {
        if (this.wins.some(w => w >= 2)) { this.phase = 'finished'; this.winner = this.wins[0] >= 2 ? 0 : 1; }
        else { this.round++; this.fighters = [new Fighter(0, this.options.p1), new Fighter(1, this.options.p2)]; this.timer = 99 * 60; this.phase = 'intro'; this.phaseTimer = 80; this.clashPairs.clear(); this.activated=[-1,-1]; }
      } return;
    }
    if (this.options.mode !== 'training') this.timer--;
    const previous = this.fighters.map(f => ({ serial: f.attackSerial, dash: f.dashTimer, ground: f.grounded }));
    for (let i = 0; i < 2; i++) this.fighters[i].step(inputs[i], this.fighters[1 - i]);
    for (let i = 0; i < 2; i++) {
      const f = this.fighters[i];
      const move=f.attack;
      if(move&&f.attackAge===move.startup&&this.activated[i]!==f.attackSerial){
        this.activated[i]=f.attackSerial;
        if(move.setup){f.mirror={x:clamp(f.x+f.facing*165,85,1675),y:570,life:210};f.traitFlash='镜痕布置';}
        if(move.field?.trigger==='cast')this.spawnField(f,move,f.x+f.facing*move.field.offset);
        if(!move.setup&&f.identity.sinner==='yi'&&f.mirror&&move.source&&move.appearance!=='lcb'&&!move.airOnly&&move.action!=='ego'){
          const mark=f.mirror;f.mirror=null;this.delayedStrikes.push({source:i,x:mark.x,y:mark.y,delay:12,life:6,move:{...move,id:move.id+'-echo',name:'镜痕追击',damage:55,hitstun:24,knockback:2,launch:3,hitstop:4,power:3,box:{x:-52,y:-115,w:104,h:115},projectile:undefined,hits:undefined,throwRange:undefined,status:undefined,normal:undefined,setup:undefined,field:undefined,heal:undefined,seal:undefined,wallBounce:undefined,minRange:undefined,slow:undefined}});f.traitFlash='镜痕追击';
        }
      }
      if(f.traitFlash)this.emit({type:'trait',source:i,x:f.x,y:f.y-95,text:f.traitFlash,color:f.identity.color});
      if(f.attackSerial!==previous[i].serial&&f.attack?.source)this.emit({type:'skill',x:f.x,y:f.y-120,source:i,text:`${f.attack.source}\n${f.attack.name}`,color:f.attack.color??f.identity.color});
      if (f.attackSerial !== previous[i].serial && f.attack?.action === 'ego') { this.hitstop = 16; this.emit({ type: 'ego', x: f.x, y: f.y - 65, source: i, text: f.attack.name, color: f.identity.color }); }
      if (f.dashTimer > previous[i].dash) this.emit({ type: 'dash', x: f.x, y: f.y, source: i });
      if (!f.grounded && previous[i].ground) this.emit({ type: 'jump', x: f.x, y: f.y, source: i });
      if (f.statuses.burn > 0) { f.statuses.burn--; if (this.frame % 45 === 0) { f.hp = Math.max(1, f.hp - 8); this.emit({ type: 'status', x: f.x, y: f.y - 90, source: i, text: '灼烧 8' }); } }
      if (f.statuses.rupture > 0) f.statuses.rupture--;
    }
    this.pushboxes();
    this.stepProjectiles();
    this.stepDelayedStrikes();
    if (!this.resolveThrows()&&!this.resolveClash()) this.resolveHits();
    if (this.options.mode === 'training') for (const f of this.fighters) { f.ego = 100; if (f.hp < 200 && !f.stun) f.hp = f.identity.hp; }
    if (this.fighters.some(f => f.hp <= 0) || this.timer <= 0) this.endRound();
  }
  private pushboxes() {
    const [a,b] = this.fighters;
    if (this.grab||Math.abs(a.y - b.y) > 90 || a.state === 'down' || b.state === 'down') return;
    const spacing=64; // Keep the standing bodies clear at the sprites' displayed scale.
    const d = b.x - a.x, overlap = spacing - Math.abs(d);
    if (overlap > 0) {
      const s = d >= 0 ? 1 : -1;
      a.x = clamp(a.x - overlap / 2 * s, 85, 1675); b.x = clamp(b.x + overlap / 2 * s, 85, 1675);
      // Distribute residual penetration when a fighter is against the wall.
      const rest = spacing - Math.abs(b.x - a.x);
      if (rest > 0) { if (a.x <= 85 || a.x >= 1675) b.x = clamp(a.x + spacing * s,85,1675); else a.x = clamp(b.x - spacing * s,85,1675); }
    }
  }
  private resolveClash(): boolean {
    const [a,b] = this.fighters, ah = a.hitbox, bh = b.hitbox;
    if (!this.options.clash || !ah || !bh || !a.attack || !b.attack || a.hitTargets.has(a.targetKey(1)) || b.hitTargets.has(b.targetKey(0)) || !intersects(ah,bh)) return false;
    const key = `${a.attackSerial}:${b.attackSerial}`;
    if (this.clashPairs.has(key)) return false;
    this.clashPairs.add(key); this.clashes++;
    const scores = [a.attack.power + Math.floor(a.sp / 15) + Math.floor(this.random()*5), b.attack.power + Math.floor(b.sp/15) + Math.floor(this.random()*5)];
    this.hitstop = 4;
    this.emit({ type:'clash', x:(a.x+b.x)/2, y:Math.min(a.y,b.y)-85, source:scores[0] >= scores[1] ? 0 : 1, text:`${scores[0]} : ${scores[1]}` });
    if (scores[0] === scores[1]) { for (const f of this.fighters) { f.interrupt(13); f.vx = -f.facing * 4; } }
    else { const win = scores[0] > scores[1] ? a : b, lose = win === a ? b : a; lose.interrupt(17); lose.vx = -lose.facing * 3; win.sp = clamp(win.sp + 4,-45,45); lose.sp = clamp(lose.sp - 3,-45,45); }
    return true;
  }
  private resolveHits() {
    // Snapshot both strikes before applying reactions so simultaneous hits can trade.
    const hits: { a: Fighter; b: Fighter; move: Move; key:number }[] = [];
    for (const a of this.fighters) { const b = this.fighters[1-a.index]; const box = a.hitbox;
      if (box && a.attack && !a.hitTargets.has(a.targetKey(b.index)) && !b.invuln && b.hp > 0 && b.state !== 'down' && (intersects(box,b.hurtbox)||!!b.limbHurtbox&&intersects(box,b.limbHurtbox))) {const scale=a.attack.hits?.[a.hitIndex]?.scale??1;hits.push({a,b,move:scale===1?a.attack:{...a.attack,damage:a.attack.damage*scale},key:a.targetKey(b.index)});}
    }
    for (const {a,b,move,key} of hits) {a.hitTargets.add(key);const level=move.hitLevels?.[a.hitIndex];this.hit(a,b,level?{...move,hitLevel:level}:move);}
  }
  private hit(a: Fighter, b: Fighter, original: Move, origin=a.x, direction=a.facing, ranged=false) {
    let move=original;
    if(a.attack?.id===move.id)a.connected = true;
    const defending=b.attack;
    if(!ranged&&!move.throwRange&&move.hitLevel!=='low'&&defending?.guardPoint&&b.attackAge>=defending.guardPoint[0]&&b.attackAge<=defending.guardPoint[1]&&(origin-b.x)*b.facing>0&&b.guardMeter>=8){
      b.guardMeter-=8;a.interrupt(9);a.vx=-a.facing*2;
      if(b.identity.sinner==='meur')b.traitCount=Math.min(3,b.traitCount+1);
      this.hitstop=Math.max(this.hitstop,2);this.emit({type:'block',x:b.x,y:b.y-80,source:b.index,target:a.index,text:'架拳'});return;
    }
    if(!ranged&&defending?.counter&&b.attackAge>=defending.counter[0]&&b.attackAge<=defending.counter[1]){
      a.interrupt(20);a.vx=-a.facing*2;b.attackAge=defending.startup-1;b.invuln=7;b.sp=clamp(b.sp+4,-45,45);this.hitstop=5;
      this.emit({type:'block',x:b.x,y:b.y-85,source:b.index,target:a.index,text:'识破反击'});return;
    }
    const back=origin>b.x?'left':'right';
    const defendingBack=!!b.held[back]&&!b.held[back==='left'?'right':'left'];
    const guardLevel=move.hitLevel??'mid';
    const blocking = !move.throwRange&&!b.attack&&b.grounded&&defendingBack&&(!b.stun||b.state==='block')&&!['down','rise','thrown'].includes(b.state)&&(guardLevel==='low'?b.lowGuard:guardLevel==='overhead'?!b.lowGuard:true);
    move=traitContact(a,b,move,blocking);
    if(a.traitFlash)this.emit({type:'trait',source:a.index,x:a.x,y:a.y-95,text:a.traitFlash,color:a.identity.color});
    if (blocking) {
      a.combo=0;a.comboDamage=0;b.facing=origin>b.x?1:-1;
      b.guardMeter -= move.damage * .34*(move.guardDamage??1);
      b.hp = Math.max(1, b.hp - Math.round(move.damage*.06));
      b.vx = direction * move.knockback * .45; b.stun = 12; b.setState('block'); a.ego = clamp(a.ego+4,0,100);
      this.hitstop = 2;
      if (b.guardMeter <= 0) { b.guardMeter = 40; b.interrupt(48); this.emit({type:'guardbreak',x:b.x,y:b.y-75,source:a.index,text:'防御崩解'}); }
      else this.emit({type:'block',x:b.x-b.facing*25,y:b.y-80,source:a.index,target:b.index});
      return;
    }
    if(!b.stun&&!b.knockdown||move.throwRange){a.combo=0;a.comboDamage=0;}
    if(a.attack?.id===move.id)a.hitConfirmed=true;
    const scaling = Math.max(.35, 1 - a.combo*.1);
    const rupture = b.statuses.rupture > 0 ? 16 : 0;
    const seals=move.seal==='consume'?b.seals[a.index]:0;
    const damage = Math.round(((move.damage+seals*14) * scaling + rupture) * b.identity.defense);
    b.hp = Math.max(0,b.hp-damage); b.statuses.rupture = 0;
    a.combo++;traitHit(a,move); a.comboTimer = move.hitstun + 42; a.comboDamage += damage; a.totalDamage += damage; a.totalHits++;
    this.totals[a.index].damage+=damage;this.totals[a.index].hits++;this.totals[a.index].maxCombo=Math.max(this.totals[a.index].maxCombo,a.combo);
    a.sp = clamp(a.sp+3,-45,45); b.sp = clamp(b.sp-2,-45,45);
    a.ego = clamp(a.ego+8+damage*.035,0,100); b.ego = clamp(b.ego+5+damage*.025,0,100);
    const armored=defending?.armorUntil&&b.attackAge<=defending.armorUntil;
    if(!armored){if(!b.stun&&!b.knockdown)b.bouncesUsed=0;b.interrupt(move.hitstun);b.vx=direction*move.knockback;b.airVelocity=b.vx;if(move.launch>0)b.vy=-move.launch;b.knockdown=!!move.knockdown||move.launch>=13;b.wallBouncePending=!!move.wallBounce&&b.bouncesUsed===0;}
    if(move.seal==='apply'){b.seals[a.index]=Math.min(5,b.seals[a.index]+2);this.emit({type:'trait',source:a.index,x:b.x,y:b.y-115,text:`朱符 ${b.seals[a.index]} / 5`});}
    if(seals){b.seals[a.index]=0;this.emit({type:'trait',source:a.index,x:b.x,y:b.y-115,text:`引符 ×${seals}`});}
    if(move.slow){b.slowTimer=move.slow.frames;b.slowScale=move.slow.scale;}
    if(!a.contactRewards.has(move.id)){
      a.contactRewards.add(move.id);
      if(move.heal&&a.hp>0){const heal=Math.max(0,Math.min(move.heal,a.identity.hp-a.hp));a.hp+=heal;if(heal)this.emit({type:'trait',source:a.index,x:a.x,y:a.y-110,text:`汲取 +${heal}`});}
      if(move.field?.trigger==='hit')this.spawnField(a,move,b.x);
    }
    if (move.status) b.statuses[move.status] = move.status === 'burn' ? 240 : 300;
    // Fast contacts stay crisp; only the final strike of a multi-hit gets emphasis.
    const hitCount=move.hits?.length??1;
    const lastHit=move.projectile?false:a.hitIndex>=hitCount-1;
    const stop=move.normal?move.normal.strength+1:hitCount>1&&!lastHit?1:Math.min(6,Math.max(2,Math.ceil(move.hitstop*.65)));
    this.hitstop = Math.max(this.hitstop,stop);
    this.emit({type:'hit',x:b.x,y:b.y-70,source:a.index,target:b.index,value:damage,color:move.color??a.identity.color,text:move.name});
  }
  private endRound() {
    this.projectiles=[];this.delayedStrikes=[];this.grab=null;
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
      const box={x:p.x-p.width/2,y:p.y-p.height/2,w:p.width,h:p.height};
      if(b.hp>0&&!b.invuln&&b.state!=='down'&&(intersects(box,b.hurtbox)||!!b.limbHurtbox&&intersects(box,b.limbHurtbox))){
        const reflect=b.attack?.reflect;
        if(reflect&&b.attackAge>=reflect[0]&&b.attackAge<=reflect[1]&&b.facing*p.vx<0){
          p.source=b.index;p.vx=-p.vx;p.vy=-p.vy;p.x=b.x+b.facing*(p.width/2+28);p.life=Math.max(p.life,30);
          p.move={...p.move,id:p.move.id+'-reflected',damage:Math.round(p.move.damage*.85)};
          this.hitstop=Math.max(this.hitstop,2);this.emit({type:'block',source:b.index,x:b.x,y:b.y-80,text:'盾返弹道'});
        }else{this.hit(a,b,p.move,a.x,p.vx>=0?1:-1,true);p.life=0;}
      }
      if(p.x<30||p.x>1730||p.y>600)p.life=0;
    }
    this.projectiles=this.projectiles.filter(p=>p.life>0);
  }
  private stepDelayedStrikes(){
    this.delayedStrikes=this.delayedStrikes.filter(s=>{const a=this.fighters[s.source],b=this.fighters[1-s.source];if(a.hp<=0)return false;if(s.delay>0){s.delay--;return true;}const box={...s.move.box,x:s.x+s.move.box.x,y:s.y+s.move.box.y};if(b.hp>0&&!b.invuln&&b.state!=='down'&&intersects(box,b.hurtbox)){this.hit(a,b,s.move,s.x,b.x>=s.x?1:-1,true);return false;}return --s.life>0;});
  }
  private spawnField(f:Fighter,move:Move,x:number){
    const field=move.field!;
    this.delayedStrikes=this.delayedStrikes.filter(s=>!(s.source===f.index&&s.kind===field.kind));
    this.delayedStrikes.push({source:f.index,x:clamp(x,85,1675),y:570,delay:field.delay,life:field.life,kind:field.kind,move:{...move,id:move.id+'-field',name:field.kind==='snare'?'时间封锁':'落地余震',damage:Math.round(move.damage*field.scale),box:{x:-field.width/2,y:-field.height,w:field.width,h:field.height},field:undefined,hits:undefined,hitLevels:undefined,heal:undefined,seal:undefined,wallBounce:undefined,projectile:undefined,normal:undefined,throwRange:undefined,minRange:undefined,launch:0,knockdown:false,hitLevel:field.kind==='snare'?'low':move.hitLevel}});
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
