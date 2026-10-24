import Phaser from 'phaser';
import { ArenaScene } from '../scenes/ArenaScene';
import { InputController } from '../input/InputController';
import { Synth } from '../audio/Synth';
import { actionNames, actions, defaults, keyLabel, readSettings, saveSettings } from '../core/settings';
import { getIdentity, identities, sinners, playableIdentities, playableSinners } from '../characters/registry';
import { portrait } from '../assets/pixel';
import { animationStates, AssetManager } from '../assets/AssetManager';
import { type MatchOptions, type FighterState } from '../core/types';
import type { Match } from '../combat/Match';
import { Fighter } from '../combat/Fighter';
import { icon } from './icons';
import { defaultLoadouts,equipSkills,skillCatalog,airMotionIds,motionIds,motionLabels,motionNotation,motionButtons } from '../skills/catalog';
import type { Identity,MotionId } from '../core/types';
import { traits,traitText } from '../characters/traits';
import { roles } from '../characters/roles';
import { normalButtons,normalNotation } from '../characters/normals';
import personaArt from '../data/persona-art.json';
import { MobileSession } from '../platform/MobileSession';
import type { PWA } from '../platform/PWA';

const modes={cpu:'单人作战',local:'本地双人',training:'自由训练'};
const difficultyNames={easy:'简单',normal:'普通',hard:'困难'};
export class App {
  settings=readSettings();controls=new InputController(this.settings);audio=new Synth();scene=new ArenaScene(this.controls,this.audio);game:Phaser.Game;
  private mode:MatchOptions['mode']='cpu';private p1='don-lcb';private p2='heath-lcb';private stage:MatchOptions['stage']='depot';private selecting:0|1=0;
  private overlay='';private playing=false;private lastOptions:MatchOptions|null=null;private resultsShown=false;private previousHud='';private portraitCache=new Map<string,string>();private returnOverlay='';
  private loadouts:[Record<string,string[]>,Record<string,string[]>]=[structuredClone(defaultLoadouts),structuredClone(defaultLoadouts)];
  private mobile=new MobileSession();private orientationPaused=false;private skillAir=false;
  constructor(private root:HTMLElement,private pwa:PWA){
    this.audio.volume=this.settings.volume;
    try{const saved=JSON.parse(localStorage.getItem('limbus-loadouts')??'null');if(saved?.length===2)this.loadouts=saved;}catch{/* use defaults */}
    this.root.innerHTML=this.shell();
    this.game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:1280,height:720,backgroundColor:'#26373c',pixelArt:true,roundPixels:true,
      scale:{mode:Phaser.Scale.ENVELOP,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[this.scene],audio:{noAudio:true},render:{antialias:false},fps:{target:60},banner:false});
    this.scene.onTick=m=>this.updateHud(m);this.scene.effectsEnabled=this.settings.effects;
    this.bindGlobal();this.controls.bindTouch(document.querySelector('#touch-controls')!);this.controls.bindStick(document.querySelector('.touch-directions')!);this.controls.bindTouch(document.querySelector('#skill-bar')!);this.applySettings();
    window.addEventListener('pwa-state',()=>this.refreshPWA());this.refreshPWA();
    window.addEventListener('resize',()=>this.syncOrientation());
    this.updateRoster();
    this.root.addEventListener('pointerdown',()=>this.audio.unlock(),{once:true});
    window.addEventListener('keydown',e=>{
      if(e.code==='Escape'){e.preventDefault();if(this.overlay){if(this.overlay==='pause')this.resume();else if(this.returnOverlay){const back=this.returnOverlay;this.returnOverlay='';this.open(back);}else this.close();}else if(this.playing)this.pause();}
      if(e.code==='Tab'&&this.playing&&!this.overlay){e.preventDefault();this.open('help');}
      if(e.code==='F3'){e.preventDefault();this.scene.debug=!this.scene.debug;document.querySelector('#debug-panel')!.classList.toggle('hidden',!this.scene.debug);}
    });
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.playing&&!this.overlay)this.pause();this.mobile.setPlaying(this.playing&&!this.overlay&&!document.hidden);});
    if(import.meta.env.DEV || new URLSearchParams(location.search).has('debug')){
      (window as unknown as Record<string,unknown>).__LIMBUS__={app:this,scene:this.scene,get match(){return (this as {scene:ArenaScene}).scene.match;},start:(opts?:Partial<MatchOptions>)=>{this.lastOptions={p1:this.equipped(0,this.p1),p2:this.equipped(1,this.p2),mode:this.mode,difficulty:this.settings.difficulty,clash:this.settings.clash,stage:this.stage,...opts};this.start();}};
    }
  }
  private image(id:string){if(!this.portraitCache.has(id))this.portraitCache.set(id,portrait(getIdentity(id)));return this.portraitCache.get(id)!;}
  private equipped(index:0|1,id:string){const base=getIdentity(id);return equipSkills(base,this.loadouts[index][base.sinner]??defaultLoadouts[base.sinner]);}
  private refreshSkillBar(id:Identity,air=false){
    this.skillAir=air;
    for(const command of [...motionIds,'ego'] as const){
      const move=command==='ego'?(air?undefined:id.moves.ego):air?id.airCommandMoves?.[command]:id.commandMoves![command];
      const card=document.querySelector<HTMLElement>(`#cd-${command}`)!.parentElement!;
      const button=document.querySelector<HTMLElement>(command==='ego'?'.attack-ego':`.command-${command}`)!;
      card.hidden=!move;button.hidden=!move;if(!move)continue;
      document.querySelector(`#skill-key-${command}`)!.textContent=command==='ego'?keyLabel(this.settings.keys[0].ego):`${air?'空中 ':''}${motionNotation[command].split(' ')[0]} ${keyLabel(this.settings.keys[0][motionButtons[command]])}`;
      document.querySelector(`#skill-name-${command}`)!.textContent=move.name;
      document.querySelector(`#skill-cost-${command}`)!.textContent=`${move.cost} 罪孽 · ${move.source?.split(' · ')[0]??'E.G.O.'}`;
      if(command!=='ego'){const names:Record<string,string>={w:'W 公司',n:'N 公司',blade:'剑契',cinq:'Cinq',t:'T 公司',queen:'女王',lcb:'升枪',fullstop:'句点',wild:'狂猎',seven:'七协',middle:'中指',kurokumo:'黑云',sunshower:'伞夫',r:'兔子'};button.innerHTML=`<b>${move.label??names[move.appearance??'lcb']??move.name}</b><small>${air?'空 ':''}${motionNotation[command].replace(' ','')}</small>`;button.title=`${move.name} / ${move.source}`;}
    }
  }
  private shell(){return `
    <header class="topbar"><button class="brand" id="home" aria-label="返回主菜单"><span class="brand-emblem">${icon('bus')}</span><span><b>边狱交锋</b><small>LIMBUS CLASH</small></span></button>
      <nav aria-label="主导航"><button class="nav-item active" data-open="menu">对战终端<span>COMBAT</span></button><button class="nav-item" data-open="archives">罪人档案<span>SINNERS</span></button><button class="nav-item" data-open="help">操作指南<span>MANUAL</span></button></nav>
      <div class="top-actions"><span class="local-status"><i></i><span data-pwa-status>离线准备中</span></span><button class="install-button" data-pwa-install><span data-install-label>安装游戏</span></button><button class="icon-button" id="sound" aria-label="切换声音">${icon('volume')}</button><button class="icon-button" data-open="settings" aria-label="游戏设置">${icon('settings')}</button><button class="icon-button" id="fullscreen" aria-label="全屏">${icon('full')}</button></div>
    </header>
    <main><div class="terminal-line"><span><i></i> LCB // COMBAT SIMULATOR</span><span>EST. 2026 <b>／</b> 非官方同人企划</span></div>
    <section class="arena-frame" aria-label="游戏画面"><div id="game"></div><div class="scanlines"></div>
      <div id="main-menu" class="main-menu"><div class="menu-copy"><div class="eyebrow"><span>罪人战斗模拟系统</span><b>VOL. 01</b></div><h1>边狱<span>交锋<i>✦</i></span></h1><div class="english-title">LIMBUS CLASH</div><p class="intro">下一站，战场。<br>以罪孽为刃，向命运挥击。</p>
      <div class="mode-options"><button class="mode-option selected" data-mode="cpu">${icon('sword')}<span><b>单人作战</b><small>挑战 CPU 对手</small></span><em>01</em></button><button class="mode-option" data-mode="local">${icon('people')}<span><b>本地双人</b><small>同屏交锋</small></span><em>02</em></button><button class="mode-option" data-mode="training">${icon('target')}<span><b>自由训练</b><small>打磨你的连招</small></span><em>03</em></button></div>
      <button id="choose" class="primary-button"><span>选择罪人</span>${icon('arrow')}</button><span class="menu-hint">键盘 / 触屏 <span>·</span> 下载后离线游玩</span></div>
      <div class="stage-caption"><span class="live-dot"></span>场景预览 <small>STAGE 01</small><b>第七区 · 废弃车站</b><span class="stage-coordinates">N 07° 03′ / E 13° 00′</span></div>
      <div class="stage-labels"><span>03 <b>DON QUIXOTE</b></span><i>VS</i><span>07 <b>HEATHCLIFF</b></span></div>
      <div class="preview-note">LCB PERSONNEL ONLY <span>◆</span> 请保持战斗准备</div></div>
      <div id="hud" class="hidden"><div class="fighter-hud p1"><div class="fighter-label"><span class="player-tag">1P</span><b id="name0"></b><small id="identity0"></small><div id="wins0" class="round-dots"></div></div><div class="hp-track"><i id="hp0"></i><span id="hptext0"></span></div><div class="sub-gauges"><span class="sp-label">SP <b id="sp0">0</b></span><div class="ego-track"><i id="ego0"></i></div><span class="ego-label">E.G.O. <b id="egotext0"></b></span></div><div class="guard-track"><i id="guard0"></i></div><span id="status0" class="status-text"></span><span id="trait0" class="trait-text"></span></div>
      <div class="timer-block"><small id="round-title">ROUND 01</small><b id="timer">99</b><span>BEST OF 3</span></div>
      <div class="fighter-hud p2"><div class="fighter-label"><span class="player-tag" id="p2-tag">CPU</span><b id="name1"></b><small id="identity1"></small><div id="wins1" class="round-dots"></div></div><div class="hp-track"><i id="hp1"></i><span id="hptext1"></span></div><div class="sub-gauges"><span class="sp-label">SP <b id="sp1">0</b></span><div class="ego-track"><i id="ego1"></i></div><span class="ego-label">E.G.O. <b id="egotext1"></b></span></div><div class="guard-track"><i id="guard1"></i></div><span id="status1" class="status-text"></span><span id="trait1" class="trait-text"></span></div>
      <button class="battle-pause icon-button" id="pause" aria-label="暂停对战">${icon('pause')}</button><div id="callout" class="callout"></div><div id="combo0" class="combo combo-left"></div><div id="combo1" class="combo combo-right"></div>
      <div class="battle-stage">LCB COMBAT SIMULATOR <i>◆</i> <span id="battle-stage-name"></span></div>
      <button class="battle-movelist secondary-button" id="move-list">招式表 <kbd>Tab</kbd></button>
      <div id="skill-bar" class="skill-bar">${([...motionIds,'ego'] as const).map(command=>`<button ${command==='ego'?'data-action="ego"':`data-command="${command}"`} class="skill ${command==='ego'?'ego-skill':''}"><kbd id="skill-key-${command}"></kbd><span><b id="skill-name-${command}"></b><small id="skill-cost-${command}"></small></span><i id="cd-${command}"></i></button>`).join('')}</div>
      </div>
      <div id="debug-panel" class="debug-panel hidden"></div>
      <div id="touch-controls" class="touch-controls hidden"><div class="touch-directions">${[['jump','↑'],['left','←'],['crouch','↓'],['right','→']].map(([a,l])=>`<button data-action="${a}" class="touch-key dir-${a}" aria-label="触屏${actionNames[a as keyof typeof actionNames]}">${l}</button>`).join('')}<span class="stick-knob" aria-hidden="true"></span></div><div class="touch-attacks"><div class="normal-grid">${normalButtons.map((a,i)=>`<button data-action="${a}" class="touch-key normal-button attack-${a}" aria-label="${actionNames[a]}"><b>${normalNotation[i]}</b><small>${i%3===0?'轻':i%3===1?'中':'重'}${i<3?'主攻':'副攻'}</small></button>`).join('')}</div><div class="touch-utilities">${[['dash','冲刺'],['throw','投'],['ego','E.G.O.']].map(([a,l])=>`<button data-action="${a}" class="touch-key attack-${a}">${l}</button>`).join('')}<button id="persona-toggle" class="touch-key" aria-expanded="false">人格</button></div><div class="touch-command-grid">${motionIds.map(m=>`<button data-command="${m}" class="touch-key touch-command command-${m}" aria-label="便捷技能 ${motionNotation[m]}">${motionNotation[m].replace(' ','')}</button>`).join('')}</div></div></div>
    </section>
    <section id="menu-bottom" class="menu-bottom"><div class="on-duty"><span class="section-micro">本次出勤<small>ON DUTY</small></span><button class="mini-fighter" data-select="don-lcb"><img alt="堂吉诃德像素头像" src="${this.image('don-lcb')}"><span><small>No. 03</small><b>堂吉诃德</b></span>${icon('arrow')}</button><button class="mini-fighter" data-select="heath-lcb"><img alt="希斯克利夫像素头像" src="${this.image('heath-lcb')}"><span><small>No. 07</small><b>希斯克利夫</b></span>${icon('arrow')}</button></div><div class="combat-features"><div>${icon('bolt')}<span>实时交锋<small>60 FPS COMBAT</small></span></div><div>${icon('diamond')}<span>人格技能<small>IDENTITY LOADOUT</small></span></div><button data-open="help">${icon('key')}<span>查看操作<small>FIELD MANUAL ↗</small></span></button></div></section>
    <section id="battle-bottom" class="battle-bottom hidden"><span><kbd>A</kbd><kbd>D</kbd> 移动 <kbd>W</kbd> 跳跃 <kbd>Shift</kbd> 冲刺 <kbd>Space</kbd> 投 / 拆投 · 后拉防御</span><span><kbd>J → K → L</kbd> 武器连段 <kbd>L → W</kbd> 浮空追击 <button data-open="help">完整指南 ↗</button></span><button id="debug-toggle">F3 调试</button></section>
    </main><footer><span>LCB <b>／</b> LIMBUS CLASH <i>© 2026</i></span><span>《边狱巴士》非官方同人作品 <b>·</b> 角色素材为 AI 辅助原创</span><button data-open="about">关于本作 ↗</button></footer>
    <div id="modal-root"></div><div id="toast" role="status"></div><div class="rotate-note">${icon('full')}<b>横屏，交锋体验更佳</b><span>旋转设备，展开战场</span><button id="dismiss-rotate">继续使用竖屏</button></div>`;}
  private bindGlobal(){
    this.root.querySelectorAll<HTMLElement>('[data-open]').forEach(el=>el.addEventListener('click',()=>{const view=el.dataset.open!;if(view==='menu'){if(this.playing)this.pause();else this.close();}else this.open(view);}));
    this.root.querySelectorAll<HTMLElement>('[data-mode]').forEach(el=>el.addEventListener('click',()=>{this.mode=el.dataset.mode as typeof this.mode;this.root.querySelectorAll('[data-mode]').forEach(e=>e.classList.toggle('selected',(e as HTMLElement).dataset.mode===this.mode));this.audio.play('ui');}));
    this.root.querySelectorAll<HTMLElement>('[data-select]').forEach(el=>el.addEventListener('click',()=>{this.p1=el.dataset.select!;this.p2=getIdentity(this.p1).sinner==='don'?'heath-lcb':'don-lcb';this.open('select');}));
    this.on('persona-toggle',()=>{const box=document.querySelector('.touch-attacks')!,open=box.classList.toggle('personas-open');document.querySelector('#persona-toggle')!.setAttribute('aria-expanded',String(open));});
    this.root.querySelector('#choose')!.addEventListener('click',()=>this.open('select'));
    this.root.querySelector('#home')!.addEventListener('click',()=>{if(this.playing)this.pause();else this.close();});
    this.root.querySelector('#pause')!.addEventListener('click',()=>this.pause());this.on('move-list',()=>this.open('help'));
    this.root.querySelector('#fullscreen')!.addEventListener('click',()=>void this.mobile.toggleFullscreen().catch(()=>this.toast('请从主屏幕打开，或旋转手机横屏游玩')));
    this.root.querySelector('#sound')!.addEventListener('click',()=>{this.settings.volume=this.settings.volume>0?0:.5;this.applySettings();this.toast(this.settings.volume?'声音已开启':'声音已关闭');});
    this.root.querySelector('#debug-toggle')!.addEventListener('click',()=>{this.scene.debug=!this.scene.debug;document.querySelector('#debug-panel')!.classList.toggle('hidden',!this.scene.debug);});
    this.root.querySelector('#dismiss-rotate')!.addEventListener('click',()=>{this.root.classList.add('portrait-ok');this.syncOrientation();});
    this.root.addEventListener('click',e=>{const target=(e.target as HTMLElement).closest('[data-pwa-install],[data-pwa-update]');if(!target)return;if(target.hasAttribute('data-pwa-update')){if(this.playing)this.toast('请先返回终端，再更新游戏');else void this.pwa.update();}else if(this.pwa.prompt)void this.pwa.install();else this.open('install');});
    this.root.addEventListener('pointerdown',e=>{
      const button=(e.target as HTMLElement).closest<HTMLElement>('[data-debug-refill],[data-debug-cycle]');const m=this.scene.match;if(!button||!m)return;
      if(button.hasAttribute('data-debug-refill')){for(const f of m.fighters){f.ego=100;f.hp=f.identity.hp;f.sp=45;f.cooldowns={};}return;}
      const i=Number(button.dataset.debugCycle) as 0|1,old=m.fighters[i],next=identities[(identities.findIndex(id=>id.id===old.identity.id)+1)%identities.length];const f=new Fighter(i,next);f.x=old.x;f.ego=100;m.fighters[i]=f;
      if(i===0)m.options.p1=next;else m.options.p2=next;
      document.querySelector(`#name${i}`)!.textContent=next.name;document.querySelector(`#identity${i}`)!.textContent=next.title;
      if(i===0)this.refreshSkillBar(next);
    });
  }
  private applySettings(){
    saveSettings(this.settings);this.controls.update(this.settings);this.audio.volume=this.settings.volume;this.scene.effectsEnabled=this.settings.effects;
    document.querySelector('#sound')!.innerHTML=icon(this.settings.volume?'volume':'mute');
    const touch=this.settings.touch||matchMedia('(pointer: coarse)').matches;
    document.querySelector('#touch-controls')!.classList.toggle('hidden',!this.playing||!touch);
    const style=(document.querySelector('#touch-controls') as HTMLElement).style;style.setProperty('--touch-scale',`${this.settings.touchSize}`);style.setProperty('--touch-x',`${this.settings.touchX}px`);style.setProperty('--touch-y',`${this.settings.touchY}px`);
    if(this.scene.match){this.scene.match.options.clash=this.settings.clash;this.scene.match.options.difficulty=this.settings.difficulty;this.scene.setDifficulty(this.settings.difficulty);}
  }
  private updateRoster(){this.root.querySelectorAll('.nav-item').forEach((el,i)=>el.classList.toggle('active',i===0));}
  private toast(text:string){const el=document.querySelector('#toast')!;el.textContent=text;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2600);}
  private refreshPWA(){
    document.querySelectorAll('[data-pwa-status]').forEach(el=>el.textContent=this.pwa.status);
    document.querySelectorAll('[data-install-label]').forEach(el=>el.textContent=this.pwa.installed?'已安装':this.pwa.prompt?'安装游戏':'手机安装');
    document.querySelectorAll<HTMLButtonElement>('[data-pwa-update]').forEach(el=>{el.hidden=!this.pwa.updateAvailable;el.disabled=this.playing;});
    document.querySelectorAll('[data-pwa-state]').forEach(el=>el.textContent=this.pwa.status);
  }
  private renderInstall(){
    this.modal('随时登车，横屏开战','PLAY ANYWHERE',`<div class="install-hero"><img src="./icon-192.png" alt="边狱交锋图标"><div><small>LIMBUS CLASH / PWA</small><h3>把交锋带在身边</h3><p>添加到主屏幕，以独立窗口横屏游玩。</p><span class="offline-state" data-pwa-state>${this.pwa.status}</span></div></div><div class="install-steps"><section><small>ANDROID</small><h3>Chrome / Edge</h3><p>点击下方安装，或打开浏览器菜单，选择「安装应用」或「添加到主屏幕」。</p></section><section><small>iPHONE / iPAD</small><h3>Safari</h3><p>点击分享按钮 →「添加到主屏幕」，再从主屏幕打开。关闭系统竖排方向锁定后，将手机横过来。</p></section></div>${this.pwa.prompt?'<button class="primary-button" data-pwa-install>安装边狱交锋 ↗</button>':''}<button class="primary-button" data-pwa-update hidden>更新游戏并重新打开 ↗</button><div class="notice-strip">首次联网打开后，等「离线资源已备妥」再断网。安装需要发布后的 HTTPS 地址；电脑上的 127.0.0.1 地址只供本机预览。游戏更新会等你返回终端后再应用。</div>`,'install-modal');this.refreshPWA();
  }
  private syncOrientation(){
    if(!this.playing||!this.scene.match)return;
    const blocked=this.mobile.handheld&&matchMedia('(orientation:portrait)').matches&&!this.root.classList.contains('portrait-ok');
    if(blocked){this.orientationPaused=true;this.scene.match.paused=true;this.controls.clear();this.controls.active=false;this.mobile.setPlaying(false);}
    else if(this.orientationPaused&&!this.overlay){this.orientationPaused=false;this.scene.match.paused=false;this.controls.clear();this.controls.active=true;this.mobile.setPlaying(true);}
  }
  private open(view:string){
    if(this.playing&&this.scene.match){this.mobile.setPlaying(false);this.scene.match.paused=true;this.controls.active=false;this.controls.clear();if(view!=='pause')this.returnOverlay='pause';}
    this.overlay=view;this.audio.play('ui');
    if(view==='select'){this.renderSelection();return;}
    if(view==='settings'){this.renderSettings();return;}
    if(view==='install'){this.renderInstall();return;}
    if(view==='assets'){this.renderAssets();return;}
    if(view==='archives'){this.renderArchives();return;}
    if(view==='help'){this.modal('操作指南','FIELD MANUAL',this.helpMarkup());return;}
    if(view==='pause'){this.modal('行动暂缓','SIMULATION PAUSED',`<div class="pause-copy">战场会等你片刻。</div><div class="pause-actions"><button class="primary-button" id="resume">继续交锋 ${icon('arrow')}</button><button class="secondary-button" id="restart">重新开始</button><button class="secondary-button" id="pause-settings">操作与设置</button><button class="text-button" id="exit">返回主菜单</button></div>`,'compact');this.on('resume',()=>this.resume());this.on('restart',()=>this.start());this.on('pause-settings',()=>this.open('settings'));this.on('exit',()=>this.exit());return;}
    if(view==='about'){this.modal('关于本作','ABOUT THE PROJECT',`<div class="about-mark">${icon('bus')}<h3>边狱交锋</h3><p>LIMBUS CLASH · VOL. 01</p></div><p>一款以《Limbus Company》角色为题材的非官方横版格斗原型。角色名称与世界观归原权利方所有，本项目与 Project Moon 无关联。</p><p>角色使用 AI 辅助原创像素动作图，背景与音效由本工程绘制和合成。战斗由固定 60 Hz 逻辑、独立状态机和 JSON 技能数据驱动。</p><div class="about-links"><a href="https://github.com/5DPLAY-Game-Studio/BleachVsNaruto" target="_blank" rel="noreferrer">玩法参考 / BVN ↗</a><button class="secondary-button" id="asset-lab">素材预览与导入 ↗</button></div>`);this.on('asset-lab',()=>this.open('assets'));}
  }
  private on(id:string,fn:()=>void){document.getElementById(id)?.addEventListener('click',fn);}
  private modal(title:string,english:string,body:string,size=''){
    const root=document.querySelector('#modal-root')!;root.innerHTML=`<div class="modal-backdrop"><section class="modal ${size}" role="dialog" aria-modal="true" aria-label="${title}"><div class="modal-heading"><div><small>${english}</small><h2>${title}<span>／</span></h2></div><button class="icon-button" id="close-modal" aria-label="关闭窗口">${icon('close')}</button></div><div class="modal-content">${body}</div></section></div>`;
    this.on('close-modal',()=>{if(this.overlay==='results'){this.exit();return;}if(this.returnOverlay){this.returnOverlay='';this.open('pause');}else if(this.playing)this.resume();else this.close();});
    (root.querySelector('#close-modal') as HTMLElement)?.focus();
  }
  private close(){if(this.overlay==='results'){this.exit();return;}document.querySelector('#modal-root')!.innerHTML='';this.overlay='';if(this.playing)this.resume();}
  private pause(){if(this.playing&&this.scene.match?.phase!=='finished')this.open('pause');}
  private resume(){this.orientationPaused=false;this.mobile.setPlaying(this.playing);document.querySelector('#modal-root')!.innerHTML='';this.overlay='';this.returnOverlay='';if(this.scene.match)this.scene.match.paused=false;this.controls.clear();this.controls.active=this.playing;this.syncOrientation();}
  private renderSelection(){
    const selected=getIdentity(this.selecting===0?this.p1:this.p2);
    this.modal('选择你的罪人','PERSONNEL DEPLOYMENT',`
      <div class="select-top"><div class="select-tabs"><button class="${this.selecting===0?'active':''}" id="select-p1"><em>1P</em> 出勤罪人</button><button class="${this.selecting===1?'active':''}" id="select-p2"><em>${this.mode==='cpu'?'CPU':'2P'}</em> 对手罪人</button></div><div class="select-mode"><label for="mode-select">作战方式</label><select id="mode-select">${Object.entries(modes).map(([k,v])=>`<option value="${k}" ${k===this.mode?'selected':''}>${v}</option>`).join('')}</select></div></div>
      <div class="character-grid">${playableSinners.map(s=>{const id=identities.find(i=>i.sinner===s)!,look=selected.sinner===s?selected:id;return `<button class="character-card ${selected.sinner===s?'chosen':''}" data-sinner="${s}" style="--fighter-color:${look.color}"><span class="card-number">${id.number}</span><span class="card-check">${selected.sinner===s?'已选定':'可出勤'}</span><img src="${this.image(look.id)}" style="filter:${look.id==='don-w'?'hue-rotate(135deg) saturate(.65)':look.id==='heath-wild'?'sepia(.3)':'none'}" alt="${id.name}原创像素形象"><div class="card-bottom"><small>${id.english}</small><h3>${id.name}</h3><span>${id.archetype}</span><b>${icon('arrow')}</b></div></button>`;}).join('')}</div>
      <section class="trait-guide"><div><small>罪人特点</small><h3>${traits[selected.sinner].name}</h3><p>${traits[selected.sinner].description}</p></div><div><small>留意破绽</small><p>${traits[selected.sinner].weakness}</p><code>${traits[selected.sinner].route}</code></div></section>
      <div class="loadout-header"><span class="section-micro">人格技能配装<small>MIXED IDENTITY MOVESET</small></span><span>常驻：LCB 罪人 · HP ${selected.hp} · SPD ${selected.speed}</span></div>
      <div class="loadout-grid">${motionIds.map((motion,i)=>{const equipped=this.equipped(this.selecting,selected.id).commandMoves![motion];return `<label class="loadout-slot"><small>${motionNotation[motion]}</small><select data-loadout="${i}">${skillCatalog.filter(skill=>skill.sinner===selected.sinner&&skill.slot===motion).map(skill=>`<option value="${skill.id}" ${skill.id===equipped.id?'selected':''}>${skill.name} · ${skill.source}</option>`).join('')}</select><span>${motionLabels[motion]} <b>／ ${equipped.cost} 罪孽</b></span></label>`;}).join('')}</div><p class="loadout-note">各槽独立选择来源人格。出招期间显现对应服装与武器，收招后恢复 LCB。方向随朝向镜像。</p>
      <div class="deployment-options"><label>战斗区域<select id="stage-select"><option value="depot" ${this.stage==='depot'?'selected':''}>第七区 · 废弃车站</option><option value="bridge" ${this.stage==='bridge'?'selected':''}>第七区 · 高架铁桥</option></select></label><label>CPU 强度<select id="difficulty-select" ${this.mode!=='cpu'?'disabled':''}>${Object.entries(difficultyNames).map(([k,v])=>`<option value="${k}" ${k===this.settings.difficulty?'selected':''}>${v}</option>`).join('')}</select></label><label class="toggle-label"><input type="checkbox" id="clash-select" ${this.settings.clash?'checked':''}><span>实时拼点</span></label></div>
      <div class="deploy-footer"><div><span class="deploy-tag">1P</span> ${getIdentity(this.p1).name}<small>${getIdentity(this.p1).title}</small><i>VS</i><span class="deploy-tag opponent">${this.mode==='cpu'?'CPU':'2P'}</span> ${getIdentity(this.p2).name}</div><button class="primary-button" id="deploy">确认出勤 ${icon('arrow')}</button></div>`, 'selection-modal');
    this.on('select-p1',()=>{this.selecting=0;this.renderSelection();});this.on('select-p2',()=>{this.selecting=1;this.renderSelection();});
    document.querySelectorAll<HTMLElement>('[data-sinner]').forEach(el=>el.addEventListener('click',()=>{const id=identities.find(i=>i.sinner===el.dataset.sinner)!;if(this.selecting===0){this.p1=id.id;if(this.mode==='cpu'&&getIdentity(this.p2).sinner===id.sinner)this.p2=id.sinner==='don'?'heath-lcb':'don-lcb';}else this.p2=id.id;this.renderSelection();this.audio.play('ui');}));
    document.querySelectorAll<HTMLSelectElement>('[data-loadout]').forEach(el=>el.addEventListener('change',()=>{const sinner=selected.sinner;this.loadouts[this.selecting][sinner]??=[...defaultLoadouts[sinner]];this.loadouts[this.selecting][sinner][Number(el.dataset.loadout)]=el.value;try{localStorage.setItem('limbus-loadouts',JSON.stringify(this.loadouts));}catch{}this.renderSelection();}));
    document.querySelector('#mode-select')!.addEventListener('change',e=>{this.mode=(e.target as HTMLSelectElement).value as typeof this.mode;this.renderSelection();});
    document.querySelector('#stage-select')!.addEventListener('change',e=>this.stage=(e.target as HTMLSelectElement).value as typeof this.stage);
    document.querySelector('#difficulty-select')!.addEventListener('change',e=>{this.settings.difficulty=(e.target as HTMLSelectElement).value as typeof this.settings.difficulty;saveSettings(this.settings);});
    document.querySelector('#clash-select')!.addEventListener('change',e=>{this.settings.clash=(e.target as HTMLInputElement).checked;saveSettings(this.settings);});
    this.on('deploy',()=>{this.lastOptions={p1:this.equipped(0,this.p1),p2:this.equipped(1,this.p2),mode:this.mode,difficulty:this.settings.difficulty,clash:this.settings.clash,stage:this.stage};this.start();});
  }
  private start(){
    if(!this.scene.ready){this.toast('终端正在加载，请稍候');return;}if(!this.lastOptions)return;
    this.pwa.setPlaying(true);void this.mobile.enter();this.playing=true;this.resultsShown=false;this.previousHud='';this.overlay='';this.returnOverlay='';document.querySelector('#modal-root')!.innerHTML='';
    document.querySelector('#main-menu')!.classList.add('hidden');document.querySelector('#menu-bottom')!.classList.add('hidden');document.querySelector('#hud')!.classList.remove('hidden');document.querySelector('#battle-bottom')!.classList.remove('hidden');
    this.root.classList.add('playing');this.game.scale.scaleMode=Phaser.Scale.FIT;this.game.scale.refresh();this.controls.clear();this.controls.active=true;
    this.scene.startMatch(this.lastOptions);this.applySettings();this.controls.active=true;
    const opts=this.lastOptions;
    [opts.p1,opts.p2].forEach((id,i)=>{document.querySelector(`#name${i}`)!.textContent=id.name;document.querySelector(`#identity${i}`)!.textContent=id.title;});
    document.querySelector('#p2-tag')!.textContent=opts.mode==='cpu'?'CPU':opts.mode==='local'?'2P':'木桩';document.querySelector('#battle-stage-name')!.textContent=opts.stage==='depot'?'第七区 · 废弃车站':'第七区 · 高架铁桥';
    this.refreshSkillBar(opts.p1);
    this.audio.play('round');this.syncOrientation();
  }
  private exit(){this.pwa.setPlaying(false);this.mobile.setPlaying(false);this.orientationPaused=false;this.playing=false;this.lastOptions=null;this.overlay='';this.returnOverlay='';document.querySelector('#modal-root')!.innerHTML='';this.scene.showDemo();document.querySelector('#main-menu')!.classList.remove('hidden');document.querySelector('#menu-bottom')!.classList.remove('hidden');document.querySelector('#hud')!.classList.add('hidden');document.querySelector('#battle-bottom')!.classList.add('hidden');this.root.classList.remove('playing');this.game.scale.scaleMode=Phaser.Scale.ENVELOP;this.game.scale.refresh();this.applySettings();}
  private updateHud(m:Match){
    if(!this.playing)return;
    for(const f of m.fighters){const i=f.index;const hp=document.querySelector<HTMLElement>(`#hp${i}`)!;hp.style.width=`${f.hp/f.identity.hp*100}%`;hp.classList.toggle('low',f.hp<f.identity.hp*.25);document.querySelector(`#hptext${i}`)!.textContent=`${f.hp} / ${f.identity.hp}`;
      document.querySelector(`#sp${i}`)!.textContent=`${f.sp>=0?'+':''}${f.sp}`;document.querySelector<HTMLElement>(`#ego${i}`)!.style.width=`${f.ego}%`;document.querySelector(`#egotext${i}`)!.textContent=`${Math.floor(f.ego)}%`;document.querySelector<HTMLElement>(`#guard${i}`)!.style.width=`${f.guardMeter}%`;
      const trait=document.querySelector<HTMLElement>(`#trait${i}`)!;trait.textContent=traitText(f);trait.classList.toggle('ready',f.traitCount>0||f.traitTimer>0);
      document.querySelector(`#status${i}`)!.textContent=[f.statuses.burn?'♨ 灼烧':'',f.statuses.rupture?'✦ 破裂':''].filter(Boolean).join(' / ');
      const combo=document.querySelector(`#combo${i}`)!;combo.innerHTML=f.combo>1?`<b>${f.combo}</b><span>HITS<small>${f.comboDamage} DAMAGE</small></span>`:'';
      document.querySelector(`#wins${i}`)!.innerHTML=`<i class="${m.wins[i]>0?'won':''}"></i><i class="${m.wins[i]>1?'won':''}"></i>`;
    }
    document.querySelector('#timer')!.textContent=m.options.mode==='training'?'∞':`${Math.ceil(m.timer/60)}`.padStart(2,'0');document.querySelector('#round-title')!.textContent=`ROUND ${String(m.round).padStart(2,'0')}`;
    const callout=m.phase==='intro'?`<small>ROUND ${m.round}</small><b>${m.phaseTimer>35?'准备就绪':'交锋开始'}</b><span>${m.phaseTimer>35?'READY':'FIGHT'}</span>`:m.phase==='roundover'?`<small>${m.roundWinner<0?'DRAW':`${m.roundWinner===0?'1P':m.options.mode==='cpu'?'CPU':'2P'} WINS`}</small><b>${m.timer<=0?'时间结束':'K.O.'}</b><span>${m.roundWinner<0?'势均力敌':m.fighters[m.roundWinner].identity.name+'赢得此回合'}</span>`:'';
    if(callout!==this.previousHud){document.querySelector('#callout')!.innerHTML=callout;this.previousHud=callout;}
    if(this.skillAir===m.fighters[0].grounded)this.refreshSkillBar(m.fighters[0].identity,!m.fighters[0].grounded);
    for(const command of [...motionIds,'ego'] as const){const f=m.fighters[0],move=command==='ego'?(this.skillAir?undefined:f.identity.moves.ego):this.skillAir?f.identity.airCommandMoves?.[command]:f.identity.commandMoves![command];if(!move)continue;const cd=f.cooldowns[move.id]??0;const el=document.querySelector<HTMLElement>(`#cd-${command}`)!;el.style.height=`${cd/Math.max(1,move.cooldown)*100}%`;el.parentElement!.classList.toggle('unavailable',f.ego<move.cost);el.parentElement!.title=`${move.source??''} / ${move.description??move.name} / ${move.startup}+${move.active}+${move.recovery} 帧`;const touch=document.querySelector<HTMLElement>(command==='ego'?'.attack-ego':`.command-${command}`);if(touch){touch.classList.toggle('unavailable',f.ego<move.cost);touch.classList.toggle('cooling',cd>0);touch.style.setProperty('--cooldown',`${cd/Math.max(1,move.cooldown)}`);touch.setAttribute('aria-disabled',String(cd>0||f.ego<move.cost));}}
    for(const f of m.fighters)document.querySelector(`#identity${f.index}`)!.textContent=f.attack?.source??'LCB 罪人';
    if(this.scene.debug)document.querySelector('#debug-panel')!.innerHTML=`<b>DEBUG / FIXED 60 Hz</b><span>frame ${m.frame} · hitstop ${m.hitstop} · clash ${m.clashes}</span>${m.fighters.map(f=>`<span>P${f.index+1} ${f.state} [${f.age}] / ${f.attack?.id??'-'} [${f.attackAge}]<br>人格 ${f.appearance} · 输入 ${f.motion.notation}<br>x ${f.x.toFixed(1)} y ${f.y.toFixed(1)} vx ${f.vx.toFixed(1)} vy ${f.vy.toFixed(1)} / stun ${f.stun}<br>frames ${f.attack?`${f.attack.startup} / ${f.attack.active} / ${f.attack.recovery}`:'-'}</span>`).join('')}<div class="debug-actions"><button data-debug-refill>补满资源</button><button data-debug-cycle="0">切换 P1</button><button data-debug-cycle="1">切换 P2</button></div>`;
    if(m.phase==='finished'&&!this.resultsShown){this.resultsShown=true;this.showResults(m);}
  }
  private showResults(m:Match){this.mobile.setPlaying(false);const winner=m.fighters[m.winner];this.controls.active=false;this.overlay='results';const playerWin=m.winner===0;this.modal(playerWin?'行动成功':'行动结束','COMBAT REPORT',`<div class="results-banner" style="--fighter-color:${winner.identity.color}"><img src="${this.image(winner.identity.id)}" alt="胜利罪人"><div><small>${m.winner===0?'PLAYER 1':m.options.mode==='cpu'?'CPU':'PLAYER 2'} VICTORY</small><h3>${winner.identity.name}</h3><p>${winner.identity.title}</p><b>${m.wins[0]} <i>:</i> ${m.wins[1]}</b></div></div><div class="report-stats"><div><small>总伤害</small><b>${m.totals[0].damage}</b></div><div><small>命中次数</small><b>${m.totals[0].hits}</b></div><div><small>实时拼点</small><b>${m.clashes}</b></div></div><div class="report-actions"><button class="secondary-button" id="result-menu">返回终端</button><button class="secondary-button" id="result-select">重新选人</button><button class="primary-button" id="rematch">再战一场 ${icon('refresh')}</button></div>`);this.on('result-menu',()=>this.exit());this.on('result-select',()=>{this.exit();this.open('select');});this.on('rematch',()=>this.start());}
  private helpMarkup(){return `<div class="manual-intro"><span>武器普通技 / 人格必杀</span><p>J / K / L 是轻、中、重主攻，U / I / O 是轻、中、重副攻。使用各罪人的 LCB 武器，站立、下蹲、空中各有六种普通技。H 为 E.G.O.；空格为投 / 拆投。</p></div><div class="notice-strip">方向始终相对面向。面向右时，236J：S → S+D → D → J；214K：S → S+A → A → K。整套输入约 0.57 秒内完成，末尾按键可稍晚约 0.2 秒；方向要连贯并经过斜方向。623 的窗口放宽到约 0.67 秒，可用 636 或 323 简化输入，末尾按键宽限约 0.23 秒。出招期间切换对应人格，结束后恢复 LCB。</div>${playableSinners.map(sinner=>{const id=this.equipped(0,sinner+'-lcb');return `<details class="command-details" open><summary>${id.name} · 地面 7 招 / 空中 2 招</summary><div class="command-list">${motionIds.map(m=>{const move=id.commandMoves![m];return `<div><kbd>${motionNotation[m]}</kbd><b>${move.name}<small>${move.source??'LCB 罪人'}</small></b><span>${move.description??''}</span></div>`;}).join('')}${airMotionIds.map(m=>{const move=id.airCommandMoves![m]!;return `<div><kbd>空中 ${motionNotation[m]}</kbd><b>${move.name}<small>${move.source}</small></b><span>${move.description}</span></div>`;}).join('')}</div></details>`;}).join('')}${playableIdentities.map(id=>`<div class="manual-trait"><b>${id.name} · ${traits[id.sinner].name}</b><p>${traits[id.sinner].description}</p><small>${traits[id.sinner].weakness}</small></div>`).join('')}<div class="manual-intro"><span>移动与防守</span><p>后拉防御中段 / 跳入，斜下后防御下段；蹲防会被空中攻击打中。空格近身投，抓住后的 7 帧内按空格可拆投，后方向 + 投可背投。跳跃起跳时确定水平速度，空中不能转向或冲刺。后走为前走的 65%；前冲 12 帧、速度 13，后撤 8 帧、速度 8。</p></div><div class="control-table"><div><b>行动</b><b>PLAYER 1</b><b>PLAYER 2</b></div>${actions.map(a=>`<div><span>${actionNames[a]}</span><kbd>${keyLabel(this.settings.keys[0][a])}</kbd><kbd>${keyLabel(this.settings.keys[1][a])}</kbd></div>`).join('')}</div><div class="manual-combos"><div><small>武器连段</small><p><kbd>J → K → L → 236J</kbd></p><span>命中后轻 → 中 → 重 → 人格技能；L 是上挑，可命中后按 W 跳跃取消，接空中 J → K → 236J。低空 I 跳入，落地接 J → K → 人格技能。普通技没有资源消耗。</span></div><div><small>空战与资源</small><p>每次跳跃可用一次空中人格技能。</p><span>空中同一普通技每跳一次，命中可向更重等级取消；空中攻击判定朝下延伸，落地有 4 帧收招。技能和 E.G.O. 消耗罪孽；手机六个武器按键支持搓招，点击「人格」展开快捷技能，空中自动切换为两招。</span></div></div><div class="notice-strip">Tab 招式表，Esc 暂停，F3 调试。P2 小键盘 1/2/3 主攻、4/5/6 副攻、0 E.G.O.、小数点冲刺、Enter 投。技能、帧数与连招为本作格斗化改编。</div>`;}
  private renderSettings(player:0|1=0){
    this.modal('终端设置','SYSTEM CONFIGURATION',`<div class="settings-grid"><section><h3>战斗与声音</h3><label class="setting-row">音效音量 <input id="volume-range" type="range" min="0" max="100" value="${this.settings.volume*100}"><span id="volume-value">${Math.round(this.settings.volume*100)}%</span></label><label class="setting-row">实时拼点<input id="clash-toggle" type="checkbox" ${this.settings.clash?'checked':''}></label><label class="setting-row">镜头震动 / 命中闪光<input id="effects-toggle" type="checkbox" ${this.settings.effects?'checked':''}></label><h3>触屏布局</h3><label class="setting-row">始终显示虚拟按键<input id="touch-toggle" type="checkbox" ${this.settings.touch?'checked':''}></label><label class="setting-row">按钮尺寸<input id="touch-size" type="range" min="70" max="130" value="${this.settings.touchSize*100}"></label><label class="setting-row">水平内缩<input id="touch-x" type="range" min="0" max="80" value="${this.settings.touchX}"></label><label class="setting-row">底部抬升<input id="touch-y" type="range" min="0" max="100" value="${this.settings.touchY}"></label><p class="muted">移动与攻击区按安全区定位，多点触控可同时按住方向与武器攻击。</p><button class="secondary-button" id="open-assets">素材管理与动画预览 ↗</button><button class="secondary-button settings-install" data-pwa-install>安装到手机 / 离线状态</button></section><section><div class="settings-keys-title"><h3>按键配置</h3><div class="small-tabs"><button id="keys-p1" class="${player===0?'active':''}">1P</button><button id="keys-p2" class="${player===1?'active':''}">2P</button></div></div><p class="muted">点击键位，再按下新按键。Esc 取消绑定。</p><div class="keybind-list">${actions.map(a=>`<div><span>${actionNames[a]}</span><button data-rebind="${a}"><kbd>${keyLabel(this.settings.keys[player][a])}</kbd></button></div>`).join('')}</div></section></div><div class="settings-footer"><span>设置自动保存至此设备</span><button class="secondary-button" id="reset-settings">恢复默认设置</button></div>`,'settings-modal');
    const checkbox=(id:string,key:'clash'|'effects'|'touch')=>document.getElementById(id)!.addEventListener('change',e=>{this.settings[key]=(e.target as HTMLInputElement).checked;this.applySettings();});checkbox('clash-toggle','clash');checkbox('effects-toggle','effects');checkbox('touch-toggle','touch');
    document.getElementById('volume-range')!.addEventListener('input',e=>{this.settings.volume=Number((e.target as HTMLInputElement).value)/100;document.querySelector('#volume-value')!.textContent=`${Math.round(this.settings.volume*100)}%`;this.applySettings();});
    for(const [id,key,divisor] of [['touch-size','touchSize',100],['touch-x','touchX',1],['touch-y','touchY',1]] as const)document.getElementById(id)!.addEventListener('input',e=>{this.settings[key]=Number((e.target as HTMLInputElement).value)/divisor;this.applySettings();});
    this.on('keys-p1',()=>this.renderSettings(0));this.on('keys-p2',()=>this.renderSettings(1));this.on('open-assets',()=>this.open('assets'));this.on('reset-settings',()=>{this.settings=structuredClone(defaults);this.applySettings();this.renderSettings(player);this.toast('已恢复默认设置');});
    document.querySelectorAll<HTMLButtonElement>('[data-rebind]').forEach(button=>button.addEventListener('click',()=>{
      const a=button.dataset.rebind as keyof typeof actionNames;button.innerHTML='<kbd>请按键…</kbd>';button.classList.add('listening');
      const handler=(e:KeyboardEvent)=>{e.preventDefault();e.stopImmediatePropagation();window.removeEventListener('keydown',handler,true);
        if(e.code!=='Escape'&&e.code!=='F3'){
          const duplicate=this.settings.keys.some((map,i)=>actions.some(other=>(i!==player||other!==a)&&map[other]===e.code));
          if(duplicate)this.toast('此按键已被其他操作占用');else{this.settings.keys[player][a]=e.code;this.applySettings();}
        }this.renderSettings(player);
      };window.addEventListener('keydown',handler,true);
    }));
  }
  private renderArchives(){
    this.modal('罪人档案','LCB PERSONNEL RECORDS',`<div class="archive-grid">${sinners.map(([number,id,name])=>{const found=identities.find(i=>i.sinner===id);return `<button class="archive-card ${found?'available':'locked'}" data-archive="${id}" ${found?'':'disabled'}><small>NO. ${number}</small>${found?`<img src="${this.image(found.id)}" alt="${name}像素人物">`:`<span class="unknown">?</span>`}<b>${name}</b><span>${found?'可出勤 / 7 搓招':'档案待解锁'}</span></button>`;}).join('')}</div><div class="notice-strip">当前可出勤：${playableIdentities.map(id=>id.name).join('、')}。十二位均可出勤，每位有独立特点与破绽。</div><div class="roster-comparison"><table><caption>十二罪人 · 选角与应对</caption><thead><tr><th>罪人 / LCB 武器</th><th>主打法</th><th>应对思路</th></tr></thead><tbody>${playableIdentities.map(id=>{const r=roles[id.sinner];return `<tr><th>${id.name}<small>${r.weapon}</small></th><td>${r.plan}</td><td>${r.answer}</td></tr>`;}).join('')}</tbody></table></div>`);
    document.querySelectorAll<HTMLElement>('[data-archive]').forEach(el=>el.addEventListener('click',()=>{this.p1=identities.find(i=>i.sinner===el.dataset.archive)!.id;this.selecting=0;this.open('select');}));
  }
  private renderAssets(){
    this.modal('素材与动画','ASSET WORKSHOP',`<div class="asset-workshop"><div class="asset-preview"><canvas id="asset-preview" width="640" height="320"></canvas><span id="preview-info">低分辨率人物 / 约 64 像素体高 / 36 姿势</span></div><div class="asset-form"><label>目标人格<select id="asset-character">${identities.map(id=>`<option value="${id.id}">${id.name} · ${id.title}</option>`).join('')}</select></label><label>人格动作预览<select id="persona-preview"><option value="base">LCB 基础动作</option>${playableIdentities.map(id=>`<option value="${id.sinner}-normals">${id.name} · 18 武器普通技</option>`).join('')}${personaArt.map(p=>`<option value="${p.key}">${playableIdentities.find(id=>id.sinner===p.sinner)?.name??p.sinner} · ${p.name}</option>`).join('')}</select></label><label>预览动作<select id="asset-state">${animationStates.map(s=>`<option>${s}</option>`).join('')}</select></label><label>PNG Sprite Sheet<input id="asset-file" type="file" accept="image/png"></label><label>可选 Aseprite JSON<input id="asset-json" type="file" accept="application/json,.json"></label><div class="frame-size"><label>帧宽<input id="frame-width" type="number" value="96" min="1" max="2048"></label><label>帧高<input id="frame-height" type="number" value="96" min="1" max="2048"></label><label>FPS<input id="asset-fps" type="number" value="10" min="1" max="60"></label></div><button class="primary-button" id="bind-asset">应用到目标人格 ${icon('arrow')}</button><p class="muted">等宽网格按行切片。Aseprite 使用与人物状态同名的 frameTags。素材只在本次会话中加载，刷新后恢复。</p></div></div>`,'settings-modal');
    const canvas=document.querySelector<HTMLCanvasElement>('#asset-preview')!,c=canvas.getContext('2d')!;let imported:HTMLImageElement|null=null;let fileURL='';let jsonURL='';let jsonData:Record<string,unknown>|null=null;const start=performance.now();
    const val=(id:string)=>document.querySelector<HTMLInputElement>(`#${id}`)!.value;
    document.querySelector('#asset-file')!.addEventListener('change',e=>{const f=(e.target as HTMLInputElement).files?.[0];if(!f)return;if(fileURL)URL.revokeObjectURL(fileURL);fileURL=URL.createObjectURL(f);const img=new Image();img.onload=()=>{imported=img;this.toast('PNG 已加载，可预览并应用');};img.onerror=()=>this.toast('无法解码 PNG');img.src=fileURL;});
    document.querySelector('#asset-json')!.addEventListener('change',async e=>{const f=(e.target as HTMLInputElement).files?.[0];if(!f)return;try{jsonData=JSON.parse(await f.text());if(jsonURL)URL.revokeObjectURL(jsonURL);jsonURL=URL.createObjectURL(f);this.toast('JSON 已加载');}catch{this.toast('JSON 格式无效');}});
    const tick=()=>{if(this.overlay!=='assets'){if(fileURL)URL.revokeObjectURL(fileURL);if(jsonURL)URL.revokeObjectURL(jsonURL);return;}const now=performance.now();const fw=Math.max(1,Number(val('frame-width'))||96),fh=Math.max(1,Number(val('frame-height'))||96),fps=Math.max(1,Number(val('asset-fps'))||10);const frame=Math.floor((now-start)/1000*fps);c.imageSmoothingEnabled=false;c.fillStyle='#20292c';c.fillRect(0,0,640,320);c.strokeStyle='#2d383a';for(let x=0;x<640;x+=24){c.beginPath();c.moveTo(x,0);c.lineTo(x,320);c.stroke();}for(let y=0;y<320;y+=24){c.beginPath();c.moveTo(0,y);c.lineTo(640,y);c.stroke();}c.fillStyle='#758079';c.fillRect(0,278,640,1);
      if(imported){const cols=Math.floor(imported.width/fw),rows=Math.floor(imported.height/fh),count=cols*rows;if(count>0){const f=frame%count,scale=Math.min(4,240/fh);c.drawImage(imported,(f%cols)*fw,Math.floor(f/cols)*fh,fw,fh,320-fw*scale/2,278-fh*scale,fw*scale,fh*scale);document.querySelector('#preview-info')!.textContent=`${imported.width} × ${imported.height} / ${fw} × ${fh} / ${count} 帧 / 当前 ${f+1}`;}}
      else{const id=getIdentity(val('asset-character')),state=val('asset-state');const index=state==='idle'?0:state==='run'||state==='dash'?6+frame%6:state==='attack'?12+frame%6:({jump:18,fall:19,hit:20,guard:21,block:21,crouch:21,down:22,ko:22,win:23,rise:18} as Record<string,number>)[state]??0;const persona=val('persona-preview');const texture=this.scene.textures.get(persona==='base'?`${id.sinner}-premium`:persona);const f=texture.get(persona==='base'?index:frame%(persona.endsWith('-normals')?18:6));document.querySelector('#preview-info')!.textContent=persona==='base'?'LCB / 64 像素体高 / 待机固定姿势':persona.endsWith('-normals')?'武器普通技 / 站、蹲、空中各 6 种 / 约 64 像素体高':`${personaArt.find(p=>p.key===persona)?.name} / 6 个专属姿势 / 约 64 像素体高`;c.drawImage(texture.getSourceImage() as CanvasImageSource,f.cutX,f.cutY,f.cutWidth,f.cutHeight,-16,-65,672,384);}requestAnimationFrame(tick);};requestAnimationFrame(tick);
    this.on('bind-asset',()=>{if(!imported||!fileURL){this.toast('请先选择 PNG Sprite Sheet');return;}const fw=Number(val('frame-width')),fh=Number(val('frame-height'));if(fw<1||fh<1||fw>imported.width||fh>imported.height){this.toast('帧尺寸超出图片范围');return;}const key=`import-${Date.now()}`,identity=getIdentity(val('asset-character')),fps=Math.max(1,Math.min(60,Number(val('asset-fps'))||10));
      const scene=this.scene;
      scene.load.once('complete',()=>{try{if(jsonURL&&jsonData){AssetManager.defineAsepriteAnimations(scene,key);}else{const count=Math.floor(imported!.width/fw)*Math.floor(imported!.height/fh);for(const state of animationStates)scene.anims.create({key:`${key}:${state}`,frames:scene.anims.generateFrameNumbers(key,{start:0,end:count-1}),frameRate:fps,repeat:-1});}AssetManager.bindIdentity(identity,key,Math.min(4,200/fh));this.toast(`已应用到 ${identity.name} · ${identity.title}`);}catch{this.toast('导入失败，请检查 PNG 与 JSON 是否匹配');}});
      if(jsonURL&&jsonData)scene.load.aseprite(key,fileURL,jsonURL);else scene.load.spritesheet(key,fileURL,{frameWidth:fw,frameHeight:fh});scene.load.start();
    });
  }
}
