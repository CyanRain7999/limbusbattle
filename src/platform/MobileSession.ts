/** Browser capabilities are optional; input and play work without them. */
export class MobileSession {
  private wake:WakeLockSentinel|null=null;private playing=false;private generation=0;
  get handheld(){return matchMedia('(pointer:coarse)').matches;}
  async enter(){
    this.setPlaying(true);
    if(this.handheld&&!document.fullscreenElement&&!matchMedia('(display-mode:standalone)').matches){try{await document.documentElement.requestFullscreen?.();}catch{/* Safari uses its standalone display instead. */}}
    if(this.handheld){try{await (screen.orientation as ScreenOrientation&{lock?:(orientation:string)=>Promise<void>}).lock?.('landscape');}catch{/* The rotate hint handles unsupported orientation locks. */}}
  }
  setPlaying(playing:boolean){this.playing=playing;this.generation++;if(playing&&document.visibilityState==='visible')void this.acquire(this.generation);else{void this.wake?.release().catch(()=>{});this.wake=null;}}
  private async acquire(generation:number){if(this.wake&&!this.wake.released||!('wakeLock' in navigator))return;try{const lock=await navigator.wakeLock.request('screen');if(!this.playing||generation!==this.generation){await lock.release();return;}this.wake=lock;lock.addEventListener('release',()=>{if(this.wake===lock)this.wake=null;});}catch{/* Power saving or browser policy can reject the wake lock. */}}
  async toggleFullscreen(){if(document.fullscreenElement){await document.exitFullscreen();return;}await document.documentElement.requestFullscreen?.();try{await (screen.orientation as ScreenOrientation&{lock?:(orientation:string)=>Promise<void>}).lock?.('landscape');}catch{/* Rotation remains available manually. */}}
}
