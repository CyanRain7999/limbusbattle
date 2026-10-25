import type {Identity,Move,NormalAction} from '../core/types';
import profiles from '../data/normal-profiles.json';

export const normalButtons:NormalAction[]=['light','heavy','special','lightAlt','mediumAlt','heavyAlt'];
export const normalNotation=['A1','A2','A3','B1','B2','B3'];
/** Six weapon normals in each stance. A/B describe attack families, not fists/feet. */
export function addNormals(identity:Identity):Identity {
  const profile=profiles[identity.sinner as keyof typeof profiles]??profiles.don;
  const {names,damage,reach}=profile,start=profile.start,active=profile.active,recover=profile.recovery;
  const moves:Record<string,Move>={ego:identity.moves.ego};
  for(const stance of ['stand','crouch','air'] as const)normalButtons.forEach((button,i)=>{
    const strength=i%3+1,air=stance==='air',low=stance==='crouch'&&i>=3,launcher=!air&&i===2;
    const key=stance==='stand'?button:`${stance}-${button}`;
    const startup=Math.max(3,start[i]+(air?-2:stance==='crouch'?1:0));
    const activeFrames=air?10:active[i],recovery=air?9:Math.max(6,recover[i]-(strength+2));
    moves[key]={id:key,name:`${stance==='air'?'空中':stance==='crouch'?'蹲姿':''}${names[i]}`,action:button,level:strength,
      startup,active:activeFrames,recovery,
      damage:Math.round(damage[i]*(air?.9:1)),hitstun:strength===1?25:strength===2?32:40,knockback:strength===1?.9:strength===2?1.3:i===5?4:1.6,
      launch:launcher?11:air?i===5?0:2:0,hitstop:strength+1,power:strength+3,cost:0,cooldown:0,lunge:air?0:strength===2?.8:0,
      box:{x:5,y:air?-70:launcher?-175:low?-49:-105,w:reach[i],h:air?113:launcher?160:low?47:80},
      cancel:[startup,startup+activeFrames+recovery-1],into:[...normalButtons,'special','ego'],
      normal:{button,strength,stance,pose:(stance==='stand'?0:stance==='crouch'?6:12)+i,launcher},airOnly:air,hitLevel:air?'overhead':low?'low':'mid',
      effect:i===0||i===1&&!['greatsword','guandao','halberd'].includes(identity.sprite)?'thrust':i===2?'uppercut':'cleave',knockdown:i===5
    };
    if(!air){
      const m=moves[key];
      if(!launcher){
        m.box.y=low?-49:stance==='crouch'?-82:i===5?-145:i===0?-100:i===1?-118:-100;
        m.box.h=low?47:stance==='crouch'?67:i===5?138:i===0?55:i===1?93:85;
      }
      if(identity.sinner==='don'&&i<2){m.box.y=-102;m.box.h=i===0?48:60;}
      if(identity.sinner==='heath'&&i===5){m.wallBounce=true;m.knockback=11;m.launch=5;}
      if(identity.sinner==='ryoshu'&&i===3)m.travel={recovery:-1.3};
      if(identity.sinner==='meur'&&i===3)m.guardPoint=[2,Math.max(2,m.startup-1)];
      if(identity.sinner==='ish'&&i===3)m.reflect=[2,Math.max(2,m.startup-1)];
      if(identity.sinner==='rod'&&i===5){m.wallBounce=true;m.knockback=12;m.launch=6;if(stance==='stand')m.hitLevel='overhead';}
      if(identity.sinner==='yi'&&i===3)m.travel={recovery:-1};
      if(identity.sinner==='outis'&&i===4)m.travel={recovery:-1.1};
      if(identity.sinner==='faust'&&i===5&&stance==='stand'){m.hitLevel='overhead';m.minRange=35;}
      if(identity.sinner==='hong'&&i===4){m.knockback=-1.8;m.launch=0;}
      if(identity.sinner==='sin'&&i===5)m.seal='consume';
    }
    if(launcher)moves[key].into=[...normalButtons,'special','ego'];
    if(identity.sinner==='greg'&&strength===3&&!air)moves[key].limb={charge:18,reach:65};
  });
  moves.dashAttack={...moves.heavy,id:'dashAttack',name:'疾行·'+names[1],startup:6,active:7,recovery:15,cancel:[6,27],lunge:5,damage:Math.round(damage[1]*1.25),normal:{button:'light',strength:2,stance:'stand',pose:1},box:{x:5,y:-110,w:reach[1]+30,h:90}};
  moves.throw={id:'throw',name:profile.throw,action:'throw',level:3,startup:6,active:3,recovery:30,damage:profile.throwDamage,hitstun:35,knockback:9,launch:7,hitstop:8,power:0,cost:0,cooldown:0,lunge:0,box:{x:0,y:-110,w:70,h:110},throwRange:profile.throwRange,cancel:[0,0],into:[],knockdown:true};
  return {...identity,moves};
}
