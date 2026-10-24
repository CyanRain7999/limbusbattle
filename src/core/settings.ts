import type {Action,Difficulty} from './types';
export const actions:Action[]=['left','right','jump','crouch','light','heavy','special','lightAlt','mediumAlt','heavyAlt','ego','dash','throw'];
export const actionNames:Record<Action,string>={left:'向左 / 后拉',right:'向右 / 后拉',jump:'跳跃',crouch:'下蹲',light:'轻主攻 A1',heavy:'中主攻 A2',special:'重主攻 A3',lightAlt:'轻副攻 B1',mediumAlt:'中副攻 B2',heavyAlt:'重副攻 B3',ego:'E.G.O.',dash:'冲刺',throw:'投 / 拆投'};
export interface Settings {keysVersion:number;volume:number;clash:boolean;difficulty:Difficulty;effects:boolean;touch:boolean;touchSize:number;touchX:number;touchY:number;keys:[Record<Action,string>,Record<Action,string>]}
export const defaults:Settings={keysVersion:2,volume:.5,clash:true,difficulty:'normal',effects:true,touch:false,touchSize:1,touchX:0,touchY:0,keys:[
  {left:'KeyA',right:'KeyD',jump:'KeyW',crouch:'KeyS',light:'KeyJ',heavy:'KeyK',special:'KeyL',lightAlt:'KeyU',mediumAlt:'KeyI',heavyAlt:'KeyO',ego:'KeyH',dash:'ShiftLeft',throw:'Space'},
  {left:'ArrowLeft',right:'ArrowRight',jump:'ArrowUp',crouch:'ArrowDown',light:'Numpad1',heavy:'Numpad2',special:'Numpad3',lightAlt:'Numpad4',mediumAlt:'Numpad5',heavyAlt:'Numpad6',ego:'Numpad0',dash:'NumpadDecimal',throw:'NumpadEnter'}
]};
export function readSettings():Settings {
  const result=structuredClone(defaults);
  try{const raw=JSON.parse(localStorage.getItem('limbus-settings')??'null');if(!raw)return result;
    Object.assign(result,raw);result.keys=structuredClone(defaults.keys);result.keysVersion=2;
    for(const player of [0,1] as const){const saved=raw.keys?.[player];if(!saved)continue;
      if(raw.keysVersion===2){for(const action of actions)if(typeof saved[action]==='string')result.keys[player][action]=saved[action];}
      else{for(const action of ['left','right','jump','crouch','light','heavy','special'] as const){const code=saved[action];if(typeof code==='string'&&!Object.entries(result.keys[player]).some(([other,k])=>other!==action&&k===code))result.keys[player][action]=code;}}
    }return result;
  }catch{return structuredClone(defaults);}
}
export function saveSettings(s:Settings){try{localStorage.setItem('limbus-settings',JSON.stringify(s));}catch{/* Device storage can be disabled. */}}
export function keyLabel(code:string){return code.replace('Key','').replace('Digit','').replace('Numpad','Num ').replace('Arrow','').replace('ShiftLeft','L Shift').replace('ShiftRight','R Shift').replace('Space','Space');}
