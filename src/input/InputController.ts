import { actions, type Settings } from '../core/settings';
import { type Action, type InputFrame, type MotionId } from '../core/types';

export class InputController {
  active=false; private keys=new Set<string>(); private keyPressed=new Set<string>();
  private pointers=new Map<number,Action>(); private touchPressed=new Set<Action>();
  private touchCommand:MotionId|undefined;
  private stick=new Set<Action>();private stickPointer:number|null=null;private stickRoot:HTMLElement|null=null;
  private directionChanges:[Partial<Record<Action,boolean>>[],Partial<Record<Action,boolean>>[]]=[[],[]];
  private recordDirection(index:0|1){const held:Partial<Record<Action,boolean>>={};for(const action of ['left','right','jump','crouch'] as const)held[action]=this.keys.has(this.settings.keys[index][action])||index===0&&this.stick.has(action);this.directionChanges[index].push(held);if(this.directionChanges[index].length>32)this.directionChanges[index].shift();}
  constructor(private settings:Settings){
    window.addEventListener('keydown',e=>{if(!this.active||e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement)return;
      if(this.settings.keys.some(map=>Object.values(map).includes(e.code))){e.preventDefault();if(!this.keys.has(e.code)){this.keyPressed.add(e.code);this.keys.add(e.code);for(const index of [0,1] as const)if(['left','right','jump','crouch'].some(a=>this.settings.keys[index][a as Action]===e.code))this.recordDirection(index);}}
    });
    window.addEventListener('keyup',e=>{const had=this.keys.delete(e.code);if(had)for(const index of [0,1] as const)if(['left','right','jump','crouch'].some(a=>this.settings.keys[index][a as Action]===e.code))this.recordDirection(index);});
    window.addEventListener('blur',()=>this.clear());
  }
  update(settings:Settings){this.settings=settings;this.clear();}
  sample(index:0|1):InputFrame {
    const frame:InputFrame={held:{},pressed:{}};
    if(!this.active)return frame;
    frame.directionChanges=this.directionChanges[index];this.directionChanges[index]=[];
    for(const action of actions){const code=this.settings.keys[index][action];frame.held[action]=this.keys.has(code)||(index===0&&([...this.pointers.values()].includes(action)||this.stick.has(action)));frame.pressed[action]=this.keyPressed.has(code)||(index===0&&this.touchPressed.has(action));this.keyPressed.delete(code);}
    if(index===0){this.touchPressed.clear();frame.command=this.touchCommand;this.touchCommand=undefined;}return frame;
  }
  clear(){this.keys.clear();this.keyPressed.clear();this.pointers.clear();this.touchPressed.clear();this.touchCommand=undefined;this.directionChanges=[[],[]];this.resetStick();document.querySelectorAll('.touch-key.pressed').forEach(el=>el.classList.remove('pressed'));}
  private resetStick(){this.stick.clear();this.stickPointer=null;this.stickRoot?.style.setProperty('--stick-x','0px');this.stickRoot?.style.setProperty('--stick-y','0px');this.stickRoot?.classList.remove('engaged');}
  bindStick(root:HTMLElement){
    this.stickRoot=root;
    const move=(e:PointerEvent)=>{const box=root.getBoundingClientRect(),dx=e.clientX-box.x-box.width/2,dy=e.clientY-box.y-box.height/2,dead=box.width*.11,next=new Set<Action>();
      if(Math.abs(dx)>dead&&Math.abs(dx)>Math.abs(dy)*.43)next.add(dx>0?'right':'left');
      if(Math.abs(dy)>dead&&Math.abs(dy)>Math.abs(dx)*.43)next.add(dy>0?'crouch':'jump');
      if(next.has('jump')&&!this.stick.has('jump'))this.touchPressed.add('jump');const changed=next.size!==this.stick.size||[...next].some(a=>!this.stick.has(a));this.stick=next;if(changed)this.recordDirection(0);
      const distance=Math.hypot(dx,dy),scale=Math.min(1,box.width*.25/Math.max(1,distance));root.style.setProperty('--stick-x',`${dx*scale}px`);root.style.setProperty('--stick-y',`${dy*scale}px`);
    };
    root.addEventListener('pointerdown',e=>{if(!this.active||this.stickPointer!==null)return;e.preventDefault();e.stopPropagation();this.stickPointer=e.pointerId;root.setPointerCapture(e.pointerId);root.classList.add('engaged');move(e);},true);
    root.addEventListener('pointermove',e=>{if(e.pointerId!==this.stickPointer)return;e.preventDefault();e.stopPropagation();move(e);},true);
    const release=(e:PointerEvent)=>{if(e.pointerId!==this.stickPointer)return;e.preventDefault();e.stopPropagation();this.resetStick();this.recordDirection(0);};
    root.addEventListener('pointerup',release,true);root.addEventListener('pointercancel',release,true);root.addEventListener('lostpointercapture',release,true);
  }
  bindTouch(root:HTMLElement){
    root.querySelectorAll<HTMLElement>('[data-action]').forEach(button=>{
      const action=button.dataset.action as Action;
      button.addEventListener('pointerdown',e=>{if(!this.active)return;e.preventDefault();button.setPointerCapture(e.pointerId);this.pointers.set(e.pointerId,action);this.touchPressed.add(action);button.classList.add('pressed');});
      const release=(e:PointerEvent)=>{e.preventDefault();this.pointers.delete(e.pointerId);if(![...this.pointers.values()].includes(action))button.classList.remove('pressed');};
      button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
    });
    root.querySelectorAll<HTMLElement>('[data-command]').forEach(button=>{
      button.addEventListener('pointerdown',e=>{if(!this.active)return;e.preventDefault();button.setPointerCapture(e.pointerId);this.touchCommand=button.dataset.command as MotionId;button.classList.add('pressed');});
      const release=()=>button.classList.remove('pressed');button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
    });
  }
}
