/* 八维认知功能计分：单题 0~1（越大代表该功能越强），再合成 0~100 */
(function (root) {
  'use strict';
  const D = () => root.MBTI_FUNCTIONS;
  const ORDER = ['Ni', 'Ne', 'Si', 'Se', 'Ti', 'Te', 'Fi', 'Fe'];

  function itemLean(item, answer) {
    if (answer == null) return null;
    if (item.type === 'likert') {
      const v = Number(answer);
      if (!v) return null;
      const base = (v - 1) / 6;
      return item.reverse ? 1 - base : base;
    }
    const idx = Number(answer);
    if (Number.isNaN(idx) || !item.map || item.map[idx] == null) return null;
    return item.map[idx];
  }

  function levelOf(pct) {
    if (pct >= 70) return '强';
    if (pct >= 60) return '偏强';
    if (pct >= 45) return '中';
    if (pct >= 35) return '偏弱';
    return '弱';
  }

  /* 返回：{Ni:{pct,level,answered,total}, ..., dominant, auxiliary, weakest, stack, fit} */
  function score(answers, typeCode) {
    const items = D().items;
    const out = {};
    ORDER.forEach(fn => {
      const list = items.filter(i => i.fn === fn);
      const leans = list.map(i => itemLean(i, answers[i.id])).filter(v => v !== null);
      const raw = leans.length ? leans.reduce((s, v) => s + v, 0) / leans.length : null;
      const pct = raw == null ? null : Math.round(raw * 100);
      out[fn] = {
        fn,
        pct,
        level: pct == null ? '未测' : levelOf(pct),
        answered: leans.length,
        total: list.length
      };
    });

    const measured = ORDER.filter(f => out[f].pct != null).sort((a, b) => out[b].pct - out[a].pct);
    const dominant = measured[0] || null;
    const auxiliary = measured[1] || null;
    const weakest = measured[measured.length - 1] || null;

    const stack = typeCode && D().stacks[typeCode] ? D().stacks[typeCode] : null;
    let fit = null;
    if (stack && dominant) {
      const rank = measured.filter(f => stack.indexOf(f) >= 0);
      const domMatches = stack.indexOf(dominant);
      fit = {
        stack,
        dominantExpected: stack[0],
        dominantActual: dominant,
        dominantMatch: dominant === stack[0],
        dominantRank: domMatches,
        /* 实测前四位和标准栈前四位的重合数 */
        overlap: stack.slice(0, 4).filter(f => measured.slice(0, 4).indexOf(f) >= 0).length
      };
    }

    return { dims: out, order: ORDER, dominant, auxiliary, weakest, stack, fit };
  }

  /* 给一段人话：你的功能配置离标准栈有多远 */
  function summarize(res, typeCode) {
    if (!res || !res.dominant) return '';
    const meta = D().meta;
    const dom = meta[res.dominant];
    const lines = [];
    lines.push(`实测最强的功能是 ${res.dominant}（${dom.cn}，${res.dims[res.dominant].pct} 分），第二是 ${res.auxiliary}（${meta[res.auxiliary].cn}，${res.dims[res.auxiliary].pct} 分）。`);
    if (res.fit) {
      lines.push(res.fit.dominantMatch
        ? `这和 ${typeCode} 的标准功能栈（${res.fit.stack.join(' → ')}）一致：主导功能对得上。`
        : `标准 ${typeCode} 的核心栈是 ${res.fit.stack.join(' → ')}，主导应该是 ${res.fit.dominantExpected}，但你实测最强的是 ${res.dominant}。这不是错答——常见于长期在某种环境里被反复要求用另一套能力的人。`);
      if (res.fit.overlap <= 2) {
        lines.push('四个核心功能和标准栈的重合只有两个或更少，说明你更接近一个「混合配置」，类型标签只覆盖了你的一部分。');
      }
    }
    return lines.join(' ');
  }

  root.FunctionEngine = { score, summarize, itemLean, levelOf, ORDER };
})(typeof globalThis !== 'undefined' ? globalThis : this);
