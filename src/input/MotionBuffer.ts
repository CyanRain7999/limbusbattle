import type { Action, AttackAction, MotionId } from '../core/types';

/** Facing-relative numpad notation. Histories are owned by each fighter, not UI. */
export class MotionBuffer {
  private frame=0; private history:{direction:number;frame:number}[]=[]; private last=5;
  record(held:Partial<Record<Action,boolean>>,facing:1|-1,advance=true){
    if(advance)this.frame++;
    const horizontal=(Number(!!held.right)-Number(!!held.left))*facing;
    const vertical=held.crouch?-1:held.jump?1:0;
    const direction=vertical===-1?horizontal+2:vertical===1?horizontal+8:horizontal+5;
    if(direction!==this.last){this.last=direction;if(direction!==5)this.history.push({direction,frame:this.frame});}
    this.history=this.history.filter(d=>this.frame-d.frame<=25);
  }
  private matches(sequence:number[]){
    if(!this.history.length||this.frame-this.history.at(-1)!.frame>7)return false;
    if(this.history.at(-1)!.direction!==sequence.at(-1))return false;
    let index=sequence.length-1,lastTime=this.frame;
    for(let i=this.history.length-1;i>=0;i--){const entry=this.history[i];if(lastTime-entry.frame>12)return false;
      if(entry.direction===sequence[index]){lastTime=entry.frame;if(--index<0)return true;}
    }return false;
  }
  recognize(pressed:Partial<Record<AttackAction,boolean>>):MotionId|undefined {
    // DP has priority; quarter-circles require the diagonal, preventing stray crouch attacks.
    if(pressed.special&&this.matches([6,2,3]))return 'dp';
    if(pressed.light&&this.matches([6,2,3]))return 'dpj';
    if(pressed.light&&this.matches([2,2]))return 'ddj';
    if(pressed.heavy&&this.matches([2,3,6]))return 'qcfk';
    if(pressed.special&&this.matches([2,1,4]))return 'qcbl';
    if(pressed.heavy&&this.matches([2,1,4]))return 'qcb';
    if(pressed.light&&this.matches([2,3,6]))return 'qcf';
    return undefined;
  }
  clear(){this.history=[];this.last=5;}
  get notation(){return this.history.map(d=>d.direction).join('');}
}
