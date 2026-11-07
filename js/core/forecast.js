/* 预测层：行运快照 / 太阳返照（日返）/ 月亮返照（月返）
   依赖 Astro（星历）与 TransitEngine（相位工具）。所有时刻都由星历二分求解，不查表。 */
(function (root) {
  'use strict';
  const A = () => root.Astro;
  const T = () => root.TransitEngine;

  /* JD(UT) → 指定时区的当地日期时间 */
  function jdParts(jd, tzHours) {
    const ms = (jd - 2440587.5) * 86400000 + (tzHours || 0) * 3600000;
    const d = new Date(ms);
    return {
      y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(),
      hour: d.getUTCHours(), minute: d.getUTCMinutes(),
      second: d.getUTCSeconds(),
      dateStr: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`,
      timeStr: `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
    };
  }

  /* 当地墙钟时间 → JD(UT) */
  function jdFromLocal(y, m, d, hour, minute, tzHours) {
    return A().toJD(y, m, d, (hour || 0) + (minute || 0) / 60) - (tzHours || 0) / 24;
  }

  /* 在某个时刻、以出生地（或指定经纬度）起一张盘 */
  function chartAt(jdUT, tzHours, lat, lonEast, system) {
    const p = jdParts(jdUT, tzHours);
    return A().natalChart({
      y: p.y, m: p.m, d: p.d, hour: p.hour, minute: p.minute,
      tzOffsetHours: tzHours, dst: false, lat, lonEast
    }, { system: system || 'placidus' });
  }

  /* ---------- 太阳返照 ---------- */
  /* 生日那天太阳回到本命黄经的那一刻；一年一张，从该时刻起算一年 */
  function solarReturn(birth, natalSunLon, year, opts) {
    opts = opts || {};
    const tz = birth.tz, lat = birth.lat, lonEast = birth.lon;
    /* 从生日前 3 天开始找，避免跨年边界 */
    const startJD = jdFromLocal(year, birth.m, birth.d, 0, 0, tz) - 3;
    let jd = A().findReturn(natalSunLon, startJD, 'sun', 8);
    if (!jd) {
      const startJD2 = jdFromLocal(year + 1, birth.m, birth.d, 0, 0, tz) - 3;
      jd = A().findReturn(natalSunLon, startJD2, 'sun', 8);
    }
    if (!jd) return null;
    const p = jdParts(jd, tz);
    const chart = chartAt(jd, tz, lat, lonEast, opts.system);
    return { jd, parts: p, chart, year: p.y };
  }

  /* ---------- 月亮返照 ---------- */
  /* 月亮回到本命月亮黄经的时刻；约 27.3 天一次 */
  function lunarReturn(birth, natalMoonLon, fromJD, opts) {
    opts = opts || {};
    const tz = birth.tz, lat = birth.lat, lonEast = birth.lon;
    const jd = A().findReturn(natalMoonLon, fromJD || T().jdNow(), 'moon', 35);
    if (!jd) return null;
    const p = jdParts(jd, tz);
    const chart = chartAt(jd, tz, lat, lonEast, opts.system);
    return { jd, parts: p, chart };
  }

  /* ---------- 行运快照（带人话摘要） ---------- */
  function transitNow(chart, jdUT) {
    const snap = T().snapshot(T().natalPointsOf(chart), jdUT);
    const rows = snap.aspects.slice(0, 12).map(a => {
      const exact = T().exactMoment(a.tBody, a.natalLon, a.angle, snap.jd, 400);
      return Object.assign({}, a, {
        exactJD: exact,
        exactStr: exact ? (exact < snap.jd ? T().fmtDate(exact) + '（已过）' : T().fmtDate(exact)) : '不精确成相',
        sign: A().signOf(snap.trans[a.tBody].lon),
        house: A().houseOf(snap.trans[a.tBody].lon, chart.houses.cusps)
      });
    });
    const transRows = Object.keys(snap.trans).map(k => ({
      id: k,
      cn: T().BODY_CN[k],
      lon: snap.trans[k].lon,
      sign: A().signOf(snap.trans[k].lon),
      house: A().houseOf(snap.trans[k].lon, chart.houses.cusps),
      retro: !!snap.trans[k].retro
    }));
    return { jd: snap.jd, trans: snap.trans, transRows, aspects: rows, moon: snap.moon, retros: snap.retros };
  }

  root.Foretell = {
    jdParts, jdFromLocal, chartAt, solarReturn, lunarReturn, transitNow
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
