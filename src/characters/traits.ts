import type {Fighter} from '../combat/Fighter';

export const traits:Record<string,{name:string;description:string;weakness:string;route:string}>={
  faust:{name:'虚实 · 重剑与人格诈势',description:'地面重普通技，以及多裂纹 / 黑兽 / 环指人格前摇，可按后+冲刺支付12罪孽撤回，冷却90帧。大刃与双刀有真实内侧空隙，必须先控距。',weakness:'有效帧、受击、空中不能诈势；原技能费用不返还，后撤无敌为零。对手可贴内侧或等收招。',route:'22J / 236K / 214L 前摇 → 后+Shift诈势；骗空挥后重剑确认'},
  hong:{name:'游龙 · 拉推换距',description:'普通技实际命中后24帧内前+冲刺，8罪孽滑步，每连段一次。S绳刃拉近，Cinq掌法推远，K双端杖实际命中修复65体力一次。',weakness:'防住或空挥不能滑步和修复；滑步没有无敌。鸿园长柄近身有柄部空隙。',route:'J → K → 前+Shift → 236J；236K拉回 / 214L推远，按距离换招'},
  sin:{name:'破限 · 贴符与献血',description:'朱符人格实际命中贴2枚符，最多5枚；细剑、小指、赤红和LCB戟挑可引符，每枚加14基础伤害。地面人格命中后另付60体力续不同人格，每连段一次。',weakness:'赤红发动另付80体力，和续势费用合计；体力不够则不发动。防住不贴符、不引符、不续势。',route:'214K贴符 → 623L引符；血续势可直接连接，血少时避免赤红'},
  yi:{name:'镜痕 · 定点控场',description:'623J在前方固定位置留下3.5秒镜痕，下一地面人格触发原位延迟追击。花扇退守、双枪封线、W短刀进场与关刀外缘清场各有分工。',weakness:'布置前摇可抢；追击位置固定，可跳跃或离开镜位。关刀近身内侧为空隙。',route:'623J布置 → 双枪封线 / 花扇退守 → 短刃切入或623L截空触发镜痕'},
  outis:{name:'火力 · 弹药与封地',description:'魔弹地空共3发，空仓地面再用改为可打断装填。214L在前方定点布时间陷阱，18帧激活、停留2.5秒，踩中后减速。',weakness:'陷阱只扫地面，可以跳过；空中不能装填。近身可钻剪刃内侧，逼她改用曲刀。',route:'214L封地 → 236J封中线 → 退枪找装填空档；贴身用双刃突围'},
  greg:{name:'展臂 · 距离与血量',description:'地面重虫臂可按住蓄18帧，加65射程，伸出的手也能被打。牧师236K发动支付70体力，实际命中修复115体力一次；退身长刺可诱对手追空。',weakness:'空挥或防住汲取会亏70体力，生命不足不能发动；长臂可被打手，收臂不能一直安全。',route:'蓄O控距 → 214L电极截路；236K付血赌汲取，22J退身长刺'},
  don:{name:'枪尖 · 突入与撤回',description:'长枪外侧35%命中伤害+15%、硬直+4。Cinq是胸口窄线突进后撤回，T技能命中夺走步行和冲刺速度，女王光束远程封线。',weakness:'贴身失去枪尖加成；细剑与光束可跳过，长枪空挥可抓收招。',route:'枪尖J确认 → K → L → 236J；623L差合撤回，623J升枪后可跳跃追击'},
  heath:{name:'怒意 · 蓄势送墙',description:'挨打积怒最多3层，下次重普通技或人格接触消耗。中指22J后可按住J蓄势再松开，半蓄以上能撞墙；狂猎和球棒重砸也能送墙反弹一次。',weakness:'蓄力仍可被投，怒意不减伤，4秒不受击消退；远离墙角能削弱重击收益。',route:'22J按住J → 松开送墙；J → K → L → 214K；黑云两刀下段后中段'},
  ryoshu:{name:'见切 · 撤进诱空',description:'刀鞘U收招退步，女仆短刀快进，鞋履技能低身滑入。命中对手收招触发见切：伤害+20%、硬直+6。齿轮落击命中后有定点余震。',weakness:'低身滑入可被下段和投抓；节刃身边有空隙，霰弹仅短程，乱挥会被反打。',route:'U撤步诱空 → 623L清扫确反；214L低身滑入，214K砸地余震'},
  meur:{name:'稳固 · 架拳与投择',description:'格挡或架拳攒3层稳固，成功投每层加20伤害。六协与LCB架拳可接正面中上段近身打击，随后在短打与拉曼却指令投之间选择。',weakness:'架拳消耗架势，下段、投、背后、弹道能突破。指令投不能抓空中或受击硬直，必须等对手能行动。',route:'236J架拳逼停 → 短打 / 236K投择；远处用214L鸟枪独头弹'},
  ish:{name:'截浪 · 盾返与牵引',description:'格挡后90帧内下一攻击前摇-2、伤害+15%。二协架势可读时机返正面弹道，LCB盾迎有6帧返弹窗；鱼叉拉近，电锤留地面，扇子末击扫下盘。',weakness:'返弹道要对准窗口和方向；投、下段、假压制克制防守，鱼叉窄线可跳过。',route:'22J读弹返还 → 623L鱼叉拉近 → 盾锤压制；236K扇子末击低扫'},
  rod:{name:'豪赌 · 破阵与汲血',description:'同一连段不同普通技攒3层，下一地面人格伤害+25%、削架势×1.8。N锤中段压头并留余震；紫伞实际命中回血75一次，拇指剑逐节伸远。',weakness:'慢重斧可抓收招；站防落锤、跳开余震，防住紫伞不给回血；强化空挥也会耗掉赌势。',route:'不同普通技攒势 → 236J落锤余震；623L紫伞汲血，214L延刃控远'},
};

export function traitText(f:Fighter){
  switch(f.identity.sinner){
    case 'faust':return f.traitTimer>0?`诈势冷却 ${(f.traitTimer/60).toFixed(1)}s`:'虚实 · 重前摇 后+冲刺 / 12罪孽';
    case 'hong':return f.traitUsed.has('flow')?'游龙 · 本连段已用':f.traitTimer>0?'游龙可用 · 前+冲刺 / 8罪孽':'游龙 · 武器命中后可滑步';
    case 'sin':return f.traitUsed.has('blood-link')?'破限 · 本连段已用':f.hp<=60?'破限 · 体力不足':f.hitConfirmed&&f.attack?.source?'破限可用 · 不同人格 / 60体力':'破限 · 人格命中后续招';
    case 'yi':return f.mirror?`镜痕 ${(f.mirror.life/60).toFixed(1)}s · 人格触发`:'镜痕 · 623J 布置';
    case 'outis':return f.ammo?`魔弹 ${'◆'.repeat(f.ammo)}${'◇'.repeat(3-f.ammo)}`:'魔弹空仓 · 地面236J装填';
    case 'greg':return f.attack?.limb?`展臂 ${Math.round(f.limbCharge/18*100)}% · 伸臂可被打`:'展臂 · 按住地面重攻击蓄力';
    case 'heath':return f.attack?.charge&&f.moveCharge?`中指蓄势 ${Math.round(f.moveCharge/f.attack.charge.frames*100)}% · 松J出拳`:`怒意 ${'◆'.repeat(f.traitCount)}${'◇'.repeat(3-f.traitCount)}`;
    case 'meur':return `稳固 ${'◆'.repeat(f.traitCount)}${'◇'.repeat(3-f.traitCount)}`;
    case 'ish':return f.traitTimer>0?`盾反可用 ${(f.traitTimer/60).toFixed(1)}s`:'盾反 · 格挡后强化';
    case 'rod':return `赌势 ${'◆'.repeat(f.traitCount)}${'◇'.repeat(3-f.traitCount)}`;
    case 'ryoshu':return f.traitTimer>0?'见切 · 确反命中':'见切 · 狙击收招';
    default:return f.traitTimer>0?'枪尖 · 精准命中':'枪尖 · 外侧命中强化';
  }
}
