import Phaser from 'phaser';
import { AssetManager } from '../assets/AssetManager';
import { Match } from '../combat/Match';
import { AIController } from '../ai/Controller';
import { playableSinners } from '../characters/registry';
import { clamp, neutral, type CombatEvent, type MatchOptions } from '../core/types';
import type { InputController } from '../input/InputController';
import type { Synth } from '../audio/Synth';
import personaArt from '../data/persona-art.json';
import { CombatFX } from '../effects/CombatFX';

const sceneFirstFrame=(scene:Phaser.Scene,key:string)=>scene.textures.get(key).getFrameNames()[0]??0;
export class ArenaScene extends Phaser.Scene {
  match:Match|null=null; debug=false; ready=false; onTick:((m:Match)=>void)|null=null;
  private ai=new AIController('normal');private accumulator=0;private sprites:Phaser.GameObjects.Sprite[]=[];
  private background!:Phaser.GameObjects.Image;private fx!:Phaser.GameObjects.Graphics;private shadows!:Phaser.GameObjects.Graphics;
  private combatFX!:CombatFX;private demo=0;private labels:Phaser.GameObjects.Text[]=[];private egoUntil=0;private stepSerial=0;private hitFlashUntil=[0,0];
  constructor(private controls:InputController,private audio:Synth){super('Arena');}
  preload(){for(const sinner of playableSinners){this.load.spritesheet(`${sinner}-premium`,`./characters/${sinner}/lcb/pixel.png`,{frameWidth:224,frameHeight:128});this.load.spritesheet(`${sinner}-normals`,`./characters/${sinner}/normals/pixel.png`,{frameWidth:224,frameHeight:128});}for(const p of personaArt)this.load.spritesheet(p.key,`./characters/${p.sinner}/${p.persona}/pixel.png`,{frameWidth:224,frameHeight:128});}
  create(){
    AssetManager.generate(this);this.background=this.add.image(0,0,'depot').setOrigin(0).setScale(2).setDepth(0);
    this.shadows=this.add.graphics().setDepth(2);
    this.sprites=[this.add.sprite(780,570,'don-lcb:idle',0),this.add.sprite(1190,570,'heath-lcb:idle',0)];
    this.sprites.forEach(s=>s.setOrigin(.5,.94).setScale(2.1).setDepth(5));this.sprites[1].setFlipX(true);
    this.combatFX=new CombatFX(this);this.fx=this.add.graphics().setDepth(10);this.cameras.main.setBounds(0,0,1760,720);this.cameras.main.scrollX=260;
    this.ready=true;
  }
  startMatch(options:MatchOptions){this.combatFX.clear();this.labels.forEach(l=>l.destroy());this.labels=[];this.match=new Match(options);this.ai=new AIController(options.difficulty);this.accumulator=0;this.stepSerial=0;this.background.setTexture(options.stage);this.egoUntil=0;this.cameras.main.setZoom(1);}
  showDemo(){this.combatFX?.clear();this.match=null;this.background?.setTexture('depot');this.controls.active=false;this.cameras.main.setZoom(1);this.cameras.main.scrollX=260;this.sprites.forEach(s=>s.clearTint().setAngle(0));}
  update(time:number,delta:number){
    if(!this.ready)return;
    const m=this.match;
    if(m){
      this.accumulator=Math.min(this.accumulator+delta,100);
      while(this.accumulator>=1000/60){
        this.accumulator-=1000/60;
        if(!m.paused){
          const p1=m.hitstop?neutral():this.controls.sample(0);const p2=m.hitstop?neutral():m.options.mode==='local'?this.controls.sample(1):m.options.mode==='training'?neutral():this.ai.sample(m.fighters[1],m.fighters[0]);
          m.step([p1,p2]);this.stepSerial++;for(const e of m.events)this.effect(e);
        }
      }
      this.renderFighters(time);this.onTick?.(m);
      const center=(m.fighters[0].x+m.fighters[1].x)/2;
      this.cameras.main.scrollX+=(clamp(center-640,0,480)-this.cameras.main.scrollX)*.08;
      const zoom=this.egoUntil>time?1.08:1;this.cameras.main.zoom+=(zoom-this.cameras.main.zoom)*.08;
    }else{
      this.demo+=delta;const frame=Math.floor(this.demo/140)%6;
      this.sprites[0].setTexture('don-premium',0).setPosition(830,570).setOrigin(.5,116/128).setScale(3).setFlipX(false).clearTint().setAlpha(1);
      this.sprites[1].setTexture('heath-premium',0).setPosition(1190,570).setOrigin(.5,116/128).setScale(3).setFlipX(true).clearTint().setAlpha(1);
      this.shadows.clear().fillStyle(0x111e24,.5).fillEllipse(830,573,100,16).fillEllipse(1190,573,100,16);
    }
    this.drawEffects(delta,time);
  }
  private renderFighters(time:number){
    const m=this.match!;this.shadows.clear();
    m.fighters.forEach((f,i)=>{
      const sprite=this.sprites[i];
      sprite.setPosition(Math.round(f.x/2)*2,Math.round(f.y/2)*2).setScale(2).setFlipX(f.facing===-1).setAlpha(f.invuln&&Math.floor(time/70)%2?.55:1);
      sprite.setDepth(f.state==='attack'||f.state==='throw'?6:5);sprite.clearTint();sprite.setAngle(f.state==='thrown'?-f.facing*24:0);
      if(f.identity.asset){const a=f.identity.asset,key=`${a.key}:${f.state}`;sprite.setOrigin(.5,a.originY).setScale(a.scale);if(this.anims.exists(key)){if(sprite.anims.currentAnim?.key!==key)sprite.play(key);}else{sprite.stop();sprite.setTexture(a.key,sceneFirstFrame(this,a.key));}}
      else{sprite.stop();const map:Partial<Record<typeof f.state,number>>={jump:18,fall:19,hit:20,guard:21,block:21,crouch:21,down:22,ko:22,win:23,rise:18,throw:14,thrown:20};
        let frame=map[f.state]??0;
        if(f.state==='idle')frame=0;
        if(f.state==='run'||f.state==='dash')frame=6+Math.floor(f.age/4)%6;
        if(f.attack){const move=f.attack;frame=(move.visualRow??2)*6+(f.attackAge<move.startup?Math.min(1,Math.floor(f.attackAge/move.startup*2)):f.active?2+Math.min(1,Math.floor((f.attackAge-move.startup)/move.active*2)):4+Math.min(1,Math.floor((f.attackAge-move.startup-move.active)/move.recovery*2)));}
        const personaKey=f.attack?.visualKey;
        let texture=personaKey&&this.textures.exists(personaKey)?personaKey:`${f.identity.sinner}-premium`;
        if(texture===personaKey)frame%=6;
        // Keep the horizontal sword pose while its extra sections retract.
        if(f.attack?.extend&&f.attackAge>=f.attack.startup+f.attack.active&&f.attackAge<f.attack.startup+f.attack.active+8)frame=3;
        const normal=f.attack?.normal;
        if(normal){
          const m=f.attack!;
          const contact=f.attackAge>=Math.max(1,m.startup-2)&&f.attackAge<m.startup+m.active+5;
          if(contact){texture=`${f.identity.sinner}-normals`;frame=normal.pose;}
          else{texture=`${f.identity.sinner}-premium`;frame=normal.stance==='crouch'?21:normal.stance==='air'?19:0;}
        }
        if(f.state==='throw'){texture=`${f.identity.sinner}-normals`;frame=3;}
        sprite.setOrigin(.5,116/128).setScale(2).setTexture(texture,frame);
      }
      if(time<this.hitFlashUntil[i])sprite.setTintFill(0xffeed9);
      this.shadows.fillStyle(0x0b1720,.45).fillEllipse(f.x,574,80-Math.min(30,(570-f.y)*.12),13);
    });
  }
  private effect(e:CombatEvent){
    if(e.type==='hit'&&e.target!==undefined)this.hitFlashUntil[e.target]=this.time.now+65;
    this.audio.play(e.type,e.type==='status'?.4:1);
    if(this.match)this.combatFX.event(e,this.match);
    if(this.effectsEnabled&&['hit','clash','ego','guardbreak'].includes(e.type)){
      const heavy=(e.value??0)>110;
      this.cameras.main.shake(e.type==='ego'?180:heavy?105:55,e.type==='ego'?.005:heavy?.0024:.0008);
    }
    if(e.type==='ego'){this.egoUntil=this.time.now+900;this.floatLabel(e.x,e.y-100,`E.G.O.\n${e.text}`,e.color??'#edc16c',28,1100);}
    if(e.type==='trait')this.floatLabel(e.x,e.y-18,e.text??'',e.color??'#ecd69f',15,450);
    if(e.type==='skill')this.floatLabel(e.x,e.y-35,e.text??'',e.color??'#cbdac1',14,650);
    if(e.type==='clash')this.floatLabel(e.x,e.y-45,`拼 点\n${e.text}`,'#ffe2a0',24,600);
    if(e.type==='throwtech')this.floatLabel(e.x,e.y-40,'拆投','#a8e4dd',20,450);
    if(e.type==='throw')this.floatLabel(e.x,e.y-40,e.text??'武器擒投','#daca9a',18,400);
    if(e.type==='guardbreak')this.floatLabel(e.x,e.y-65,'防御崩解','#ef8b72',24,650);
    if(e.type==='hit')this.floatLabel(e.x+Math.random()*25,e.y-45,`${e.value}`,e.color??'#fff',24,550);
    if(e.type==='status')this.floatLabel(e.x,e.y-20,e.text??'','#f4a674',15,500);
  }
  effectsEnabled=true;
  setDifficulty(difficulty:MatchOptions['difficulty']){this.ai.difficulty=difficulty;}
  private floatLabel(x:number,y:number,text:string,color:string,size:number,duration:number){
    const label=this.add.text(x,y,text,{fontFamily:'Consolas, Microsoft YaHei, monospace',fontSize:`${size}px`,fontStyle:'bold',color,stroke:'#18262b',strokeThickness:5,align:'center'}).setOrigin(.5).setDepth(12);this.labels.push(label);
    this.tweens.add({targets:label,y:y-42,alpha:0,duration,onComplete:()=>{this.labels=this.labels.filter(l=>l!==label);label.destroy();}});
  }
  private drawEffects(delta:number,time:number){
    this.combatFX.update(delta,this.match,this.sprites,!this.effectsEnabled);
    this.fx.clear();this.fx.lineStyle(1,0xb3c4b6,.08);
    for(let i=0;i<25;i++){const x=(i*83+time*.09)%1760,y=(i*47+time*.25)%650;this.fx.lineBetween(x,y,x-5,y+15);}
    if(this.debug&&this.match)for(const f of this.match.fighters){const h=f.hurtbox;this.fx.lineStyle(2,0x71d7bd,.9);this.fx.strokeRect(h.x,h.y,h.w,h.h);if(f.hitbox){const b=f.hitbox;this.fx.fillStyle(0xe9544e,.25);this.fx.fillRect(b.x,b.y,b.w,b.h);this.fx.lineStyle(2,0xff6859,.9);this.fx.strokeRect(b.x,b.y,b.w,b.h);}}
  }
}
