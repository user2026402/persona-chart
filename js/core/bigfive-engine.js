/* 五因素（mini-IPIP 10 题）计分 + 与四维的映射说明 */
(function (root) {
  'use strict';

  const FACETS = {
    E: { cn: '外向性', pair: ['E', 'I'], high: '社交主动、表达外放、从人群里获得能量。', low: '安静自持、偏好小范围与独处。' },
    A: { cn: '宜人性', pair: ['F', 'T'], high: '体谅他人、愿意让步、重视关系和谐。', low: '直接、以事为重、不怕说难听的实话。' },
    C: { cn: '尽责性', pair: ['J', 'P'], high: '有计划、能兑现、对结果负责。', low: '灵活随性、靠临场驱动，容易拖到最后。' },
    N: { cn: '神经质', pair: ['—', '—'], high: '情绪起伏大、压力感强、对负面信号敏感。', low: '情绪稳定、恢复快、不容易被带跑。' },
    O: { cn: '开放性', pair: ['N', 'S'], high: '好奇、爱抽象、喜欢新观念与新体验。', low: '务实、偏好已知与可验证的东西。' }
  };

  function score(answers) {
    const q = root.MBTI_QUESTIONS.standard.bigfive;
    const acc = { E: [], A: [], C: [], N: [], O: [] };
    q.forEach(item => {
      const v = Number(answers[item.id]);
      if (!v) return;
      const base = (v - 1) / 6;
      acc[item.facet].push(item.reverse ? 1 - base : base);
    });
    const out = {};
    Object.keys(acc).forEach(f => {
      const arr = acc[f];
      const raw = arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0.5;
      const pct = Math.round(raw * 100);
      out[f] = {
        facet: f, cn: FACETS[f].cn, pct,
        level: pct >= 65 ? '高' : pct <= 35 ? '低' : '中',
        desc: pct >= 65 ? FACETS[f].high : pct <= 35 ? FACETS[f].low : `${FACETS[f].high} 但也保留 ${FACETS[f].low.split('。')[0]}。`,
        answered: arr.length
      };
    });
    return out;
  }

  root.BigFiveEngine = { score, FACETS };
})(typeof globalThis !== 'undefined' ? globalThis : this);
