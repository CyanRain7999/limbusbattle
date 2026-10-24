import type {Fighter} from '../combat/Fighter';

export const traits:Record<string,{name:string;description:string;weakness:string;route:string}>={
  don:{name:'枪尖 · 迅袭',description:'长枪普通技外侧 35% 命中时，伤害 +15%、硬直 +4 帧。前冲和长枪推进擅长把对手留在枪尖。',weakness:'贴身时失去枪尖加成，空挥长枪会暴露收招。',route:'J → K → L → 236J；L → W → 空中 J → K → 236J'},
  heath:{name:'怒意 · 重击',description:'受到有效伤害积累怒意，最多 3 层，4 秒未再受击消退。下次重普通技或人格必杀接触对手时，每层伤害 +8%、架势削减 +15%，随后消耗。',weakness:'移动较慢，怒意不会减少自己受到的伤害；要把受压机会转成一次可靠重击。',route:'J → K → L → 214K；低空 I → J → K → 214K'},
  ryoshu:{name:'见切 · 抓破绽',description:'命中对手攻击收招时触发见切：该击伤害 +20%、硬直 +6 帧。较快的刀鞘与踏步人格技适合差合确反。',weakness:'生命较低；依赖观察对手的空挥，乱出长招容易被反打。',route:'J → K → L → 623L；蹲 U → 蹲 I → 236K'},
  meur:{name:'稳固 · 擒投',description:'成功格挡积累稳固，最多 3 层。下次普通投或指令投成功时，每层增加 20 基础伤害并消耗；普通投范围比其他罪人更远。',weakness:'步行慢、普通技射程短。指令投不能抓空中与受击硬直，必须先逼对手留在地面。',route:'J → K → L → 214K；挡住后逼近，用空格或 236K 抓防守'},
  ish:{name:'盾反 · 截浪',description:'成功格挡后 90 帧内，下次普通技或人格攻击前摇缩短 2 帧、伤害 +15%。盾锤短打、重剑架势和鱼叉控距形成攻守转换。',weakness:'盾反只强化一次，出手落空也会消耗；后拉防守仍会被投与下段克制。',route:'盾反后 J → K → L → 236J；蹲 U → 蹲 I → 214L'},
  rod:{name:'豪赌 · 破阵',description:'同一连段用不同普通技命中可各积累一层赌势，最多 3 层。满层后的下一个地面人格必杀消耗赌势，伤害 +25%、架势削减 ×1.8。',weakness:'重斧起手和终结收招较长；强化招式空挥也会失去赌势。',route:'J → K → L → 236J；蹲 U → 蹲 I → L → 人格必杀'}
};

export function traitText(f:Fighter){
  switch(f.identity.sinner){
    case 'heath':return `怒意 ${'◆'.repeat(f.traitCount)}${'◇'.repeat(3-f.traitCount)}`;
    case 'meur':return `稳固 ${'◆'.repeat(f.traitCount)}${'◇'.repeat(3-f.traitCount)}`;
    case 'ish':return f.traitTimer>0?`盾反可用 ${(f.traitTimer/60).toFixed(1)}s`:'盾反 · 格挡后强化';
    case 'rod':return `赌势 ${'◆'.repeat(f.traitCount)}${'◇'.repeat(3-f.traitCount)}`;
    case 'ryoshu':return f.traitTimer>0?'见切 · 确反命中':'见切 · 狙击收招';
    default:return f.traitTimer>0?'枪尖 · 精准命中':'枪尖 · 外侧命中强化';
  }
}
