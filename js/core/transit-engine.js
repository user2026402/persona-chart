/* 行运引擎：当下天象、与本命点的相位、精确时刻与生效窗口、月相
   依赖 astro-engine.js（window.Astro）
*/
(function (root) {
  'use strict';
  const A = () => root.Astro;

  const BODY_CN = {
    sun: '太阳', moon: '月亮', mercury: '水星', venus: '金星', mars: '火星',
    jupiter: '木星', saturn: '土星', uranus: '天王星', neptune: '海王星', pluto: '冥王星',
    asc: '上升点', mc: '中天'
  };

  /* 行运容许度：外行星影响宽、内行星窄 */
  const ORB_TRANS = {
    sun: 1.5, mercury: 1.5, venus: 1.5, moon: 0.6, mars: 2,
    jupiter: 2.5, saturn: 2.5, uranus: 3, neptune: 3, pluto: 3
  };

  const MAJOR = [
    { name: '合相', angle: 0, symbol: '☌' },
    { name: '冲相', angle: 180, symbol: '☍' },
    { name: '三分相', angle: 120, symbol: '△' },
    { name: '四分相', angle: 90, symbol: '□' },
    { name: '六分相', angle: 60, symbol: '✶' }
  ];

  const NA = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'asc', 'mc'];

  function norm180(x) {
    x = (x % 360 + 360) % 360;
    return x > 180 ? x - 360 : x;
  }

  function jdNow(date) {
    const d = date || new Date();
    const ut = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
    return A().toJD(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), ut);
  }

  /* JD → UTC 日期 */
  function jdToDate(jd) {
    let z = Math.floor(jd + 0.5);
    let f = jd + 0.5 - z;
    let a = z;
    if (z >= 2299161) {
      const alpha = Math.floor((z - 1867216.25) / 36524.25);
      a = z + 1 + alpha - Math.floor(alpha / 4);
    }
    const b = a + 1524, c = Math.floor((b - 122.1) / 365.25);
    const d = Math.floor(365.25 * c), e = Math.floor((b - d) / 30.6001);
    const day = b - d - Math.floor(30.6001 * e) + f;
    const month = e < 14 ? e - 1 : e - 13;
    const year = month > 2 ? c - 4716 : c - 4715;
    const di = Math.floor(day);
    const frac = day - di;
    let hours = frac * 24;
    const hh = Math.floor(hours);
    const mm = Math.floor((hours - hh) * 60);
    return new Date(Date.UTC(year, month - 1, di, hh, mm));
  }

  function fmtDate(jd) {
    const d = jdToDate(jd);
    const pad = n => (n < 10 ? '0' + n : '' + n);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  }

  function fmtDateTime(jd) {
    const d = jdToDate(jd);
    const pad = n => (n < 10 ? '0' + n : '' + n);
    return `${fmtDate(jd)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UT`;
  }

  /* 本命点：把 natalChart 的 positions + 四轴整理成 {lon,speed,cn} */
  function natalPointsOf(chart) {
    const pts = {};
    NA.forEach(k => {
      if (chart.points && chart.points[k]) {
        pts[k] = { lon: chart.points[k].lon, speed: chart.points[k].speed || 0, cn: BODY_CN[k] };
      }
    });
    return pts;
  }

  /* 行运相位：t_ 行星对 n_ 本命点 */
  function aspectsToNatal(trans, natalPts, opts) {
    opts = opts || {};
    const list = [];
    Object.keys(trans).forEach(tb => {
      if (!BODY_CN[tb]) return;
      const orb = ORB_TRANS[tb] || 2;
      const tp = trans[tb];
      Object.keys(natalPts).forEach(nb => {
        if (tb === nb && (tb === 'asc' || tb === 'mc')) return;
        if (tb === 'asc' || tb === 'mc') return; // 行运四轴由时刻决定，不在此算
        const np = natalPts[nb];
        const sep = Math.abs(norm180(tp.lon - np.lon));
        for (const def of MAJOR) {
          const delta = Math.abs(sep - def.angle);
          if (delta <= orb) {
            const ang = norm180(tp.lon - np.lon);
            const dAng = tp.speed || 0;
            /* 入/出相位要按「到该相位角的距离」算，不能直接拿 ang 比——
               否则 90° 类相位会整体反掉（逆行时把出相位判成入相位）；
               90° 类相位有两个解（+angle / -angle），两侧都要比较，否则同一相位可能被判反 */
            const dist = d => {
              const a = Math.abs(norm180(d - def.angle));
              const b = def.angle === 0 || def.angle === 180 ? a : Math.abs(norm180(d + def.angle));
              return Math.min(a, b);
            };
            const now = dist(ang);
            const next = dist(ang + dAng);
            list.push({
              tBody: tb, tCn: BODY_CN[tb],
              nBody: nb, nCn: BODY_CN[nb],
              aspect: def.name, angle: def.angle, symbol: def.symbol,
              orb: delta, applying: next < now,
              exactLon: tp.lon, natalLon: np.lon,
              retro: !!tp.retro,
              weight: (1 - delta / orb) * (def.angle === 0 || def.angle === 180 || def.angle === 90 ? 1.15 : 1)
            });
            break;
          }
        }
      });
    });
    return list.sort((a, b) => b.weight - a.weight);
  }

  /* 行运体与本命点的精确相位时刻：找离 centerJD 最近的真正过零点
     （不能取窗口内的全局最小值——那会挑到下一次公转的相位，日期差好几个月） */
  function exactMoment(tBody, natalLon, angle, centerJD, span) {
    span = span || 150;
    const targets = angle === 0 || angle === 180 ? [angle] : [angle, -angle];
    const cross = [];
    targets.forEach(target => {
      /* 每个相位角都有两个解：+angle 与 -angle。只扫一个会把另一侧的精确日推到半年后 */
      const f = jd => norm180(A().bodyLon(tBody, A().jdTTfromJDUT(jd)) - natalLon - target);
      let prevT = centerJD - span;
      let prevV = f(prevT);
      for (let t = prevT + 0.5; t <= centerJD + span; t += 0.5) {
        const v = f(t);
        if (prevV === 0) {
          cross.push(prevT);
        } else if (prevV * v < 0 && Math.abs(prevV - v) < 90) {
          /* 跳变超过 90° 是 180° 处的折返，不是真正过零 */
          let lo = prevT, hi = t, flo = prevV;
          for (let i = 0; i < 32; i++) {
            const mid = (lo + hi) / 2, fm = f(mid);
            if (flo * fm <= 0) { hi = mid; } else { lo = mid; flo = fm; }
          }
          cross.push((lo + hi) / 2);
        }
        prevT = t; prevV = v;
      }
    });
    let best = null;
    cross.forEach(c => {
      if (best == null || Math.abs(c - centerJD) < Math.abs(best - centerJD)) best = c;
    });
    return best;
  }

  /* 生效窗口：到该相位角的距离 <= orb 的起止（两侧解都算） */
  function activeWindow(tBody, natalLon, angle, exactJD, orb, span) {
    span = span || 200;
    const f = jd => {
      const jdTT = A().jdTTfromJDUT(jd);
      const delta = norm180(A().bodyLon(tBody, jdTT) - natalLon);
      const a = Math.abs(norm180(delta - angle));
      const b = angle === 0 || angle === 180 ? a : Math.abs(norm180(delta + angle));
      return Math.min(a, b);
    };
    let enter = exactJD, exit = exactJD;
    for (let t = exactJD; t >= exactJD - span; t -= 0.5) {
      if (f(t) > orb) { enter = t + 0.5; break; }
      enter = t;
    }
    for (let t = exactJD; t <= exactJD + span; t += 0.5) {
      if (f(t) > orb) { exit = t - 0.5; break; }
      exit = t;
    }
    return { enter, exit };
  }

  /* 月相 */
  function moonPhase(jdUT) {
    const pos = A().positions(jdUT);
    const elong = (pos.moon.lon - pos.sun.lon + 360) % 360;
    const names = [
      [22.5, '新月'], [67.5, '眉月'], [112.5, '上弦'], [157.5, '盈凸'],
      [202.5, '满月'], [247.5, '亏凸'], [292.5, '下弦'], [360, '残月']
    ];
    let phase = '残月';
    for (const [limit, name] of names) { if (elong < limit) { phase = name; break; } }
    const illum = Math.round((1 - Math.cos(elong * Math.PI / 180)) / 2 * 100);
    return { elong: Math.round(elong * 10) / 10, phase, illum };
  }

  /* 当下快照 */
  function snapshot(natalPts, jdUT) {
    const jd = jdUT || jdNow();
    const trans = A().positions(jd);
    const asp = aspectsToNatal(trans, natalPts);
    const phase = moonPhase(jd);
    const retros = Object.keys(trans).filter(k => BODY_CN[k] && trans[k].retro).map(k => BODY_CN[k]);
    return { jd, trans, aspects: asp, moon: phase, retros };
  }

  /* 未来 N 周内即将精确的关键行运（只取外行星与火星、木土） */
  function upcoming(natalPts, startJD, weeks) {
    const spanDays = (weeks || 12) * 7;
    const jd0 = startJD || jdNow();
    const slow = ['mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
    const out = [];
    slow.forEach(tb => {
      Object.keys(natalPts).forEach(nb => {
        const np = natalPts[nb];
        MAJOR.forEach(def => {
          const jdTT = A().jdTTfromJDUT(jd0);
          const lon = A().bodyLon(tb, jdTT);
          /* 只看当前在 40° 以内、有机会在窗口内精确成相的组合，避免无谓扫描 */
          if (Math.abs(norm180(lon - np.lon - def.angle)) > 40) return;
          const ex = exactMoment(tb, np.lon, def.angle, jd0 + spanDays / 2, spanDays / 2 + 5);
          if (ex == null || ex < jd0 || ex > jd0 + spanDays) return;
          const win = activeWindow(tb, np.lon, def.angle, ex, ORB_TRANS[tb] || 2.5, 120);
          out.push({
            tBody: tb, tCn: BODY_CN[tb], nBody: nb, nCn: BODY_CN[nb],
            aspect: def.name, angle: def.angle, symbol: def.symbol,
            exactJD: ex, enterJD: win.enter, exitJD: win.exit,
            date: fmtDate(ex)
          });
        });
      });
    });
    return out.sort((a, b) => a.exactJD - b.exactJD).slice(0, 12);
  }

  root.TransitEngine = {
    BODY_CN, NA, MAJOR,
    jdNow, jdToDate, fmtDate, fmtDateTime,
    natalPointsOf, aspectsToNatal, exactMoment, activeWindow,
    moonPhase, snapshot, upcoming, norm180
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
