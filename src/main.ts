import { App } from './ui/App';
import './style.css';
import './ui/skills.css';
import './ui/mobile.css';
import { PWA } from './platform/PWA';
const pwa=new PWA();
new App(document.querySelector<HTMLElement>('#app')!,pwa);
if(document.readyState==='complete')void pwa.register();else window.addEventListener('load',()=>void pwa.register(),{once:true});
