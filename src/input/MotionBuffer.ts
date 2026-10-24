import type { Action, AttackAction, MotionId } from '../core/types';

const MOTION_WINDOW=34,STEP_WINDOW=16,BUTTON_GRACE=12;
const DP_WINDOW=40,DP_STEP=20,DP_GRACE=14;

/** Facing-relative numpad notation. Histories are owned by each fighter, not UI. */
export class MotionBuffer {
  private frame=0; private history:{direction:number;frame:number}[]=[]; private last=5;
  record(held:Partial<Record<Action,boolean>>,facing:1|-1,advance=true){
    if(advance)this.frame++;
    const horizontal=(Number(!!held.right)-Number(!!held.left))*facing;
    const vertical=held.crouch?-1:held.jump?1:0;
    const direction=vertical===-1?horizontal+2:vertical===1?horizontal+8:horizontal+5;
    if(direction!==this.last){this.last=direction;if(direction!==5)this.history.push({direction,frame:this.frame});}
    this.history=this.history.filter(d=>this.frame-d.frame<=DP_WINDOW);
  }
  private matches(sequence:number[],window=MOTION_WINDOW,step=STEP_WINDOW,grace=BUTTON_GRACE){
    if(!this.history.length||this.frame-this.history.at(-1)!.frame>grace)return false;
    if(this.history.at(-1)!.direction!==sequence.at(-1))return false;
    let index=sequence.length-1,lastTime=this.frame;
    for(let i=this.history.length-1;i>=0;i--){const entry=this.history[i];if(lastTime-entry.frame>step)return false;
      if(entry.direction===sequence[index]){lastTime=entry.frame;if(--index<0)return this.frame-entry.frame<=window;}
    }return false;
  }
  private quarterCircle(back=false){const diagonal=back?1:3,end=back?4:6;return this.matches([2,diagonal,end])||this.matches([2,diagonal,end,diagonal]);}
  private dragonPunch(){return [[6,2,3],[6,2,3,6],[6,3,6],[3,2,3]].some(seq=>this.matches(seq,DP_WINDOW,DP_STEP,DP_GRACE));}
  recognize(pressed:Partial<Record<AttackAction,boolean>>):MotionId|undefined {
    // Complete directions remain required; tolerate a small roll at the end.
    // DP keeps priority when its forward/down/diagonal was entered in order.
    if(pressed.special&&this.dragonPunch())return 'dp';
    if(pressed.light&&this.dragonPunch())return 'dpj';
    if(pressed.light&&this.matches([2,2]))return 'ddj';
    if(pressed.heavy&&this.quarterCircle())return 'qcfk';
    if(pressed.special&&this.quarterCircle(true))return 'qcbl';
    if(pressed.heavy&&this.quarterCircle(true))return 'qcb';
    if(pressed.light&&this.quarterCircle())return 'qcf';
    return undefined;
  }
  clear(){this.history=[];this.last=5;}
  get notation(){return this.history.map(d=>d.direction).join('');}
}
