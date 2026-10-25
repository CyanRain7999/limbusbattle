import Phaser from 'phaser';
import { drawFighter, makeStage } from './pixel';
import { identities } from '../characters/registry';
import type { FighterState, Identity } from '../core/types';
import personaArt from '../data/persona-art.json';

export const animationStates:FighterState[]=['idle','run','crouch','jump','fall','dash','attack','hit','guard','block','down','rise','win','ko'];
export interface AssetDefinition {
  key:string; type:'sheet'|'sequence'|'aseprite'|'audio'|'effect';
  url?:string; urls?:string[]; json?:string; frameWidth?:number; frameHeight?:number;
  animations?:Record<string,{frames:number[];fps:number;loop:boolean}>;
}
export class AssetManager {
  static buildPixelCharacters(scene:Phaser.Scene){
    for(const sinner of ['don','heath']){
      const source=scene.textures.get(`${sinner}-source`).getSourceImage();const meta=scene.cache.json.get(`${sinner}-frames`);
      const canvas=document.createElement('canvas');canvas.width=224*6;canvas.height=128*6;const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
      const scale=meta?.scaleTo64??.4;
      for(let index=0;index<36;index++){
        c.save();c.translate(index%6*224+112,Math.floor(index/6)*128+116);c.scale(scale,scale);
        c.drawImage(source as CanvasImageSource,index%6*448,Math.floor(index/6)*288,448,288,-208,-264,448,288);c.restore();
      }
      const texture=scene.textures.addCanvas(`${sinner}-premium`,canvas)!;scene.textures.addSpriteSheet('',texture,{frameWidth:224,frameHeight:128});
      scene.textures.remove(`${sinner}-source`);
    }
    for(const persona of personaArt){
      const meta=scene.cache.json.get(`${persona.key}-frames`);if(!meta||!scene.textures.exists(`${persona.key}-source`))continue;
      const source=scene.textures.get(`${persona.key}-source`).getSourceImage() as CanvasImageSource;
      const frameWidth=meta.runtimeFrameWidth??224;
      const canvas=document.createElement('canvas');canvas.width=frameWidth*6;canvas.height=128;const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
      for(let i=0;i<6;i++){
        c.save();c.translate(i*frameWidth+frameWidth/2,116);c.scale(meta.scaleTo64,meta.scaleTo64);
        c.drawImage(source,i%meta.columns*meta.frameWidth,Math.floor(i/meta.columns)*meta.frameHeight,meta.frameWidth,meta.frameHeight,-meta.anchor[0],-meta.anchor[1],meta.frameWidth,meta.frameHeight);c.restore();
      }
      const texture=scene.textures.addCanvas(persona.key,canvas)!;scene.textures.addSpriteSheet('',texture,{frameWidth,frameHeight:128});
      scene.textures.remove(`${persona.key}-source`);
    }
  }
  static generate(scene:Phaser.Scene) {
    for(const stage of ['depot','bridge'] as const) if(!scene.textures.exists(stage)) scene.textures.addCanvas(stage,makeStage(stage));
    for(const id of identities) for(const state of animationStates) {
      const key=`${id.id}:${state}`;if(scene.textures.exists(key))continue;
      const sheet=document.createElement('canvas');sheet.width=96*6;sheet.height=96;const c=sheet.getContext('2d')!;
      for(let f=0;f<6;f++){const frame=document.createElement('canvas');frame.width=96;frame.height=96;drawFighter(frame.getContext('2d')!,id,state,f);c.drawImage(frame,f*96,0);}
      const texture=scene.textures.addCanvas(key,sheet)!;
      scene.textures.addSpriteSheet('',texture,{frameWidth:96,frameHeight:96});
    }
  }
  static queue(scene:Phaser.Scene,asset:AssetDefinition) {
    if(asset.type==='sheet'||asset.type==='effect') { if(!asset.url||!asset.frameWidth||!asset.frameHeight)throw Error('Sprite Sheet 需要 URL 和帧尺寸');scene.load.spritesheet(asset.key,asset.url,{frameWidth:asset.frameWidth,frameHeight:asset.frameHeight}); }
    else if(asset.type==='aseprite') {if(!asset.url||!asset.json)throw Error('Aseprite 需要 PNG 与 JSON');scene.load.aseprite(asset.key,asset.url,asset.json);}
    else if(asset.type==='sequence') {if(!asset.urls?.length)throw Error('需要至少一张序列帧');asset.urls.forEach((url,i)=>scene.load.image(`${asset.key}:${i}`,url));}
    else if(asset.type==='audio')scene.load.audio(asset.key,asset.urls??asset.url!);
  }
  static defineAnimations(scene:Phaser.Scene,asset:AssetDefinition) {
    if(asset.type==='aseprite')this.defineAsepriteAnimations(scene,asset.key);
    for(const [name,anim] of Object.entries(asset.animations??{}))scene.anims.create({key:`${asset.key}:${name}`,frames:anim.frames.map(frame=>asset.type==='sequence'?{key:`${asset.key}:${frame}`}:{key:asset.key,frame}),frameRate:anim.fps,repeat:anim.loop?-1:0});
  }
  static defineAsepriteAnimations(scene:Phaser.Scene,key:string) {
    const data=scene.cache.json.get(key);if(!data?.meta?.frameTags)throw Error('Aseprite JSON 缺少 frameTags');
    const names=scene.textures.get(key).getFrameNames();
    const frames=Object.values(data.frames) as {duration?:number}[];
    for(const tag of data.meta.frameTags as {name:string;from:number;to:number;direction:string}[]){
      const selected=names.slice(tag.from,tag.to+1).map((frame,i)=>({key,frame,duration:frames[tag.from+i]?.duration??100}));
      if(tag.direction==='reverse')selected.reverse();
      scene.anims.create({key:`${key}:${tag.name}`,frames:selected,yoyo:tag.direction==='pingpong',repeat:['idle','run','guard'].includes(tag.name)?-1:0});
    }
  }
  static bindIdentity(identity:Identity,key:string,scale=2,originY=.94) {identity.asset={key,scale,originY};}
}
