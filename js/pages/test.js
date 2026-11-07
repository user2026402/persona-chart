/* 测评页逻辑 */
(function () {
  'use strict';
  const Q = window.MBTI_QUESTIONS.standard;
  const FN = window.MBTI_FUNCTIONS;
  const answers = {};
  let skipBigFive = false;
  let mode = 'standard';

  /* ---------- 组装题目顺序：四维交替 + 效度题穿插 + 八维（深度档）+ 五因素置尾 ---------- */
  function buildOrder(m) {
    const byDim = { EI: [], SN: [], TF: [], JP: [] };
    Q.scale.forEach(i => byDim[i.dim].push(i));
    const mixed = [];
    for (let k = 0; k < 15; k++) {
      ['EI', 'SN', 'TF', 'JP'].forEach(d => { if (byDim[d][k]) mixed.push(byDim[d][k]); });
    }
    const validity = Q.validity.slice();
    const marks = new Set([Math.floor(mixed.length / 3), Math.floor(mixed.length * 2 / 3)]);
    const final = [];
    let vi = 0;
    mixed.forEach((item, i) => {
      final.push(item);
      if (marks.has(i)) {
        for (let n = 0; n < 3 && vi < validity.length; n++) final.push(validity[vi++]);
      }
    });
    while (vi < validity.length) final.push(validity[vi++]);

    if (m === 'deep') {
      /* 八维：按功能轮流排，避免连续八题都在测同一个功能 */
      const fns = ['Ni', 'Ne', 'Si', 'Se', 'Ti', 'Te', 'Fi', 'Fe'];
      for (let k = 0; k < 4; k++) {
        fns.forEach(f => {
          const item = FN.items.filter(i => i.fn === f)[k];
          if (item) final.push(item);
        });
      }
    }

    const bf = Q.bigfive.map(b => Object.assign({}, b, { type: 'likert', isBigFive: true }));
    const order = final.concat(bf);
    order.forEach((item, idx) => { item._no = idx + 1; });
    return order;
  }

  let order = buildOrder(mode);
  const bigFiveIds = Q.bigfive.map(b => b.id);
  const requiredIds = () => order
    .filter(it => !(skipBigFive && it.isBigFive))
    .map(it => it.id);

  /* ---------- 渲染 ---------- */
  function makeOpt(text) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'opt';
    b.innerHTML = '<span class="opt__dot"></span><span class="opt__txt"></span>';
    b.querySelector('.opt__txt').textContent = text;
    return b;
  }

  function renderItem(item) {
    const card = document.createElement('div');
    card.className = 'q';
    card.id = 'q-' + item.id;

    const meta = document.createElement('div');
    meta.className = 'q__meta';
    const left = document.createElement('span');
    const mainCount = order.filter(it => !it.isBigFive).length;
    left.textContent = item.isBigFive ? '五因素 · 换个尺子' : `第 ${item._no} / ${mainCount} 题`;
    const right = document.createElement('span');
    right.textContent = item.type === 'likert' ? '1 = 完全不像我，7 = 非常像我' : '';
    meta.appendChild(left);
    meta.appendChild(right);
    card.appendChild(meta);

    const qt = document.createElement('div');
    qt.className = 'q__text';
    qt.textContent = item.q;
    card.appendChild(qt);

    if (item.type === 'likert') {
      const scale = document.createElement('div');
      scale.className = 'scale';
      const l0 = document.createElement('span');
      l0.className = 'scale__end'; l0.textContent = '完全不像我';
      scale.appendChild(l0);
      for (let v = 1; v <= 7; v++) {
        const pt = document.createElement('div');
        pt.className = 'scale__pt';
        pt.dataset.v = v;
        const dot = document.createElement('div');
        dot.className = 'scale__dot';
        dot.textContent = v;
        pt.appendChild(dot);
        pt.addEventListener('click', () => {
          answers[item.id] = v;
          scale.querySelectorAll('.scale__pt').forEach(x => x.classList.toggle('is-on', Number(x.dataset.v) === v));
          updateProgress();
        });
        scale.appendChild(pt);
      }
      const l1 = document.createElement('span');
      l1.className = 'scale__end'; l1.textContent = '非常像我';
      scale.appendChild(l1);
      card.appendChild(scale);
      if (answers[item.id]) {
        scale.querySelectorAll('.scale__pt').forEach(x => x.classList.toggle('is-on', Number(x.dataset.v) === answers[item.id]));
      }
    } else if (item.type === 'pick2') {
      const wrap = document.createElement('div');
      wrap.className = 'pick';
      const chosen = new Set(Array.isArray(answers[item.id]) ? answers[item.id] : []);
      item.opts.forEach((o, i) => {
        const b = makeOpt(o.t);
        if (chosen.has(i)) b.classList.add('is-on');
        b.addEventListener('click', () => {
          if (chosen.has(i)) chosen.delete(i);
          else {
            if (chosen.size >= 2) {
              const first = [...chosen][0];
              chosen.delete(first);
              const firstBtn = wrap.children[first];
              if (firstBtn) firstBtn.classList.remove('is-on');
            }
            chosen.add(i);
          }
          b.classList.toggle('is-on', chosen.has(i));
          answers[item.id] = [...chosen];
          updateProgress();
        });
        wrap.appendChild(b);
      });
      card.appendChild(wrap);
      const hint = document.createElement('small');
      hint.className = 'faint';
      hint.textContent = '选两条。选中第一条后再点一条即可。';
      card.appendChild(hint);
    } else {
      item.opts.forEach((text, i) => {
        const b = makeOpt(text);
        if (answers[item.id] === i) b.classList.add('is-on');
        b.addEventListener('click', () => {
          answers[item.id] = i;
          card.querySelectorAll('.opt').forEach((x, xi) => x.classList.toggle('is-on', xi === i));
          updateProgress();
        });
        card.appendChild(b);
      });
    }

    return card;
  }

  /* ---------- 进度 ---------- */
  function updateProgress() {
    const req = requiredIds();
    const done = req.filter(id => answers[id] != null).length;
    const total = req.length;
    document.getElementById('prog-text').textContent = `已答 ${done} / ${total}`;
    document.getElementById('prog-bar').style.width = (done / total * 100).toFixed(1) + '%';

    const left = total - done;
    const btn = document.getElementById('btn-submit');
    const hint = document.getElementById('submit-hint');
    if (left === 0) {
      btn.disabled = false;
      hint.textContent = '没有遗漏，可以生成结果了。';
    } else {
      btn.disabled = true;
      hint.textContent = `还有 ${left} 题没答`;
    }
  }

  function jumpNext() {
    const first = requiredIds().find(id => answers[id] == null);
    if (!first) { updateProgress(); return; }
    const node = document.getElementById('q-' + first);
    if (node) node.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ---------- 提交 ---------- */
  function submit() {
    if (skipBigFive) bigFiveIds.forEach(id => { delete answers[id]; });
    const result = window.MBTIEngine.score(answers);
    const bigfive = skipBigFive ? null : window.BigFiveEngine.score(answers);
    const functions = mode === 'deep' ? window.FunctionEngine.score(answers, result.code) : null;
    window.Store.save({
      mbti: { answers: JSON.parse(JSON.stringify(answers)), result, functions, mode, at: new Date().toISOString() },
      bigfive
    });
    location.href = 'result.html';
  }

  /* ---------- 初始化 ---------- */
  function startWith(m) {
    mode = m;
    order = buildOrder(m);

    document.getElementById('intro').hidden = true;
    document.getElementById('quiz').hidden = false;

    const list = document.getElementById('qlist');
    list.innerHTML = '';

    const fnHeader = document.createElement('div');
    fnHeader.className = 'card card--inset';
    fnHeader.id = 'fn-header';
    fnHeader.innerHTML = `
      <div>
        <h3 style="margin:0 0 4px">接下来 32 题：八维认知功能</h3>
        <p class="small" style="margin:0">四维测的是「你落在哪一型」，这 32 题测的是「你实际靠哪几种方式想事情」。八维是荣格功能模型的现代写法，和四字母不是一一对应——它们经常会打架，那正是有用的信息。</p>
      </div>`;

    const bfHeader = document.createElement('div');
    bfHeader.className = 'card card--warm';
    bfHeader.id = 'bf-header';
    bfHeader.innerHTML = `
      <div class="between">
        <div>
          <h3 style="margin:0 0 4px">最后 10 题：另一把尺子</h3>
          <p class="small" style="margin:0">这 10 道题测的是五因素模型（外向性、宜人性、尽责性、神经质、开放性）。它和十六型不是同一套体系，用来给结论加一个实证参照。</p>
        </div>
        <button class="btn btn--ghost btn--small" id="btn-skip-bf">跳过这 10 题</button>
      </div>`;

    order.forEach(item => {
      if (item.id === 'FN01') list.appendChild(fnHeader);
      if (item.id === 'BF01') list.appendChild(bfHeader);
      list.appendChild(renderItem(item));
    });

    bfHeader.querySelector('#btn-skip-bf').addEventListener('click', function () {
      skipBigFive = true;
      bigFiveIds.forEach(id => { delete answers[id]; });
      bfHeader.classList.add('faint');
      document.querySelectorAll('.q').forEach(n => {
        if (n.id.startsWith('q-BF')) { n.style.opacity = '.45'; n.style.display = 'none'; }
      });
      updateProgress();
    });

    document.getElementById('btn-jump').addEventListener('click', jumpNext);
    document.getElementById('btn-submit').addEventListener('click', submit);

    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('[data-mode]').forEach(btn => {
    btn.addEventListener('click', function () { startWith(btn.dataset.mode || 'standard'); });
  });

  /* 支持 ?mode=deep 直接进入，方便分享链接 */
  try {
    const qm = new URLSearchParams(location.search).get('mode');
    if (qm === 'deep' || qm === 'standard') startWith(qm);
  } catch (e) { /* 忽略 */ }

  /* 恢复已答（同一会话刷新不丢） */
  try {
    const st = window.Store.load();
    if (st.mbti && st.mbti.answers) Object.assign(answers, st.mbti.answers);
  } catch (e) { /* 忽略 */ }
})();
