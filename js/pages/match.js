/* 合盘页：类型适配度 + 星盘合盘 */
(function () {
  'use strict';
  const A = window.Astro, S = window.Store, TXT = window.ASTRO_TEXT;
  const SE = window.SynastryEngine;
  const PARTNER_KEY = 'persona-chart:partner';

  const el = id => document.getElementById(id);
  const s = S.load();
  const DIM_CN = { E: '外倾', I: '内倾', S: '实感', N: '直觉', T: '思考', F: '情感', J: '判断', P: '感知' };

  /* ---------------- 我的部分 ---------------- */
  function renderMe() {
    const box = el('me');
    const code = s.mbti && s.mbti.result ? s.mbti.result.code : null;
    const hasBirth = s.birth && s.birth.lat && s.birth.lon;
    if (code && hasBirth) {
      box.innerHTML = `<strong>你这一侧的档案已经就绪：</strong>人格 ${code}${s.mbti.mode === 'deep' ? '（深度档，含八维）' : ''} · 出生 ${s.birth.y}-${s.birth.m}-${s.birth.d} ${s.birth.timeUnknown ? '时间未知' : s.birth.hour + ':' + String(s.birth.minute).padStart(2, '0')} · ${s.birth.place || '手填坐标'}`;
      return { code, chart: chartFromStore(s.birth) };
    }
    box.innerHTML = `<strong>还缺一点东西：</strong>${!code ? '还没测人格类型（<a href="test.html">去测</a>）；' : ''}${!hasBirth ? '还没填出生信息（<a href="birth.html">去填</a>）。' : ''}合盘可以只做你有的那一层，但两样齐了信息最完整。`;
    return { code: code || null, chart: hasBirth ? chartFromStore(s.birth) : null };
  }

  function chartFromStore(b) {
    return A.natalChart({
      y: b.y, m: b.m, d: b.d,
      hour: b.timeUnknown ? 12 : b.hour,
      minute: b.timeUnknown ? 0 : b.minute,
      tzOffsetHours: b.tz, lat: b.lat, lonEast: b.lon, dst: !!b.dst
    });
  }

  /* ---------------- 表单 ---------------- */
  const cityList = el('citylist');
  window.CN_CITIES.forEach(c => {
    const op = document.createElement('option');
    op.value = c.n;
    cityList.appendChild(op);
  });

  const typeSel = el('p-type');
  const codes = Object.keys(window.MBTI_TYPES ? window.MBTI_TYPES.types : {});
  codes.forEach(c => {
    const op = document.createElement('option');
    op.value = c;
    op.textContent = c + ' · ' + (window.MBTI_TYPES.types[c].name || '');
    typeSel.appendChild(op);
  });

  function fillCity() {
    const name = el('p-city').value.trim();
    const hit = window.CN_CITIES.find(c => c.n === name || c.n === name + '市' || c.n.replace('市', '') === name.replace('市', ''));
    if (hit) {
      el('p-lat').value = hit.lat;
      el('p-lon').value = hit.lon;
    }
  }
  el('p-city').addEventListener('change', fillCity);
  el('p-city').addEventListener('input', function () { if (window.CN_CITIES.some(c => c.n === this.value.trim())) fillCity(); });

  function dstOf(y, m, d) {
    try { return window.cnDstOffset ? window.cnDstOffset(y, m, d) : 0; } catch (e) { return 0; }
  }

  /* 打开时回填上次填的对方资料 */
  try {
    const saved = JSON.parse(localStorage.getItem(PARTNER_KEY) || 'null');
    if (saved) {
      el('p-date').value = saved.date || '';
      el('p-time').value = saved.time || '';
      el('p-unknown').checked = !!saved.unknown;
      el('p-city').value = saved.city || '';
      el('p-lat').value = saved.lat || '';
      el('p-lon').value = saved.lon || '';
      el('p-type').value = saved.type || '';
      el('p-relation').value = saved.relation || 'love';
    }
  } catch (e) { /* 忽略损坏的存档 */ }

  /* ---------------- 计算与渲染 ---------------- */
  function bandColor(tone) {
    return tone === 'green' ? 'var(--green)' : tone === 'warn' ? 'var(--gold-deep)' : 'var(--rose)';
  }

  function renderType(tm, relation) {
    if (!tm) return '';
    const relNote = {
      love: '恋人场景里，低分维度多半会以「你怎么不懂我」的形式出现，重点是把差异说成事实而不是态度。',
      friend: '朋友场景里，低分维度通常只影响聊得来不来，不构成长期负担。',
      work: '同事场景里，J/P 与 S/N 的差异会直接变成交付质量问题，需要流程兜底而不是靠默契。',
      family: '家人场景里，E/I 与 T/F 的差异常被读成「不亲」，其实只是处理方式不同。'
    }[relation] || '';

    let html = `<div class="card">
      <h2>一、类型适配度 <span class="badge badge--B" title="基于各维度机制差异的规则模型">B</span></h2>
      <div class="between" style="margin:6px 0 12px">
        <strong style="font-size:17px">${tm.headline}</strong>
        <span class="pill" style="color:${bandColor(tm.band.tone)}">${tm.band.label}</span>
      </div>
      <div class="lean" style="margin-bottom:16px">
        <div class="lean__track"><div class="lean__fill" style="left:0;width:${tm.score}%"></div></div>
        <div class="lean__labels"><span>0 · 高摩擦</span><span>50</span><span>100 · 高适配</span></div>
      </div>

      <table class="kv"><thead><tr><th>维度</th><th>你</th><th>对方</th><th>是否同侧</th></tr></thead><tbody>`;
    tm.rows.forEach(r => {
      html += `<tr><td>${r.name}</td><td>${r.a} · ${DIM_CN[r.a]}</td><td>${r.b} · ${DIM_CN[r.b]}</td><td class="small ${r.same ? 'muted' : ''}">${r.same ? '同侧' : '异侧'}</td></tr>`;
    });
    html += `</tbody></table>`;

    html += `<div class="note" style="margin-top:14px">${tm.stackNote}</div>`;
    tm.notes.forEach(n => { html += `<p class="small">${n}</p>`; });
    if (relNote) html += `<p class="small muted">${relNote}</p>`;

    if (tm.conflicts.length) {
      html += `<h3 style="margin-top:18px">需要提前约定的地方</h3><ul class="small">`;
      tm.conflicts.forEach(c => { html += `<li>${c}</li>`; });
      html += `</ul>`;
    }
    html += `</div>`;
    return html;
  }

  function renderChart(cm, bTimeUnknown) {
    if (!cm) return '';
    let html = `<div class="card">
      <h2>二、星盘合盘 <span class="badge badge--A" title="相位由黄经差算出">A</span> <span class="badge badge--B" title="相位解读属占星理论">B</span></h2>
      <p class="small muted">合盘的做法是把两张盘的行星互相「对相位」：你的行星在对方行星的什么角度上。容许度取日月 7°、其余 4.5°，只算五个主要相位。</p>
      <div class="between" style="margin:10px 0 6px"><strong style="font-size:17px">合盘接触指数 ${cm.score} / 100</strong><span class="pill">${cm.band}</span></div>
      <p class="small faint" style="margin:0 0 8px">指数只表示「顺相位与拉扯相位的比重」，不是关系成败的概率。十条接触里哪几条重、哪几条需要提前约定，比分数本身有用。</p>
      <div class="lean" style="margin-bottom:16px"><div class="lean__track"><div class="lean__fill" style="left:0;width:${cm.score}%"></div></div></div>`;
    cm.summary.forEach(s => { html += `<p class="small">${s}</p>`; });

    html += `<h3 style="margin-top:20px">最重的十条接触</h3><table class="kv"><thead><tr><th>你的</th><th>相位</th><th>对方</th><th>误差</th></tr></thead><tbody>`;
    cm.contacts.forEach(c => {
      html += `<tr><td>${c.a}</td><td>${c.symbol} ${c.name}</td><td>${c.b}</td><td class="mono">${c.orb.toFixed(1)}°</td></tr>`;
    });
    html += `</tbody></table><details class="fold"><summary>逐条读法</summary>`;
    cm.contacts.slice(0, 6).forEach(c => { html += `<p class="small">${c.a}${c.name}${c.b}：${c.text}</p>`; });
    html += `</details>`;

    if (cm.overlays.length) {
      html += `<h3 style="margin-top:20px">宫位叠加：你在对方生活的哪一块</h3><ul class="small">`;
      cm.overlays.forEach(o => { html += `<li>${o.text}</li>`; });
      html += `</ul>`;
    }

    if (bTimeUnknown) {
      html += `<div class="note note--warn">对方时间未知，所以合盘用的是正午盘：行星对行星的相位（除月亮）大体成立，凡是涉及对方上升、宫位的句子都只是条件成立。</div>`;
    }
    html += `<div class="note" style="margin-bottom:0">合盘只描述「两人之间的作用方式」，不预测关系成败。真正决定关系的是重复的日常行为——合盘能告诉你哪几件事值得提前说清楚。</div>`;
    html += `</div>`;
    return html;
  }

  function run() {
    const dateStr = el('p-date').value;
    const timeStr = el('p-time').value;
    const unknown = el('p-unknown').checked;
    const lat = parseFloat(el('p-lat').value), lon = parseFloat(el('p-lon').value);
    const out = el('out');
    const hint = el('p-hint');

    if (!dateStr) { hint.textContent = '先填对方的出生日期。'; return; }
    if (!lat || !lon) { hint.textContent = '还需要对方出生地的经纬度（选城市会自动填）。'; return; }

    const parts = dateStr.split('-').map(Number);
    const y = parts[0], m = parts[1], d = parts[2];
    let hour = 12, minute = 0;
    if (!unknown && timeStr) {
      const t = timeStr.split(':').map(Number);
      hour = t[0]; minute = t[1];
    }
    const dst = dstOf(y, m, d);

    try {
      localStorage.setItem(PARTNER_KEY, JSON.stringify({
        date: dateStr, time: timeStr, unknown, city: el('p-city').value, lat, lon,
        type: el('p-type').value, relation: el('p-relation').value
      }));
    } catch (e) { /* 空间不足时忽略 */ }

    const me = renderMe();
    const bType = el('p-type').value || null;
    const relation = el('p-relation').value;

    const tm = (me.code && bType) ? SE.typeMatch(me.code, bType) : null;
    let cm = null;
    if (me.chart) {
      const bChart = A.natalChart({
        y, m, d, hour, minute, tzOffsetHours: 8, lat, lonEast: lon,
        dst: !!dst
      });
      cm = SE.chartMatch(me.chart, bChart);
    }

    let html = '';
    if (!tm) {
      html += `<div class="card"><h2>类型适配度</h2><p class="small muted">${!me.code ? '你还没测人格类型，这一层先空着。' : ''}${!bType ? '对方的类型没选，这一层先空着——让对方去测一次，或直接在下拉里选类型。' : ''}合盘的第二层不受影响。</p></div>`;
    } else {
      html += renderType(tm, relation);
    }
    if (!cm) {
      html += `<div class="card"><h2>星盘合盘</h2><p class="small muted">还缺你的出生信息，没法合盘。填完出生信息再回来即可。</p></div>`;
    } else {
      html += renderChart(cm, unknown);
    }
    out.innerHTML = html;
    hint.textContent = '';
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  el('btn-run').addEventListener('click', run);
  el('p-unknown').addEventListener('change', function () {
    el('p-time').disabled = this.checked;
    if (this.checked) el('p-time').value = '';
  });
  renderMe();

  try {
    if (new URLSearchParams(location.search).get('auto') === '1') setTimeout(run, 200);
  } catch (e) { /* 忽略 */ }
})();

