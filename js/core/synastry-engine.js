/* 合盘引擎：人格适配度 + 星盘合盘（synastry）
   两层都可独立成立：没有人格数据时只用星盘，没有出生信息时只用类型。
   所有「度数级」结论来自 A 级实算，关系解读属 B/C 级理论。 */
(function (root) {
  'use strict';

  const A = () => root.Astro;
  const TXT = () => root.ASTRO_TEXT;
  const T = () => root.TransitEngine;

  const DIM_NAME = { EI: '能量来源', SN: '信息通道', TF: '决策依据', JP: '节奏与结构' };
  const DIM_LETTER = { E: '外倾', I: '内倾', S: '实感', N: '直觉', T: '思考', F: '情感', J: '判断', P: '感知' };

  /* ---------------- 一、类型适配度 ---------------- */
  function typeMatch(codeA, codeB) {
    if (!codeA || !codeB) return null;
    const a = codeA.split(''), b = codeB.split('');
    const dims = ['EI', 'SN', 'TF', 'JP'];
    let score = 0;
    const rows = [];

    const same = { EI: a[0] === b[0], SN: a[1] === b[1], TF: a[2] === b[2], JP: a[3] === b[3] };
    const w = {
      SN: [36, 16], TF: [24, 15], JP: [20, 8], EI: [10, 12]
    };
    dims.forEach((d, i) => {
      score += same[d] ? w[d][0] : w[d][1];
      rows.push({ dim: d, name: DIM_NAME[d], a: a[i], b: b[i], same: same[d] });
    });

    /* 功能栈互补 */
    let stackBonus = 0;
    let stackNote = '';
    const FS = root.MBTI_FUNCTIONS;
    if (FS && FS.stacks && FS.stacks[codeA] && FS.stacks[codeB]) {
      const sa = FS.stacks[codeA], sb = FS.stacks[codeB];
      if (sa[0] === sb[1] || sb[0] === sa[1]) {
        stackBonus = 9;
        stackNote = `一方的主导功能 ${sa[0]} 正好是另一方的前两位功能之一，这种「同一个频道、不同使用强度」的组合最容易互相听懂。`;
      } else if (sa[0] === sb[0]) {
        stackBonus = 4;
        stackNote = `主导功能同为 ${sa[0]}：价值观的底层一致，争执通常发生在「怎么表达」而不是「要什么」。`;
      } else if (sa[0] === sb[3] || sb[0] === sa[3]) {
        stackBonus = 6;
        stackNote = `一方的主导功能（${sa[0] === sb[3] ? sa[0] : sb[0]}）是另一方最不熟悉的那一项：互补性最强，也最容易把对方当成「不认真」。`;
      } else {
        stackBonus = 3;
        stackNote = '功能栈没有直接重合，好处是视角互补，代价是缺少共同的默认语言。';
      }
    }
    score += stackBonus;
    score = Math.max(12, Math.min(97, score));

    const band = score >= 78 ? { label: '高适配', tone: 'green' }
      : score >= 62 ? { label: '中高，需约定规则', tone: 'green' }
        : score >= 46 ? { label: '中等，靠磨合', tone: 'warn' }
          : { label: '高摩擦，需要明确边界', tone: 'rose' };

    /* 逐维度出一条人话 */
    const notes = [];
    const dense = {
      SN: {
        same: 'SN',
        txt: same.SN
          ? (a[1] === 'S' ? '两人都在实感侧：讲具体的事、具体的做法、具体的时间，沟通很少跑偏，但也容易一起忽略「这件事长期意味着什么」。' : '两人都在直觉侧：聊模式、聊可能性、聊意义很顺，一起做长期判断很合拍，但落到具体执行容易谁都不想碰细节。')
          : '一人看事实、一人看可能：一方要例子，一方要原理。这不是谁不认真，是两套信息通道。争论时先给结论与例子，再谈想象，顺序反了就会各说各话。'
      },
      TF: {
        txt: same.TF
          ? (a[2] === 'T' ? '两人都优先讲道理：分歧能靠标准解决，效率高；代价是情绪容易积压到一次性爆发。' : '两人都优先照顾感受：共情充足，冲突少；代价是没人愿意当那个说「不行」的人。')
          : '一人要方案、一人要被理解：F 侧的人在情绪里需要先被接住，T 侧的人在问题里需要先被解决。最有效的做法是先接住三句话，再谈解决办法，顺序错了会被读成冷漠。'
      },
      JP: {
        txt: same.JP
          ? (a[3] === 'J' ? '两人都要确定：计划、分工、时间点都能对齐，执行强；代价是临时变动会让两个人一起炸。' : '两人都能接受变化：弹性大、不较劲；代价是没人负责推进，事情常在最后一刻赶。')
          : '一人要提前定好、一人要留余地：这是关系里最常见的摩擦源，与爱不爱无关。做法是把「必须定」和「可以变」分成两类事，别在同一件事上拉锯。'
      },
      EI: {
        txt: same.EI
          ? (a[0] === 'E' ? '两人电量都偏外：一起出门容易，安静相处反而需要练习。' : '两人电量都偏内：安静相处是默认状态，但要留意两个人都等对方先开口。')
          : '一人靠人充电、一人靠独处充电：约的时候要区分「一起安静」和「各自消失」，前者是陪伴，后者是恢复，不是冷淡。'
      }
    };
    ['SN', 'TF', 'JP', 'EI'].forEach(d => {
      notes.push(dense[d].txt);
    });

    const conflicts = [];
    if (!same.JP) conflicts.push('时间观：提前定 vs 到时候看。具体做法是重要事项提前 48 小时确认，其余事项允许临时改。');
    if (!same.TF) conflicts.push('冲突处理：一方要答案、一方要共情。约定「先说三句感受，再说办法」能砍掉一半误读。');
    if (!same.SN && !same.JP) conflicts.push('执行层：抽象共识容易达成，落地容易各做各的。把「谁在哪天交什么」写成一句话即可。');
    if (same.EI && a[0] === 'I') conflicts.push('沉默螺旋：两人都偏内，问题容易被「算了吧」盖住。约定每周一次十分钟的直说时段。');

    return {
      score, band, rows, notes, conflicts, stackNote,
      codeA, codeB,
      headline: `${codeA} × ${codeB}：${band.label}（${score} 分）`
    };
  }

  /* ---------------- 二、星盘合盘 ---------------- */
  const ASPECT_W = { 合相: 6, 三分相: 7, 六分相: 5, 四分相: -7, 冲相: -5 };
  const PAIR_OVERRIDE = {
    'sun|moon': { 合相: 11, 三分相: 9, 六分相: 6, 四分相: -3, 冲相: 5 },
    'moon|moon': { 合相: 9, 三分相: 8, 六分相: 5, 四分相: -5, 冲相: -2 },
    'venus|mars': { 合相: 10, 三分相: 8, 六分相: 6, 四分相: 2, 冲相: 6 },
    'sun|saturn': { 合相: -6, 三分相: 3, 六分相: 2, 四分相: -8, 冲相: -7 },
    'moon|saturn': { 合相: -5, 三分相: 3, 六分相: 2, 四分相: -8, 冲相: -6 },
    'venus|pluto': { 合相: 4, 三分相: 5, 六分相: 3, 四分相: -6, 冲相: -4 }
  };
  const BODY_KEY = { sun: '核心自我', moon: '情绪需求', mercury: '表达方式', venus: '亲密与审美', mars: '行动与欲望', jupiter: '扩张与信心', saturn: '责任与边界', uranus: '自由与变动', neptune: '共情与模糊', pluto: '深层控制' };
  const BODY_CN = { sun: '太阳', moon: '月亮', mercury: '水星', venus: '金星', mars: '火星', jupiter: '木星', saturn: '土星', uranus: '天王星', neptune: '海王星', pluto: '冥王星' };

  function orbFor(pa, pb) {
    const lum = ['sun', 'moon'].includes(pa) && ['sun', 'moon'].includes(pb);
    return lum ? 7 : 4.5;
  }

  function chartMatch(chartA, chartB) {
    if (!chartA || !chartB) return null;
    const defs = A().ASPECT_DEFS.filter(d => ['合相', '三分相', '六分相', '四分相', '冲相'].includes(d.name));
    const contacts = [];

    chartA.rows.forEach(ra => {
      chartB.rows.forEach(rb => {
        const orb = orbFor(ra.id, rb.id);
        let best = null;
        defs.forEach(def => {
          const sep = Math.abs(T().norm180(rb.lon - ra.lon));
          const diff = Math.abs(sep - def.angle);
          if (diff <= orb && (!best || diff < best.diff)) best = { def, diff, sep };
        });
        if (!best) return;
        const name = best.def.name;
        const key1 = ra.id + '|' + rb.id, key2 = rb.id + '|' + ra.id;
        const ov = PAIR_OVERRIDE[key1] || PAIR_OVERRIDE[key2] || null;
        const weight = (ov && ov[name] != null) ? ov[name] : (ASPECT_W[name] || 0);
        const harmony = ['三分相', '六分相'].includes(name);
        contacts.push({
          aId: ra.id, bId: rb.id,
          a: BODY_CN[ra.id], b: BODY_CN[rb.id],
          name, symbol: best.def.symbol || '',
          orb: best.diff, weight,
          applying: false,
          text: `你的${BODY_KEY[ra.id]}遇到对方的${BODY_KEY[rb.id]}，以${name}相接。${harmony ? '这一条是顺的：同一件事两个人不需要翻译就能接上。' : (name === '合相' ? '这一条是「黏在一起」：容易共振，也容易把对方的问题当成自己的。' : '这一条是拉扯的：它带来吸引力，也带来反复消耗同一个点。')}`
        });
      });
    });

    contacts.sort((x, y) => Math.abs(y.weight) - Math.abs(x.weight));

    /* 宫位叠加：A 的行星落进 B 的宫（同一宫合并成一条，避免重复读） */
    const HW = { sun: 4, moon: 4, venus: 3, mars: 3, mercury: 2, jupiter: 2, saturn: 2, uranus: 1, neptune: 1, pluto: 1 };
    const byHouse = {};
    chartA.rows.forEach(r => {
      if (!HW[r.id]) return;
      const h = A().houseOf(r.lon, chartB.houses.cusps);
      if (!byHouse[h]) byHouse[h] = { house: h, planets: [], weight: 0 };
      byHouse[h].planets.push(BODY_CN[r.id]);
      byHouse[h].weight += HW[r.id];
    });
    const overlays = Object.keys(byHouse).map(k => {
      const o = byHouse[k];
      return {
        house: o.house,
        planets: o.planets,
        weight: o.weight,
        text: `你的${o.planets.join('、')}落在对方第 ${o.house} 宫（${TXT().houses[o.house]}）：这是你在他生活里最容易被感知到的位置。`
      };
    }).sort((x, y) => y.weight - x.weight);

    let raw = 0;
    const useN = Math.min(12, contacts.length);
    for (let i = 0; i < useN; i++) raw += contacts[i].weight;
    const avg = useN ? raw / useN : 0;
    const score = Math.max(15, Math.min(92, Math.round(50 + avg * 4)));

    const sunMoon = contacts.find(c => (c.aId === 'sun' && c.bId === 'moon') || (c.aId === 'moon' && c.bId === 'sun'));
    const venusMars = contacts.find(c => (c.aId === 'venus' && c.bId === 'mars') || (c.aId === 'mars' && c.bId === 'venus'));
    const hard = contacts.filter(c => c.weight < 0).slice(0, 3);

    return {
      score,
      band: score >= 78 ? '高适配' : score >= 62 ? '中高' : score >= 46 ? '中等' : '高摩擦',
      contacts: contacts.slice(0, 10),
      overlays: overlays.slice(0, 5),
      sunMoon, venusMars, hard,
      summary: [
        sunMoon ? `太阳—月亮${sunMoon.name}（误差 ${sunMoon.orb.toFixed(1)}°）：这是关系里的「被认出」通道，${sunMoon.weight > 0 ? '对方很容易自然地理解你要什么。' : '这一块需要靠语言补，不能指望对方自动懂。'}`
          : '太阳与月亮之间没有紧密相位：日常的理解要靠说清楚，不能靠猜。',
        venusMars ? `金星—火星${venusMars.name}：亲密与行动的配比${venusMars.weight > 0 ? '顺，身体层面的吸引力有落点。' : '有张力，吸引力强但节奏容易错位。'}`
          : '金星与火星没有紧密相位：亲密感的建立更依赖相处习惯，而不是电光火石。',
        hard.length ? `最需要预留缓冲的是：${hard.map(h => h.a + h.name + h.b).join('、')}。这几条不会消失，只能靠约定分担。` : '主要接触里没有重压型相位，摩擦多在生活细节而非结构。'
      ]
    };
  }

  root.SynastryEngine = { typeMatch, chartMatch, BODY_KEY };
})(typeof globalThis !== 'undefined' ? globalThis : this);
