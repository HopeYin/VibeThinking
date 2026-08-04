/**
 * scripts/gen-demo-backup.mjs — 生成 VibeThinking 示例备份 JSON
 *
 * 用法：node scripts/gen-demo-backup.mjs
 * 产出：项目根目录 VibeThinking-示例备份.json
 * 说明：时间戳按「相对现在」生成，导入后相对时间显示自然。
 */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const NOW = Date.now();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

let seq = 0;
const id = (p) => `demo-${p}-${++seq}`;

// ── 预设标签（与首次启动播种一致）──
const tags = [
  { id: 'demo-tag-first-principles', name: '第一性原理', color: 'blue', isPreset: true },
  { id: 'demo-tag-inversion', name: '逆向思考', color: 'red', isPreset: true },
  { id: 'demo-tag-analogy', name: '类比', color: 'purple', isPreset: true },
  { id: 'demo-tag-system', name: '系统思考', color: 'green', isPreset: true },
  { id: 'demo-tag-probability', name: '概率思维', color: 'yellow', isPreset: true },
  { id: 'demo-tag-opportunity-cost', name: '机会成本', color: 'orange', isPreset: true },
  { id: 'demo-tag-8020', name: '二八法则', color: 'pink', isPreset: true },
  { id: 'demo-tag-reflection', name: '反思', color: 'gray', isPreset: true },
];
const tagId = (name) => tags.find((t) => t.name === name).id;

const output = (content, tagNames, agoMs) => ({
  id: id('b'),
  kind: 'output',
  content,
  tagIds: tagNames.map(tagId),
  createdAt: NOW - agoMs,
  updatedAt: NOW - agoMs,
});
const breakpoint = (note, agoMs) => ({ id: id('bp'), kind: 'breakpoint', note, createdAt: NOW - agoMs });

// ── 会话 1：功能导览（自带一条 AI 讨论样例）──
const tour = {
  id: 'demo-session-tour',
  title: '示例：这个工具怎么用',
  sortOrder: 0,
  blocks: [
    output('刚导入示例数据。随便点开看看：每条想法就是一个「输出块」，点一下就能改，写完点外面或按 Esc 收起来。', ['反思'], 3 * DAY + 5 * HOUR),
    output('思维流就是一条时间线。写的时候不用管格式、不用管对错，先记下来再说——整理是后面的事。', ['类比'], 3 * DAY + 4 * HOUR),
    breakpoint('第一阶段：熟悉基本操作', 3 * DAY + 3 * HOUR),
    output('给块打标签，是在标记「我刚才用了什么思维方式」。点块下方的「+ 标签」试试，预设的 8 个不够用还能自己建。', ['系统思考'], 2 * DAY + 6 * HOUR),
    output('Alt+N 新块、Alt+B 断点、Alt+I 召唤 AI、Ctrl+K 命令面板。四个键按一遍，基本就毕业了。', ['第一性原理'], 2 * DAY + 5 * HOUR),
    breakpoint('第二阶段：AI 怎么参与进来', 2 * DAY + 4 * HOUR),
    output('打开右侧 AI 讨论（Alt+I）：它已经读过这整条思维链，你不用像对普通聊天机器人那样重复背景。', [], 1 * DAY + 3 * HOUR),
    output('AI 还能干三件事：hover 一个块点 ✨ 让它建议标签；命令面板里「总结本会话」；「生成复盘报告」。都要先在设置页配好 API Key。', ['二八法则'], 1 * DAY + 2 * HOUR),
  ],
  aiThread: [
    {
      id: id('m'),
      role: 'user',
      content: '这个工具和普通备忘录有什么区别？',
      status: 'done',
      createdAt: NOW - 1 * DAY - 1 * HOUR,
    },
    {
      id: id('m'),
      role: 'assistant',
      content:
        '最大的区别是**上下文**。我不是只看你这一句话，而是已经读过你这条思维链的全部输出块和断点——你前面写了「先记下来再说，整理是后面的事」，所以我的建议会直接接在你的思路上，而不是客套的泛泛而谈。\n\n另外三处不同：\n\n- **断点**把思考切成阶段，我能看出你在哪个阶段卡住了\n- **标签**暴露你的思维习惯（比如你是不是很少用逆向思考）\n- 备忘录负责「存」，我负责「接着想」',
      status: 'done',
      createdAt: NOW - 1 * DAY - 59 * MIN,
    },
  ],
  instructionPrompt: '',
  reports: [],
  createdAt: NOW - 3 * DAY - 5 * HOUR,
  updatedAt: NOW - 1 * DAY - 59 * MIN,
};

// ── 会话 2：方向思考（自带总结卡片 + 一篇复盘报告样例）──
const direction = {
  id: 'demo-session-direction',
  title: '机器人工程方向瞎想',
  sortOrder: 1,
  blocks: [
    output('我到底喜欢机器人的什么？拆到最小单元：大概是「让一堆零件动起来并且听我使唤」的那种快感。写代码让电机转起来的瞬间，比考高分爽。', ['第一性原理'], 5 * DAY + 8 * HOUR),
    output('方向候选先全列出来不评价：ROS/运动控制、嵌入式、机器视觉、强化学习、机械结构设计。', [], 5 * DAY + 7 * HOUR),
    breakpoint('先罗列，后排除', 4 * DAY + 9 * HOUR),
    output('全部都要 = 全部都要不到。这学期满打满算，课余精力只够真正深挖一个方向。', ['机会成本'], 4 * DAY + 8 * HOUR),
    output('从就业看：视觉+深度学习的岗位基数最大，但基数大 = 卷得厉害；运动控制+嵌入式岗位少，但竞争者里真正能打的也少。', ['概率思维'], 4 * DAY + 5 * HOUR),
    output('等一下——我注意到自己在用「哪个好就业」来回避「我喜欢哪个」这个问题。这是个危险信号。', ['反思'], 3 * DAY + 10 * HOUR),
    output('下一步：花 20% 时间各做一个最小 demo——视觉做一个「识别手势控制网页翻页」，控制做一个「PID 平衡杆」。哪个让我做到忘记吃饭，就选哪个。', ['二八法则'], 2 * DAY + 8 * HOUR),
  ],
  aiThread: [],
  instructionPrompt: '',
  reports: [
    {
      id: id('r'),
      createdAt: NOW - 1 * DAY - 6 * HOUR,
      content:
        '## 思维轨迹\n\n第一阶段你在做自我剖析：从「喜欢机器人的什么」出发，拆到了最朴素的驱动力。第二阶段转向现实决策：列出五个候选方向，开始用机会成本、概率思维做排除。\n\n## 思维模式使用\n\n标签分布：第一性原理×1、机会成本×1、概率思维×1、反思×1、二八法则×1。思维工具使用相当均衡，没有单一依赖。尤其「反思」的那一次自我纠偏，是整条链里质量最高的动作。\n\n## 亮点\n\n1. **「我在用好就业回避我喜欢哪个」**——能抓到自己的思维偏差，比任何外部建议都值钱。\n2. **最小 demo 验证法**：把「选方向」这个抽象焦虑，转化成了两个两周内可执行的具体实验。\n\n## 卡点与盲区\n\n- 五个候选方向的「排除标准」始终模糊：除了就业和兴趣，没有第三条轴（比如：你的既有基础、能接触到的资源/老师）。\n- 「做到忘记吃饭」这个判据很浪漫但不可观测，需要提前定义记录方式（比如连续心流时长）。\n\n## 下一步建议\n\n1. 今晚就把两个 demo 的「最小可运行版本」拆成 checklist，各不超过 10 条。\n2. 给两个 demo 各设一个 7 天截止点，到点必须凭记录做判断，禁止无限延长。\n3. 找一位做过控制方向的学长聊 30 分钟，补上「真实日常是什么样」这一盲区。',
    },
  ],
  summary: {
    createdAt: NOW - 1 * DAY - 6 * HOUR,
    content:
      '**先罗列后排除**：你先在五个方向（ROS 控制、嵌入式、视觉、强化学习、结构）中明确了精力只够深挖一个。\n\n**关键转折**：你意识到自己在用「好就业」回避「喜欢哪个」，这是本会话最重要的一次自我纠偏。\n\n**总览**：从「我喜欢机器人的什么」出发，最终收敛到一个可执行方案——用两个最小 demo 实测兴趣，凭心流体验做选择。',
  },
  createdAt: NOW - 5 * DAY - 8 * HOUR,
  updatedAt: NOW - 1 * DAY - 6 * HOUR,
};

const backup = {
  app: 'vibethinking',
  schemaVersion: 1,
  appVersion: '0.1.0',
  exportedAt: NOW,
  includesApiKey: false,
  sessions: [tour, direction],
  tags,
  settings: { providers: [], activeProviderId: null, activeModel: null, sidebarCollapsed: false },
};

// 自检：与应用导入校验同一套规则
if (backup.app !== 'vibethinking' || backup.schemaVersion !== 1) throw new Error('header 不对');
if (!Array.isArray(backup.sessions) || !Array.isArray(backup.tags) || !backup.settings) {
  throw new Error('缺少必要数据');
}
const blockTagIds = backup.sessions.flatMap((s) =>
  s.blocks.flatMap((b) => (b.kind === 'output' ? b.tagIds : [])),
);
const tagIds = new Set(tags.map((t) => t.id));
for (const t of blockTagIds) {
  if (!tagIds.has(t)) throw new Error(`块引用了不存在的标签 ${t}`);
}

const outPath = join(root, 'VibeThinking-示例备份.json');
writeFileSync(outPath, JSON.stringify(backup, null, 2), 'utf-8');
console.log(`已生成: ${outPath}`);
console.log(`会话 ${backup.sessions.length} 个 · 标签 ${tags.length} 个 · 块 ${backup.sessions.reduce((n, s) => n + s.blocks.length, 0)} 个`);
