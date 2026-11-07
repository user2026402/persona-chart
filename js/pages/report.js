/* 综合报告页：八领域 + 星盘融合 + 冲突仲裁 + 情境指引 */
(function () {
  'use strict';
  const A = window.Astro;
  const RE = window.ReportEngine;
  const st = window.Store.load();
  const app = document.getElementById('app');

  if (!st.mbti || !st.mbti.result) {
    app.innerHTML = `<div class="card"><h2>还没有人格结果</h2>
      <p class="small">这一页要先把人格测出来。八领域解析只靠人格也能给出，但融合层与情境指引需要出生信息。</p>
      <div class="row"><a class="btn" href="test.html">去做测评</a><a class="btn btn--ghost" href="birth.html">去排本命盘</a></div></div>`;
    return;
  }

  const mbti = st.mbti.result;
  const b = st.birth;
  let chart = null;
  if (b) {
    chart = A.natalChart({
      y: b.y, m: b.m, d: b.d,
      hour: b.timeUnknown ? 12 : b.hour,
      minute: b.timeUnknown ? 0 : b.minute,
      tzOffsetHours: b.tz,
      dst: !!b.dst,
      lat: b.lat, lonEast: b.lon,
      place: b.place
    }, { system: 'placidus' });
  }

  const SIT_KEY = 'persona-chart:situation';
  const situation = (function () {
    try { return JSON.parse(localStorage.getItem(SIT_KEY) || 'null'); } catch (e) { return null; }
  })();

  const report = RE.build({ mbti, bigfive: st.bigfive, chart });
  const p = report.profile || {};

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* ---------- 头部 ---------- */
  const head = el('div', 'card card--moon');
  let hh = `<div class="muted small">综合报告 · ${report.hasChart ? '人格 × 星盘' : '仅人格侧'}</div>
    <div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin:8px 0 4px">
      <div style="font-size:42px;font-weight:700;letter-spacing:.06em;color:#5a4f32">${report.code}</div>
      <div style="font-size:19px;font-weight:600">${p.name || ''}</div>
    </div>
    <div class="muted">${p.tagline || ''}</div>
    <div class="row" style="margin-top:14px">
      <span class="pill">可信度 ${report.reliability.grade}</span>`;
  if (report.hasChart) {
    hh += `<span class="pill pill--green">太阳 ${chart.rows.find(r => r.id === 'sun').sign.cn} · 月亮 ${chart.rows.find(r => r.id === 'moon').sign.cn} · 上升 ${chart.ascSign.cn}</span>`;
    if (b.timeUnknown) hh += `<span class="pill pill--rose">出生时间未知，按正午排盘</span>`;
  } else {
    hh += `<span class="pill pill--rose">还没有出生信息，融合层未生成</span>`;
  }
  hh += `</div>`;
  if (b && b.timeUnknown) {
    hh += `<div class="note note--warn">出生时间未知：上升点与宫位随时辰变化，这一版的宫位落点只能当参照，不能当结论。行星落座仍然准确。</div>`;
  }
  head.innerHTML = hh;
  app.appendChild(head);

  /* ---------- 领域权重 ---------- */
  const wcard = el('div', 'card');
  let wh = `<h2>八个领域在你身上的权重</h2>
    <p class="small muted">权重 = 该领域对应的宫位里落了几颗行星（主宫 0.6 / 次宫 0.3）再归一化。它说明哪几块生活被这张盘重点写过，不代表哪个更重要。</p>`;
  const maxW = Math.max.apply(null, report.domains.map(d => d.weight)) || 1;
  report.domains.forEach(d => {
    const w = Math.round(d.weight / maxW * 100);
    wh += `<div class="lean">
      <div class="lean__head"><span><strong>${d.name}</strong></span><span class="muted">${d.weight}%</span></div>
      <div class="lean__track"><div class="lean__fill" style="left:0;width:${w}%"></div></div>
    </div>`;
  });
  wh += `<div class="note" style="margin-bottom:0">没有出生信息时这八条都是等权的——权重栏只反映宫位，不反映你这个人。</div>`;
  wcard.innerHTML = wh;
  app.appendChild(wcard);

  /* ---------- 八领域 ---------- */
  const dmHead = el('div', 'card card--warm');
  dmHead.innerHTML = `<h2>按领域展开</h2>
    <p class="small" style="margin:0">每块都是同一套结构：你在这域的方式（机制 → 可验证表现 → 风险）→ 星盘上对应的落点 → 合成 → 你能执行的动作。理论骨架收在折叠里，想核对出处就展开。</p>`;
  app.appendChild(dmHead);

  const clsCycle = ['card', 'card--warm', 'card', 'card--inset'];
  report.domains.forEach((d, i) => {
    const card = el('div', clsCycle[i % 3] + ' card--domain');
    let dh = `<span class="domain__no">${String(i + 1).padStart(2, '0')}</span>
      <div class="between" style="align-items:flex-start">
        <div>
          <div class="muted small">${d.short}</div>
          <h2 style="margin:2px 0 8px">${d.name}</h2>
        </div>
        <span class="pill">权重 ${d.weight}% · ${d.grade} 级</span>
      </div>`;

    dh += `<details class="fold"><summary>理论骨架（${d.theories.length} 条）</summary><ul class="small">`;
    d.theories.forEach(t => { dh += `<li><strong>${t.name}</strong>：${t.claim}</li>`; });
    dh += `</ul></details>`;

    dh += `<h3>你在这域的方式</h3>`;
    d.used.forEach(u => {
      dh += `<div class="note" style="margin:10px 0">
        <div><strong>${u.letter}</strong> 侧 · 机制：${u.mech}</div>
        <div class="small" style="margin-top:6px">可验证的表现：${u.sign}</div>
        <div class="small" style="margin-top:4px;color:#8a6a52">风险：${u.risk}</div>
      </div>`;
    });

    if (d.chart && d.chart.planets.length) {
      dh += `<h3>星盘上对应的落点 <span class="badge badge--C" title="宫位与星座的传统对应关系">C</span></h3>
        <p class="small muted" style="margin-top:0">主宫第 ${d.chart.cuspHouse} 宫宫头在 ${d.chart.cuspSign}。这一域相关的宫位里落着这些行星（带上「辅」的是次要宫位，权重低一档）：</p><ul class="small">`;
      d.chart.planets.forEach(pl => {
        dh += `<li><strong>${pl.cn}在${pl.signCn}</strong>（第 ${pl.house} 宫${pl.aux ? '，辅' : ''}${pl.retro ? '，逆行' : ''}）${pl.text ? '：' + pl.text : ''}</li>`;
      });
      dh += `</ul>`;
    } else if (!report.hasChart) {
      dh += `<div class="note note--warn">还没有出生信息，这一块只有人格侧。</div>`;
    } else {
      dh += `<div class="note note--warn">这张盘在 ${d.chart ? d.chart.cuspHouse : ''} 宫没有行星落点，这一域主要由宫头星座与宫主星决定，权重也相应偏低。</div>`;
    }

    dh += `<div class="note note--green">合成：${d.synthesis}</div>`;

    dh += `<h3>可以做的</h3><ul class="small">`;
    d.actions.forEach(a => { dh += `<li>${a.t}</li>`; });
    dh += `</ul>`;

    dh += `<p class="small faint" style="margin-bottom:0">${d.boundary}</p>`;
    card.innerHTML = dh;
    app.appendChild(card);
  });

  /* ---------- 融合层 ---------- */
  if (report.fusion.length) {
    const fc = el('div', 'card');
    let fh = `<h2>融合层：机制 × 表达</h2>
      <p class="small muted">人格说你怎么运作，星盘说你在什么主题上、用什么语气运作。下面每一条都是这两句话的交叉点。</p><div class="grid2">`;
    report.fusion.forEach(f => {
      fh += `<div class="note" style="margin:0">
        <div class="muted small">${f.astro}</div>
        <h3 style="margin:6px 0 6px;font-size:15px">${f.title} <span class="badge badge--${f.grade}">${f.grade}</span></h3>
        <p class="small" style="margin:0">${f.text}</p>
      </div>`;
    });
    fh += `</div>`;
    fc.innerHTML = fh;
    app.appendChild(fc);
  }

  /* ---------- 冲突仲裁 ---------- */
  if (report.conflicts.length) {
    const cc = el('div', 'card card--inset');
    let ch = `<h2>两套坐标不一致的地方</h2>
      <p class="small muted">不一致不是数据错了，也不是你「不正常」。它通常是偏好与环境长期拉扯的结果。这里不给统一答案，给假说和自查方法。</p>`;
    report.conflicts.forEach((c, i) => {
      ch += `<h3>${i + 1}. ${c.title}</h3><p class="small">${c.text}</p><ul class="small">`;
      c.hypotheses.forEach(h => { ch += `<li>${h}</li>`; });
      ch += `</ul><p class="small" style="margin-bottom:0"><strong>${c.check}</strong></p>`;
    });
    cc.innerHTML = ch;
    app.appendChild(cc);
  }

  /* ---------- 情境指引 ---------- */
  const gcard = el('div', 'card card--moon');
  if (!report.guidance) {
    gcard.innerHTML = `<h2>当下情境指引</h2>
      <p class="small">这一块要算当天的行运与本命点的相位，需要出生信息。</p>
      <a class="btn" href="birth.html">去录入出生信息</a>`;
  } else {
    const g = report.guidance;
    let gh = `<div class="muted small">第三层 · 情境</div>
      <h2 style="margin:6px 0 10px">现在天上的位置，对你意味着什么</h2>
      <p class="small muted">结构固定为五段：天象事实（全 A）→ 与你人格的耦合（B）→ 该做的三件事 → 该避免的三件事 → 时间窗口。不预测具体事件。</p>`;

    if (situation && situation.text) {
      gh += `<div class="note note--green">你描述的处境：${situation.text}${situation.domain ? `　（对应领域：${RE_domainName(situation.domain)}）` : ''}</div>`;
    }

    gh += `<h3>一、天象事实 <span class="badge badge--A">A</span></h3><ul class="small">`;
    g.facts.forEach(f => { gh += `<li>${f}</li>`; });
    gh += `</ul>`;

    gh += `<h3>二、与你人格的耦合 <span class="badge badge--B">B</span></h3>`;
    g.coupling.forEach(c => { gh += `<p class="small">${c}</p>`; });
    if (!g.coupling.length) gh += `<p class="small">这段时间没有落在强权重领域的行运，说明外部推力主要来自日常小事，不是结构性变化。</p>`;

    gh += `<div class="grid2" style="margin-top:18px">
      <div><h3 style="margin-top:0">三、该做的三件事</h3><ul class="small">`;
    g.doList.forEach(t => { gh += `<li>${t}</li>`; });
    gh += `</ul></div><div><h3 style="margin-top:0">四、该避免的三件事</h3><ul class="small">`;
    g.avoidList.forEach(t => { gh += `<li>${t}</li>`; });
    gh += `</ul></div></div>`;

    gh += `<h3>五、时间窗口</h3>`;
    if (g.window.length) {
      gh += `<table class="kv"><thead><tr><th>精确日</th><th>行运</th><th>生效区间</th></tr></thead><tbody>`;
      g.window.forEach(w => {
        const parts = w.split('｜');
        const m = /（(.+) 进入 · (.+) 消退）/.exec(parts[1] || '');
        gh += `<tr><td>${parts[0]}</td><td>${(parts[1] || '').replace(/（.+）/, '')}</td><td>${m ? m[1] + ' → ' + m[2] : '—'}</td></tr>`;
      });
      gh += `</tbody></table>`;
    } else {
      gh += `<p class="small">未来 12 周内没有外行星精确相位，属于相对平缓的一段。</p>`;
    }

    gh += `<div class="note note--warn" style="margin-bottom:0">边界：行运描述的是「这段时间容易在什么主题上被推动」，不预测具体事件，也不替代医疗、投资或法律意见。逆行期标注「可能反复三次」，指的是同一相位在顺逆之间来回。</div>`;

    /* 处境输入（打印时换成只读文本） */
    gh += `<div class="no-print"><h3>把你的处境填进来</h3>
      <p class="small muted">写 200 字以内，报告会把它和上面这些行运放在一起读。</p>
      <div class="row" style="gap:10px;align-items:flex-start;flex-wrap:wrap">
        <select class="btn btn--ghost btn--small" id="sit-domain" style="width:auto">
          <option value="">不指定领域</option>
          ${window.DOMAIN_DATA.order.map(id => `<option value="${id}"${situation && situation.domain === id ? ' selected' : ''}>${window.DOMAIN_DATA.domains[id].name}</option>`).join('')}
        </select>
        <button class="btn btn--ghost btn--small" id="btn-sit">保存并重读</button>
      </div>
      <textarea id="sit-text" rows="4" style="width:100%;margin-top:10px;border:1.5px solid var(--line);border-radius:var(--radius-sm);padding:14px;font:inherit;color:var(--ink);background:#fffcf0;resize:vertical">${situation && situation.text ? situation.text : ''}</textarea></div>${situation && situation.text ? `<p class="small print-only" style="margin-top:10px">你的处境：${situation.text}${situation.domain ? `（领域：${(window.DOMAIN_DATA.domains[situation.domain] || {}).name || situation.domain}）` : ''}</p>` : ''}`;

    gcard.innerHTML = gh;
    app.appendChild(gcard);

    gcard.querySelector('#btn-sit').addEventListener('click', function () {
      const text = gcard.querySelector('#sit-text').value.slice(0, 200);
      const domain = gcard.querySelector('#sit-domain').value;
      localStorage.setItem(SIT_KEY, JSON.stringify({ text, domain }));
      location.reload();
    });
  }

  /* ---------- 方法说明 ---------- */
  const mcard = el('div', 'card card--warm');
  mcard.innerHTML = `<h2>这一页是怎么算出来的</h2>
    <p class="small">领域结论由规则库装配：先按四个维度的实际字母取对应的机制、表现与风险，再按该领域的宫位落点补星盘侧，最后合成。星盘落宫与星座的对应属传统体系，统一标 C；行运行星位置由星历实算，标 A。</p>
    <p class="small">八领域的理论骨架都是可查的公开理论（Holland、Schein、Bartholomew、Gottman、Sweller、Bowen、Lazarus、Kahneman 等）。学业域明确不使用已被证伪的 VAK 学习风格分类。</p>
    <div class="row"><a class="btn btn--ghost btn--small no-print" href="natal.html">看完整本命盘</a><button class="btn btn--ghost btn--small no-print" id="btn-print">打印 / 存 PDF（A4）</button></div>
    <p class="small faint no-print" style="margin-bottom:0">存 PDF 时选「另存为 PDF」，纸张 A4、边距默认、勾选「背景图形」；折叠起来的理论骨架会在打印时自动展开，打完自动收起。</p>`;
  app.appendChild(mcard);
  mcard.querySelector('#btn-print').addEventListener('click', () => window.print());

  /* 打印时展开所有折叠块，打印后恢复 */
  window.addEventListener('beforeprint', () => {
    document.querySelectorAll('details.fold').forEach(d => {
      if (!d.open) { d.open = true; d.dataset.autoOpened = '1'; }
    });
  });
  window.addEventListener('afterprint', () => {
    document.querySelectorAll('details.fold[data-auto-opened]').forEach(d => {
      d.open = false;
      delete d.dataset.autoOpened;
    });
  });

  function RE_domainName(id) {
    return (window.DOMAIN_DATA.domains[id] || {}).name || id;
  }
})();
