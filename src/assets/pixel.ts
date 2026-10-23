import type { FighterState, Identity } from '../core/types';

const rect = (c: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) => { c.fillStyle=color; c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)); };
const poly = (c: CanvasRenderingContext2D,color:string,points:number[][]) => { c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.closePath();c.fill(); };
function limb(c:CanvasRenderingContext2D,color:string,x:number,y:number,ex:number,ey:number,size:number) { const n=Math.ceil(Math.hypot(ex-x,ey-y)); for(let i=0;i<=n;i++) rect(c,color,x+(ex-x)*i/n-size/2,y+(ey-y)*i/n-size/2,size,size); }

/** Original, code-drawn placeholder art. All animation is independent of combat. */
export function drawFighter(c:CanvasRenderingContext2D,id:Identity,state:FighterState,frame:number) {
  c.clearRect(0,0,96,96); c.imageSmoothingEnabled=false;
  const don=id.sprite==='lance', alt=id.rarity==='000', t=frame/6*Math.PI*2;
  let bob=state==='idle'?Math.round(Math.sin(t)):0;
  let lean=state==='run'||state==='dash'?6:state==='hit'?-5:0;
  const attack=state==='attack'; const crouch=state==='crouch'||state==='guard'||state==='block';
  if(crouch)bob+=12;
  if(state==='down'||state==='ko') { c.save();c.translate(-19,111);c.rotate(-Math.PI/2); }
  c.save();c.translate(lean,bob);
  const dark='#15181f', coat=alt?(don?'#263744':'#27202d'):don?'#44322e':'#29282e';
  const edge=don?'#85604a':'#514049', light=don?'#e7c573':'#88717f';
  const hair=don?'#d5a847':'#4b3431', hairlight=don?'#f3d078':'#815447', skin=don?'#f2d2ad':'#c9987c';
  const stride=state==='run'?Math.sin(t)*12:state==='dash'?13:0;
  // Rear arm and coat tails.
  limb(c,dark,43,49,29,62,9);limb(c,coat,43,49,30,60,6);
  poly(c,dark,[[32,47],[51,46],[55,71],[46,77],[39,70],[27,74]]);
  poly(c,coat,[[33,48],[48,47],[52,70],[46,73],[38,66],[29,70]]);
  rect(c,edge,31,60,3,9);
  // Separated legs, boots and pixel highlights.
  const legs=state==='jump'||state==='fall'?[[-7,-8],[9,-14]]:[[stride,0],[-stride,0]];
  legs.forEach(([s,up],i)=>{const x=40+i*8;limb(c,'#141920',x,66,x+s,84+up,7);limb(c,'#36353b',x,68,x+s,81+up,4);rect(c,dark,x+s-4,82+up,12,6);rect(c,'#575059',x+s-3,82+up,8,2);});
  // Jacket, shirt, lapels, tie and numbered badge.
  poly(c,dark,[[33,40],[48,39],[54,48],[50,65],[34,64],[29,49]]);
  poly(c,coat,[[34,41],[47,41],[51,49],[48,62],[34,61],[32,48]]);
  poly(c,don?'#d7cbb5':'#9a819a',[[37,41],[45,41],[46,55],[39,55]]);
  poly(c,edge,[[34,42],[38,43],[40,57],[34,52],[35,48],[32,46]]);
  poly(c,'#171a22',[[47,42],[44,46],[43,59],[49,51],[47,48],[50,46]]);
  rect(c,don?'#a93c38':'#70465e',40,44,2,12);rect(c,'#e5bb66',34,46,3,3);rect(c,'#a4a3a1',43,61,5,2);
  // Neck and face.
  rect(c,'#986e57',38,35,8,8);rect(c,skin,34,23,16,15);rect(c,'#b98967',47,29,4,7);rect(c,'#e6ba92',37,37,10,3);
  rect(c,dark,42,29,3,2);rect(c,don?'#d58930':'#b6a59f',43,29,2,1);rect(c,'#84584b',45,35,4,1);
  // Distinct silhouettes: gold bob versus wild brown hair.
  poly(c,'#201e23',don?[[30,22],[33,17],[47,17],[53,22],[53,37],[49,43],[47,34],[33,28],[33,42],[29,38]]:[[29,22],[31,17],[36,18],[37,13],[43,17],[48,14],[50,20],[55,20],[52,27],[48,29],[44,24],[39,27],[34,29],[33,35],[30,31]]);
  poly(c,hair,don?[[31,23],[34,19],[47,19],[51,23],[51,35],[48,39],[48,28],[44,25],[40,30],[38,24],[34,29],[32,39],[31,36]]:[[31,23],[34,19],[38,20],[39,17],[44,21],[48,18],[49,23],[52,23],[48,26],[43,23],[37,27],[34,26],[33,31],[31,29]]);
  rect(c,hairlight,don?34:35,21,don?11:5,3);if(don){rect(c,'#f8df94',33,25,2,10);rect(c,hair,31,35,4,7);}
  if(alt){rect(c,id.color,34,52,4,2);rect(c,id.color,47,45,2,6);}
  // Weapon follows a six-frame drawn animation, never its hitbox.
  const swing=attack?frame:0; const handX=attack?49+(swing>1&&swing<5?8:0):49, handY=attack&&swing<2?35:53;
  limb(c,dark,48,45,handX,handY,9);limb(c,coat,48,45,handX,handY,6);rect(c,skin,handX-2,handY-2,5,5);
  if(don){
    const x1=attack&&swing<2?44:19, y1=attack&&swing<2?79:70, x2=attack&&swing<2?65:91, y2=attack&&swing<2?4:attack?43:15;
    limb(c,'#111920',x1,y1,x2,y2,4);limb(c,'#98816a',x1,y1,x2,y2,2);
    poly(c,light,[[x2-4,y2+7],[x2+2,y2-8],[x2+4,y2+6],[x2,y2+3]]);rect(c,'#f5e4b6',x2,y2-6,2,7);
    limb(c,id.secondary,x1+11,y1-9,x1+20,y1-14,3);
  }else{
    const endX=attack?(swing<2?26:88):73,endY=attack?(swing<2?9:58):17;
    limb(c,'#17151c',handX,handY,endX,endY,8);limb(c,'#756577',handX,handY,endX,endY,5);limb(c,'#b0a0a2',handX,handY,endX,endY,2);
    for(let i=0;i<3;i++)rect(c,'#39313d',endX-3+i,endY+2+i*4,5,2);
  }
  if(state==='guard'||state==='block'){limb(c,dark,37,45,54,34,8);limb(c,coat,37,45,54,34,5);rect(c,skin,53,31,5,5);}
  if(state==='win'){rect(c,'#f6dd93',53,25,2,9);rect(c,'#f6dd93',50,28,8,2);}
  c.restore();if(state==='down'||state==='ko')c.restore();
}

export function portrait(id:Identity): string {
  return `./characters/${id.sinner}/lcb/portrait.png`;
}

export function makeStage(kind:'depot'|'bridge'='depot'):HTMLCanvasElement {
  const canvas=document.createElement('canvas');canvas.width=880;canvas.height=360;const c=canvas.getContext('2d')!;
  let seed=1023;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const r=(color:string,x:number,y:number,w:number,h:number)=>rect(c,color,x,y,w,h);
  // Dithered sky and a distant industrial skyline.
  const sky=c.createLinearGradient(0,0,0,300);sky.addColorStop(0,kind==='depot'?'#26373c':'#34323e');sky.addColorStop(.55,'#747c70');sky.addColorStop(1,'#b39a70');c.fillStyle=sky;c.fillRect(0,0,880,360);
  for(let i=0;i<1400;i++){const x=rand()*880,y=rand()*255;r(rand()>.5?'#a6a185':'#40555b',x,y,rand()*4+1,1);c.globalAlpha=.12;}c.globalAlpha=1;
  r('#b8aa82',588,62,47,47);r('#b8aa82',582,69,59,33);r('#c4b68f',594,65,35,38);
  for(let row=0;row<3;row++){
    const color=['#596a69','#435656','#334749'][row];let x=-20;
    while(x<900){const w=18+rand()*55,h=25+rand()*110;const y=230-h+row*8;r(color,x,y,w,h);r(color,x+w*.25,y-8,w*.45,8);
      for(let yy=y+12;yy<238;yy+=10)for(let xx=x+5;xx<x+w-3;xx+=8)if(rand()>.5)r(row===2?'#839080':'#99a18a',xx,yy,2,3);
      if(rand()>.5){r(color,x+w*.6,y-45,7,45);r(color,x+w*.6-2,y-47,11,4);for(let s=0;s<5;s++)r('#5e706d',x+w*.6-s*9,y-54-s*4,14+s*4,4);}
      x+=w+rand()*12;
    }
  }
  // Rail gantry and power lines.
  for(const x of [88,382,740]){r('#293c40',x,21,7,227);r('#64736a',x,21,2,227);r('#26383d',x-12,20,34,6);r('#26383d',x-8,42,25,4);r('#26383d',x-3,247,14,9);}
  c.strokeStyle='#283b3e';c.lineWidth=1;for(let i=0;i<3;i++){c.beginPath();c.moveTo(0,36+i*9);c.quadraticCurveTo(190,72+i*9,385,27+i*9);c.quadraticCurveTo(560,75+i*9,744,28+i*9);c.lineTo(880,47+i*9);c.stroke();}
  // A vast station canopy: repeating riveted steel beams.
  r('#202d31',0,0,880,14);r('#3c4c4c',0,14,880,5);r('#1f2c30',0,44,880,6);
  for(let x=0;x<880;x+=98){poly(c,'#28393c',[[x,16],[x+10,16],[x+85,45],[x+75,45]]);r('#52615c',x+1,19,3,3);}
  for(const x of [24,322,836]){r('#1b2d33',x,14,13,250);r('#465651',x+3,17,3,242);r('#111f26',x-8,259,30,9);for(let yy=30;yy<250;yy+=30)r('#697267',x+5,yy,3,3);}
  // Platform brick facade, warning lamps and torn signage.
  r('#405052',0,218,880,52);r('#59615b',0,218,880,4);
  for(let y=225;y<270;y+=8){for(let x=(y%16?0:-15);x<880;x+=29){r('#34484b',x,y,27,1);r('#34484b',x,y,1,8);}}
  r('#243237',57,136,126,62);r('#a0916c',60,139,120,3);r('#a0916c',60,192,120,3);r('#39474a',64,146,112,41);
  c.fillStyle='#d0c3a0';c.font='bold 14px monospace';c.fillText('DISTRICT 07',69,163);c.font='8px monospace';c.fillText('TERMINAL / CLOSED',70,180);
  r('#a74732',197,207,11,4);r('#e5a95e',200,206,4,3);
  if(kind==='depot'){
    // Original red company bus, warm windows, grilles and brass trim.
    r('#17272d',445,176,302,84);poly(c,'#1e292f',[[444,181],[456,155],[689,155],[730,171],[747,201],[747,250],[443,250]]);
    poly(c,'#793a34',[[449,183],[460,160],[685,160],[725,176],[741,204],[741,243],[449,243]]);
    r('#a4513e',454,162,230,6);r('#b48857',450,208,288,4);r('#492f30',450,215,289,22);r('#25272b',450,243,294,9);
    for(let x=465;x<671;x+=35){r('#17282c',x,173,29,31);r('#a79869',x+2,175,25,27);r('#d6bd76',x+3,178,23,19);r('#7f815f',x+5,192,7,10);r('#5f6b59',x+21,179,2,23);r('#353f36',x+12,198,11,4);}
    poly(c,'#172c30',[[684,172],[718,181],[732,202],[684,202]]);poly(c,'#b4ae7c',[[688,176],[716,184],[726,198],[688,198]]);
    r('#302e2f',682,207,2,36);r('#b38756',686,216,4,3);r('#b0a080',729,214,9,6);r('#eee0a4',731,215,8,4);r('#d09b5b',446,215,4,7);
    for(const x of [494,687]){r('#151e26',x-14,237,29,23);r('#0e1921',x-10,234,21,30);r('#5a5a53',x-6,239,13,19);r('#9c8c69',x-3,245,7,8);r('#292c2e',x-1,247,3,4);}
    for(let x=550;x<622;x+=5)r('#9b6450',x,222,2,10);
    c.fillStyle='#dec38a';c.font='bold 10px monospace';c.fillText('LCB',635,229);c.font='5px monospace';c.fillText('MEPHISTOPHELES',467,230);
  } else {
    for(let x=410;x<800;x+=42){r('#243137',x,175,6,85);limb(c,'#34474a',x,175,x+42,250,3);}
    r('#2c3d40',400,173,430,7);r('#60706a',400,177,430,2);
  }
  // Cobblestones, rails and puddle reflections.
  r('#303d40',0,270,880,90);r('#8a8567',0,271,880,3);r('#b3a67b',0,275,880,2);r('#202e34',0,278,880,4);
  for(let y=285;y<360;y+=12){for(let x=-40+(y%24)*2;x<900;x+=60){r('#465255',x,y,57,1);r('#222f36',x,y+1,2,11);}}
  for(let i=0;i<140;i++){const x=rand()*880,y=284+rand()*76;r(i%3?'#53615e':'#7b7c63',x,y,rand()*18+2,1);}
  for(let i=0;i<60;i++){const x=450+rand()*290,y=286+rand()*45;c.globalAlpha=.2;r('#d3a65f',x,y,rand()*14+1,1);}c.globalAlpha=1;
  r('#152730',0,335,880,3);r('#758178',0,333,880,2);r('#1a2c34',0,348,880,4);r('#5c6a65',0,347,880,1);
  // Foreground pipes and quiet edge dressing.
  r('#26383c',0,297,47,7);r('#65746b',0,297,47,2);r('#26383c',42,290,6,16);r('#1b2c32',818,286,62,15);
  for(let x=826;x<880;x+=9)r('#53605b',x,285,2,16);
  return canvas;
}
