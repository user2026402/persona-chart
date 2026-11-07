/* 报告装配引擎：领域解读 × 星盘融合 × 当下情境指引
   输入：{ mbti, bigfive, chart, jd }
   - mbti   : MBTIEngine.score 的结果（可含 functions）
   - bigfive: BigFiveEngine.score 的结果，可为 null
   - chart  : Astro.natalChart 的结果，可为 null（无出生信息时退化为纯人格版）
*/
(function (root) {
  'use strict';
  const DD = () => root.DOMAIN_DATA;
  const AT = () => root.ASTRO_TEXT;

  const BODY_CN = {
    sun: '太阳', moon: '月亮', mercury: '水星', venus: '金星', mars: '火星',
    jupiter: '木星', saturn: '土星', uranus: '天王星', neptune: '海王星', pluto: '冥王星'
  };

  /* 元素 × 字母取向 的合成语气 */
  const COMBO = {
    火: {
      E: '起势在人和场面里，快、外显、容易过热', I: '内里有一台引擎，独自点火，烧得久但不外露',
      S: '冲劲落在具体的事上，先做再解释', N: '冲劲朝着愿景去，起得快、收得慢',
      T: '直接切要害，推进强硬，不太绕路', F: '热情带着护人，容易替别人出头',
      J: '一旦定下就猛推，节奏感很强', P: '随时能启动，方向随现场调整'
    },
    土: {
      E: '在人群里也求稳，慢热但有分量', I: '安静地把事一点点做实，不声张',
      S: '靠经验与手感，越做越稳', N: '蓝图要靠时间垒，急不来',
      T: '标准清楚，执行到底', F: '照顾人落在具体的事上，不说漂亮话',
      J: '计划与耐力叠加，长期赢', P: '弹性被现实拖住，慢，但补得上'
    },
    风: {
      E: '靠说话聚人，信息流动快', I: '先在脑内推演，出手时已经成型',
      S: '把沟通变成可执行的清单', N: '概念翻飞，容易离地',
      T: '讲逻辑、讲条款，情绪不进场', F: '用语言照顾气氛，怕场面难看',
      J: '把想法排成流程，推进有序', P: '想法多、切换快，收尾最弱'
    },
    水: {
      E: '把情绪说出来，靠人接住', I: '情绪向内沉，自己消化',
      S: '记得具体的人与事，照顾在细节上', N: '共感带想象，容易替别人写剧本',
      T: '用分析处理情绪，先压住再说', F: '情绪直连，边界天生偏薄',
      J: '需要稳定的情感秩序，怕变故', P: '情绪随场流动，起落大'
    }
  };

  /* 行运行星 → 主要领域 */
  const PLANET_DOMAIN = {
    sun: ['career', 'decision'], moon: ['family', 'health'], mercury: ['study', 'social'],
    venus: ['love', 'money'], mars: ['career', 'love'], jupiter: ['career', 'money'],
    saturn: ['career', 'family'], uranus: ['social', 'decision'], neptune: ['health', 'love'],
    pluto: ['family', 'money']
  };

  /* 行运行星的行为提示 */
  const PLANET_TIP = {
    sun: { do: '把事情摆到台面上，该露面就露面', avoid: '为了面子硬撑，或把精力分散给所有人' },
    moon: { do: '优先照顾睡眠与情绪节律', avoid: '深夜做决定，或用情绪回复重要的人' },
    mercury: { do: '把话说清楚、把条款写成文字', avoid: '重要的事只靠口头约定' },
    venus: { do: '修复关系、把该花的钱花在体验上', avoid: '用消费代替沟通，或把暧昧当确认' },
    mars: { do: '把要冲突的事提前说清，用运动消耗冲动', avoid: '当场硬碰、疲劳时做决定' },
    jupiter: { do: '谈机会、扩边界、把学到的东西用出去', avoid: '过度承诺，把预期当结果' },
    saturn: { do: '补基础、把长期结构搭起来', avoid: '硬扛、把一切归因于自己不够好' },
    uranus: { do: '换掉一个明显低效的旧做法', avoid: '突然辞职、突然断联这类不可逆动作' },
    neptune: { do: '休息、创作、核实信息真伪', avoid: '签约、借钱、把对方理想化' },
    pluto: { do: '处理一直拖着的那件深层的事', avoid: '权力拉扯、控制别人' }
  };

  const REL = {
    合相: '叠加', 三分相: '顺流', 六分相: '可用', 四分相: '卡住', 冲相: '拉扯'
  };

  /* ---------- 工具 ---------- */
  function lettersOf(mbti) {
    const d = mbti.dims;
    return { EI: d.EI.letter, SN: d.SN.letter, TF: d.TF.letter, JP: d.JP.letter };
  }

  function signCnOf(chart, house) {
    const cusp = chart.houses.cusps[house - 1];
    const s = root.Astro.signOf(cusp);
    return { sign: s, cusp };
  }

  function planetsInHouses(chart, houses) {
    return chart.rows.filter(r => houses.indexOf(r.house) >= 0 && BODY_CN[r.id]);
  }

  function planetSignText(pid, signId, house) {
    const t = AT().inSign;
    const signTxt = (t && t[pid] && t[pid][signId]) ? t[pid][signId] : '';
    const h = house != null && AT().inHouse && AT().inHouse[pid] && AT().inHouse[pid][house];
    // 内行星的星座文案已经完整，宫位由条目行首的「第 N 宫」承担；外行星补一句宫位含义
    return h ? (signTxt ? signTxt + ' ' + h : h) : signTxt;
  }

  /* ---------- 领域权重 ---------- */
  function domainWeights(chart) {
    const out = {};
    let total = 0;
    DD().order.forEach(id => {
      const cfg = DD().domains[id];
      let raw = 1;
      if (chart) {
        const primary = planetsInHouses(chart, cfg.houses).length;
        const aux = planetsInHouses(chart, cfg.auxHouses).length;
        raw = 1 + 0.6 * primary + 0.3 * aux;
      }
      out[id] = { raw };
      total += raw;
    });
    DD().order.forEach(id => {
      out[id].pct = Math.round(out[id].raw / total * 1000) / 10;
    });
    return out;
  }

  /* ---------- 单领域 ---------- */
  function buildDomain(id, mbti, chart, weights) {
    const cfg = DD().domains[id];
    const L = lettersOf(mbti);
    const used = [];
    const texts = [];
    /* 只取该域最相关的两个维度：情感看 TF/EI，学业看 SN/JP，其余按维度表 */
    const relevant = {
      career: ['TF', 'JP'], love: ['TF', 'EI'], social: ['EI', 'TF'], study: ['SN', 'JP'],
      money: ['SN', 'TF'], family: ['TF', 'EI'], health: ['SN', 'TF'], decision: ['JP', 'TF']
    }[id] || ['EI', 'TF'];

    relevant.forEach(dim => {
      const letter = L[dim];
      const b = cfg.blocks[letter];
      if (!b) return;
      used.push({ dim, letter, ...b });
    });

    /* 星盘部分 */
    let chartPart = null;
    if (chart) {
      const primary = planetsInHouses(chart, cfg.houses);
      const aux = planetsInHouses(chart, cfg.auxHouses);
      const c1 = signCnOf(chart, cfg.houses[0]);
      const list = primary.concat(aux);
      chartPart = {
        cuspHouse: cfg.houses[0],
        cuspSign: c1.sign.cn,
        cuspEl: c1.sign.el,
        planets: list.map((p, i) => ({
          cn: BODY_CN[p.id],
          signCn: p.sign.cn,
          signId: p.sign.id,
          el: p.sign.el,
          house: p.house,
          retro: p.retro,
          aux: i >= primary.length,
          text: planetSignText(p.id, p.sign.id, p.house)
        })),
        weight: weights[id].pct
      };
    }

    /* 合成 */
    const letterTone = used.map(u => `${u.letter}：${u.mech}`).join(' ');
    let synthesis = '';
    if (chartPart && chartPart.planets.length) {
      const first = chartPart.planets[0];
      const combo = (COMBO[first.el] && COMBO[first.el][L[relevant[0]]]) || '';
      synthesis = `${first.cn}落在${first.signCn}（第 ${first.house} 宫），这一域在你盘里由${first.el}象开场；人格侧你偏 ${L[relevant[0]]}，方式是「${combo}」。两套坐标在这里的结论是同一件事：${first.el}象负责节奏，${L[relevant[0]]} 负责取向。`;
    } else {
      synthesis = `这一域只按人格侧给结论：${used[0] ? used[0].sign : ''}`;
    }

    const allow = ['any'];
    relevant.forEach(d => { if (L[d]) allow.push(L[d]); });
    const actions = cfg.actions.filter(a => allow.indexOf(a.when) >= 0);

    return {
      id,
      name: cfg.name,
      short: cfg.short,
      weight: weights[id].pct,
      used,
      theories: cfg.theory,
      chart: chartPart,
      synthesis,
      actions,
      grade: cfg.grade,
      boundary: cfg.boundary
    };
  }

  /* ---------- 融合层：太阳 / 月亮 / 上升 ---------- */
  function fusion(mbti, chart) {
    if (!chart) return [];
    const p = mbti.profile || {};
    const L = lettersOf(mbti);
    const out = [];

    const sun = chart.rows.find(r => r.id === 'sun');
    const moon = chart.rows.find(r => r.id === 'moon');
    const asc = chart.ascSign;
    const sunText = planetSignText('sun', sun.sign.id);
    const moonText = planetSignText('moon', moon.sign.id);
    const ascText = AT().asc[asc.id];

    out.push({
      title: '太阳：你要成为的那个样子',
      grade: 'B',
      astro: `太阳 ${root.Astro.fmtLon(sun.lon)} · 第 ${sun.house} 宫`,
      text: `星盘说：${sunText}　人格说：${mbti.code} 的核心是「${(p.core || '').replace(/「/g, '“').replace(/」/g, '”')}」。　交叉：类型告诉你用哪套机制做事，太阳告诉你这件事最终要长成什么样子——同一个方向，两种说法。`
    });

    out.push({
      title: '月亮：你需要被怎么对待',
      grade: 'B',
      astro: `月亮 ${root.Astro.fmtLon(moon.lon)} · 第 ${moon.house} 宫`,
      text: `星盘说：${moonText}　人格说：你的 ${L.TF} 侧决定情绪的处理顺序（${L.TF === 'T' ? '先分析，再感受' : '先感受，再分析'}）。　交叉：两者不一致时，先满足月亮的需求，再讲道理——饿着的人听不进逻辑。`
    });

    out.push({
      title: '上升：别人先看到的那一层',
      grade: 'B',
      astro: `上升 ${root.Astro.fmtLon(chart.houses.asc)}`,
      text: `星盘说：${ascText}　人格说：你的 ${L.EI} 侧说明电量来自${L.EI === 'E' ? '与人互动' : '独处'}。　交叉：别人按上升的印象对待你时，${L.EI === 'E' ? '通常不会差太远，你确实接得住这些社交' : '会明显高估你的社交需求——你应付得了，但不代表不耗'}。`
    });

    const els = chart.elements;
    const top = Object.keys(els).sort((a, b) => els[b] - els[a])[0];
    const tones = { 火: '动起来才顺', 土: '有结构才稳', 风: '讲清楚才通', 水: '有共感才安' };
    out.push({
      title: `元素配比：${top}象最多（${els[top]} 颗）`,
      grade: 'C',
      astro: `火 ${els.火} · 土 ${els.土} · 风 ${els.风} · 水 ${els.水}`,
      text: `${tones[top]}。这是十个行星的落座统计，不含宫位权重，只能说明整体语气，不能单独用来下结论。`
    });

    return out;
  }

  /* ---------- 冲突与张力 ---------- */
  function conflicts(mbti, bigfive, chart) {
    const out = [];
    const L = lettersOf(mbti);

    /* 临界维度 × 星盘强调 */
    if (chart && mbti.boundaryDims && mbti.boundaryDims.length) {
      const dimHouse = { EI: [1, 7, 11], SN: [3, 9], TF: [2, 8], JP: [6, 10] };
      mbti.boundaryDims.forEach(dim => {
        const houses = dimHouse[dim];
        const hits = planetsInHouses(chart, houses);
        if (hits.length >= 2) {
          out.push({
            title: `${dim} 维度落在临界带，而盘的 ${houses.join('/')} 宫被强调`,
            text: `你在这个维度上的自评介于两侧之间（${mbti.dims[dim].pct}%），而 ${hits.map(h => BODY_CN[h.id] + '在' + h.sign.cn).join('、')} 落在对应的宫位。这通常说明：你的「偏好」和「被环境长期要求的表现」不是同一件事。`,
            hypotheses: [
              '假说一：你天生两侧都可用，属于真正的双型，标签只是简化。',
              '假说二：环境长期要求你用另一侧，形成了补偿性的熟练，但它不是你的默认模式。',
              '假说三：你在不同场景切换（工作一套、私下另一套），两套都真实。'
            ],
            check: `自查：回想最近三个月最消耗你的场景，那时你用的是 ${mbti.dims[dim].poleA} 还是 ${mbti.dims[dim].poleB}？消耗大的那一侧，通常不是你真正的偏好。`
          });
        }
      });
    }

    /* 五因素与类型的张力 */
    if (bigfive) {
      const N = bigfive.N, C = bigfive.C, A = bigfive.A;
      if (N && N.pct >= 62 && (L.TF === 'T' || L.JP === 'J')) {
        out.push({
          title: `外表按规则走，内里对不确定性敏感`,
          text: `你的类型是 ${mbti.code}（${L.TF === 'T' ? '以标准判断' : ''}${L.JP === 'J' ? '、按计划推进' : ''}），但神经质自评 ${N.pct}/100 偏高。这解释了为什么你有时「明明知道该怎么做，却迟迟不动」——不是懒，是风险感知被放大了。`,
          hypotheses: [
            '假说一：高标准 + 高敏感，实际表现是过度准备。',
            '假说二：你在重要场合的稳定度低于日常，需要外部结构托底。',
            '假说三：这只是阶段性状态（近期压力），不是稳定特质。'
          ],
          check: '自查：把最近一次拖延的事写下「最坏结果」和「发生概率」。多数时候概率远低于感受。'
        });
      }
      if (C && C.pct <= 38 && L.JP === 'J') {
        out.push({
          title: `自认有计划，尽责性自评却偏低`,
          text: `你选了 J 侧，但尽责性只有 ${C.pct}/100。常见于「计划做得漂亮、执行靠 deadline」的人：结构是有的，驱动力来自压力而不是习惯。`,
          hypotheses: ['假说一：计划是应对焦虑的方式，不是执行工具。', '假说二：你在意的事能准时，不在意的事一律拖。', '假说三：自评偏严，实际完成度高于你的感觉。'],
          check: '自查：翻最近一个月的交付记录，按「是否按时」逐条打勾，用事实替代印象。'
        });
      }
      if (A && A.pct <= 38 && L.TF === 'F') {
        out.push({
          title: `自认体贴，宜人性却偏低`,
          text: `F 侧通常伴随较高的共情，但你的宜人性只有 ${A.pct}/100。这更像「对少数人极 soft、对多数人极 hard」的结构，不是矛盾，是分层。`,
          hypotheses: ['假说一：你的共情是有门槛的，只对认定的人开放。', '假说二：你在耗竭期关闭了共情通道。', '假说三：你把「不讨好」当成原则，而非冷漠。'],
          check: '自查：分别写下对一个亲近的人和一个陌生人的容忍度，差距越大，越接近分层结构。'
        });
      }
    }

    /* 星盘与类型的语气冲突：元素对 S/N，模式对 J/P——只有同轴才值得拿出来说 */
    if (chart) {
      const sun = chart.rows.find(r => r.id === 'sun');
      const el = sun.sign.el;
      const elAxis = { 土: 'S', 水: 'S', 风: 'N', 火: 'N' }[el];
      if (elAxis && elAxis !== L.SN) {
        out.push({
          title: `太阳在${sun.sign.cn}（${el}象），类型却在 ${L.SN} 这一侧`,
          text: `${el}象描述的是「什么能打动你、让你觉得真实」，${L.SN} 描述的是「你怎么处理信息」。${el}象偏向${elAxis === 'S' ? '具体、可验证的经验' : '概念、关联与可能性'}，而你的量表落在 ${L.SN} 一侧——这两句可以同时成立：你被一类东西打动，却用另一套方式处理它。`,
          hypotheses: [
            '假说一：感受层与认知层不同步，你容易在「知道自己该怎么做」和「真正被打动」之间拉扯。',
            '假说二：环境长期要求你用 ' + L.SN + ' 这一侧工作，它已经熟练，但不是你的默认。',
            '假说三：两边都真实，只是分别在不同场景里主导（工作一套、私下另一套）。'
          ],
          check: `自查：回想最近一次「明明理由充分却提不起劲」的决定——理由是哪一侧给的，劲又是被哪一侧抽走的？`
        });
      }
    }

    return out;
  }

  /* ---------- 情境指引 ---------- */
  function guidance(mbti, chart, jdUT) {
    if (!chart) return null;
    const T = root.TransitEngine;
    const natalPts = T.natalPointsOf(chart);
    const snap = T.snapshot(natalPts, jdUT);

    const facts = [];
    facts.push(`观测时刻：${T.fmtDateTime(snap.jd)}（换算到你的本地时间约 ${localHint()}）。`);
    facts.push(`月相：${snap.moon.phase}，月面被照亮约 ${snap.moon.illum}%（日月角距 ${snap.moon.elong}°）。`);
    facts.push(snap.retros.length ? `正在逆行的行星：${snap.retros.join('、')}。` : '此刻没有行星逆行。');

    const top = snap.aspects.slice(0, 5);
    top.forEach(a => {
      const exact = T.exactMoment(a.tBody, a.natalLon, a.angle, snap.jd, 400);
      const when = exact ? T.fmtDate(exact) : '不精确成相（行星在接近时转向）';
      const range = exact ? `精确日 ${when}` : when;
      facts.push(`行运${a.tCn}${a.aspect}本命${a.nCn}，容许度 ${a.orb.toFixed(1)}°，${a.applying ? '入相位' : '出相位'}，${range}${a.retro ? '（逆行中，同一相位可能来回三次）' : ''}。`);
    });

    const coupling = [];
    const seenCouple = {};
    const DIM_OF_DOMAIN = {
      career: ['TF', 'JP'], love: ['TF', 'EI'], social: ['EI', 'TF'], study: ['SN', 'JP'],
      money: ['SN', 'TF'], family: ['TF', 'EI'], health: ['SN', 'TF'], decision: ['JP', 'TF']
    };
    const TONE = {
      sun: '这件事会被推到台面上，被动变成主动',
      moon: '情绪需求先浮上来，理性判断会晚一步',
      mercury: '信息、措辞与沟通频次都会加密',
      venus: '取舍变软，关系与舒适度被优先考虑',
      mars: '推进速度变快，摩擦也同步变快',
      jupiter: '机会与扩张的诱因变多，容易答应太多',
      saturn: '要求被验收，容错空间收窄',
      uranus: '原定计划容易被打断，需要临时改道',
      neptune: '边界变模糊，容易把期待当成事实',
      pluto: '底层的权重被翻出来，旧问题会重演一次'
    };
    top.forEach(a => {
      if (seenCouple[a.tBody]) return;
      seenCouple[a.tBody] = true;
      const doms = PLANET_DOMAIN[a.tBody] || [];
      const domCfg = doms.length ? DD().domains[doms[0]] : null;
      if (!domCfg) return;
      const L = lettersOf(mbti);
      const dims = DIM_OF_DOMAIN[doms[0]] || ['TF', 'EI'];
      const letter = L[dims[0]];
      const block = domCfg.blocks[letter];
      const tone = TONE[a.tBody] || '这一域的力道被加强';
      coupling.push(`行运${a.tCn}${a.aspect}本命${a.nCn}，落在${domCfg.name}这一域：${tone}。你在这域默认用的是 ${letter} 侧（${dims[0]}）：${block.mech} 所以这股${REL[a.aspect] || ''}的力道，会先打到「${block.risk.split('；')[0].replace(/「/g, '“').replace(/」/g, '”')}」这个位置。`);
    });

    const doList = [];
    const avoidList = [];
    const seenBody = {};
    top.forEach(a => {
      const tip = PLANET_TIP[a.tBody];
      if (!tip || seenBody[a.tBody]) return;
      seenBody[a.tBody] = true;
      const tension = a.aspect === '四分相' || a.aspect === '冲相' || a.aspect === '合相';
      const tag = `${a.tCn}${a.aspect}本命${a.nCn}${tension ? '（摩擦期）' : ''}`;
      doList.push(`${tag}：${tip.do}`);
      avoidList.push(`${tag}：${tip.avoid}`);
    });
    if (mbti.boundaryDims.length) {
      doList.push(`在 ${mbti.boundaryDims.join('/')} 这两个维度上，这段时间别急着给自己定标签，按具体场景选边更稳。`);
    }

    const up = T.upcoming(natalPts, snap.jd, 12);
    const window = up.slice(0, 6).map(u =>
      `${u.date}｜${u.tCn}${u.aspect}本命${u.nCn}（${T.fmtDate(u.enterJD)} 进入 · ${T.fmtDate(u.exitJD)} 消退）`
    );

    return { facts: facts, coupling: coupling, doList: doList.slice(0, 3), avoidList: avoidList.slice(0, 3), window, moon: snap.moon, retros: snap.retros, top };
  }

  function localHint() {
    const d = new Date();
    const pad = n => (n < 10 ? '0' + n : '' + n);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /* ---------- 总装 ---------- */
  function build(opts) {
    const { mbti, bigfive, chart, jd } = opts;
    if (!mbti) return null;
    const weights = domainWeights(chart);
    const domains = DD().order.map(id => buildDomain(id, mbti, chart, weights));
    return {
      code: mbti.code,
      profile: mbti.profile,
      reliability: mbti.reliability,
      weights,
      domains,
      fusion: fusion(mbti, chart),
      conflicts: conflicts(mbti, bigfive, chart),
      guidance: chart ? guidance(mbti, chart, jd) : null,
      hasChart: !!chart
    };
  }

  root.ReportEngine = { build, domainWeights, fusion, conflicts, guidance, lettersOf, COMBO };
})(typeof globalThis !== 'undefined' ? globalThis : this);
