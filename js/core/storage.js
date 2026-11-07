/* 本地存档：数据只存在浏览器里，不上传 */
(function (root) {
  'use strict';
  const KEY = 'persona-chart:v1';
  const empty = () => ({ mbti: null, bigfive: null, birth: null, updatedAt: null });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return empty();
      const d = JSON.parse(raw);
      return Object.assign(empty(), d);
    } catch (e) { return empty(); }
  }

  function save(patch) {
    const d = Object.assign(load(), patch, { updatedAt: new Date().toISOString() });
    localStorage.setItem(KEY, JSON.stringify(d));
    return d;
  }

  function clear() { localStorage.removeItem(KEY); }

  function exportJSON() {
    return JSON.stringify(load(), null, 2);
  }

  function importJSON(text) {
    const d = JSON.parse(text);
    if (!d || typeof d !== 'object') throw new Error('格式不对');
    localStorage.setItem(KEY, JSON.stringify(Object.assign(empty(), d)));
    return load();
  }

  root.Store = { load, save, clear, exportJSON, importJSON, KEY };
})(typeof globalThis !== 'undefined' ? globalThis : this);
