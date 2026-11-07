/* 出生信息页：城市选择、夏令时判定、校验、存档 */
(function () {
  'use strict';
  const cities = window.CN_CITIES || [];

  const $ = id => document.getElementById(id);
  const cityInput = $('f-city'), cityList = $('citylist');
  const latInput = $('f-lat'), lonInput = $('f-lon');
  const dateInput = $('f-date'), timeInput = $('f-time');
  const unknownBox = $('f-unknown'), dstBox = $('dst-box');
  let dstAuto = 0, dstManualOff = false;

  cities.forEach(c => {
    const o = document.createElement('option');
    o.value = `${c.n}（${c.p}）`;
    cityList.appendChild(o);
  });

  function parseCity(text) {
    const core = String(text).replace(/（.*?）/g, '').trim();
    return cities.find(c => c.n === core) || null;
  }

  cityInput.addEventListener('change', function () {
    const c = parseCity(cityInput.value);
    if (c) {
      latInput.value = c.lat.toFixed(2);
      lonInput.value = c.lon.toFixed(2);
      cityInput.value = `${c.n}（${c.p}）`;
      updateDst();
    }
  });

  unknownBox.addEventListener('change', function () {
    $('unknown-hint').style.display = unknownBox.checked ? 'block' : 'none';
    timeInput.disabled = unknownBox.checked;
    timeInput.style.opacity = unknownBox.checked ? '.45' : '1';
  });

  $('f-tz').addEventListener('change', updateDst);

  function updateDst() {
    const dv = dateInput.value;
    const tz = Number($('f-tz').value);
    dstAuto = 0;
    if (dv) {
      const [y, m, d] = dv.split('-').map(Number);
      if (tz === 8 && window.cnDstOffset) dstAuto = window.cnDstOffset(y, m, d);
      $('old-warn').style.display = y < 1949 ? 'block' : 'none';
    }
    if (dstAuto && !dstManualOff) {
      dstBox.innerHTML = '<span style="color:#8a5334">已自动 +1 小时（1986–1991 夏令时）</span>';
    } else if (dstAuto && dstManualOff) {
      dstBox.textContent = '已手动关闭夏令时修正';
    } else {
      dstBox.textContent = '该日期不在夏令时区间内';
    }
  }

  dateInput.addEventListener('change', updateDst);
  dateInput.addEventListener('input', updateDst);

  dstBox.addEventListener('click', function () {
    if (!dstAuto) return;
    dstManualOff = !dstManualOff;
    updateDst();
  });

  function fail(msg) {
    const hint = $('form-hint');
    hint.textContent = msg;
    hint.style.color = '#a4542f';
    hint.style.fontWeight = '600';
    hint.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  $('btn-submit').addEventListener('click', function () {
    const dv = dateInput.value;
    const tv = timeInput.value;
    const lat = parseFloat(latInput.value);
    const lon = parseFloat(lonInput.value);
    const tz = Number($('f-tz').value);
    const name = $('f-name').value.trim();

    if (!dv) return fail('请先填出生日期。');
    if (!unknownBox.checked && !tv) return fail('请填出生时间；确实不知道就勾选上面的「不知道准确时间」。');
    if (!Number.isFinite(lat) || Math.abs(lat) > 66) return fail('纬度请填 −66 到 66 之间的数值（超过极圈时 Placidus 宫位会退化）。');
    if (!Number.isFinite(lon) || Math.abs(lon) > 180) return fail('经度请填 −180 到 180 之间的数值。');
    if (!parseCity(cityInput.value) && (!latInput.value || !lonInput.value)) {
      return fail('请从列表里选择城市，或直接填写经纬度。');
    }

    const [y, m, d] = dv.split('-').map(Number);
    const [hh, mm] = (tv || '12:00').split(':').map(Number);

    const birth = {
      name: name || '我的档案',
      y, m, d,
      hour: unknownBox.checked ? 12 : hh,
      minute: unknownBox.checked ? 0 : mm,
      timeUnknown: unknownBox.checked,
      place: cityInput.value || '手动坐标',
      lat, lon,
      tz,
      dst: (!dstManualOff && dstAuto) ? 1 : 0,
      createdAt: new Date().toISOString()
    };

    window.Store.save({ birth });
    location.href = 'natal.html';
  });

  /* 回填已有存档 */
  try {
    const st = window.Store.load();
    if (st.birth) {
      const b = st.birth;
      dateInput.value = `${b.y}-${String(b.m).padStart(2, '0')}-${String(b.d).padStart(2, '0')}`;
      timeInput.value = `${String(b.hour).padStart(2, '0')}:${String(b.minute).padStart(2, '0')}`;
      cityInput.value = b.place || '';
      latInput.value = b.lat;
      lonInput.value = b.lon;
      $('f-tz').value = String(b.tz);
      $('f-name').value = b.name === '我的档案' ? '' : b.name;
      if (b.timeUnknown) {
        unknownBox.checked = true;
        timeInput.disabled = true;
        $('unknown-hint').style.display = 'block';
      }
      dstManualOff = !b.dst;
      updateDst();
      // 若当时确实有夏令时但存档里是关掉的，展示为手动关闭
      if (dstAuto && !b.dst) { dstManualOff = true; updateDst(); }
    }
  } catch (e) { /* 忽略 */ }
})();
