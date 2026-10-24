export type NormalAction = 'light' | 'heavy' | 'special' | 'lightAlt' | 'mediumAlt' | 'heavyAlt';
export type Action = 'left' | 'right' | 'jump' | 'crouch' | NormalAction | 'ego' | 'dash' | 'throw';
export type AttackAction = NormalAction | 'ego' | 'throw';
export type MotionId = 'qcf' | 'qcb' | 'dp' | 'ddj' | 'qcfk' | 'qcbl' | 'dpj';
export type FighterState = 'idle' | 'run' | 'crouch' | 'jump' | 'fall' | 'dash' | 'attack' | 'hit' | 'guard' | 'block' | 'down' | 'rise' | 'win' | 'ko' | 'throw' | 'thrown';
export interface InputFrame { held: Partial<Record<Action, boolean>>; pressed: Partial<Record<Action, boolean>>; command?: MotionId; directionChanges?:Partial<Record<Action,boolean>>[] }
export const neutral = (): InputFrame => ({ held: {}, pressed: {} });
export interface Box { x: number; y: number; w: number; h: number }
export interface Move {
  id: string; name: string; action: AttackAction; level: number;
  startup: number; active: number; recovery: number; damage: number;
  hitstun: number; knockback: number; launch: number; hitstop: number;
  power: number; cost: number; cooldown: number; lunge: number;
  box: Box; cancel: [number, number]; into: AttackAction[];
  status?: 'burn' | 'rupture'; knockdown?: boolean;
  normal?:{button:NormalAction;strength:number;stance:'stand'|'crouch'|'air';pose:number;launcher?:boolean};
  hitLevel?:'mid'|'low'|'overhead';airOnly?:boolean;throwRange?:number;
  appearance?: string; visualRow?: number; visualKey?:string; color?:string; source?:string; description?:string; label?:string;
  effect?: 'thrust' | 'rift' | 'retreat' | 'uppercut' | 'bullets' | 'slug' | 'cleave' | 'hammer' | 'time' | 'beam' | 'iaido' | 'fist' | 'umbrella' | 'fan' | 'parasol' | 'extend' | 'petal' | 'butterfly' | 'brush' | 'claw' | 'electric' | 'flame' | 'scissors' | 'palm' | 'maraca' | 'talisman';
  /** Near/full blade reach; extends over active frames and retracts in recovery. */
  extend?:[number,number];
  setup?:boolean;ammoCost?:number;reload?:boolean;
  limb?:{charge:number;reach:number};
  counter?:[number,number];armorUntil?:number;teleport?:number;guardDamage?:number;
  hits?: {frame:number;duration:number;scale:number}[];
  projectile?: {frames:number[];speed:number;vy?:number;width:number;height:number;life:number};
}
export interface Identity {
  id: string; sinner: string; number: string; name: string; english: string;
  title: string; rarity: string; description: string; archetype: string;
  color: string; secondary: string; sprite: 'lance' | 'bat' | 'sheathed' | 'gauntlet' | 'mace' | 'axe' | 'dagger' | 'kopis' | 'insect' | 'greatsword' | 'guandao' | 'halberd';
  hp: number; speed: number; jump: number; defense: number;
  stats: [number, number, number]; moves: Record<string, Move>;
  asset?: { key: string; scale: number; originY: number };
  commandMoves?: Record<MotionId,Move>;
  airCommandMoves?:Partial<Record<MotionId,Move>>;
}
export type Difficulty = 'easy' | 'normal' | 'hard';
export interface MatchOptions { p1: Identity; p2: Identity; mode: 'cpu' | 'local' | 'training'; difficulty: Difficulty; clash: boolean; stage: 'depot' | 'bridge'; seed?: number }
export interface CombatEvent { type: 'hit' | 'block' | 'clash' | 'dash' | 'jump' | 'ego' | 'ko' | 'round' | 'guardbreak' | 'status' | 'skill' | 'throw' | 'throwtech' | 'trait'; x: number; y: number; source: number; target?: number; value?: number; text?: string; color?: string }
export const WORLD = { width: 1760, height: 720, floor: 570, left: 85, right: 1675 };
export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
export const intersects = (a: Box, b: Box) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
