import Phaser from 'phaser';
import type { CombatEvent } from '../core/types';
import type { Fighter } from '../combat/Fighter';
import type { Match } from '../combat/Match';

interface Palette { edge:number; accent:number; core:number; ink:number }
interface Particle { x:number;y:number;vx:number;vy:number;age:number;life:number;size:number;color:number;kind:'shard'|'dust'|'mote'|'link';angle:number }
interface Burst {x:number;y:number;age:number;life:number;size:number;angle:number;palette:Palette;kind:string}
interface Ghost {image:Phaser.GameObjects.Image;age:number;life:number}
const palettes:Record<string,Palette>={
  lcb:{edge:0xe7b95f,accent:0xd45d4d,core:0xfff2cc,ink:0x361925},
  w:{edge:0x42dcff,accent:0xa673ff,core:0xeaffff,ink:0x122a50},
  n:{edge:0xed6b46,accent:0xa92e3d,core:0xffe7ac,ink:0x3a111c},
  blade:{edge:0xe8e5d9,accent:0xb9c9ce,core:0xffffff,ink:0x111a21},
  cinq:{edge:0x85caff,accent:0xc8e6ff,core:0xf4fbff,ink:0x203e6c},
  t:{edge:0xffc35c,accent:0xd28a42,core:0xfff0b7,ink:0x462d20},
  queen:{edge:0xff79c9,accent:0x79e4d3,core:0xfff6e9,ink:0x6b245b},
  seven:{edge:0x88eeb8,accent:0xf5d281,core:0xf5fff6,ink:0x193f32},
  sunshower:{edge:0x76c8c1,accent:0x9cafa5,core:0xd9f8e8,ink:0x17363e},
  fullstop:{edge:0xe8d1a3,accent:0x88bba6,core:0xfff8da,ink:0x25332f},
  kurokumo:{edge:0xe4ebf2,accent:0xc85668,core:0xffffff,ink:0x121a26},
  middle:{edge:0xc784f7,accent:0xf6c862,core:0xfff2d1,ink:0x432555},
  wild:{edge:0xd64b68,accent:0x99455c,core:0xffd4cf,ink:0x310d23},
  r:{edge:0xffa24b,accent:0xe36336,core:0xfff1b0,ink:0x382a28}
};
const ease=(v:number)=>1-(1-v)**3;

/** Layered, phase-driven VFX. Visuals never change combat timing or collision. */
export class CombatFX {
  private rear:Phaser.GameObjects.Graphics;
  private front:Phaser.GameObjects.Graphics;
  private light:Phaser.GameObjects.Graphics;
  private dim:Phaser.GameObjects.Rectangle;
  private particles:Particle[]=[];private bursts:Burst[]=[];private ghosts:Ghost[]=[];
  private observed=[-1,-1];private ghostStamp=[0,0];private egoLife=0;private clock=0;
  private mobile=matchMedia('(pointer:coarse)').matches;
  constructor(private scene:Phaser.Scene){
    this.dim=scene.add.rectangle(0,0,1280,720,0x080e19,0).setOrigin(0).setScrollFactor(0).setDepth(1);
    this.rear=scene.add.graphics().setDepth(3);
    this.front=scene.add.graphics().setDepth(8);
    this.light=scene.add.graphics().setDepth(9).setBlendMode(Phaser.BlendModes.ADD);
  }
  clear(){this.particles=[];this.bursts=[];this.ghosts.forEach(g=>g.image.destroy());this.ghosts=[];this.observed=[-1,-1];this.egoLife=0;this.rear.clear();this.front.clear();this.light.clear();this.dim.setAlpha(0);}
  event(e:CombatEvent,match:Match){
    const f=match.fighters[Math.max(0,e.source)],p=this.palette(f),direction=f?.facing??1;
    if(e.type==='ego'){this.egoLife=850;this.burst(e.x,e.y,p,'ego',155,600);this.scatter(e.x,e.y,p,30,direction,12);}
    if(e.type==='hit'){
      const heavy=(e.value??0)>110;this.burst(e.x,e.y,p,'hit',heavy?83:53,heavy?300:230);
      this.scatter(e.x,e.y,p,heavy?23:13,direction,heavy?10:7);
      if(heavy)this.burst(e.x,e.y+63,p,'ground',95,420);
    }
    if(e.type==='throwtech'){this.burst(e.x,e.y,p,'parry',70,260);this.scatter(e.x,e.y,p,10,0,5);}
    if(e.type==='clash'){this.burst(e.x,e.y,{...p,edge:0xffd078,core:0xfff5d9},'clash',122,400);this.scatter(e.x,e.y,p,27,0,11);}
    if(e.type==='block'){this.burst(e.x,e.y,p,e.text?'parry':'block',e.text?89:53,290);this.scatter(e.x,e.y,{...p,edge:0x9de9f0},9,-direction,5);}
    if(e.type==='guardbreak'){this.burst(e.x,e.y,p,'break',118,440);this.scatter(e.x,e.y,p,27,0,9);}
  }
  private palette(f:Fighter){const base=palettes[f.appearance]??(f.attack?.color?{edge:parseInt(f.attack.color.slice(1),16),accent:parseInt(f.identity.color.slice(1),16),core:0xfff2d5,ink:0x1c2330}:palettes.lcb);return f.attack?.action==='ego'?{...base,edge:parseInt(f.identity.color.slice(1),16),accent:0xc65b78}:base;}

  private burst(x:number,y:number,palette:Palette,kind:string,size:number,life:number){this.bursts.push({x,y,palette,kind,size,life,age:0,angle:Math.random()*.9-.45});if(this.bursts.length>28)this.bursts.shift();}
  private scatter(x:number,y:number,p:Palette,count:number,direction:number,speed:number){
    for(let i=0;i<count;i++){const a=direction?((direction===1?0:Math.PI)+(Math.random()-.5)*2.6):Math.random()*Math.PI*2,v=speed*(.3+Math.random());this.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1.5,age:0,life:180+Math.random()*300,size:2+Math.random()*4,color:i%4===0?p.core:i%3===0?p.accent:p.edge,kind:i%5===0?'dust':'shard',angle:a});}
  }
  private polygon(g:Phaser.GameObjects.Graphics,points:{x:number;y:number}[],color:number,alpha:number){g.fillStyle(color,Math.max(0,alpha));g.fillPoints(points,true);}
  private star(g:Phaser.GameObjects.Graphics,x:number,y:number,r:number,color:number,alpha:number,rotation=0,points=4,inner=.19){const vertices=[];for(let i=0;i<points*2;i++){const a=rotation+i*Math.PI/points,rr=i%2?r*inner:r;vertices.push({x:x+Math.cos(a)*rr,y:y+Math.sin(a)*rr});}this.polygon(g,vertices,color,alpha);}
  private ring(g:Phaser.GameObjects.Graphics,x:number,y:number,r:number,color:number,alpha:number,width=2,segments=48,rotation=0){g.lineStyle(width,color,Math.max(0,alpha));g.beginPath();for(let i=0;i<=segments;i++){const a=rotation+i/segments*Math.PI*2,xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r;i?g.lineTo(xx,yy):g.moveTo(xx,yy);}g.closePath();g.strokePath();}
  private heart(g:Phaser.GameObjects.Graphics,x:number,y:number,r:number,color:number,alpha:number){const points=[];for(let i=0;i<=24;i++){const a=i/24*Math.PI*2;points.push({x:x+r*Math.sin(a)**3,y:y-r*(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a))/16});}this.polygon(g,points,color,alpha);}
  private slash(x:number,y:number,rx:number,ry:number,start:number,end:number,width:number,p:Palette,alpha:number,direction:number){
    const ribbon=(w:number,color:number,a:number,g:Phaser.GameObjects.Graphics)=>{const outer=[],inner=[];for(let i=0;i<=24;i++){const t=i/24,angle=start+(end-start)*t,thickness=Math.sin(t*Math.PI)**.6*w;outer.push({x:x+direction*Math.cos(angle)*(rx+thickness),y:y+Math.sin(angle)*(ry+thickness)});inner.unshift({x:x+direction*Math.cos(angle)*(rx-thickness),y:y+Math.sin(angle)*(ry-thickness)});}this.polygon(g,[...outer,...inner],color,a);};
    ribbon(width*1.65,p.edge,alpha*.14,this.light);ribbon(width,p.ink,alpha*.8,this.front);ribbon(width*.62,p.edge,alpha*.95,this.light);ribbon(width*.16,p.core,alpha,this.light);
  }
  private chain(x:number,y:number,r:number,rotation:number,p:Palette,alpha:number){
    for(let i=0;i<12;i++){const a=rotation+i*Math.PI/6,xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r;this.front.lineStyle(3,p.ink,alpha);this.front.strokeEllipse(xx,yy,15,8);this.light.lineStyle(1.5,p.accent,alpha);this.light.strokeEllipse(xx,yy,12,6);}
  }
  private clockFace(x:number,y:number,r:number,phase:number,p:Palette,alpha:number){
    const gear=[];for(let i=0;i<96;i++){const a=i*Math.PI/48+phase,rr=r+(i%4<2?5:-2);gear.push({x:x+Math.cos(a)*rr,y:y+Math.sin(a)*rr});}this.polygon(this.rear,gear,p.ink,alpha*.35);this.rear.lineStyle(1,p.edge,alpha*.3);this.rear.strokePoints(gear,true);
    this.ring(this.rear,x,y,r,p.edge,alpha*.8,2);this.ring(this.rear,x,y,r*.81,p.edge,alpha*.4,1);
    for(let i=0;i<24;i++){const a=i*Math.PI/12+phase,short=i%2?7:15;this.rear.lineStyle(i%2?2:4,p.edge,alpha);this.rear.lineBetween(x+Math.cos(a)*(r-short),y+Math.sin(a)*(r-short),x+Math.cos(a)*r,y+Math.sin(a)*r);}
    this.light.lineStyle(3,p.core,alpha*.9);this.light.lineBetween(x,y,x+Math.cos(phase*3)*r*.66,y+Math.sin(phase*3)*r*.66);this.light.lineStyle(2,p.edge,alpha);this.light.lineBetween(x,y,x+Math.cos(phase+2)*r*.48,y+Math.sin(phase+2)*r*.48);this.star(this.light,x,y,9,p.core,alpha,phase);
  }
  update(delta:number,match:Match|null,sprites:Phaser.GameObjects.Sprite[],reduceMotion:boolean){
    const dt=match?.paused?0:Math.min(delta,40);this.clock+=dt;this.rear.clear();this.front.clear();this.light.clear();
    if(!match){this.dim.setAlpha(0);return;}
    this.egoLife=Math.max(0,this.egoLife-dt);this.dim.setAlpha(this.egoLife?Math.min(.46,this.egoLife/600*.46):0);
    this.ghosts=this.ghosts.filter(g=>{g.age+=dt;if(g.age>=g.life){g.image.destroy();return false;}g.image.setAlpha((1-g.age/g.life)*.27);return true;});
    for(const f of match.fighters){
      const p=this.palette(f),move=f.attack;
      if(move&&this.observed[f.index]!==f.attackSerial){this.observed[f.index]=f.attackSerial;if(!move.normal&&!move.throwRange)this.burst(f.x,f.y-65,p,'summon',62,250);}
      if(dt>0&&!reduceMotion&&(f.state==='dash'||move&&(move.effect==='rift'||move.effect==='iaido'||move.lunge>=6))&&this.clock-this.ghostStamp[f.index]>55){
        this.ghostStamp[f.index]=this.clock;const s=sprites[f.index];const image=this.scene.add.image(s.x,s.y,s.texture.key,s.frame.name).setOrigin(s.originX,s.originY).setScale(s.scaleX,s.scaleY).setFlipX(s.flipX).setTint(p.edge).setAlpha(.25).setDepth(4);this.ghosts.push({image,age:0,life:155});if(this.ghosts.length>(this.mobile?8:14))this.ghosts.shift()!.image.destroy();
      }
      if(move)this.drawMove(f,p);
      if(f.state==='guard'||f.state==='block'){const x=f.x+f.facing*25,y=f.y-64;this.front.lineStyle(2,0x9ce1e4,.6);this.front.beginPath();this.front.arc(x,y,63,f.facing===1?-1.15:1.99,f.facing===1?1.15:4.29);this.front.strokePath();}
    }
    this.drawBursts(dt);this.drawParticles(dt);
    for(const projectile of match.projectiles){
      const f=match.fighters[projectile.source],color=projectile.move.color,p=palettes[projectile.move.appearance??'r']??(color?{...palettes.lcb,edge:parseInt(color.slice(1),16)}:this.palette(f));
      const len=Math.hypot(projectile.vx,projectile.vy),dx=projectile.vx/len,dy=projectile.vy/len;
      if(projectile.move.effect==='slug'){
        // One solid slug and its short air wake, rather than an energy orb.
        this.front.lineStyle(4,0x26262c,1);this.front.lineBetween(projectile.x-dx*12,projectile.y-dy*12,projectile.x,projectile.y);
        this.front.lineStyle(2,0xc6b58c,1);this.front.lineBetween(projectile.x-dx*10,projectile.y-dy*10,projectile.x,projectile.y);
        this.light.lineStyle(1,p.edge,.45);this.light.lineBetween(projectile.x-dx*38,projectile.y-dy*38,projectile.x-dx*15,projectile.y-dy*15);
      }else{for(const [w,c,a] of [[9,p.edge,.15],[3,p.edge,.85],[1,p.core,1]]){this.light.lineStyle(w,c,a);this.light.lineBetween(projectile.x-dx*60,projectile.y-dy*60,projectile.x,projectile.y);}this.star(this.light,projectile.x,projectile.y,9,p.core,.9,Math.atan2(dy,dx),4);}
    }

    if(this.egoLife>450&&!reduceMotion){const alpha=(this.egoLife-450)/400;for(let i=0;i<10;i++){const y=105+i*55,x=(this.clock*.9+i*219)%1760;this.front.lineStyle(i%3?1:3,0xc8a8bc,alpha*.2);this.front.lineBetween(x,y,x+160+i%3*80,y-18);}}
  }
  private thrust(x:number,y:number,length:number,width:number,p:Palette,alpha:number,direction:number){
    this.polygon(this.light,[{x:x-direction*20,y:y-width*3},{x:x+direction*length,y},{x:x-direction*20,y:y+width*3},{x:x+direction*17,y}],p.edge,alpha*.17);
    this.polygon(this.front,[{x,y:y-width},{x:x+direction*length,y},{x,y:y+width},{x:x+direction*22,y}],p.ink,alpha);
    this.polygon(this.light,[{x,y:y-width*.6},{x:x+direction*length,y},{x,y:y+width*.6},{x:x+direction*22,y}],p.edge,alpha);
    this.light.lineStyle(1.5,p.core,alpha);this.light.lineBetween(x,y,x+direction*length,y);
  }
  private drawMove(f:Fighter,p:Palette){
    if(f.attack!.throwRange)return;
    const m=f.attack!,d=f.facing,x=f.x+d*24,y=f.y-70,age=f.attackAge;
    const charging=age<m.startup,active=age>=m.startup&&age<m.startup+m.active;
    const charge=Math.min(1,age/m.startup),a=charging?Math.sin(charge*Math.PI)*.65:active?1:Math.max(0,1-(age-m.startup-m.active)/Math.min(m.recovery,15));
    const t=active?(age-m.startup)/m.active:charging?0:1;
    const theme=f.appearance,effect=m.effect;
    if(charging&&m.action==='special'&&!m.normal){
      const radius=53-charge*18;this.ring(this.rear,x-d*14,y,radius,p.edge,.15+charge*.3,1);
      for(let i=0;i<5;i++){const angle=i*Math.PI*.4+this.clock*.004,xx=x-d*14+Math.cos(angle)*radius,yy=y+Math.sin(angle)*radius;this.star(this.light,xx,yy,3+charge*2,p.edge,.35+charge*.4,angle);}
    }
    if(theme==='t')this.clockFace(x,y,70+charge*30,this.clock*.002,p,a*.8);
    if(theme==='middle')this.chain(x-d*10,y,67,this.clock*.002,p,a*.7);
    if(theme==='queen'){
      this.ring(this.rear,x-d*18,y,58,p.edge,a*.6,2);this.ring(this.rear,x-d*18,y,48,p.accent,a*.35,1);
      for(let i=0;i<5;i++){const angle=this.clock*.001+i*Math.PI*.4;this.heart(this.rear,x-d*18+Math.cos(angle)*48,y+Math.sin(angle)*48,6,p.edge,a*.6);}
      if(charging){this.star(this.light,x+d*48,y-10,10+charge*19,p.core,charge*.6,this.clock*.002,5,.45);this.heart(this.light,x+d*48,y-10,6+charge*5,p.edge,.9);}
    }
    if((theme==='seven'||theme==='sunshower')&&charging){const r=46+charge*9;this.ring(this.rear,x+d*5,y,r,p.edge,.5,theme==='seven'?6:32,this.clock*.001);this.light.lineStyle(1,p.core,.4);for(let i=0;i<4;i++){const xx=x-34+i*23;this.light.lineBetween(xx,y-55+(this.clock*.22+i*17)%108,xx-8,y-34+(this.clock*.22+i*17)%108);}}
    if(!active&&a<.02)return;
    if(active||!charging){
      const phase=active?ease(Math.min(1,(t+.1)*1.3)):1;
      if(effect==='beam')this.beam(x+d*22,y-9,m.box.w-20,p,a,d);
      else if(effect==='time'){
        this.clockFace(x+d*65,y+5,100+Math.sin(t*Math.PI)*19,this.clock*.009,p,a);this.thrust(x,y+35,180,13,p,a*.7,d);
      }else if(effect==='rift'){
        for(let i=0;i<3;i++){
          const xx=x+d*(i*16-8),yy=y+54-i*42,ex=x+d*(158+i*13),ey=y-60+i*43,dx=ex-xx,dy=ey-yy,len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len,q={...p,edge:i===1?p.accent:p.edge};
          for(const [width,color,opacity] of [[10,q.ink,.9],[6,q.edge,.9],[1.6,q.core,1]]){const points=[];for(let j=0;j<=10;j++){const t=j/10,w=Math.sin(t*Math.PI)*width*(j%2?.8:1.2);points.push({x:xx+dx*t+nx*w,y:yy+dy*t+ny*w});}for(let j=10;j>=0;j--){const t=j/10,w=Math.sin(t*Math.PI)*width;points.push({x:xx+dx*t-nx*w,y:yy+dy*t-ny*w});}this.polygon(color===q.ink?this.front:this.light,points,color,a*opacity);}
          for(let j=0;j<3;j++){const t=.25+j*.25,s=j%2?1:-1,cx=xx+dx*t+nx*s*18,cy=yy+dy*t+ny*s*18;this.polygon(this.light,[{x:cx,y:cy-6},{x:cx+d*10,y:cy},{x:cx+d*3,y:cy+7}],q.edge,a*.65);}
        }
      }else if(effect==='iaido'){
        this.thrust(x-d*26,y-5,Math.min(260,m.box.w+30),6,p,a,d);this.slash(x,y,132,64,-.75,-.75+1.7*phase,9,p,a*.9,d);
        for(let i=0;i<5;i++)this.star(this.light,x+d*(35+i*39),y-24+i%2*32,4,p.core,a*.7,this.clock*.003);
      }else if(effect==='uppercut')this.slash(x,y-22,105,130,1.3,1.3-3*phase,15,p,a,d);
      else if(effect==='hammer'||effect==='fist'){
        this.slash(x-d*12,y,95,116,-1.8,-1.8+2.8*phase,effect==='fist'?21:13,p,a,d);
        if(t>.25||!active){const yy=f.y-3,xx=x+d*80;this.front.lineStyle(3,p.ink,a);this.front.strokeEllipse(xx,yy,150+80*t,24);this.light.lineStyle(2,p.edge,a*.8);this.light.strokeEllipse(xx,yy,120+100*t,18);for(let i=0;i<5;i++){const dx=d*(i*29-15);this.thrust(xx+dx,yy-7,18,2,p,a*.5,d);}}
        if(effect==='fist')this.chain(x+d*90,y+5,35+20*t,this.clock*.009,p,a);
        if(theme==='n'){for(let i=0;i<3;i++){const xx=x+d*(44+i*39),yy=y-80+phase*105;this.light.lineStyle(2,p.edge,a*.7);this.light.lineBetween(xx,yy-22,xx,yy+17);this.light.lineBetween(xx-7,yy-11,xx+7,yy-11);}}
      }else if(effect==='extend'){
        // Read the same changing reach used by collision. Steel sections, no gunfire.
        const extendedPose=age-m.startup>=Math.ceil(m.active/2),start=f.x+d*(extendedPose?126:103),end=f.x+d*(m.box.x+f.attackReach),yy=f.y-(extendedPose?78:68);
        if(age>=m.startup+m.active+8)return;
        this.polygon(this.front,[{x:start,y:yy-5},{x:end-d*16,y:yy-4},{x:end,y:yy},{x:end-d*16,y:yy+4},{x:start,y:yy+5}],0x20232e,a);
        this.front.lineStyle(3,0xbfc5d0,a);this.front.lineBetween(start,yy-1,end-d*14,yy-1);
        this.front.lineStyle(1,0xf2ecda,a);this.front.lineBetween(start,yy-4,end-d*16,yy-3);
        for(let n=1;n<f.attackReach/44;n++){const xx=start+d*n*44;this.front.lineStyle(1,0x5f5764,a);this.front.lineBetween(xx,yy-4,xx-d*4,yy+3);}
        if(active){this.light.lineStyle(1,p.edge,a*.45);this.light.lineBetween(start,yy+9,end-d*20,yy+9);}
      }else if(effect==='fan'||effect==='parasol'){
        const parasol=effect==='parasol',radius=parasol?115:78,cx=x+d*30,cy=y+(parasol?0:14),turn=-1.4+phase*2.6;
        this.slash(cx,cy,radius,parasol?95:64,turn-1.1,turn+.8,parasol?7:5,p,a*.8,d);
        // Thin rib-shaped wake follows the opening fan or the rotating canopy.
        for(let i=0;i<7;i++){const angle=turn-1.1+i*.3,xx=cx+d*Math.cos(angle)*radius,yy=cy+Math.sin(angle)*(parasol?95:64);this.rear.lineStyle(1,p.edge,a*.25);this.rear.lineBetween(cx,cy,xx,yy);if(parasol)this.star(this.light,xx,yy,3,p.accent,a*.6,angle);}
      }else if(effect==='slug'){
        if(m.projectile?.frames.some(frame=>age-m.startup-frame>=0&&age-m.startup-frame<3)){
          const xx=f.x+d*90,yy=y-10;this.star(this.light,xx,yy,17,p.edge,.8,d<0?Math.PI:0,5,.16);this.star(this.light,xx,yy,8,p.core,1);
          this.light.lineStyle(1,0xd2c6a6,.55);this.light.lineBetween(xx-d*16,yy+6,xx-d*35,yy+11);
        }
      }else if(effect==='bullets'){
        const burst=m.projectile?.frames.some(frame=>Math.abs(age-m.startup-frame)<3);if(burst){const xx=x+d*73;this.star(this.light,xx,y-8,42,p.edge,.65,d<0?Math.PI:0,5,.18);this.star(this.light,xx,y-8,23,p.core,.95,0,4);this.thrust(xx,y-8,80,8,p,.8,d);}
      }else if(effect==='thrust'||effect==='umbrella'||f.identity.sprite==='lance'&&effect!=='cleave'){
        this.thrust(x,y-9,Math.min(260,m.box.w+25),effect==='umbrella'?11:7,p,a,d);
        for(let i=0;i<3;i++){this.light.lineStyle(1,p.accent,a*.5);this.light.lineBetween(x+d*(i*18-40),y-29+i*20,x+d*(i*18+68),y-29+i*20);}
        if(theme==='cinq')this.star(this.light,x+d*155,y-9,20,p.core,a*.8,Math.PI/4);
      }else {
        this.slash(x-d*17,y,Math.min(220,m.box.w),112,-1.5,-1.5+2.8*phase,m.action==='ego'?25:13,p,a,d);
        if(theme==='wild')for(let i=0;i<8;i++){const angle=-1.3+i*.3,rr=145,xx=x+d*Math.cos(angle)*rr,yy=y+Math.sin(angle)*98;this.polygon(this.front,[{x:xx-d*7,y:yy+7},{x:xx+d*25,y:yy-20},{x:xx+d*3,y:yy+16}],p.ink,a);this.light.lineStyle(1,p.edge,a);this.light.lineBetween(xx-d*7,yy+7,xx+d*25,yy-20);}
      }
    }
    if(m.action==='ego'){
      const r=115+Math.sin(charge*Math.PI)*25;this.ring(this.rear,x,y,r,p.edge,a*.7,3);this.ring(this.rear,x,y,r*.82,p.edge,a*.5,1,6,this.clock*.001);for(let i=0;i<9;i++){const ang=i*Math.PI*2/9-this.clock*.001;this.star(this.light,x+Math.cos(ang)*r,y+Math.sin(ang)*r,9,p.core,a*.75,ang);}
      if(active){this.thrust(x,y,360,16,p,a,d);this.slash(x,y,190,145,-1.8,-1.8+3*ease(t),23,p,a,d);}
    }
  }
  private beam(x:number,y:number,length:number,p:Palette,alpha:number,d:number){
    for(const [width,color,opacity,offset] of [[29,p.edge,.18,0],[20,p.edge,.45,0],[8,p.core,.97,0],[3,p.accent,.9,13]] as number[][]){const upper=[],lower=[];for(let i=0;i<=24;i++){const t=i/24,xx=x+d*t*length,w=(width+Math.sin(t*22-this.clock*.03)*2)*Math.min(1,t*10+.3),yy=y+Math.sin(t*18-this.clock*.012)*offset;upper.push({x:xx,y:yy-w});lower.unshift({x:xx,y:yy+w});}this.polygon(this.light,[...upper,...lower],color,alpha*opacity);}
    this.star(this.light,x,y,24,p.core,alpha*.85,this.clock*.002,5,.35);this.heart(this.front,x,y,9,p.edge,alpha);
    for(let i=0;i<5;i++){const t=(i/5+this.clock*.0007)%1,xx=x+d*t*length,yy=y+Math.sin(t*12+this.clock*.004)*25;this.star(this.light,xx,yy,7+i%2*4,i%2?p.accent:p.edge,alpha*.85,this.clock*.002,5,.38);}
    this.star(this.light,x+d*length,y,49,p.edge,alpha*.6,this.clock*.002,5,.3);this.star(this.light,x+d*length,y,25,p.core,alpha*.9,-this.clock*.002,4);
  }
  private drawBursts(dt:number){
    this.bursts=this.bursts.filter(b=>{b.age+=dt;if(b.age>=b.life)return false;const t=b.age/b.life,alpha=(1-t)**1.5,p=b.palette,r=b.size*ease(t),g=this.light;
      if(b.kind==='summon'){this.ring(this.rear,b.x,b.y,20+r*.6,p.edge,alpha*.4,1);return true;}
      if(b.kind==='ground'){this.front.lineStyle(2,p.ink,alpha*.6);this.front.strokeEllipse(b.x,b.y,r*2,r*.24);g.lineStyle(2,p.edge,alpha*.55);g.strokeEllipse(b.x,b.y,r*1.7,r*.16);return true;}
      if(['block','parry','break'].includes(b.kind)){this.ring(g,b.x,b.y,18+r*.6,b.kind==='break'?p.edge:0x9ee0dc,alpha,2,6,b.angle+t*.7);if(b.kind==='parry')this.star(g,b.x,b.y,43*(1-t),p.core,alpha,Math.PI/4);return true;}
      this.ring(g,b.x,b.y,r,p.edge,alpha*.55,Math.max(1,4*(1-t)));
      this.star(this.front,b.x,b.y,b.size*.7*(1-t),p.ink,alpha*.9,b.angle,4,.24);
      this.star(g,b.x,b.y,b.size*(1-t)**2,p.edge,alpha,b.angle,4,.14);
      this.star(g,b.x,b.y,b.size*.68*(1-t)**3,p.core,alpha,b.angle+.14,4,.16);
      if(b.kind==='clash'||b.kind==='ego'){this.star(g,b.x,b.y,b.size*.75*(1-t),p.core,alpha*.9,b.angle+Math.PI/4,4,.07);this.ring(this.rear,b.x,b.y,r*1.4,p.edge,alpha*.3,2,24);}
      return true;
    });
  }
  private drawParticles(dt:number){
    const cap=this.mobile?135:240;if(this.particles.length>cap)this.particles.splice(0,this.particles.length-cap);
    this.particles=this.particles.filter(p=>{p.age+=dt;if(p.age>=p.life)return false;const step=dt/16.67;p.x+=p.vx*step;p.y+=p.vy*step;p.vy+=.13*step;const a=1-p.age/p.life;
      if(p.kind==='dust'){this.rear.fillStyle(p.color,a*.12);this.rear.fillEllipse(p.x,p.y,14+p.age*.03,5+p.age*.01);}
      else {const speed=Math.hypot(p.vx,p.vy),length=p.size+speed*2;this.polygon(this.light,[{x:p.x,y:p.y},{x:p.x-p.vx*length/Math.max(1,speed)-p.vy*.13,y:p.y-p.vy*length/Math.max(1,speed)+p.vx*.13},{x:p.x-p.vx*.45,y:p.y-p.vy*.45}],p.color,a*.95);}
      return true;
    });
  }
  get diagnostics(){return {particles:this.particles.length,bursts:this.bursts.length,ghosts:this.ghosts.length};}
}
