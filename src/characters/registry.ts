import raw from '../data/identities.json';
import expansion from '../data/expansion-identities.json';
import type { Identity } from '../core/types';
import { equipSkills } from '../skills/catalog';
import { addNormals } from './normals';

const base = [...raw,...expansion] as unknown as Identity[];
const alternate = (source: Identity, id: string, title: string, color: string, hp: number, speed: number): Identity => ({
  ...source, id, title, color, hp, speed, rarity: '000',
  description: source.sinner === 'don' ? 'W 公司清理人员。以充能斩击撕开空间，用更远的突进换取更高的资源消耗。' : '荒野的回声。以更高的生命与威力，交换移动速度；重击附加破裂。',
  moves: Object.fromEntries(Object.entries(source.moves).map(([key, move]) => [key, {
    ...move, box: { ...move.box, w: Math.round(move.box.w * 1.1) },
    name: key==='special'?(source.sinner==='don'?'空间切断':'荒野回响'):key==='heavy'?(source.sinner==='don'?'充能升斩':'风暴重锤'):move.name,
    lunge: move.lunge+(key==='special'&&source.sinner==='don'?1.5:0),
    damage: Math.round(move.damage * 1.08), cost: move.cost ? move.cost + 3 : 0,
    startup: Math.max(3, move.startup + (source.sinner === 'don' ? -1 : 2)),
    status: key === 'special' ? (source.sinner === 'don' ? 'burn' : 'rupture') : move.status
  }]))
});
export const identities: Identity[] = [...base,
  alternate(base[0], 'don-w', 'W 公司 · 清理人员', '#7eced6', 950, 5.8),
  alternate(base[1], 'heath-wild', '荒野 · 流浪者', '#d29d82', 1250, 3.6)
].map(id=>equipSkills(addNormals(id)));
export const playableIdentities=identities.filter(i=>i.id.endsWith('-lcb'));
export const playableSinners=playableIdentities.map(i=>i.sinner);
export const sinners = [
  ['01','yi','李箱'], ['02','faust','浮士德'], ['03','don','堂吉诃德'], ['04','ryoshu','良秀'],
  ['05','meur','默尔索'], ['06','hong','鸿璐'], ['07','heath','希斯克利夫'], ['08','ish','以实玛利'],
  ['09','rod','罗佳'], ['11','sin','辛克莱'], ['12','outis','奥提斯'], ['13','greg','格里高尔']
];
export const getIdentity = (id: string) => identities.find(i => i.id === id) ?? identities[0];
