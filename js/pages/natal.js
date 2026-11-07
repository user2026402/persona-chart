/* 本命盘页：排盘、绘制、行星/宫位/相位表、时间未知降级 */
(function () {
  'use strict';
  const A = window.Astro, TXT = window.ASTRO_TEXT;
  const TRANSIT_TONE = {
    sun: '自我表达与重心', moon: '情绪与日常节奏', mercury: '沟通、文书与判断',
    venus: '关系、金钱与审美', mars: '行动、冲突与体力', jupiter: '机会、扩张与信念',
    saturn: '责任、结构与时间表', uranus: '突变、自由与跳出旧轨',
    neptune: '模糊、消融与灵感', pluto: '重构、权力与深层动机'
  };
  const TRANSIT_VERB_HARMONY = {
    sun: '重心清楚，适合露面、把要争取的事说出口',
    moon: '情绪有落处，适合照顾自己，也适合照顾身边的人',
    mercury: '说得动、谈得拢，适合把要谈的条件摊开谈',
    venus: '关系与钱的手感顺，适合谈条件、谈感受、谈价钱',
    mars: '行动有出口，适合把一直拖着的动作做掉',
    jupiter: '机会容易接上，适合谈合作、要资源',
    saturn: '进度能落地，适合定规则、定时限、做长期的事',
    uranus: '换个做法反而顺，适合试新路子',
    neptune: '直觉准、边界松，适合创作、也适合休息',
    pluto: '看得清动机，适合处理压着的关系与旧账'
  };
  const TRANSIT_VERB_TENSION = {
    sun: '自我被顶，容易为面子较劲，先放下「被看见」这件事',
    moon: '情绪被挑，容易把小事读成态度问题，先睡好再谈',
    mercury: '话容易说岔、文件容易返工，先确认再发',
    venus: '关系与钱容易起摩擦，别用暗示代替说清',
    mars: '火气与体力都容易过载，别硬碰，先降温',
    jupiter: '摊子容易铺大，先砍掉不必要的承诺',
    saturn: '进度被压，先减量再谈质量',
    uranus: '计划容易被打断，留一套备用方案',
    neptune: '容易看不清、被消耗，先把边界立起来',
    pluto: '权力与控制的事浮出来，别硬扛，先抽身看结构'
  };
  const MOON_PHASE_TONE = {
    '新月': '起步期，适合定方向，不适合要结果',
    '娥眉月': '试探期，先做小的、能验证的动作',
    '上弦月': '推进期，卡住的地方要硬顶过去',
    '盈凸月': '打磨期，把快成的事补细节',
    '满月': '见光期，关系与情绪的事会浮到台面上',
    '亏凸月': '消化期，适合复盘与收束',
    '下弦月': '清理期，砍掉不必要的事',
    '残月': '收尾期，把没结的尾结掉，别开新局'
  };
  const app = document.getElementById('app');
  const st = window.Store.load();

  if (!st.birth) {
    app.innerHTML = `<div class="card"><h2>还没有出生信息</h2>
      <p class="small">排盘需要出生日期、时间与地点。时间不准也能用，会切到区间模式。</p>
      <a class="btn" href="birth.html">去录入</a></div>`;
    return;
  }

  const b = st.birth;
  let system = 'placidus';

  const toBirth = (hour, minute, unknown) => ({
    y: b.y, m: b.m, d: b.d,
    hour, minute,
    tzOffsetHours: b.tz,
    dst: !!b.dst,
    lat: b.lat, lonEast: b.lon,
    place: b.place
  });

  function chartOf(system, hour, minute) {
    return A.natalChart(toBirth(hour == null ? b.hour : hour, minute == null ? b.minute : minute), { system });
  }

  /* ---------- 页面骨架 ---------- */
  function shell() {
    app.innerHTML = '';
    const head = document.createElement('div');
    head.className = 'card card--moon';
    head.id = 'head';
    const summary = document.createElement('div');
    summary.className = 'card card--warm';
    summary.id = 'summary';
    const chartCard = document.createElement('div');
    chartCard.className = 'card';
    chartCard.id = 'chartcard';
    const three = document.createElement('div');
    three.className = 'card';
    three.id = 'three';
    const planetCard = document.createElement('div');
    planetCard.className = 'card';
    planetCard.id = 'planetcard';
    const tableCard = document.createElement('div');
    tableCard.className = 'card';
    tableCard.id = 'tablecard';
    const aspCard = document.createElement('div');
    aspCard.className = 'card';
    aspCard.id = 'aspcard';
    const elemCard = document.createElement('div');
    elemCard.className = 'card';
    elemCard.id = 'elemcard';
    const method = document.createElement('div');
    method.className = 'card card--inset';
    method.id = 'method';
    const fc = document.createElement('div');
    fc.className = 'card card--inset';
    fc.id = 'forecast';
    app.append(head, summary, chartCard, three, planetCard, fc, tableCard, aspCard, elemCard, method);
  }

  /* ---------- 头部 ---------- */
  function renderHead(chart) {
    const head = document.getElementById('head');
    const dateStr = `${b.y} 年 ${b.m} 月 ${b.d} 日`;
    const timeStr = b.timeUnknown ? '时间未知（区间模式）' : `${String(b.hour).padStart(2, '0')}:${String(b.minute).padStart(2, '0')}`;
    head.innerHTML = `
      <div class="muted small">${b.name || '我的档案'} · 本命盘</div>
      <h1 style="margin:8px 0 6px">太阳${chart.rows[0].sign.cn} · 月亮${chart.rows[1].sign.cn} · 上升${chart.ascSign.cn}</h1>
      <div class="muted">${dateStr} ${timeStr} · ${b.place || '手填坐标'}（${b.lat.toFixed(2)}°N, ${b.lon.toFixed(2)}°E）· UTC+${b.tz}${b.dst ? '（含夏令时）' : ''}</div>
      <div class="row" style="margin-top:12px">
        <span class="pill pill--line">宫位制 ${chart.houses.system === 'placidus' ? 'Placidus' : chart.houses.system === 'whole' ? '整宫' : '等宫'}</span>
        ${b.timeUnknown ? '<span class="pill pill--rose">上升与宫位不确定</span>' : '<span class="pill pill--green">时间完整</span>'}
        <button class="btn btn--ghost btn--small no-print" id="btn-print-natal">打印 / 存 PDF</button>
      </div>`;
    head.querySelector('#btn-print-natal').addEventListener('click', () => window.print());
  }

  /* ---------- 先看结论 ---------- */
  function renderSummary(chart) {
    const card = document.getElementById('summary');
    const sun = chart.rows[0], moon = chart.rows[1], asc = chart.ascSign;
    const tight = chart.aspects.filter(a => a.kind === 'major').sort((x, y) => x.exact - y.exact)[0];
    const missing = Object.entries(chart.elements).filter(([, v]) => v === 0).map(([k]) => k);
    const tt = window.Foretell.transitNow(chart, window.TransitEngine.jdNow());
    const nowAspect = tt.aspects.slice().sort((a, b) => a.orb - b.orb)[0];

    let html = `<h2>先看结论：这张盘在说你什么</h2>
      <p class="small muted" style="margin-bottom:14px">下面这几条可以直接拿去用，细节在后面各节。太阳/月亮/上升的完整句子在「三个最重要的位置」，八颗行星在下一张卡。</p>
      <ul class="facts">`;

    html += `<li><strong>你怎么活</strong>：${TXT.inSign.sun[sun.sign.id]}</li>`;
    html += `<li><strong>什么才让你安心</strong>：${TXT.inSign.moon[moon.sign.id]}</li>`;
    html += `<li><strong>别人先看到什么</strong>：${TXT.asc[asc.id]}</li>`;

    if (tight) {
      const na = TXT.planets[tight.a] ? TXT.planets[tight.a].cn : tight.a;
      const nb = TXT.planets[tight.b] ? TXT.planets[tight.b].cn : tight.b;
      const tension = ['四分相', '冲相'].includes(tight.name);
      const meaning = TXT.aspects[tight.name] ? (tension ? TXT.aspects[tight.name].tension : TXT.aspects[tight.name].harmony) : '';
      html += `<li><strong>盘上最紧的一处（误差 ${tight.exact.toFixed(2)}°）</strong>：${na}${tight.symbol}${nb}，${tight.name}。${meaning}</li>`;
    }

    if (missing.length) {
      html += `<li><strong>缺口</strong>：计配比的九颗星里没有一颗落在${missing.join('、')}象，这一类事你默认不靠它处理。压力大的时候，失守的往往就是这里。</li>`;
    }

    if (nowAspect) {
      const nb = TXT.planets[nowAspect.nBody] ? TXT.planets[nowAspect.nBody].cn : nowAspect.nCn;
      const h = nowAspect.nBody === 'asc' ? 1 : nowAspect.nBody === 'mc' ? 10 : (chart.rows.find(r => r.id === nowAspect.nBody) || {}).house;
      const where = h ? `（第 ${h} 宫，${TXT.houses[h]}）` : '';
      html += `<li><strong>此刻正在发生</strong>：行运${nowAspect.tCn}${nowAspect.symbol}你的${nb}${where}，误差 ${nowAspect.orb.toFixed(2)}°，${nowAspect.applying ? '还在逼近' : '已经过去'}。这一条决定这段时间你被什么事牵着走。</li>`;
    }

    html += `</ul><div class="note" style="margin-bottom:0">这张盘只描述「默认配置」，不描述命运。同样一张盘，用不用得上取决于你有没有把它当镜子而不是当判决书。</div>`;
    card.innerHTML = html;
  }

  /* ---------- 八颗行星逐条 ---------- */
  function renderPlanets(chart) {
    const card = document.getElementById('planetcard');
    const list = chart.rows.filter(r => r.id !== 'sun' && r.id !== 'moon');
    let html = `<h2>其余八颗行星：一件事各管一段</h2>
      <p class="small muted">太阳月亮说「你是谁」，这八颗说「你在哪些事上、用什么方式出手」。每条只写这一颗星在它的星座与宫位上的意思，不重复前面三段。</p>`;

    list.forEach(r => {
      const meta = TXT.planets[r.id];
      const signTxt = TXT.inSign[r.id][r.sign.id];
      const hTxt = (TXT.inHouse[r.id] || {})[r.house];
      let body;
      if (hTxt) {
        body = `${signTxt}${hTxt}`;
      } else {
        body = `${signTxt}放在第 ${r.house} 宫，这件事就落在「${TXT.houses[r.house]}」上。`;
      }
      html += `<div class="card card--inset" style="padding:16px 18px;margin:12px 0">
        <div class="between" style="align-items:baseline;gap:10px;flex-wrap:wrap">
          <strong>${meta.glyph} ${meta.cn} · ${r.sign.cn}${r.retro && r.id !== 'pluto' ? ' R' : ''}</strong>
          <span class="pill pill--line">第 ${r.house} 宫</span>
        </div>
        <p class="small" style="margin:8px 0 0">${body}</p>
      </div>`;
    });

    const retros = list.filter(r => r.retro).map(r => TXT.planets[r.id].cn);
    if (retros.length) {
      html += `<div class="note" style="margin-bottom:0">这张盘上${retros.join('、')}是逆行。逆行在这里不是说「做不到」，而是说这一部分你更习惯往里处理、比别人慢半拍才表态；它常对应童年或长期环境里被压过一段的经历。</div>`;
    }
    card.innerHTML = html;
  }

  /* ---------- 星盘 ---------- */
  function renderChart(chart) {
    const card = document.getElementById('chartcard');
    card.innerHTML = `
      <div class="between" style="margin-bottom:12px">
        <h2 style="margin:0">星盘</h2>
        <select id="sys" style="padding:7px 12px;border:1.5px solid var(--line);border-radius:12px;background:#fffdf6;font-family:inherit;font-size:13px;color:var(--ink)">
          <option value="placidus"${system === 'placidus' ? ' selected' : ''}>Placidus（默认）</option>
          <option value="whole"${system === 'whole' ? ' selected' : ''}>整宫制 Whole Sign</option>
          <option value="equal"${system === 'equal' ? ' selected' : ''}>等宫制 Equal</option>
        </select>
      </div>
      <div class="chart-wrap">
        <div id="wheel"></div>
        <div class="chart-legend">
          <h3 style="margin-top:0">落点</h3>
          <ul id="legend"></ul>
        </div>
      </div>
      <details class="fold"><summary>怎么看这张图</summary>
        <p class="small" style="margin-bottom:0">外圈是十二星座，中圈的分割线是十二宫的宫头，宫头旁的淡色数字是宫位编号。上升点（ASC）在左侧，逆时针方向是第二宫。行星符号旁的小数字是它落在该星座的度数，带 R 的是逆行。中间那些连线是相位：偏金色的是合相，绿色系是三分/六分（和谐），红褐色是四分/冲（张力），越靠近圆心画得越实，说明相位越精确。</p>
      </details>`;

    window.ChartDraw.render(document.getElementById('wheel'), chart, { size: 460 });

    const legend = document.getElementById('legend');
    legend.innerHTML = '';
    chart.rows.forEach(row => {
      const meta = TXT.planets[row.id];
      const li = document.createElement('li');
      li.innerHTML = `<span><span style="color:#a89355;margin-right:6px">${meta.glyph}</span>${meta.cn}</span>
        <span class="muted">${A.fmtLon(row.lon)}${row.retro && row.id !== 'sun' && row.id !== 'moon' ? ' R' : ''}</span>`;
      legend.appendChild(li);
    });

    document.getElementById('sys').addEventListener('change', function () {
      system = this.value;
      redraw();
    });
  }

  /* ---------- 三大 ---------- */
  function renderThree(chart) {
    const sun = chart.rows[0], moon = chart.rows[1];
    const asc = chart.ascSign;
    const card = document.getElementById('three');
    card.innerHTML = `
      <h2>三个最重要的位置 <span class="badge badge--A" title="行星黄经与宫头由星历算出">A</span></h2>
      <p class="small muted">太阳是「你怎么活」，月亮是「你需要什么才安心」，上升是「别人先看到什么」。</p>

      <h3>太阳 · ${sun.sign.cn}（第 ${sun.house} 宫）</h3>
      <p style="margin-bottom:6px">${TXT.inSign.sun[sun.sign.id]}</p>
      <p class="small muted">这一层主要作用在「${TXT.houses[sun.house]}」这件事上。</p>

      <h3>月亮 · ${moon.sign.cn}（第 ${moon.house} 宫）</h3>
      <p style="margin-bottom:6px">${TXT.inSign.moon[moon.sign.id]}</p>
      <p class="small muted">这一层主要作用在「${TXT.houses[moon.house]}」这件事上。</p>
      <p class="small muted">月亮的位置对出生时间敏感：如果时间只记得大概，这一条也可能是条件成立。</p>

      <h3>上升 · ${asc.cn}</h3>
      <p style="margin-bottom:6px">${TXT.asc[asc.id]}</p>
      <p class="small faint">上升点完全由「时间 + 地点」决定。时间差 4 分钟，上升约走 1°；差 30 分钟，可能整体换座。</p>

      <div class="note" style="margin-bottom:0">
        把这三条放在一起读：太阳在${sun.sign.cn}，你的核心表达以${sun.sign.el}象为底色；月亮在${moon.sign.cn}，情绪上${TXT.inSign.moon[moon.sign.id].split('；')[0]}；而别人先看到的是${TXT.asc[asc.id].split('；')[0]}。三者并不总一致，不一致的地方正是最值得留意的地方。
      </div>`;
  }

  /* ---------- 行星表 + 宫位 ---------- */
  function renderTables(chart) {
    const card = document.getElementById('tablecard');
    let html = `<h2>行星落座与落宫 <span class="badge badge--A" title="星历计算">A</span></h2>
      <table class="kv"><thead><tr><th>行星</th><th>位置</th><th>宫位</th><th>状态</th></tr></thead><tbody>`;
    chart.rows.forEach(row => {
      const meta = TXT.planets[row.id];
      html += `<tr><td>${meta.glyph} ${meta.cn}</td><td class="mono">${A.fmtLon(row.lon)}</td><td>${row.house}</td>
        <td class="small muted">${row.retro && row.id !== 'sun' && row.id !== 'moon' ? '逆行' : (row.id === 'sun' || row.id === 'moon' ? '恒顺行' : '顺行')}</td></tr>`;
    });
    html += `</tbody></table>`;

    html += `<h2 style="margin-top:26px">十二宫宫头</h2>
      <table class="kv"><thead><tr><th>宫</th><th>宫头</th><th>主题</th></tr></thead><tbody>`;
    chart.houses.cusps.forEach((c, i) => {
      html += `<tr><td>第 ${i + 1} 宫</td><td class="mono">${A.fmtLon(c)}</td><td class="small muted">${TXT.houses[i + 1]}</td></tr>`;
    });
    html += `</tbody></table>`;

    if (chart.houses.fallback) {
      html += `<div class="note note--warn">该纬度下 Placidus 无法求解（接近极圈），已自动退回等宫制。</div>`;
    }
    card.innerHTML = html;
  }

  /* ---------- 相位 ---------- */
  function renderAspects(chart) {
    const card = document.getElementById('aspcard');
    const major = chart.aspects.filter(a => a.kind === 'major').slice(0, 14);
    let html = `<h2>主要相位 <span class="badge badge--A" title="由黄经差算出">A</span> <span class="badge badge--B" title="相位含义属占星理论">B</span></h2>
      <p class="small muted">按精确度排序。容许度：日月 8°、个人行星 6°、外行星 4°。"入"表示正在逼近、影响加强；"出"表示已经过去、影响减弱。</p>`;
    if (!major.length) {
      html += `<p class="small">没有落在容许度内的主要相位。</p>`;
    } else {
      const groups = [];
      major.forEach(a => {
        let g = groups.filter(x => x.name === a.name)[0];
        if (!g) {
          const tension = ['四分相', '冲相'].includes(a.name);
          const desc = TXT.aspects[a.name] ? (tension ? TXT.aspects[a.name].tension : TXT.aspects[a.name].harmony) : '';
          g = { name: a.name, desc: desc, items: [] };
          groups.push(g);
        }
        g.items.push(a);
      });

      const houseOf = id => {
        if (id === 'asc') return 1;
        if (id === 'mc') return 10;
        const row = chart.rows.filter(r => r.id === id)[0];
        return row ? row.house : null;
      };

      groups.forEach(g => {
        html += `<h3 style="margin-top:20px">${g.name}</h3>
          <p class="small muted" style="margin:4px 0 10px">${g.desc}</p>`;
        g.items.forEach(a => {
          const na = TXT.planets[a.a] ? TXT.planets[a.a].cn : a.a.toUpperCase();
          const nb = TXT.planets[a.b] ? TXT.planets[a.b].cn : a.b.toUpperCase();
          const ha = houseOf(a.a), hb = houseOf(a.b);
          const haTxt = ha ? `（第 ${ha} 宫）` : '';
          const hbTxt = hb ? `（第 ${hb} 宫）` : '';
          html += `<div class="card card--inset" style="padding:12px 16px;margin:8px 0">
            <div class="between" style="gap:10px;flex-wrap:wrap">
              <strong>${na}${haTxt} ${a.symbol} ${nb}${hbTxt}</strong>
              <span class="pill pill--line">误差 ${a.exact.toFixed(2)}° · ${a.applying ? '入' : '出'}</span>
            </div>
          </div>`;
        });
      });
    }
    html += `<details class="fold"><summary>次要相位</summary><p class="small" style="margin-bottom:0">半六分、半四分、补十二分、五分相的容许度收紧到 2.5°，只在相当精确时才算，避免噪音。它们反映的是细微的处理方式差异，不构成主要结论。</p></details>`;
    card.innerHTML = html;
  }

  /* ---------- 元素与模式 ---------- */
  function renderElements(chart) {
    const card = document.getElementById('elemcard');
    const total = 9;
    let html = `<h2>元素与模式配比 <span class="badge badge--A" title="按落座统计">A</span></h2>
      <p class="small muted">按十颗行星中的九颗（不含冥王）统计。配比不说明好坏，说明的是「默认用哪种方式应对」。缺一个元素，往往是最容易被忽略、也最容易在压力下失守的地方。</p>
      <div class="grid2">`;

    html += `<div><h3 style="margin-top:0">元素</h3>`;
    Object.entries(chart.elements).forEach(([k, v]) => {
      html += `<div class="lean"><div class="lean__head"><span>${k}</span><span class="muted">${v} / ${total}</span></div>
        <div class="lean__track"><div class="lean__fill" style="left:0;width:${(v / total * 100).toFixed(0)}%"></div></div></div>`;
    });
    html += `</div><div><h3 style="margin-top:0">模式</h3>`;
    Object.entries(chart.modes).forEach(([k, v]) => {
      html += `<div class="lean"><div class="lean__head"><span>${k}</span><span class="muted">${v} / ${total}</span></div>
        <div class="lean__track"><div class="lean__fill" style="left:0;width:${(v / total * 100).toFixed(0)}%"></div></div></div>`;
    });
    html += `</div></div>
      <div class="note" style="margin-bottom:0">元素说的是「用什么材料处理事情」：火＝直接行动，土＝实做与积累，风＝思考与交换，水＝感受与联结。模式说的是「什么时候动」：基本＝启动，固定＝维持，变动＝调整。</div>`;
    card.innerHTML = html;
  }

  /* ---------- 方法说明 ---------- */
  function renderMethod() {
    const card = document.getElementById('method');
    card.innerHTML = `
      <h2>这张盘是怎么算出来的，以及它不能做什么</h2>
      <p class="small">行星黄经：太阳与水金火木土天海用 JPL 近似开普勒根数（1800–2050 有效），月亮用 Meeus 第 47 章主项级数。坐标从 J2000 黄道经岁差、章动修正到当日黄道，并做光行时修正。上升与中天由当地恒星时与黄赤交角算出，宫头用 Placidus 数值求解。</p>
      <p class="small">精度：行星黄经误差在 0.02° 量级；冥王星在 0.1° 量级。真正影响结论的不是算法，而是出生时间与地点的精度——时间差 4 分钟约等于上升 1°，城市坐标精确到市级会带来约 ±1° 的上升偏差。</p>
      <p class="small" style="margin-bottom:0">占星没有因果层的实证支持。这张盘上的位置是算出来的（A 级），对位置的解读属于理论与传统（B、C 级）。两者我做了区分，没有混在一起说成一样确定的事。</p>`;
  }

  /* ---------- 时间未知：四盘对比 ---------- */
  function renderUnknown() {
    const sunNoon = chartOf('placidus', 12, 0);
    const eps = sunNoon.houses.eps;
    const sunLon = sunNoon.positions.sun.lon;
    const dec = Math.asin(Math.sin(eps * Math.PI / 180) * Math.sin(sunLon * Math.PI / 180)) * 180 / Math.PI;
    const phi = b.lat * Math.PI / 180;
    const h0 = Math.acos(Math.max(-1, Math.min(1, -Math.tan(phi) * Math.tan(dec * Math.PI / 180)))) * 180 / Math.PI / 15;
    const solarNoon = 12 - (b.lon - b.tz * 15) / 15 + (b.dst ? 1 : 0);
    const times = [
      { label: '日出前后', h: solarNoon - h0 },
      { label: '正午前后', h: solarNoon },
      { label: '日落前后', h: solarNoon + h0 },
      { label: '子夜前后', h: solarNoon + 12 > 24 ? solarNoon + 12 - 24 : solarNoon + 12 }
    ].map(t => ({ label: t.label, h: Math.round((t.h + 24) % 24 * 60) }))
      .map(t => ({ label: t.label, hour: Math.floor(t.h / 60), minute: t.h % 60 }));

    const charts = times.map(t => ({ ...t, chart: chartOf('placidus', t.hour, t.minute) }));

    const card = document.createElement('div');
    card.className = 'card';
    let html = `<h2>时间未知：四盘对照</h2>
      <p class="small muted">按你填的日期与地点，取日出、正午、日落、子夜四个时刻各排一盘。上升点在这四盘之间摆动的范围，就是「时间不确定」带来的真实误差。</p>
      <div class="auto-grid">`;
    charts.forEach(c => {
      html += `<div class="card card--inset" style="padding:12px">
        <div class="small" style="font-weight:600;margin-bottom:4px">${c.label} · ${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}</div>
        <div id="mini-${c.label}" class="mini-chart"></div>
        <div class="small muted">上升 ${c.chart.ascSign.cn}</div>
      </div>`;
    });
    html += `</div>
      <h3>哪些结论仍然成立</h3>
      <table class="kv"><thead><tr><th>可以确定</th><th>不能确定</th></tr></thead><tbody>
        <tr><td>太阳星座（边缘日期除外）<br>月亮星座（边缘日期除外）<br>外行星落座<br>行星彼此的相位（除月亮）</td>
          <td>上升星座<br>十二宫宫头与行星落宫<br>与上升/中天的相位<br>月亮的精确相位<br>一切时间敏感的结论</td></tr>
      </tbody></table>
      <div class="note">下方的主盘用的是「正午」这一盘，只为让图表有个参照。凡涉及上升与宫位的句子，请当作「条件成立」，不要当结论用。</div>`;
    card.innerHTML = html;
    return { card, charts };
  }

  /* ---------- 行运 / 日返 / 月返 ---------- */
  function renderForecast(chart) {
    const F = window.Foretell, TT = window.TransitEngine;
    const card = document.getElementById('forecast');
    const natalSun = chart.rows.find(r => r.id === 'sun').lon;
    const natalMoon = chart.rows.find(r => r.id === 'moon').lon;
    const nowJD = TT.jdNow();
    const nowYear = new Date().getFullYear();

    const tr = F.transitNow(chart, nowJD);

    let html = `<h2>行运 · 日返 · 月返</h2>
      <p class="small muted">行运是「此刻天上的行星落在我本命的哪里」，日返是「每年生日那一刻的盘，管一年」，月返是「每次月亮回到本命位置那一刻的盘，管一个月」。三者都是时间层，不改变本命盘的基本结构。</p>

      <h3>一、当下行运 <span class="badge badge--A">A</span></h3>
      <p class="small muted">观测时刻 ${(function () { const p = F.jdParts(tr.jd, b.tz); return `${p.dateStr} ${p.timeStr} 当地（UTC+${b.tz}）· ${TT.fmtDateTime(tr.jd)} 世界时`; })()} · 月相 ${tr.moon.phase}（照亮 ${tr.moon.illum}%）${tr.retros.length ? ' · 逆行：' + tr.retros.join('、') : ' · 无行星逆行'}</p>
      <div class="row" style="gap:8px">`;
    tr.transRows.forEach(r => {
      const cn = window.ASTRO_TEXT.signs[r.sign.id].cn.replace('座', '');
      html += `<span class="pill pill--line">${r.cn} ${cn} ${Math.floor(r.lon % 30)}°${r.retro ? ' R' : ''}</span>`;
    });
    html += `</div>`;

    if (tr.aspects.length) {
      html += `<h3 style="margin-top:22px">此刻与本命点的相位</h3>
        <table class="kv"><thead><tr><th>行运</th><th>相位</th><th>本命</th><th>容许度</th><th>精确</th></tr></thead><tbody>`;
      tr.aspects.slice(0, 10).forEach(a => {
        html += `<tr><td>${a.tCn}${a.retro ? ' R' : ''}</td><td>${a.symbol} ${a.aspect}</td><td>${a.nCn}</td>
          <td class="mono">${a.orb.toFixed(1)}° ${a.applying ? '入' : '出'}</td><td class="small muted">${a.exactStr}</td></tr>`;
      });
      html += `</tbody></table>`;

      html += `<h3 style="margin-top:22px">这些行运落到你身上是什么事</h3>
        <p class="small muted">按精确度取前五条。每条说的是：哪颗星在动、动的方向、撞上你盘上的哪一块，所以最近什么事会被挑起来。</p>`;
      tr.aspects.slice(0, 5).forEach(a => {
        const tone = TRANSIT_TONE[a.tBody] || '这一段的一般事务';
        const tension = ['四分相', '冲相'].includes(a.aspect);
        const verb = (tension ? TRANSIT_VERB_TENSION : TRANSIT_VERB_HARMONY)[a.tBody] || '这段时间相关的事会被放大';
        const stage = a.applying ? '还在逼近，接下来一两周会更明显' : '已经过去，正在减弱';
        const h = a.nBody === 'asc' ? 1 : a.nBody === 'mc' ? 10 : (chart.rows.find(r => r.id === a.nBody) || {}).house;
        const where = h ? `本命${a.nCn}（第 ${h} 宫，${TXT.houses[h]}）` : `本命${a.nCn}`;
        html += `<div class="card" style="padding:15px 17px;margin:10px 0">
          <div class="between" style="align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:6px">
            <strong>行运${a.tCn}${a.symbol}${where} <span class="muted small">${a.aspect}</span></strong>
            <span class="pill pill--line">误差 ${a.orb.toFixed(2)}° · ${a.applying ? '入' : '出'}</span>
          </div>
          <p class="small" style="margin:0 0 6px">${a.tCn}动的是「${tone}」：${verb}。</p>
          <p class="small faint" style="margin:0">${stage}。${tension && a.applying ? '这一条还在加强，别在这个主题上做不可逆的决定。' : ''}</p>
        </div>`;
      });
      html += `<p class="small muted">这五条只说明压力与机会落在哪个主题上，不说明具体会发生什么。具体事件取决于你在这个主题上实际在做什么。</p>`;
    } else {
      html += `<p class="small">此刻没有落在容许度内的行运相位。这不代表什么事都没有，只代表天上没有哪颗星正精确压在你盘上的某一点上——这段时间更适合处理自己的节奏，而不是等外部事件。</p>`;
    }

    const phaseTone = MOON_PHASE_TONE[tr.moon.phase];
    html += `<div class="note" style="margin-bottom:0">
      <strong>月相在这里的作用</strong>：现在是${tr.moon.phase}（照亮 ${tr.moon.illum}%），${phaseTone || '按月相推进安排节奏'}。月相变的是「哪类事容易起波动」，不改变你盘上的长期结构。
      ${tr.retros.length ? `<br><strong>逆行</strong>：${tr.retros.join('、')}正在逆行。逆行期适合复盘、修整、把旧事收尾，不适合开新局；其中水星逆行影响最具体——合同、文书、沟通与设备。` : '<br><strong>逆行</strong>：此刻没有行星逆行，是推进新事相对省力的窗口。'}
    </div>`;

    if (b.timeUnknown) {
      html += `<div class="note note--warn">日返与月返都需要精确出生时间（上升与宫位要重算）。你的档案是「时间未知」，这两块先不生成。</div>`;
      card.innerHTML = html;
      return;
    }

    /* 太阳返照：取当前所在太阳年 + 下一次 */
    const srs = [];
    [nowYear - 1, nowYear, nowYear + 1].forEach(y => {
      const s = F.solarReturn(b, natalSun, y);
      if (s) srs.push(s);
    });
    const cur = srs.filter(s => s.jd <= nowJD).sort((x, y) => y.jd - x.jd)[0] || null;
    const nxt = srs.filter(s => s.jd > nowJD).sort((x, y) => x.jd - y.jd)[0] || null;

    function srBlock(s, tag, id) {
      if (!s) return '';
      const sun = s.chart.rows.find(r => r.id === 'sun');
      const moon = s.chart.rows.find(r => r.id === 'moon');
      const asc = s.chart.ascSign;
      const changed = asc.id !== chart.ascSign.id;
      return `<div class="card" style="padding:20px 22px;margin:14px 0">
        <div class="between" style="align-items:flex-start">
          <div>
            <div class="muted small">${tag}</div>
            <h3 style="margin:4px 0 6px">${s.parts.dateStr} ${s.parts.timeStr} 起，管到次年同日前</h3>
          </div>
          <span class="pill">太阳回到本命 ${A.fmtLon(natalSun)}</span>
        </div>
        <div class="grid2" style="gap:18px;align-items:start">
          <div><div id="${id}" class="mini-chart"></div></div>
          <div>
            <p class="small" style="margin-bottom:8px"><strong>重心：</strong>太阳落在第 ${sun.house} 宫——「${TXT.houses[sun.house]}」是这一年的主轴。</p>
            <p class="small" style="margin-bottom:8px"><strong>姿态：</strong>返照上升在${asc.cn}，${TXT.asc[asc.id].split('；')[0]}。${changed ? '与出生上升不同，说明这一年外部环境要你用另一套方式出场。' : '与出生上升相同，说明这一年的外部条件与你熟悉的模式接近。'}</p>
            <p class="small" style="margin-bottom:0"><strong>情绪基调：</strong>月亮在${moon.sign.cn}第 ${moon.house} 宫，${TXT.inSign.moon[moon.sign.id].split('；')[0]}。</p>
          </div>
        </div>
      </div>`;
    }

    html += `<h3 style="margin-top:26px">二、太阳返照（日返）</h3>
      <p class="small muted">日返盘只看三件事：太阳落宫（一年重心）、返照上升（这一年的出场方式）、月亮落宫（情绪基调）。它不预测事件，只描述这一年的默认剧本。</p>`;
    html += srBlock(cur, '当前太阳年', 'sr-cur');
    html += srBlock(nxt, '下一次（新一轮）', 'sr-next');

    const lr = F.lunarReturn(b, natalMoon, nowJD);
    if (lr) {
      const moon = lr.chart.rows.find(r => r.id === 'moon');
      const asc = lr.chart.ascSign;
      const daysTo = Math.round(lr.jd - nowJD);
      html += `<h3 style="margin-top:26px">三、月亮返照（月返）</h3>
        <p class="small muted">下一次月返在 ${lr.parts.dateStr} ${lr.parts.timeStr}（约 ${daysTo} 天后），管约 27.3 天。月返看的是这个月的情绪节奏与短期重点。</p>
        <div class="grid2" style="gap:18px;align-items:start;margin-top:12px">
          <div><div id="lr" class="mini-chart"></div></div>
          <div>
            <p class="small" style="margin-bottom:8px"><strong>情绪主线：</strong>月亮回到本命位置，落在${moon.sign.cn}第 ${moon.house} 宫，${TXT.inSign.moon[moon.sign.id].split('；')[0]}。</p>
            <p class="small" style="margin-bottom:8px"><strong>这个月的姿态：</strong>月返上升在${asc.cn}，${TXT.asc[asc.id].split('；')[0]}。</p>
            <p class="small" style="margin-bottom:0"><strong>用法：</strong>月返不改变长期结构，只决定哪几件事这一个月特别容易起波动。${moon.house === 4 || moon.house === 8 || moon.house === 12 ? '月亮落在内省宫位，这个月适合收，不适合冲。' : '月亮落在行动宫位，这个月适合把拖着的事推一步。'}</p>
          </div>
        </div>`;
    }

    html += `<div class="note note--warn" style="margin-bottom:0">返照盘的上升完全由「返照时刻 + 地点」决定。如果你已不在出生地，用现居地重排会得到不同的上升——这一点没有对错，看你用哪套参照。本页统一用出生地。</div>`;
    card.innerHTML = html;

    setTimeout(() => {
      [['sr-cur', cur], ['sr-next', nxt], ['lr', lr]].forEach(([id, s]) => {
        const node = document.getElementById(id);
        if (node && s) window.ChartDraw.render(node, s.chart, { size: 260 });
      });
    }, 0);
  }

  /* ---------- 重绘 ---------- */
  function redraw() {
    const chart = chartOf(system);
    renderHead(chart);
    renderSummary(chart);
    renderChart(chart);
    renderThree(chart);
    renderPlanets(chart);
    renderForecast(chart);
    renderTables(chart);
    renderAspects(chart);
    renderElements(chart);
    renderMethod();
  }

  shell();
  redraw();

  if (b.timeUnknown) {
    const unk = renderUnknown();
    const anchor = document.getElementById('chartcard');
    anchor.parentNode.insertBefore(unk.card, anchor);
    setTimeout(() => {
      unk.charts.forEach(c => {
        const node = document.getElementById('mini-' + c.label);
        if (node) window.ChartDraw.render(node, c.chart, { size: 240 });
      });
    }, 0);
  }
})();
