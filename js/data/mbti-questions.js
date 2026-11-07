/* 题库数据
   dim: EI / SN / TF / JP（poleA 为第一位字母）
   type: pair(二选一) likert(七点) situ(情境) word(词汇偏好) pick2(选两条) freq(频率) dilemma(两难)
   map: 每个选项对应的“倾向前者程度” 0(完全后极) ~ 1(完全前极)
*/
window.MBTI_QUESTIONS = {
  standard: {
    scale: [
      /* ---------- E / I ---------- */
      { id: 'EI01', dim: 'EI', type: 'pair', q: '周末两天完全空出来，没有任何安排，你更可能：', opts: ['约上几个人出门，哪怕只是随便逛逛、没什么正事', '一个人待着，把攒下来的事慢慢做完，或者干脆什么都不做'], map: [1, 0] },
      { id: 'EI02', dim: 'EI', type: 'likert', q: '在一群人里待久了，我会明显觉得电量被抽走。', reverse: true },
      { id: 'EI03', dim: 'EI', type: 'situ', q: '到一个几乎都不认识的聚会，你更可能：', opts: ['主动找人搭话，很快就融进去', '先观察一阵，找到一两个能聊的人再展开'], map: [1, 0] },
      { id: 'EI04', dim: 'EI', type: 'word', q: '更像你的词：', opts: ['热闹', '安静'], map: [1, 0] },
      { id: 'EI05', dim: 'EI', type: 'likert', q: '有话想说的时候，我需要先讲出来才能想清楚。' },
      { id: 'EI06', dim: 'EI', type: 'pair', q: '遇到一件让你很难受的事：', opts: ['立刻找人说说，讲完才舒服', '先自己消化，过一阵子再谈'], map: [1, 0] },
      { id: 'EI07', dim: 'EI', type: 'freq', q: '过去一周，你主动发起过几次「没有具体目的」的聊天？', opts: ['0 次', '1–2 次', '3–5 次', '6 次以上'], map: [0, 0.33, 0.67, 1] },
      { id: 'EI08', dim: 'EI', type: 'likert', q: '独处一段时间之后，我才觉得自己是完整的。', reverse: true },
      { id: 'EI09', dim: 'EI', type: 'situ', q: '连续三天高强度开会之后，你恢复的方式更像：', opts: ['约朋友吃顿饭聊聊，散散气', '关掉手机自己待一晚，谁也别找我'], map: [1, 0] },
      { id: 'EI10', dim: 'EI', type: 'likert', q: '在群里讨论事情时，我常常是最先开口的那个。' },
      { id: 'EI11', dim: 'EI', type: 'pair', q: '你更喜欢的工作方式：', opts: ['边做边和同事讨论，边聊边定', '自己闷头做完，再拿出来给人看'], map: [1, 0] },
      { id: 'EI12', dim: 'EI', type: 'likert', q: '需要临时当众发言时，我并不太紧张。' },
      { id: 'EI13', dim: 'EI', type: 'word', q: '更像你的词：', opts: ['外放', '内敛'], map: [1, 0] },
      { id: 'EI14', dim: 'EI', type: 'likert', q: '我的想法通常是在和别人聊的过程中成形的。' },
      { id: 'EI15', dim: 'EI', type: 'pair', q: '出门旅行：', opts: ['喜欢有人一起，行程随时商量', '更喜欢一个人走，遇到什么人算什么'], map: [1, 0] },

      /* ---------- S / N ---------- */
      { id: 'SN01', dim: 'SN', type: 'pair', q: '学一样新东西，你会先：', opts: ['看具体的例子、步骤和做法', '弄懂它背后的原理和逻辑'], map: [1, 0] },
      { id: 'SN02', dim: 'SN', type: 'likert', q: '我常常会想到几年后可能发生的事。', reverse: true },
      { id: 'SN03', dim: 'SN', type: 'situ', q: '别人给你讲一个新方案，你第一反应更关心：', opts: ['它具体怎么落地、谁来做、要多久', '这个想法本身成不成立、有没有新意'], map: [1, 0] },
      { id: 'SN04', dim: 'SN', type: 'word', q: '更像你的词：', opts: ['具体', '抽象'], map: [1, 0] },
      { id: 'SN05', dim: 'SN', type: 'likert', q: '在我这儿，把细节记准比「感觉对了」更重要。' },
      { id: 'SN06', dim: 'SN', type: 'pair', q: '看完一部电影，你更容易记住：', opts: ['具体情节、台词、某个镜头', '它给的整体感受和背后的隐喻'], map: [1, 0] },
      { id: 'SN07', dim: 'SN', type: 'likert', q: '我喜欢把一件事拆成能一步步执行的步骤。' },
      { id: 'SN08', dim: 'SN', type: 'situ', q: '接到一个说得很模糊的任务，你会先：', opts: ['问清楚要求、边界和交付标准', '自己构想一个可能的方向再谈'], map: [1, 0] },
      { id: 'SN09', dim: 'SN', type: 'word', q: '更像你的词：', opts: ['实用', '想象'], map: [1, 0] },
      { id: 'SN10', dim: 'SN', type: 'likert', q: '比起一个已被验证的方法，我更容易被新的可能性吸引。', reverse: true },
      { id: 'SN11', dim: 'SN', type: 'pair', q: '如果要介绍你自己，你更愿意说：', opts: ['我做过什么、擅长什么', '我想成为什么、在意什么'], map: [1, 0] },
      { id: 'SN12', dim: 'SN', type: 'likert', q: '我经常在脑子里演练还没发生的对话。', reverse: true },
      { id: 'SN13', dim: 'SN', type: 'pick2', q: '下面四条，选出最像你的两条：', opts: [{ t: '我信亲眼见过、亲手做过的', pole: 1 }, { t: '我信推得通、讲得圆的', pole: 0 }, { t: '我关注此刻正在发生什么', pole: 1 }, { t: '我关注接下来可能发生什么', pole: 0 }] },
      { id: 'SN14', dim: 'SN', type: 'likert', q: '比起改进现有做法，我更想彻底换一种做法。', reverse: true },
      { id: 'SN15', dim: 'SN', type: 'pair', q: '买东西的时候，你更靠：', opts: ['参数、比价、看测评', '感觉、看它像不像我想要的'], map: [1, 0] },

      /* ---------- T / F ---------- */
      { id: 'TF01', dim: 'TF', type: 'pair', q: '朋友向你倾诉一件糟心事，你更可能先：', opts: ['帮他理清问题出在哪、下一步怎么办', '陪他把情绪过完，先不谈怎么办'], map: [1, 0] },
      { id: 'TF02', dim: 'TF', type: 'likert', q: '做决定时，我更在意它是否公平合理，而不是是否让所有人都舒服。' },
      { id: 'TF03', dim: 'TF', type: 'situ', q: '团队里有人一直拖进度，你会：', opts: ['直接指出，按定好的规则处理', '先私下问他为什么拖，再决定怎么办'], map: [1, 0] },
      { id: 'TF04', dim: 'TF', type: 'word', q: '更像你的词：', opts: ['客观', '体贴'], map: [1, 0] },
      { id: 'TF05', dim: 'TF', type: 'likert', q: '别人难过时，我会先跟着难受，再想能做点什么。', reverse: true },
      { id: 'TF06', dim: 'TF', type: 'pair', q: '评价一个方案，你会先说：', opts: ['它哪里不成立、哪里有漏洞', '它哪里有价值、值得保留'], map: [1, 0] },
      { id: 'TF07', dim: 'TF', type: 'likert', q: '我很难对别人的请求说不。', reverse: true },
      { id: 'TF08', dim: 'TF', type: 'situ', q: '要给同事一个不太好的反馈，你会：', opts: ['讲清事实和改进点，尽量简短', '先铺垫，先照顾他的感受再进正题'], map: [1, 0] },
      { id: 'TF09', dim: 'TF', type: 'word', q: '更像你的词：', opts: ['讲理', '讲情'], map: [1, 0] },
      { id: 'TF10', dim: 'TF', type: 'likert', q: '争论的时候，我能把「观点」和「人」分开看。' },
      { id: 'TF11', dim: 'TF', type: 'dilemma', q: '两个都不舒服，但你更能接受哪个？', opts: ['被人说冷血、不近人情', '被人说没原则、太好说话'], map: [1, 0] },
      { id: 'TF12', dim: 'TF', type: 'likert', q: '我会因为别人一句话的语气不舒服很久。', reverse: true },
      { id: 'TF13', dim: 'TF', type: 'likert', q: '做选择的时候，我列得出自己的判断标准。' },
      { id: 'TF14', dim: 'TF', type: 'pair', q: '看完一条社会新闻，你更先关注：', opts: ['事实是什么、责任该谁担', '当事人当时是什么处境'], map: [1, 0] },
      { id: 'TF15', dim: 'TF', type: 'pick2', q: '下面四条，选出最像你的两条：', opts: [{ t: '我按标准判断', pole: 1 }, { t: '我按直觉判断', pole: 0 }, { t: '我宁可事情对、有人不高兴', pole: 1 }, { t: '我宁可人不难受、事情慢一点', pole: 0 }] },

      /* ---------- J / P ---------- */
      { id: 'JP01', dim: 'JP', type: 'pair', q: '出门旅行：', opts: ['提前把每天住哪、去哪定好', '订好第一站，到了再看'], map: [1, 0] },
      { id: 'JP02', dim: 'JP', type: 'likert', q: '计划被打乱的时候，我会明显不舒服。' },
      { id: 'JP03', dim: 'JP', type: 'situ', q: '一个项目 deadline 在两周后，你会：', opts: ['现在就拆成任务，按节奏开始做', '前十天先放着，最后几天集中做完'], map: [1, 0] },
      { id: 'JP04', dim: 'JP', type: 'word', q: '更像你的词：', opts: ['定下来', '保持开放'], map: [1, 0] },
      { id: 'JP05', dim: 'JP', type: 'likert', q: '我常常在最后一刻才开始干。', reverse: true },
      { id: 'JP06', dim: 'JP', type: 'pair', q: '你的桌面和文件：', opts: ['都有固定位置，我随手就能找到', '有点乱，但我知道东西在哪'], map: [1, 0] },
      { id: 'JP07', dim: 'JP', type: 'freq', q: '要出门的话，你一般提前多久收拾行李？', opts: ['前一天或更早收好', '出门前几小时', '临出门才抓'], map: [1, 0.5, 0] },
      { id: 'JP08', dim: 'JP', type: 'likert', q: '事情悬着没定下来，我会一直惦记着。' },
      { id: 'JP09', dim: 'JP', type: 'situ', q: '突然多出一天完全空闲的时间，你会：', opts: ['很快就在脑子里安排出要做的事', '就让它空着，随它去'], map: [1, 0] },
      { id: 'JP10', dim: 'JP', type: 'likert', q: '我喜欢把选择留到最后，说不定有更好的。', reverse: true },
      { id: 'JP11', dim: 'JP', type: 'pair', q: '你的做事节奏更像：', opts: ['一件一件做完，再开始下一件', '几件事同时推进，来回切换'], map: [1, 0] },
      { id: 'JP12', dim: 'JP', type: 'likert', q: '我有一套自己的固定流程，而且不太想改。' },
      { id: 'JP13', dim: 'JP', type: 'word', q: '更像你的词：', opts: ['有序', '随性'], map: [1, 0] },
      { id: 'JP14', dim: 'JP', type: 'likert', q: '我会为了保持灵活，故意先不承诺。', reverse: true },
      { id: 'JP15', dim: 'JP', type: 'pick2', q: '下面四条，选出最像你的两条：', opts: [{ t: '先做完，再放松', pole: 1 }, { t: '边做边放松', pole: 0 }, { t: '我讨厌临时变动', pole: 1 }, { t: '我喜欢临场发挥', pole: 0 }] }
    ],

    /* 效度题：不进分数，只进可信度 */
    validity: [
      { id: 'V01', kind: 'pairRepeat', pairWith: 'V02', dim: 'TF', type: 'likert', q: '我常常先有情绪反应，再去找理由。' },
      { id: 'V02', kind: 'pairRepeat', pairWith: 'V01', dim: 'TF', type: 'likert', q: '我倾向于先感受，再分析。' },
      { id: 'V03', kind: 'pairRepeat', pairWith: 'V04', dim: 'JP', type: 'likert', q: '事情定下来之后，我才安心。' },
      { id: 'V04', kind: 'pairRepeat', pairWith: 'V03', dim: 'JP', type: 'likert', q: '没有定下来的事，会一直挂在我心上。' },
      { id: 'V05', kind: 'socialDesirability', type: 'likert', q: '我从来没有对任何人产生过反感。' },
      { id: 'V06', kind: 'socialDesirability', type: 'likert', q: '我几乎从没后悔过自己说过的话。' }
    ],

    /* 五因素：mini-IPIP 10 题（公有领域） */
    bigfive: [
      { id: 'BF01', facet: 'E', q: '我常常是聚会里最活跃的那个。', reverse: false },
      { id: 'BF02', facet: 'E', q: '我话不多。', reverse: true },
      { id: 'BF03', facet: 'A', q: '我容易对别人的感受产生共鸣。', reverse: false },
      { id: 'BF04', facet: 'A', q: '别人有麻烦的时候，我不太关心。', reverse: true },
      { id: 'BF05', facet: 'C', q: '该做的事我会立刻做完。', reverse: false },
      { id: 'BF06', facet: 'C', q: '我常把东西放错地方，之后到处找。', reverse: true },
      { id: 'BF07', facet: 'N', q: '我的情绪起伏比较大。', reverse: false },
      { id: 'BF08', facet: 'N', q: '大部分时候我是放松的。', reverse: true },
      { id: 'BF09', facet: 'O', q: '我的想象力很活跃。', reverse: false },
      { id: 'BF10', facet: 'O', q: '我对抽象的想法没什么兴趣。', reverse: true }
    ]
  }
};
