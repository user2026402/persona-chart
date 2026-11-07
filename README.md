# 人格星图 · 十六型人格与星盘合参

一个纯静态、无后端、可公开给任何人使用的自测站：十六型人格（标准档 / 深度档）→ 八领域深度解读 → 把它和本命盘、行运、日返月返、合盘放在一起读。

所有计算都在浏览器里完成，没有服务器，没有账号，不上传任何出生信息。

## 现在能做什么

| 模块 | 页面 | 说明 |
|---|---|---|
| 十六型人格测评 | `pages/test.html` | 标准档 76 题（66 量表 + 6 效度 + 10 五因素，五因素可跳）；深度档再加 32 道八维认知功能 = 108 题。九种题型混排，临界带出双型候选 |
| 测评结果 | `pages/result.html` | 四维倾向条、类型运作方式、深度档的八维功能强度与「实测栈 vs 标准栈」对比、可信度分级 |
| 出生信息 | `pages/birth.html` | 城市库 244 条，1986–1991 夏令时自动修正，时间未知可切区间模式 |
| 本命盘 | `pages/natal.html` | 星盘轮盘、行星落座落宫、十二宫宫头、主要相位（入/出）、元素模式配比；**行运 / 日返 / 月返** 三层时间；时间未知时出四盘对照 |
| 综合报告 | `pages/report.html` | 八个生活领域（职业/情感/社交/学业/金钱/家庭/身心/决策），每域挂理论骨架 + 机制-表现-风险 + 星盘落点 + 动作；融合层、冲突假说、情境五段 |
| 合盘 | `pages/match.html` | 两种人格类型的适配度（四维机制差异 + 功能栈重合）+ 两张盘的合盘（行星相位接触 + 宫位叠加） |

## 目录

```
persona-chart/
├─ index.html
├─ pages/            test / result / birth / natal / report / match
├─ css/theme.css     主题（奶油黄 + 浅豆绿 + 金星，圆角 40px，无阴影平涂）
├─ js/
│  ├─ data/          mbti-questions / mbti-types / mbti-functions / astro-texts / cities / domains
│  ├─ core/          mbti-engine / bigfive-engine / function-engine / astro-engine /
│  │                 transit-engine / forecast / report-engine / synastry-engine / storage
│  ├─ ui/chart-draw.js
│  └─ pages/         每个页面的渲染脚本
├─ assets/           mascot.png（绘本插画）与截图
└─ tests/            node 回归脚本（不需要浏览器）
```

## 本地打开

直接双击 `index.html` 即可。所有脚本都是相对路径，`file://` 下也能跑。

想用本地服务器（推荐，避免个别浏览器对 file:// 的存储限制）：

```bash
cd persona-chart
python -m http.server 8000
# 打开 http://localhost:8000/
```

## 发布到 GitHub Pages

1. 新建仓库，把 `persona-chart/` 里的所有文件放到仓库根目录（`index.html` 在根）。
2. Settings → Pages → Source 选 `Deploy from a branch`，分支 `main`，目录 `/ (root)`。
3. 等一两分钟，访问 `https://<用户名>.github.io/<仓库名>/`。

站点里没有以 `/` 开头的绝对路径，放在 `/<repo>/` 子路径下同样正常。仓库根目录已带 `.nojekyll`，避免 GitHub 的 Jekyll 处理跳过下划线开头的文件。

## 打印 / 存 PDF

报告页与本命盘页右上角都有「打印 / 存 PDF」：

1. 点按钮，目标选「另存为 PDF」；
2. 纸张 A4、边距默认、**勾选「背景图形」**（否则倾向条和标记底色会变白）；
3. 报告页里折叠的「理论骨架」会在打印时自动展开、打完自动收起，不用手动点开。

`css/theme.css` 里的 `@media print` 已按 A4 重排：去掉深底、按钮、装饰星与编号水印，每个领域单独起页，长内容允许跨页，标题不与正文分离。

## 数据与隐私

- 存档写在浏览器 `localStorage`，key `persona-chart:v1`；合盘对方的资料存在 `persona-chart:partner`；报告的「当下处境」存在 `persona-chart:situation`。
- 首页提供导出 / 导入 JSON，换设备靠这个迁移。
- 没有云同步、没有后端、没有第三方统计。

## 关于「科学依据」

每条结论带分级：

- **A**：算出来的事实，或有实证支持的关系（行星黄经、宫头、相位角、量表得分、内部一致性）。
- **B**：有经典出处、但没有因果层实证的理论推演（类型动力学、宫位含义、相位解读）。
- **C**：传统流传的对应关系（星座性格描述、元素配比的含义）。

占星部分默认 C，除非是天文实算。人格部分的分值是 A，类型描述是 B。测评不是临床诊断工具。

## 回归测试

```bash
node tests/_test-engine2.js     # 星历自检（日食、行星位置、上升中天、日返时刻）
node tests/_test-mbti.js        # 量表计分与可信度
node tests/_test-report.js      # 报告装配（八领域/融合层/冲突/情境五段/无色盘降级）
node tests/_test-synastry.js    # 类型适配度与合盘
```

## 已知边界

- 星历精度：行星黄经 0.02° 量级，冥王 0.1° 量级；真正影响结论的是出生时间与地点精度（4 分钟 ≈ 上升 1°）。
- 返照盘统一按出生地排；如果你已不在出生地，用现居地会得到不同上升，这一点没有对错。
- 木星/土星/天王/海王/冥王已补十二星座文案与十二宫位文案（星座说「怎么运作」，宫位说「作用在哪件事上」）；但这两条只到「落座 + 落宫」的粒度，不对单一行星的每一组相位逐一展开。
- 合盘指数是接触强度的相对指标，不是关系成败的预测。
