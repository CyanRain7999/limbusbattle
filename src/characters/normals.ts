import type {Identity,Move,NormalAction} from '../core/types';

export const normalButtons:NormalAction[]=['light','heavy','special','lightAlt','mediumAlt','heavyAlt'];
export const normalNotation=['A1','A2','A3','B1','B2','B3'];
/** Six weapon normals in each stance. A/B describe attack families, not fists/feet. */
export function addNormals(identity:Identity):Identity {
  const don=identity.sinner==='don';
  const names=don?['短刺','贯刺','上挑','枪尾击','横扫','重劈']:['短戳','平挥','上挑','反手击','横扫','重砸'];
  const start=[4,6,9,5,8,12],active=[4,5,6,4,5,6],recover=[10,14,19,11,17,23];
  const damage=don?[28,48,72,30,54,82]:[32,56,88,36,64,96];
  const reach=don?[92,120,146,96,140,155]:[82,106,130,87,122,143];
  const moves:Record<string,Move>={ego:identity.moves.ego};
  for(const stance of ['stand','crouch','air'] as const)normalButtons.forEach((button,i)=>{
    const strength=i%3+1,air=stance==='air',low=stance==='crouch'&&i>=3,launcher=!air&&i===2;
    const key=stance==='stand'?button:`${stance}-${button}`;
    moves[key]={id:key,name:`${stance==='air'?'空中':stance==='crouch'?'蹲姿':''}${names[i]}`,action:button,level:strength,
      startup:Math.max(3,start[i]+(don?0:1)+(air?-2:stance==='crouch'?1:0)),active:air?10:active[i],recovery:air?12:recover[i],
      damage:Math.round(damage[i]*(air?.9:1)),hitstun:strength===1?25:strength===2?32:40,knockback:strength===1?.9:strength===2?1.3:i===5?4:1.6,
      launch:launcher?11:air?i===5?0:2:0,hitstop:strength+2,power:strength+3,cost:0,cooldown:0,lunge:air?0:strength===2?.8:0,
      box:{x:5,y:air?-70:launcher?-175:low?-49:-105,w:reach[i],h:air?113:launcher?160:low?47:80},
      cancel:[Math.max(3,start[i]-2),start[i]+active[i]+10],into:[...normalButtons,'special','ego'],
      normal:{button,strength,stance,pose:(stance==='stand'?0:stance==='crouch'?6:12)+i,launcher},airOnly:air,hitLevel:air?'overhead':low?'low':'mid',
      effect:i<3&&i!==2?'thrust':i===2?'uppercut':'cleave',knockdown:i===5
    };
    if(launcher)moves[key].into=[...normalButtons,'special','ego'];
  });
  moves.dashAttack={...moves.heavy,id:'dashAttack',name:don?'疾行突刺':'疾行挥击',startup:6,active:7,recovery:19,lunge:5,damage:don?60:72,normal:{button:'light',strength:2,stance:'stand',pose:1},box:{x:5,y:-110,w:don?150:135,h:90}};
  moves.throw={id:'throw',name:don?'绊枪投':'钩棒投',action:'throw',level:3,startup:6,active:3,recovery:30,damage:don?130:150,hitstun:35,knockback:9,launch:7,hitstop:8,power:0,cost:0,cooldown:0,lunge:0,box:{x:0,y:-110,w:70,h:110},throwRange:72,cancel:[0,0],into:[],knockdown:true};
  return {...identity,moves};
}
