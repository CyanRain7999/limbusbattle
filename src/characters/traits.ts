import type {Fighter} from '../combat/Fighter';

export const traits:Record<string,{name:string;description:string;weakness:string;route:string}>={
  faust:{name:'虚实 · 重剑诈势',description:'地面重普通技前摇中，按后方向 + 冲刺可取消为后撤，消耗 12 罪孽，冷却 1.5 秒。用重剑假动作诱出反击，再抓空挥。',weakness:'只在重普通技前摇可用，有效帧后不能撤回；后撤无敌为零，受压时不能取消硬直。',route:'重攻击诈势 → 后 + Shift → 对手空挥 → 大剑确认；J → K → L → 236J'},
  hong:{name:'游龙 · 命中滑步',description:'武器普通技实际命中后 24 帧内，按前方向 + 冲刺可取消为短前滑，消耗 8 罪孽，每条连段一次；可继续武器攻击或人格技。',weakness:'空挥和被防住时不能滑步，无敌为零、不能穿过对手；过度逼近会失去长柄刀间距。',route:'J → K → 前 + Shift → J → K → 236J；滑步用来调整后续距离'},
  sin:{name:'破限 · 以血续势',description:'地面人格技能实际命中后，可支付额外 60 体力取消到另一种地面人格技，每条连段一次。仍消耗技能罪孽并遵守冷却，不能同招反复取消。',weakness:'体力不足 61 时不能续势；防住、空挥、空中均不能触发。续招不保证任意组合都是真连，收招与生命代价都需要取舍。',route:'J → K → L → 214K → 623L；第二个人格技额外支付体力'},
  yi:{name:'镜痕 · 布置控场',description:'623J 在前方固定位置留下 3.5 秒镜痕。下一次地面人格技能进入有效帧时消耗镜痕，在原地延迟 12 帧追击；镜痕最多一个。',weakness:'布置有前摇，追击位置固定，对手可用跳跃或走位避开；贴身受压时难以布置。',route:'623J 布置 → 匕首逼近 → J → K → L → 623L 触发追击'},
  outis:{name:'火力 · 有限魔弹',description:'魔弹初始 3 发，地面 / 空中共用。空仓时再次使用地面魔弹会装填，完成前可被打断；曲刀与其他人格技不耗弹。',weakness:'空中不能装填，装填期间无法防守。要用曲刀截击逼近者，给自己留出补弹空档。',route:'魔弹限制路线 → J → K → L → 214K；空仓时在安全距离 236J 装填'},
  greg:{name:'展臂 · 距离与破绽',description:'地面重虫臂普通技可按住对应攻击键蓄力，最多 18 帧，增加攻击距离。手臂伸出及收回的前段可被对手打中。',weakness:'伸臂更远也会扩大受击范围，空挥容易被打手；松键即可提前释放，不能一直安全压制。',route:'短爪 J → K → L → 214K；中距离蓄力 O，命中后接人格技'},
  don:{name:'枪尖 · 迅袭',description:'长枪普通技外侧 35% 命中时，伤害 +15%、硬直 +4 帧。前冲和长枪推进擅长把对手留在枪尖。',weakness:'贴身时失去枪尖加成，空挥长枪会暴露收招。',route:'J → K → L → 236J；L → W → 空中 J → K → 236J'},
  heath:{name:'怒意 · 重击',description:'受到有效伤害积累怒意，最多 3 层，4 秒未再受击消退。下次重普通技或人格必杀接触对手时，每层伤害 +8%、架势削减 +15%，随后消耗。',weakness:'移动较慢，怒意不会减少自己受到的伤害；要把受压机会转成一次可靠重击。',route:'J → K → L → 214K；低空 I → J → K → 214K'},
  ryoshu:{name:'见切 · 抓破绽',description:'命中对手攻击收招时触发见切：该击伤害 +20%、硬直 +6 帧。较快的刀鞘与踏步人格技适合差合确反。',weakness:'生命较低；依赖观察对手的空挥，乱出长招容易被反打。',route:'J → K → L → 623L；蹲 U → 蹲 I → 236K'},
  meur:{name:'稳固 · 擒投',description:'成功格挡积累稳固，最多 3 层。下次普通投或指令投成功时，每层增加 20 基础伤害并消耗；普通投范围比其他罪人更远。',weakness:'步行慢、普通技射程短。指令投不能抓空中与受击硬直，必须先逼对手留在地面。',route:'J → K → L → 214K；挡住后逼近，用空格或 236K 抓防守'},
  ish:{name:'盾反 · 截浪',description:'成功格挡后 90 帧内，下次普通技或人格攻击前摇缩短 2 帧、伤害 +15%。盾锤短打、重剑架势和鱼叉控距形成攻守转换。',weakness:'盾反只强化一次，出手落空也会消耗；后拉防守仍会被投与下段克制。',route:'盾反后 J → K → L → 236J；蹲 U → 蹲 I → 214L'},
  rod:{name:'豪赌 · 破阵',description:'同一连段用不同普通技命中可各积累一层赌势，最多 3 层。满层后的下一个地面人格必杀消耗赌势，伤害 +25%、架势削减 ×1.8。',weakness:'重斧起手和终结收招较长；强化招式空挥也会失去赌势。',route:'J → K → L → 236J；蹲 U → 蹲 I → L → 人格必杀'}
};

export function traitText(f:Fighter){
  switch(f.identity.sinner){
    case 'faust':return f.traitTimer>0?`诈势冷却 ${(f.traitTimer/60).toFixed(1)}s`:'虚实 · 重前摇 后+冲刺 / 12罪孽';
    case 'hong':return f.traitUsed.has('flow')?'游龙 · 本连段已用':f.traitTimer>0?'游龙可用 · 前+冲刺 / 8罪孽':'游龙 · 武器命中后可滑步';
    case 'sin':return f.traitUsed.has('blood-link')?'破限 · 本连段已用':f.hp<=60?'破限 · 体力不足':f.hitConfirmed&&f.attack?.source?'破限可用 · 不同人格 / 60体力':'破限 · 人格命中后续招';
    case 'yi':return f.mirror?`镜痕 ${(f.mirror.life/60).toFixed(1)}s · 人格触发`:'镜痕 · 623J 布置';
    case 'outis':return f.ammo?`魔弹 ${'◆'.repeat(f.ammo)}${'◇'.repeat(3-f.ammo)}`:'魔弹空仓 · 地面236J装填';
    case 'greg':return f.attack?.limb?`展臂 ${Math.round(f.limbCharge/18*100)}% · 伸臂可被打`:'展臂 · 按住地面重攻击蓄力';
    case 'heath':return `怒意 ${'◆'.repeat(f.traitCount)}${'◇'.repeat(3-f.traitCount)}`;
    case 'meur':return `稳固 ${'◆'.repeat(f.traitCount)}${'◇'.repeat(3-f.traitCount)}`;
    case 'ish':return f.traitTimer>0?`盾反可用 ${(f.traitTimer/60).toFixed(1)}s`:'盾反 · 格挡后强化';
    case 'rod':return `赌势 ${'◆'.repeat(f.traitCount)}${'◇'.repeat(3-f.traitCount)}`;
    case 'ryoshu':return f.traitTimer>0?'见切 · 确反命中':'见切 · 狙击收招';
    default:return f.traitTimer>0?'枪尖 · 精准命中':'枪尖 · 外侧命中强化';
  }
}
