import raw from '../data/command-skills.json';
import airRaw from '../data/air-skills.json';
import type { Identity, MotionId, Move } from '../core/types';
export interface CommandSkill extends Move { sinner:string; slot:MotionId; source:string }
export const skillCatalog=raw as unknown as CommandSkill[];
export const airSkillCatalog=airRaw as unknown as CommandSkill[];
export const airMotionIds:MotionId[]=['qcf','qcb'];
export const motionIds:MotionId[]=['qcf','qcb','dp','ddj','qcfk','qcbl','dpj'];
export const motionLabels:Record<MotionId,string>={qcf:'↓↘→ + J',qcb:'↓↙← + K',dp:'→↓↘ + L',ddj:'↓↓ + J',qcfk:'↓↘→ + K',qcbl:'↓↙← + L',dpj:'→↓↘ + J'};
export const motionNotation:Record<MotionId,string>={qcf:'236 J',qcb:'214 K',dp:'623 L',ddj:'22 J',qcfk:'236 K',qcbl:'214 L',dpj:'623 J'};
export const motionButtons:Record<MotionId,'light'|'heavy'|'special'>={qcf:'light',qcb:'heavy',dp:'special',ddj:'light',qcfk:'heavy',qcbl:'special',dpj:'light'};
export const defaultLoadouts:Record<string,string[]>={don:['don-rip-space','don-n-purge','don-cinq-duel','don-t-collect','don-blade-draw','don-queen-beam','don-justice-rise'],heath:['heath-fullstop-shot','heath-wild-burial','heath-seven-parry','heath-middle-revenge','heath-kurokumo-draw','heath-sunshower-counter','heath-quick-suppression']};
export function equipSkills(identity:Identity,ids:string[]=defaultLoadouts[identity.sinner]??[]):Identity {
  const entries=motionIds.map((motion,i)=>{const candidates=skillCatalog.filter(s=>s.sinner===identity.sinner&&s.slot===motion);return [motion,candidates.find(s=>s.id===ids[i])??candidates[0]];});
  return {...identity,commandMoves:Object.fromEntries(entries) as Record<MotionId,Move>,airCommandMoves:Object.fromEntries(airSkillCatalog.filter(s=>s.sinner===identity.sinner).map(s=>[s.slot,s]))};
}
