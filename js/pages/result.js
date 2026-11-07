/* 结果页：维度倾向 / 双型候选 / 类型档案 / 五因素 / 可信度 */
(function () {
  'use strict';
  const T = window.MBTI_TYPES;
  const st = window.Store.load();
  const app = document.getElementById('app');

  if (!st.mbti || !st.mbti.result) {
    app.innerHTML = `<div class="card"><h2>还没有测评结果</h2>
      <p class="small">先做完 76 道题，再回来看这一页。</p>
      <a class="btn" href="test.html">去做测评</a></div>`;
    return;
  }

  const r = st.mbti.result;
  const p = r.profile || { name: r.code, tagline: '', core: '', decide: '', energy: '', work: '', love: '', stress: '', growth: '', misread: '' };
  const bf = st.bigfive;

  /* ---------- 头部 ---------- */
  const head = document.getElementById('head');
  head.className = 'card card--moon';
  head.innerHTML = `
    <div class="muted small">你的人格类型</div>
    <div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin:6px 0 4px">
      <div style="font-size:44px;font-weight:700;letter-spacing:.06em;color:#5a4f32">${r.code}</div>
      <div style="font-size:19px;font-weight:600">${p.name}</div>
    </div>
    <div class="muted">${p.tagline || ''}</div>
    <div class="row" style="margin-top:14px">
      <span class="pill">可信度 ${r.reliability.grade}</span>
      ${r.boundaryDims.length ? `<span class="pill pill--rose">有 ${r.boundaryDims.length} 个维度落在临界带</span>` : '<span class="pill pill--green">四个维度都清晰</span>'}
      <span class="pill pill--line">${(st.mbti && st.mbti.mode === 'deep') ? '深度档' : '标准档'}</span>
    </div>`;

  /* ---------- 四维倾向 ---------- */
  const dimsCard = document.createElement('div');
  dimsCard.className = 'card';
  let html = `<h2>四个维度的倾向 <span class="badge badge--A" title="由你的作答直接计算得出">A</span></h2>
    <p class="small muted">横条长度代表倾向前者的比例。中间那道细线是 50%，落在附近的区间就说明这个维度并不清晰。</p>`;
  Object.values(r.dims).forEach(d => {
    const meta = T.dims[d.dim];
    const isA = d.letter === d.poleA;
    html += `
    <div class="lean">
      <div class="lean__head">
        <span><strong>${meta.name}</strong> · ${d.letter}</span>
        <span class="muted">${isA ? d.pct : d.otherPct}% 倾向 ${d.letter} · ${d.strength}</span>
      </div>
      <div class="lean__track">
        <div class="lean__fill" style="${isA ? 'left:0;width:' + d.pct + '%' : 'right:0;width:' + d.otherPct + '%'}"></div>
        <div class="lean__mark"></div>
      </div>
      <div class="lean__labels">
        <span>${d.poleA} · ${meta.a.replace(/^[A-Z] /, '')}</span>
        <span>${d.poleB} · ${meta.b.replace(/^[A-Z] /, '')}</span>
      </div>
    </div>`;
  });
  html += `<div class="note note--green" style="margin-bottom:0">倾向强度只说明你在这一维度上偏得有多明显，不代表能力高低。</div>`;
  dimsCard.innerHTML = html;

  /* ---------- 双型候选 ---------- */
  let candCard = null;
  if (r.boundaryDims.length && r.candidates.length > 1) {
    candCard = document.createElement('div');
    candCard.className = 'card card--warm';
    let ch = `<h2>你落在两个类型之间</h2>
      <p class="small">落在临界带不代表结果无效。它说明这两个维度上，你的两种倾向强度接近，硬选一个字母反而会失真。候选：<strong>${r.candidates.join(' / ')}</strong>。</p>`;
    r.boundaryDims.forEach(dim => {
      const meta = T.dims[dim];
      ch += `<h3>${meta.name}：${meta.a} 还是 ${meta.b}？</h3><ul class="small">`;
      (r.reliability ? T.boundary[dim] : T.boundary[dim]).forEach(line => { ch += `<li>${line}</li>`; });
      ch += `</ul>`;
    });
    ch += `<div class="note" style="margin-bottom:0">判断方法：对每一条给出「更像我」的答案，然后数一下哪边更多。感觉两边都像的时候，回想最近一次真实发生的情境，而不是想象中的自己。</div>`;
    candCard.innerHTML = ch;
  }

  /* ---------- 类型档案 ---------- */
  const profileCard = document.createElement('div');
  profileCard.className = 'card';
  const rows = [
    ['核心动力', 'core'], ['决策链', 'decide'], ['能量管理', 'energy'],
    ['工作方式', 'work'], ['亲密关系', 'love'], ['压力反应', 'stress'],
    ['成长方向', 'growth'], ['常被误读为', 'misread']
  ];
  let ph = `<h2>${r.code} 的运作方式 <span class="badge badge--B" title="由类型学框架推演，非实证结论">B</span></h2>`;
  rows.forEach(([label, key]) => {
    if (!p[key]) return;
    ph += `<h3>${label}</h3><p style="margin-bottom:0">${p[key]}</p>`;
  });
  profileCard.innerHTML = ph;

  /* ---------- 五因素 ---------- */
  const bfCard = document.createElement('div');
  bfCard.className = 'card';
  if (bf) {
    let bh = `<h2>五因素分数 <span class="badge badge--A" title="量表自评分数">A</span></h2>
      <p class="small muted">这不是「更科学」的第二版人格，而是另一套坐标。<span class="badge badge--B" title="映射关系来自研究文献，但并非一对一">B</span> 与十六型的映射只在部分维度上可靠：E–I 对外向性可靠，T–F 对宜人性只部分相关。</p>`;
    Object.values(bf).forEach(f => {
      bh += `
      <div class="lean">
        <div class="lean__head"><span><strong>${f.cn}</strong></span><span class="muted">${f.pct} / 100 · ${f.level}</span></div>
        <div class="lean__track"><div class="lean__fill" style="left:0;width:${f.pct}%"></div></div>
        <div class="small muted" style="margin-top:6px">${f.desc}</div>
      </div>`;
    });
    bh += `<div class="note" style="margin-bottom:0">元分析里，职业绩效预测力最强的是尽责性，关系满意度最稳的组合是低神经质 + 较高宜人性。这两项在后面职业域、情感域的解析里会当作主要依据。</div>`;
    bfCard.innerHTML = bh;
  } else {
    bfCard.innerHTML = `<h2>五因素：未测</h2>
      <p class="small">你跳过了那 10 道题。后续报告里凡是依赖五因素的推断，都会标注「依据较弱」，不会假装测过。</p>`;
  }

  /* ---------- 八维认知功能（深度档） ---------- */
  const fn = st.mbti.functions;
  const fnCard = document.createElement('div');
  fnCard.className = 'card card--inset';
  if (fn && fn.dominant) {
    const meta = window.MBTI_FUNCTIONS.meta;
    let fh = `<h2>八维认知功能 <span class="badge badge--B" title="荣格功能模型的现代改写，属类型学推演">B</span></h2>
      <p class="small muted">这八项测的是「你用哪种方式处理信息与做判断」，不是能力高低。${window.FunctionEngine.summarize(fn, r.code)}</p>`;
    const order = fn.order;
    order.forEach(k => {
      const d = fn.dims[k];
      if (d.pct == null) return;
      const isDom = k === fn.dominant;
      const isAux = k === fn.auxiliary;
      fh += `<div class="lean">
        <div class="lean__head">
          <span><strong>${k}</strong> · ${meta[k].cn}${isDom ? ' <span class="pill pill--green">主导</span>' : isAux ? ' <span class="pill">辅助</span>' : ''}</span>
          <span class="muted">${d.pct} · ${d.level}</span>
        </div>
        <div class="lean__track"><div class="lean__fill" style="left:0;width:${d.pct}%"></div></div>
        <div class="small muted" style="margin-top:4px">${meta[k].desc}</div>
      </div>`;
    });
    if (fn.stack) {
      fh += `<div class="note" style="margin-bottom:0">标准 ${r.code} 的功能栈是 <strong>${fn.stack.join(' → ')}</strong>（主导 / 辅助 / 第三 / 劣势）。你的实测前四位与它重合 ${fn.fit ? fn.fit.overlap : 0} 个。重合度低不是错答——长期环境会把人训练成另一套配置，这也是为什么同一个类型的人实际差别很大。</div>`;
    }
    fnCard.innerHTML = fh;
  } else {
    fnCard.innerHTML = `<h2>八维认知功能：未测</h2>
      <p class="small">这一块只在深度档出现。它要额外答 32 题，用来区分「你是什么型」和「你实际怎么想事情」。<a href="test.html">去测深度档</a></p>`;
  }

  /* ---------- 可信度 ---------- */
  const relCard = document.createElement('div');
  relCard.className = 'card card--inset';
  const rel = r.reliability;
  let rh = `<h2>这份结果有多可信</h2>
    <p><strong>等级 ${rel.grade}</strong> · 同义题一致 ${rel.pairOk}/${rel.pairTotal} · 迎合倾向标记 ${rel.socialFlags}</p>
    <p class="small">${rel.note}</p>`;
  if (rel.issues && rel.issues.length) {
    rh += `<ul class="small">` + rel.issues.map(i => `<li>${i.msg}</li>`).join('') + `</ul>`;
  }
  rh += `<details class="fold"><summary>这个等级是怎么判的</summary>
    <p class="small" style="margin-bottom:0">两组同义题（换了说法问同一件事）用来检测作答稳定性：两题差异超过 34% 记一次不一致。两道「几乎无人能同意」的题用来检测迎合倾向：选到 5 分及以上记一次标记。一致率 ≥80% 且无标记为 A，≥60% 为 B，其余为 C。C 级建议 2 周后重测，不要拿它当结论。</p>
    </details>`;
  relCard.innerHTML = rh;

  /* ---------- 下一步 ---------- */
  const nextCard = document.createElement('div');
  nextCard.className = 'card';
  nextCard.innerHTML = `
    <h2>下一步</h2>
    <p class="small">人格只说明你「怎么运作」。要让这份报告长成有深度的东西，还需要第二套坐标：你出生那一刻的行星位置。</p>
    <div class="row">
      <a class="btn ${st.birth ? 'btn--ghost' : ''}" href="${st.birth ? 'report.html' : 'birth.html'}">${st.birth ? '看综合报告（八领域 + 当下指引）' : '去录入出生信息'}</a>
      <a class="btn btn--ghost" href="${st.birth ? 'natal.html' : 'test.html'}">${st.birth ? '查看我的本命盘' : '重测一次'}</a>
      ${st.birth ? '<a class="btn btn--ghost" href="match.html">和人合盘</a>' : ''}
    </div>`;

  app.innerHTML = '';
  app.append(head, dimsCard);
  if (candCard) app.appendChild(candCard);
  app.append(profileCard, fnCard, bfCard, relCard, nextCard);
})();
