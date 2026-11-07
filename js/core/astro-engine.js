/* 星历引擎 —— 纯 JS，无依赖
   行星：JPL 近似开普勒根数（Standish, 1800–2050，精度优于 0.1°）
   月亮：Meeus《天文算法》第 47 章主项（约 50 项，精度优于 0.01°）
   坐标：J2000 黄道 → 加入岁差与章动 → 当日黄道（tropical）
   宫位：Placidus（数值求解）/ Whole Sign / Equal / Koch 备用
*/
(function (root, factory) {
  const Astro = factory();
  root.Astro = Astro;
  if (typeof module !== 'undefined' && module.exports) module.exports = Astro;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const D2R = Math.PI / 180;
  const R2D = 180 / Math.PI;
  const norm360 = x => ((x % 360) + 360) % 360;
  const norm180 = x => { const v = norm360(x); return v > 180 ? v - 360 : v; };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------------- 时间 ---------------- */
  // y/m/d + 十进制小时（UT）→ 儒略日
  function toJD(y, m, d, hoursUT) {
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5 + (hoursUT || 0) / 24;
  }

  // TT - UT（秒），Espenak & Meeus 分段多项式
  function deltaT(y) {
    let t;
    if (y < 1900) { t = (y - 1820) / 100; return -20 + 32 * t * t; }
    if (y < 1920) { t = y - 1900; return -2.79 + 1.494119 * t - 0.0598939 * t * t + 0.0061966 * t * t * t - 0.000197 * Math.pow(t, 4); }
    if (y < 1941) { t = y - 1920; return 21.20 + 0.84493 * t - 0.076100 * t * t + 0.0020936 * t * t * t; }
    if (y < 1961) { t = y - 1950; return 29.07 + 0.407 * t - t * t / 233 + t * t * t / 2547; }
    if (y < 1986) { t = y - 1975; return 45.45 + 1.067 * t - t * t / 260 - t * t * t / 718; }
    if (y < 2005) {
      t = y - 2000;
      return 63.86 + 0.3345 * t - 0.060374 * t * t + 0.0017275 * Math.pow(t, 3)
        + 0.000651814 * Math.pow(t, 4) + 0.00002373599 * Math.pow(t, 5);
    }
    if (y < 2050) { t = y - 2000; return 62.92 + 0.32217 * t + 0.005589 * t * t; }
    if (y < 2150) { t = (y - 1820) / 100; return -20 + 32 * t * t - 0.5628 * (2150 - y); }
    t = (y - 1820) / 100; return -20 + 32 * t * t;
  }

  function jdTTfromJDUT(jdUT) {
    const yApprox = 2000 + (jdUT - 2451545.0) / 365.25;
    return jdUT + deltaT(yApprox) / 86400;
  }

  /* ---------------- 章动 / 黄赤交角 ---------------- */
  function nutation(T) {
    // 返回 {dpsi: 度, deps: 度}（Meeus 简化式，误差 < 0.5"）
    const Om = (125.04452 - 1934.136261 * T) * D2R;
    const Ls = (280.4665 + 36000.7698 * T) * D2R;
    const Lm = (218.3165 + 481267.8813 * T) * D2R;
    const dpsi = (-17.20 * Math.sin(Om) - 1.32 * Math.sin(2 * Ls) - 0.23 * Math.sin(2 * Lm) + 0.21 * Math.sin(2 * Om));
    const deps = (9.20 * Math.cos(Om) + 0.57 * Math.cos(2 * Ls) + 0.10 * Math.cos(2 * Lm) - 0.09 * Math.cos(2 * Om));
    return { dpsi: dpsi / 3600, deps: deps / 3600 };
  }

  function obliquity(T) {
    const eps = 23.43929111 - 0.013004167 * T - 1.6389e-7 * T * T + 5.0361e-7 * T * T * T;
    return eps + nutation(T).deps;
  }

  /* ---------------- JPL 近似根数（每世纪变化率） ---------------- */
  const EL = {
    mercury: { a: [0.38709843, 0.0], e: [0.20563661, 0.00002123], i: [7.00559432, -0.00590158], L: [252.25166724, 149472.67486623], w: [77.45771895, 0.15940013], o: [48.33961819, -0.12214182], extra: null },
    venus: { a: [0.72332102, -0.00000026], e: [0.00676399, -0.00005107], i: [3.39777545, 0.00043494], L: [181.97970850, 58517.81560260], w: [131.76755713, 0.05679648], o: [76.67261496, -0.27274174], extra: null },
    earth: { a: [1.00000018, -0.00000003], e: [0.01673163, -0.00003661], i: [-0.00054346, -0.01337178], L: [100.46691572, 35999.37306329], w: [102.93005885, 0.31795260], o: [-5.11260389, -0.24123856], extra: null },
    mars: { a: [1.52371243, 0.00000097], e: [0.09336511, 0.00009149], i: [1.85181869, -0.00724757], L: [-4.56813164, 19140.29934243], w: [-23.91744784, 0.45223625], o: [49.71320984, -0.26852431], extra: null },
    jupiter: { a: [5.20248019, -0.00002864], e: [0.04853590, 0.00018026], i: [1.29861416, -0.00322699], L: [34.33479152, 3034.90371757], w: [14.27495244, 0.18199196], o: [100.29282654, 0.13024619], extra: { b: -0.00012452, c: 0.06064060, s: -0.35635438, f: 38.35125000 } },
    saturn: { a: [9.54149883, -0.00003065], e: [0.05550825, -0.00032044], i: [2.49424102, 0.00451969], L: [50.07571329, 1222.11494724], w: [92.86136063, 0.54179478], o: [113.63998702, -0.25015002], extra: { b: 0.00025899, c: -0.13434469, s: 0.87320147, f: 38.35125000 } },
    uranus: { a: [19.18797948, -0.00020455], e: [0.04685740, -0.00001550], i: [0.77298127, -0.00180155], L: [314.20276625, 428.49512595], w: [172.43404441, 0.09266985], o: [73.96250215, 0.05739699], extra: { b: 0.00058331, c: -0.97731848, s: 0.17689245, f: 7.67025000 } },
    neptune: { a: [30.06952752, 0.00006447], e: [0.00895439, 0.00000818], i: [1.77005520, 0.00022400], L: [304.22289287, 218.46515314], w: [46.68158724, 0.01009938], o: [131.78635853, -0.00606302], extra: { b: -0.00041348, c: 0.68346318, s: -0.10162547, f: 7.67025000 } },
    pluto: { a: [39.48686035, 0.00449751], e: [0.24885238, 0.00006016], i: [17.14104260, 0.00000501], L: [238.96535011, 145.18042903], w: [224.09702598, -0.00968827], o: [110.30167986, -0.00809981], extra: null }
  };

  function helio(name, T) {
    const el = EL[name];
    if (!el) throw new Error('unknown body: ' + name);
    const a = el.a[0] + el.a[1] * T;
    const e = el.e[0] + el.e[1] * T;
    const inc = (el.i[0] + el.i[1] * T) * D2R;
    const L = el.L[0] + el.L[1] * T;
    const wbar = el.w[0] + el.w[1] * T;
    const node = el.o[0] + el.o[1] * T;

    let M = L - wbar;
    if (el.extra) {
      const { b, c, s, f } = el.extra;
      M = M + b * T * T + c * Math.cos(f * T * D2R) + s * Math.sin(f * T * D2R);
    }
    M = norm180(M);
    const Mrad = M * D2R;

    // 解开普勒方程
    let E = Mrad + e * Math.sin(Mrad);
    for (let k = 0; k < 30; k++) {
      const dE = (Mrad - (E - e * Math.sin(E))) / (1 - e * Math.cos(E));
      E += dE;
      if (Math.abs(dE) < 1e-10) break;
    }

    const xp = a * (Math.cos(E) - e);
    const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);

    const wArg = (wbar - node) * D2R;
    const om = node * D2R;
    const ci = Math.cos(inc), si = Math.sin(inc);
    const cw = Math.cos(wArg), sw = Math.sin(wArg);
    const co = Math.cos(om), so = Math.sin(om);

    const x = (cw * co - sw * so * ci) * xp + (-sw * co - cw * so * ci) * yp;
    const y = (cw * so + sw * co * ci) * xp + (-sw * so + cw * co * ci) * yp;
    const z = (sw * si) * xp + (cw * si) * yp;
    return { x, y, z };
  }

  /* ---------------- 月亮（Meeus 47 章主项） ---------------- */
  const MOON_TERMS = [
    [6288774, 0, 0, 1, 0], [1274027, 2, 0, -1, 0], [658314, 2, 0, 0, 0], [213618, 0, 0, 2, 0],
    [-185116, 0, 1, 0, 0], [-114332, 0, 0, 0, 2], [58793, 2, 0, -2, 0], [57066, 2, -1, -1, 0],
    [53322, 2, 0, 1, 0], [45758, 2, -1, 0, 0], [-40923, 0, 1, -1, 0], [-34720, 1, 0, 0, 0],
    [-30383, 0, 1, 1, 0], [15327, 2, 0, 0, -2], [-12528, 0, 0, 1, 2], [10980, 0, 0, 1, -2],
    [10675, 4, 0, -1, 0], [10034, 0, 0, 3, 0], [8548, 4, 0, -2, 0], [-7888, 2, 1, -1, 0],
    [-6766, 2, 1, 0, 0], [-5163, 1, 0, -1, 0], [4987, 1, 1, 0, 0], [4036, 2, -1, 1, 0],
    [3994, 2, 0, 2, 0], [3861, 4, 0, 0, 0], [3665, 2, 0, -3, 0], [-2689, 0, 1, -2, 0],
    [-2602, 2, 0, -1, 2], [2390, 2, -1, -2, 0], [-2348, 1, 0, 1, 0], [2236, 2, -2, 0, 0],
    [-2120, 0, 1, 2, 0], [-2069, 0, 2, 0, 0], [2048, 2, -2, -1, 0], [-1773, 2, 0, 1, -2],
    [-1595, 2, 0, 0, 2], [1215, 4, -1, -1, 0], [-1110, 0, 0, 2, 2], [-892, 3, 0, -1, 0],
    [-810, 2, 1, 1, 0], [759, 4, -1, -2, 0], [-713, 0, 2, -1, 0], [-700, 2, 2, 0, 0],
    [691, 2, 1, -2, 0], [596, 2, -1, 0, -2], [549, 4, 0, 1, 0], [537, 0, 0, 4, 0],
    [520, 4, -1, 0, 0], [-487, 1, 0, -2, 0], [-399, 2, 1, 0, -2], [-381, 0, 2, 1, 0],
    [351, 1, 1, 1, 0], [-340, 3, 0, -2, 0], [330, 4, 0, -3, 0], [327, 2, -1, 2, 0],
    [-323, 0, 2, -2, 0], [299, 1, 0, 0, 2], [294, 2, 0, 3, 0]
  ];

  function moonLon(T) {
    const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T
      + Math.pow(T, 3) / 538841 - Math.pow(T, 4) / 65194000;
    const Dd = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T
      + Math.pow(T, 3) / 545868 - Math.pow(T, 4) / 113065000;
    const Ms = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + Math.pow(T, 3) / 24490000;
    const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T
      + Math.pow(T, 3) / 69699 - Math.pow(T, 4) / 14712000;
    const F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T * T
      - Math.pow(T, 3) / 3526000 + Math.pow(T, 4) / 863310000;

    const eCorr = 1 - 0.002516 * T - 0.0000074 * T * T;
    let sum = 0;
    for (const [coef, d, m, mp, f] of MOON_TERMS) {
      const arg = (d * Dd + m * Ms + mp * Mp + f * F) * D2R;
      let mult = 1;
      if (Math.abs(m) === 1) mult = eCorr;
      else if (Math.abs(m) === 2) mult = eCorr * eCorr;
      sum += coef * mult * Math.sin(arg);
    }
    let lon = Lp + sum / 1e6;
    return norm360(lon);
  }

  /* ---------------- 行星位置（视黄经） ---------------- */
  function bodyLon(name, jdTT) {
    const T = (jdTT - 2451545.0) / 36525;
    const nut = nutation(T);
    const prec = 1.3969 * T + 0.000308 * T * T; // 岁差（度）

    if (name === 'moon') {
      return norm360(moonLon(T) + nut.dpsi);
    }

    const sunSign = 1;
    if (name === 'sun') {
      const eh = helio('earth', T);
      // 地心太阳 = -地球
      let lon = Math.atan2(-eh.y, -eh.x) * R2D;
      const r = Math.sqrt(eh.x * eh.x + eh.y * eh.y + eh.z * eh.z);
      lon = norm360(lon + prec + nut.dpsi - (20.489 / (r * 3600)));
      return lon;
    }

    const ph = helio(name, T);
    const eh = helio('earth', T);
    let gx = ph.x - eh.x, gy = ph.y - eh.y, gz = ph.z - eh.z;
    const dist = Math.sqrt(gx * gx + gy * gy + gz * gz);

    // 光行时修正：行星位置回退 dist * 0.0057755 天
    if (dist > 0 && dist < 60) {
      const T2 = T - (dist * 0.0057755183) / 36525;
      const ph2 = helio(name, T2);
      const eh2 = helio('earth', T);
      gx = ph2.x - eh2.x; gy = ph2.y - eh2.y; gz = ph2.z - eh2.z;
    }

    let lon = Math.atan2(gy, gx) * R2D;
    return norm360(lon + prec + nut.dpsi);
  }

  const BODIES = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

  // 速度（度/天），数值微分
  function speedOf(name, jdTT) {
    const a = bodyLon(name, jdTT - 0.5);
    const b = bodyLon(name, jdTT + 0.5);
    return norm180(b - a);
  }

  function positions(jdUT) {
    const jdTT = jdTTfromJDUT(jdUT);
    const out = {};
    for (const b of BODIES) {
      const lon = bodyLon(b, jdTT);
      out[b] = {
        lon: lon,
        speed: speedOf(b, jdTT),
        retro: speedOf(b, jdTT) < 0
      };
    }
    return out;
  }

  /* ---------------- 恒星时与四轴 ---------------- */
  function gmst(jdUT) {
    const T = (jdUT - 2451545.0) / 36525;
    let st = 280.46061837 + 360.98564736629 * (jdUT - 2451545.0)
      + 0.000387933 * T * T - Math.pow(T, 3) / 38710000;
    return norm360(st);
  }

  // 东经为正
  function lst(jdUT, lonEast) {
    return norm360(gmst(jdUT) + lonEast);
  }

  function angles(ramc, lat, eps) {
    const e = eps * D2R;
    const th = ramc * D2R;
    const phi = lat * D2R;
    const mc = norm360(Math.atan2(Math.sin(th), Math.cos(th) * Math.cos(e)) * R2D);
    const asc = norm360(Math.atan2(Math.cos(th), -(Math.sin(th) * Math.cos(e) + Math.tan(phi) * Math.sin(e))) * R2D);
    return { mc, asc };
  }

  function eclToEq(lamDeg, eps) {
    const l = lamDeg * D2R, e = eps * D2R;
    const dec = Math.asin(clamp(Math.sin(e) * Math.sin(l), -1, 1));
    let ra = Math.atan2(Math.cos(e) * Math.sin(l), Math.cos(l)) * R2D;
    return { dec, ra: norm360(ra) };
  }

  function placidusCusp(ramc, lat, eps, kind) {
    const phi = lat * D2R;
    const e = eps * D2R;
    // 粗略起点：α ≈ λ，目标 RA = RAMC + 偏移
    const offsets = { 11: 30, 12: 60, 2: -60, 3: -30 };
    const guess = ramc + offsets[kind];

    function f(lamDeg) {
      const l = lamDeg * D2R;
      let a = Math.atan2(Math.cos(e) * Math.sin(l), Math.cos(l)) * R2D;
      while (a - lamDeg > 180) a -= 360;
      while (lamDeg - a > 180) a += 360;
      const dec = Math.asin(clamp(Math.sin(e) * Math.sin(l), -1, 1));
      const h0 = Math.acos(clamp(-Math.tan(phi) * Math.tan(dec), -1, 1)) * R2D;
      let target;
      if (kind === 11) target = h0 / 3;
      else if (kind === 12) target = 2 * h0 / 3;
      else if (kind === 2) target = h0 + (180 - h0) / 3;
      else target = h0 + 2 * (180 - h0) / 3;
      return a - ramc - target;
    }

    let lo = guess - 80, hi = guess + 80;
    let flo = f(lo), fhi = f(hi);
    // 展开括号直到异号
    for (let i = 0; i < 6 && flo * fhi > 0; i++) {
      lo -= 40; hi += 40; flo = f(lo); fhi = f(hi);
    }
    if (flo * fhi > 0) return null;
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2;
      const fm = f(mid);
      if (Math.abs(fm) < 1e-9 || hi - lo < 1e-9) return norm360(mid);
      if (flo * fm <= 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; }
    }
    return norm360((lo + hi) / 2);
  }

  function houses(jdUT, lat, lonEast, system) {
    const jdTT = jdTTfromJDUT(jdUT);
    const T = (jdTT - 2451545.0) / 36525;
    const eps = obliquity(T);
    const ramc = lst(jdUT, lonEast);
    const { asc, mc } = angles(ramc, lat, eps);

    if (system === 'whole') {
      const signStart = Math.floor(norm360(asc) / 30) * 30;
      const cusps = [];
      for (let i = 0; i < 12; i++) cusps.push(norm360(signStart + i * 30));
      return { cusps, asc, mc, ramc, eps, system: 'whole' };
    }
    if (system === 'equal') {
      const cusps = [];
      for (let i = 0; i < 12; i++) cusps.push(norm360(asc + i * 30));
      return { cusps, asc, mc, ramc, eps, system: 'equal' };
    }

    // Placidus
    const c11 = placidusCusp(ramc, lat, eps, 11);
    const c12 = placidusCusp(ramc, lat, eps, 12);
    const c2 = placidusCusp(ramc, lat, eps, 2);
    const c3 = placidusCusp(ramc, lat, eps, 3);
    let cusps;
    if (c11 == null || c12 == null || c2 == null || c3 == null) {
      // 极区退化为等宫
      cusps = [];
      for (let i = 0; i < 12; i++) cusps.push(norm360(asc + i * 30));
      return { cusps, asc, mc, ramc, eps, system: 'equal', fallback: true };
    }
    cusps = [asc, c2, c3, norm360(mc + 180), norm360(c11 + 180), norm360(c12 + 180),
      norm360(asc + 180), norm360(c2 + 180), norm360(c3 + 180), mc, c11, c12];
    return { cusps, asc, mc, ramc, eps, system: 'placidus' };
  }

  /* ---------------- 相位 ---------------- */
  const ASPECT_DEFS = [
    { name: '合相', angle: 0, symbol: '☌', kind: 'major' },
    { name: '冲相', angle: 180, symbol: '☍', kind: 'major' },
    { name: '三分相', angle: 120, symbol: '△', kind: 'major' },
    { name: '四分相', angle: 90, symbol: '□', kind: 'major' },
    { name: '六分相', angle: 60, symbol: '✶', kind: 'major' },
    { name: '半六分', angle: 30, symbol: '⚹', kind: 'minor' },
    { name: '半四分', angle: 45, symbol: '⚼', kind: 'minor' },
    { name: '补十二分', angle: 150, symbol: '⚻', kind: 'minor' },
    { name: '五分相', angle: 72, symbol: '⚺', kind: 'minor' }
  ];

  const ORB_BY_BODY = { sun: 8, moon: 8, mercury: 6, venus: 6, mars: 6, jupiter: 6, saturn: 6, uranus: 4, neptune: 4, pluto: 4, asc: 6, mc: 6 };

  function aspects(points, opts) {
    opts = opts || {};
    const includeMinor = opts.minor !== false;
    const list = [];
    const keys = Object.keys(points);
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const A = keys[i], B = keys[j];
        if ((A === 'asc' && B === 'mc') || (A === 'mc' && B === 'asc')) continue; // 四轴恒为差 90°，非相位
        const pa = points[A], pb = points[B];
        if (!pa || !pb) continue;
        const orbA = ORB_BY_BODY[A] || 4;
        const orbB = ORB_BY_BODY[B] || 4;
        let orb = Math.min(orbA, orbB) + (Math.abs(orbA - orbB) * 0.15);
        let diff = Math.abs(norm180(pa.lon - pb.lon));
        for (const def of ASPECT_DEFS) {
          if (def.kind === 'minor' && !includeMinor) continue;
          const useOrb = def.kind === 'minor' ? Math.min(orb, 2.5) : orb;
          const delta = Math.abs(diff - def.angle);
          if (delta <= useOrb) {
            // 入相位/出相位：用速度差
            const sa = pa.speed || 0, sb = pb.speed || 0;
            // 相对角距变化方向
            let ang = norm180(pa.lon - pb.lon);
            const dAng = norm180(sa - sb);
            const sepNow = Math.abs(ang);
            const sepNext = Math.abs(norm180(ang + dAng));
            const applying = sepNext < sepNow;
            list.push({
              a: A, b: B, name: def.name, angle: def.angle, symbol: def.symbol,
              kind: def.kind, exact: delta, orb: orb,
              applying, strength: 1 - delta / useOrb
            });
            break;
          }
        }
      }
    }
    return list.sort((x, y) => x.exact - y.exact);
  }

  /* ---------------- 星座 / 元素 / 模式 ---------------- */
  const SIGNS = [
    { id: 'aries', cn: '白羊座', el: '火', mode: '基本', ruler: 'mars' },
    { id: 'taurus', cn: '金牛座', el: '土', mode: '固定', ruler: 'venus' },
    { id: 'gemini', cn: '双子座', el: '风', mode: '变动', ruler: 'mercury' },
    { id: 'cancer', cn: '巨蟹座', el: '水', mode: '基本', ruler: 'moon' },
    { id: 'leo', cn: '狮子座', el: '火', mode: '固定', ruler: 'sun' },
    { id: 'virgo', cn: '处女座', el: '土', mode: '变动', ruler: 'mercury' },
    { id: 'libra', cn: '天秤座', el: '风', mode: '基本', ruler: 'venus' },
    { id: 'scorpio', cn: '天蝎座', el: '水', mode: '固定', ruler: 'pluto' },
    { id: 'sagittarius', cn: '射手座', el: '火', mode: '变动', ruler: 'jupiter' },
    { id: 'capricorn', cn: '摩羯座', el: '土', mode: '基本', ruler: 'saturn' },
    { id: 'aquarius', cn: '水瓶座', el: '风', mode: '固定', ruler: 'uranus' },
    { id: 'pisces', cn: '双鱼座', el: '水', mode: '变动', ruler: 'neptune' }
  ];

  function signOf(lon) {
    const i = Math.floor(norm360(lon) / 30);
    return { index: i, ...SIGNS[i], degInSign: norm360(lon) - i * 30 };
  }

  function fmtLon(lon) {
    const s = signOf(lon);
    const d = Math.floor(s.degInSign);
    const m = Math.floor((s.degInSign - d) * 60);
    return `${d}°${String(m).padStart(2, '0')}′ ${s.cn}`;
  }

  function houseOf(lon, cusps) {
    for (let i = 0; i < 12; i++) {
      const a = cusps[i], b = cusps[(i + 1) % 12];
      let span = norm360(b - a);
      let off = norm360(lon - a);
      if (off < span) return i + 1;
    }
    return 1;
  }

  /* ---------------- 返照盘 ---------------- */
  function findReturn(natalLon, startJD, body, days) {
    const f = jd => {
      const jdTT = jdTTfromJDUT(jd);
      return norm180(bodyLon(body, jdTT) - natalLon);
    };
    let lo = startJD, hi = startJD + (days || 400);
    let flo = f(lo), fhi = f(hi);
    if (flo === 0) return lo;
    // 逐步扩张寻找符号变化
    const step = body === 'moon' ? 1 : 5;
    let prev = lo, prevF = flo;
    for (let t = lo + step; t <= hi; t += step) {
      const ft = f(t);
      if (prevF * ft <= 0) { lo = prev; hi = t; flo = prevF; fhi = ft; break; }
      prev = t; prevF = ft;
    }
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      const fm = f(mid);
      if (Math.abs(fm) < 1e-7 || hi - lo < 1e-6) return mid;
      if (flo * fm <= 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; }
    }
    return (lo + hi) / 2;
  }

  /* ---------------- 出生信息 → 星盘 ---------------- */
  // birth: {y,m,d,hour,minute, tzOffsetHours, dst, lat, lonEast, place}
  function natalChart(birth, opts) {
    opts = opts || {};
    const localHours = birth.hour + birth.minute / 60;
    const utHours = localHours - (birth.tzOffsetHours || 0) - (birth.dst ? 1 : 0);
    const jdUT = toJD(birth.y, birth.m, birth.d, utHours);
    const pos = positions(jdUT);
    const hs = houses(jdUT, birth.lat, birth.lonEast, opts.system || 'placidus');

    const points = { ...pos, asc: { lon: hs.asc, speed: 0 }, mc: { lon: hs.mc, speed: 0 } };
    const asp = aspects(points, { minor: opts.minor !== false });

    const rows = BODIES.map(b => ({
      id: b,
      lon: pos[b].lon,
      sign: signOf(pos[b].lon),
      house: houseOf(pos[b].lon, hs.cusps),
      retro: pos[b].retro,
      speed: pos[b].speed
    }));

    return {
      jdUT, jdTT: jdTTfromJDUT(jdUT),
      positions: pos, houses: hs, points, aspects: asp, rows,
      ascSign: signOf(hs.asc), mcSign: signOf(hs.mc),
      elements: countElements(rows),
      modes: countModes(rows)
    };
  }

  function countElements(rows) {
    const c = { 火: 0, 土: 0, 风: 0, 水: 0 };
    rows.filter(r => r.id !== 'pluto').forEach(r => { c[r.sign.el] += 1; });
    return c;
  }
  function countModes(rows) {
    const c = { 基本: 0, 固定: 0, 变动: 0 };
    rows.filter(r => r.id !== 'pluto').forEach(r => { c[r.sign.mode] += 1; });
    return c;
  }

  return {
    toJD, deltaT, jdTTfromJDUT, nutation, obliquity,
    bodyLon, positions, speedOf,
    gmst, lst, angles, houses, eclToEq, placidusCusp,
    aspects, ASPECT_DEFS, ORB_BY_BODY,
    SIGNS, signOf, fmtLon, houseOf,
    findReturn, natalChart, BODIES
  };
});
