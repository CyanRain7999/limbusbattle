import type { Action, Difficulty } from './types';
export const actions:Action[]=['left','right','jump','crouch','light','heavy','special','ego','dash','guard'];
export const actionNames:Record<Action,string>={left:'向左',right:'向右',jump:'跳跃',crouch:'下蹲',light:'轻攻击',heavy:'重攻击',special:'招式键',ego:'E.G.O.',dash:'冲刺',guard:'防御'};
export interface Settings { volume:number; clash:boolean; difficulty:Difficulty; effects:boolean; touch:boolean; touchSize:number; touchX:number; touchY:number; keys:[Record<Action,string>,Record<Action,string>] }
export const defaults:Settings={volume:.5,clash:true,difficulty:'normal',effects:true,touch:false,touchSize:1,touchX:0,touchY:0,keys:[
  {left:'KeyA',right:'KeyD',jump:'KeyW',crouch:'KeyS',light:'KeyJ',heavy:'KeyK',special:'KeyL',ego:'KeyU',dash:'ShiftLeft',guard:'Space'},
  {left:'ArrowLeft',right:'ArrowRight',jump:'ArrowUp',crouch:'ArrowDown',light:'Numpad1',heavy:'Numpad2',special:'Numpad3',ego:'Numpad0',dash:'Numpad5',guard:'Numpad4'}
]};
export function readSettings():Settings {try{const raw=JSON.parse(localStorage.getItem('limbus-settings')??'null');return raw?{...structuredClone(defaults),...raw,keys:raw.keys??structuredClone(defaults.keys)}:structuredClone(defaults);}catch{return structuredClone(defaults);}}
export function saveSettings(s:Settings){try{localStorage.setItem('limbus-settings',JSON.stringify(s));}catch{/* Private browsing may disable storage. */}}
export function keyLabel(code:string){return code.replace('Key','').replace('Digit','').replace('Numpad','Num ').replace('Arrow','').replace('ShiftLeft','L Shift').replace('ShiftRight','R Shift').replace('Space','Space');}
