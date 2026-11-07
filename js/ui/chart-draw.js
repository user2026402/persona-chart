/* 星盘绘制：SVG 轮盘（黄道十二宫环 + 宫位 + 行星 + 相位线） */
(function (root) {
  'use strict';
  const SVGNS = 'http://www.w3.org/2000/svg';

  // 星座符号必须走文字形态（加 U+FE0E），否则 Windows 会渲染成紫色 emoji 方块
  const SIGN_GLYPH = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓']
    .map(function (s) { return s + '\uFE0E'; });
  const EL_FILL = {
    火: '#fbe7dd',
    土: '#efe9cf',
    风: '#e4edf0',
    水: '#e5ece0'
  };
  const ASPECT_COLOR = {
    合相: '#e6b93c',
    三分相: '#a9bd8b',
    六分相: '#8fb6a2',
    四分相: '#e0a08c',
    冲相: '#d08a72',
    半六分: '#cfc6ae',
    半四分: '#cfc6ae',
    补十二分: '#cfc6ae',
    五分相: '#cfc6ae'
  };

  function el(tag, attrs, parent) {
    const n = document.createElementNS(SVGNS, tag);
    if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function polar(cx, cy, r, angleDeg) {
    const a = angleDeg * Math.PI / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  function render(container, chart, opts) {
    opts = opts || {};
    const size = opts.size || 460;
    const cx = size / 2, cy = size / 2;
    const R = size / 2 - 8;
    const asc = chart.houses.asc;
    const toScreen = lon => 180 - (lon - asc);

    container.innerHTML = '';
    const svg = el('svg', { viewBox: `0 0 ${size} ${size}`, class: 'chart-svg', role: 'img' }, container);
    el('title', {}, svg).textContent = '本命盘';

    const g = el('g', {}, svg);

    // 底盘
    el('circle', { cx, cy, r: R, fill: '#fffcf0', stroke: '#f0e2ba', 'stroke-width': 1 }, g);
    el('circle', { cx, cy, r: R * 0.96, fill: 'none', stroke: '#f7eccf' }, g);

    // 黄道十二宫环
    const signInner = R * 0.72, signOuter = R * 0.96;
    for (let i = 0; i < 12; i++) {
      const a0 = toScreen(i * 30), a1 = toScreen(i * 30 + 30);
      const p1 = polar(cx, cy, signOuter, a0);
      const p2 = polar(cx, cy, signOuter, a1);
      const p3 = polar(cx, cy, signInner, a1);
      const p4 = polar(cx, cy, signInner, a0);
      const elsign = root.Astro.SIGNS[i].el;
      el('path', {
        d: `M${p1.x} ${p1.y} A${signOuter} ${signOuter} 0 0 1 ${p2.x} ${p2.y} L${p3.x} ${p3.y} A${signInner} ${signInner} 0 0 0 ${p4.x} ${p4.y} Z`,
        fill: EL_FILL[elsign] || '#f7f2e2',
        stroke: '#eae0c6',
        'stroke-width': 0.8
      }, g);
      const mid = polar(cx, cy, (signInner + signOuter) / 2, toScreen(i * 30 + 15));
      const t = el('text', {
        x: mid.x, y: mid.y + 5, 'text-anchor': 'middle',
        'font-size': 15, fill: '#8b8168',
        'font-family': '"Segoe UI Symbol", "Noto Sans Symbols 2", serif',
        'font-variant-emoji': 'text'
      }, g);
      t.textContent = SIGN_GLYPH[i];
    }

    // 宫位线
    chart.houses.cusps.forEach((c, i) => {
      const a = toScreen(c);
      const p1 = polar(cx, cy, R * 0.30, a);
      const p2 = polar(cx, cy, signInner, a);
      const major = i % 3 === 0;
      el('line', {
        x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
        stroke: major ? '#d9cdab' : '#efe6cd',
        'stroke-width': major ? 1.4 : 0.9,
        'stroke-dasharray': major ? 'none' : '3 3'
      }, g);
      const midA = toScreen((c + ((chart.houses.cusps[(i + 1) % 12] - c + 360) % 360) / 2));
      const lp = polar(cx, cy, R * 0.38, midA);
      const lt = el('text', { x: lp.x, y: lp.y + 4, 'text-anchor': 'middle', 'font-size': 10, fill: '#b3a98e' }, g);
      lt.textContent = i + 1;
    });

    // 相位线（先画，压在行星下面；贯穿内圈，便于直接看出哪些行星互相牵动）
    chart.aspects.forEach(asp => {
      const pa = chart.points[asp.a], pb = chart.points[asp.b];
      if (!pa || !pb) return;
      const a1 = toScreen(pa.lon), a2 = toScreen(pb.lon);
      const r = R * 0.68;
      const p1 = polar(cx, cy, r, a1), p2 = polar(cx, cy, r, a2);
      el('line', {
        x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
        stroke: ASPECT_COLOR[asp.name] || '#ddd3b8',
        'stroke-width': asp.kind === 'major' ? (1.2 + asp.strength * 1.1) : 0.7,
        opacity: asp.kind === 'major' ? 0.5 + asp.strength * 0.35 : 0.3
      }, g);
    });

    // 行星：黄经过于接近时错开到内一圈，避免符号重叠成一团
    const rings = [R * 0.795, R * 0.695];
    const placed = [];
    const angDist = (a, b) => {
      const d = Math.abs(((a - b) % 360 + 360) % 360);
      return d > 180 ? 360 - d : d;
    };

    chart.rows.forEach(row => {
      const a = toScreen(row.lon);
      let ring = 0;
      while (ring < rings.length &&
        placed.some(p => p.ring === ring && angDist(p.lon, row.lon) < 7.5)) ring++;
      if (ring >= rings.length) ring = 0;
      placed.push({ lon: row.lon, ring });

      const pt = polar(cx, cy, rings[ring], a);
      const meta = root.ASTRO_TEXT.planets[row.id];
      const isRetro = row.retro && row.id !== 'sun' && row.id !== 'moon';
      const big = row.id === 'sun' || row.id === 'moon';
      const size = (big ? 19 : 16) - (ring ? 3 : 0);
      const t = el('text', {
        x: pt.x, y: pt.y + size * 0.32, 'text-anchor': 'middle',
        'font-size': size,
        fill: row.id === 'sun' ? '#d99b27' : row.id === 'moon' ? '#8a9a6a' : '#6b6450'
      }, g);
      t.textContent = meta ? meta.glyph : '●';
      // 度数往圆心方向退 12px，既不压住符号，也不挤黄道环
      const ux = (pt.x - cx) / rings[ring], uy = (pt.y - cy) / rings[ring];
      const deg = el('text', {
        x: pt.x - ux * 12, y: pt.y - uy * 12 + 3, 'text-anchor': 'middle',
        'font-size': 8.2, fill: '#9d947c'
      }, g);
      deg.textContent = `${Math.floor(row.sign.degInSign)}°${isRetro ? 'R' : ''}`;
    });

    // 四轴标记
    const axisMark = (lon, label, color) => {
      const a = toScreen(lon);
      const p1 = polar(cx, cy, R * 0.96, a);
      const p2 = polar(cx, cy, R, a);
      el('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: color, 'stroke-width': 2.4 }, g);
      const lp = polar(cx, cy, R * 1.0, a);
      const t = el('text', {
        x: lp.x, y: lp.y + 3.5, 'text-anchor': 'middle', 'font-size': 9, fill: color, 'font-weight': 700
      }, g);
      t.textContent = label;
    };
    axisMark(asc, 'ASC', '#b8822b');
    axisMark(chart.houses.mc, 'MC', '#b8822b');
    axisMark((asc + 180) % 360, 'DSC', '#c9bd9c');
    axisMark((chart.houses.mc + 180) % 360, 'IC', '#c9bd9c');

    // 中心圆
    el('circle', { cx, cy, r: R * 0.29, fill: '#fdf8e8', stroke: '#efe5c8' }, g);
  }

  root.ChartDraw = { render, SIGN_GLYPH };
})(typeof globalThis !== 'undefined' ? globalThis : this);
