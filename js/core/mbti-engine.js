/* 十六型计分引擎：维度倾向、临界判定、双型候选、可信度 */
(function (root) {
  'use strict';
  const Q = () => root.MBTI_QUESTIONS.standard;
  const T = () => root.MBTI_TYPES;

  const POLES = { EI: ['E', 'I'], SN: ['S', 'N'], TF: ['T', 'F'], JP: ['J', 'P'] };

  // 单题 → 倾向前极的程度 0~1
  function leanOf(item, answer) {
    if (answer == null) return null;
    if (item.type === 'likert') {
      const v = Number(answer);
      if (!v) return null;
      const base = (v - 1) / 6;
      return item.reverse ? 1 - base : base;
    }
    if (item.type === 'pick2') {
      const sel = Array.isArray(answer) ? answer : [answer];
      if (!sel.length) return null;
      let a = 0;
      sel.forEach(i => { if (item.opts[i] && item.opts[i].pole === 1) a += 1; });
      return a / sel.length;
    }
    const idx = Number(answer);
    if (Number.isNaN(idx) || !item.map || item.map[idx] == null) return null;
    return item.map[idx];
  }

  function strengthLabel(pct, pole) {
    const d = Math.abs(pct - 50);
    let s = '临界';
    if (d >= 20) s = '明显';
    else if (d >= 10) s = '较明显';
    else if (d >= 5) s = '略偏';
    return { text: s === '临界' ? '临界' : `${s}偏 ${pole}`, level: s };
  }

  function score(answers) {
    const q = Q();
    const dims = {};
    for (const dim of ['EI', 'SN', 'TF', 'JP']) {
      const items = q.scale.filter(i => i.dim === dim);
      const leans = items.map(i => leanOf(i, answers[i.id])).filter(v => v !== null);
      const raw = leans.length ? leans.reduce((s, v) => s + v, 0) / leans.length : 0.5;
      const pct = Math.round(raw * 1000) / 10; // 一位小数
      const poleA = POLES[dim][0], poleB = POLES[dim][1];
      const letter = raw >= 0.5 ? poleA : poleB;
      const strength = strengthLabel(pct, letter);
      dims[dim] = {
        dim, pct, raw, letter, poleA, poleB,
        leanTo: letter, strength: strength.text, level: strength.level,
        boundary: Math.abs(pct - 50) < 5,
        answered: leans.length, total: items.length,
        otherPct: Math.round((100 - pct) * 10) / 10
      };
    }

    const code = dims.EI.letter + dims.SN.letter + dims.TF.letter + dims.JP.letter;
    const boundaryDims = Object.values(dims).filter(d => d.boundary).map(d => d.dim);

    // 双型候选：对每个临界维度取两种字母
    let candidates = [code];
    boundaryDims.forEach(dim => {
      const idx = ['EI', 'SN', 'TF', 'JP'].indexOf(dim);
      const next = [];
      candidates.forEach(c => {
        const chars = c.split('');
        const other = c[idx] === POLES[dim][0] ? POLES[dim][1] : POLES[dim][0];
        chars[idx] = other;
        next.push(chars.join(''));
      });
      candidates = candidates.concat(next);
    });
    candidates = [...new Set(candidates)].slice(0, 4);

    return {
      code, dims, candidates, boundaryDims,
      profile: T().types[code] || null,
      reliability: reliability(answers)
    };
  }

  function reliability(answers) {
    const q = Q();
    const issues = [];
    let pairOk = 0, pairTotal = 0;

    const groups = {};
    q.validity.forEach(v => {
      if (v.kind === 'pairRepeat') {
        const key = [v.id, v.pairWith].sort().join('-');
        groups[key] = groups[key] || [];
        groups[key].push(v);
      }
    });

    Object.keys(groups).forEach(k => {
      const [a, b] = groups[k];
      const la = leanOf(a, answers[a.id]);
      const lb = leanOf(b, answers[b.id]);
      if (la === null || lb === null) return;
      pairTotal += 1;
      const diff = Math.abs(la - lb);
      if (diff <= 0.34) pairOk += 1;
      else issues.push({ type: 'inconsistent', msg: `两道同义题的答案不一致（相差 ${Math.round(diff * 100)}%）` });
    });

    let socialFlags = 0;
    q.validity.filter(v => v.kind === 'socialDesirability').forEach(v => {
      const a = Number(answers[v.id]);
      if (a >= 5) { socialFlags += 1; issues.push({ type: 'social', msg: '在一道「几乎无人能同意」的题上选择了同意，可能存在迎合倾向' }); }
    });

    const answered = q.scale.filter(i => answers[i.id] != null).length;
    const total = q.scale.length;
    const consistency = pairTotal ? pairOk / pairTotal : 1;

    let grade = 'A';
    if (consistency < 0.8 || socialFlags > 0) grade = 'B';
    if (consistency < 0.6 || socialFlags >= 2) grade = 'C';

    return {
      grade, consistency, pairOk, pairTotal, socialFlags, answered, total, issues,
      note: grade === 'A'
        ? '作答一致性高，结果可用作自我探索的参照。'
        : grade === 'B'
          ? '存在少量不一致或迎合倾向，建议结合实际行为核对结论。'
          : '一致性偏低，结论的稳定性有限，建议 2 周后重测。'
    };
  }

  /* 某维度上「你更像哪一个」的判断建议 */
  function boundaryGuide(dim) {
    return (T().boundary[dim] || []).slice();
  }

  root.MBTIEngine = { score, reliability, leanOf, boundaryGuide, POLES };
})(typeof globalThis !== 'undefined' ? globalThis : this);
