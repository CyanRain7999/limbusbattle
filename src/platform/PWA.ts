interface InstallPrompt extends Event {prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>}
export class PWA {
  prompt:InstallPrompt|null=null;ready=false;updateAvailable=false;error=false;
  private applyUpdate:((reloadPage?:boolean)=>Promise<void>)|null=null;private playing=false;private added=false;
  constructor(){
    window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();this.prompt=e as InstallPrompt;this.changed();});
    window.addEventListener('appinstalled',()=>{this.prompt=null;this.added=true;this.changed();});
    window.addEventListener('online',()=>this.changed());window.addEventListener('offline',()=>this.changed());
  }
  get installed(){return this.added||matchMedia('(display-mode:standalone)').matches||!!(navigator as Navigator&{standalone?:boolean}).standalone;}
  get status(){return this.error?'离线准备失败，请联网重试':!navigator.onLine?(this.ready?'已离线 · 可以游玩':'网络已断开'):this.updateAvailable?'新版本就绪':this.ready?'离线资源已备妥':import.meta.env.DEV?'开发预览':'正在准备离线资源…';}
  setPlaying(value:boolean){this.playing=value;this.changed();}
  private changed(){window.dispatchEvent(new CustomEvent('pwa-state'));}
  async install(){if(this.prompt){const prompt=this.prompt;this.prompt=null;await prompt.prompt();const result=await prompt.userChoice;this.changed();return result.outcome==='accepted';}return false;}
  async update(){if(this.playing)return false;await this.applyUpdate?.(true);return true;}
  async register(){
    if(!('serviceWorker' in navigator)||!import.meta.env.PROD)return;
    try{const {registerSW}=await import('virtual:pwa-register');this.applyUpdate=registerSW({
      onOfflineReady:()=>{this.ready=true;this.changed();},
      onNeedRefresh:()=>{this.updateAvailable=true;this.changed();},
      onRegisterError:()=>{this.error=true;this.changed();},
      onRegisteredSW:(_url,registration)=>{if(registration?.active){this.ready=true;this.changed();}}
    });await navigator.serviceWorker.ready;this.ready=true;this.changed();}catch{this.error=true;this.changed();}
  }
}
