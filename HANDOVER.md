# VibeThinking 项目交接技术文档

> **文档性质**：技术负责人交付给下一位开发 Agent 的完整交接文档
> **读者**：从未接触过本项目的全栈工程师 / AI 编码 Agent
> **编写时间**：2026-08-04 ｜ 基于 commit `079978b` 的真实代码与部署状态
> **配套文档**：`VibeThinking.md`（PRD v1.0，需求与决策的唯一来源）、`README.md`（运行说明）

---

## 0. 如何使用这份文档

1. 先读第 1~3 章建立全局认知（是什么、做到哪了、怎么跑起来）；
2. 动手改代码前，**必读第 5 章架构红线与第 11 章踩坑清单**——这两章能帮你避开 90% 的破坏性错误；
3. 改任何模块前，查第 12 章「要改什么，去哪个文件」定位指南；
4. 完成后按第 13 章验证清单自检，再提交。

**三条元规则**（继承自 PRD，必须遵守）：

- 不引入 PRD 未列出的第三方依赖（确有必要先说明理由并征得所有者同意）；
- TypeScript strict，禁止 `any` 糊墙（外部 API 响应可用 `unknown` + 类型收窄）；
- 这是**纯前端、无后端、无账号**项目，不要主动提议加后端。

---

## 1. 项目是什么

**VibeThinking = 思维的外脑 + AI 的思考陪练。** 一个纯前端 Web 工具：

- 把一闪而过的想法写进「**输出块**」（OutputBlock）；
- 用「**断点**」（Breakpoint）划分思考阶段；
- 给输出块打「**思维方法标签**」（第一性原理、逆向思考、类比……）；
- AI 基于**完整思维链**（不是零散对话）陪你讨论、给标签建议、做会话总结、生成复盘报告。

**关键定位**：自用优先（所有者是机器人工程专业的大学生），桌面端优先，BYOK（用户自带 API Key），数据全在本机浏览器 localStorage，无后端、无账号、无云同步。

---

## 2. 当前状态快照（2026-08-04）

### 2.1 完成度

PRD 的 M0~M5 六个里程碑**全部完成**，每个里程碑一个 git commit：

```
079978b chore: 接入 Vercel（忽略 .vercel 与 .env*）
a518b19 chore: 示例备份生成脚本与演示数据
dd5786c chore: M5 打磨与交付（组件交互测试、README 定稿、全量格式化与验证）
fcc27ee feat: M4 AI 增强三件套（自动标签建议、会话总结、复盘报告）
15277c5 feat: M3 AI 底座（三格式 Provider 抽象层、设置页模型服务、AI 讨论抽屉）
b5c0243 feat: M2 快捷键体系、命令面板、Markdown 导出、全局备份/恢复
63ee53a feat: M1 数据层与核心思维流（storage 迁移框架、stores、会话/块/断点/标签）
3ede7e9 feat: M0 脚手架与设计地基（tokens + 基础 UI 组件 + showcase）
```

工作区干净（`git status` 无未提交内容）。

### 2.2 验证状态

| 验证项 | 状态 |
|---|---|
| `npm run test`（Vitest，40 个单测 / 5 个文件） | ✅ 全过 |
| `npm run lint`（ESLint 9 flat config） | ✅ 无错无警告 |
| `npm run build`（tsc strict + vite） | ✅ 通过，dist gzip ≈ 138 KB |
| dev server 冒烟 | ✅ 通过 |
| **G2/G3：真实 API Key 实测 AI 讨论与三件套** | ⚠️ **未完成**——AI 层已用 mock fetch 单测覆盖，但 PRD 要求真实 DeepSeek/Kimi Key 实测。这是唯一欠缺的验收项，见第 9.2 节。 |

### 2.3 部署状态

- **GitHub**：`HopeYin/VibeThinking`（public），main 分支与本地同步；
- **Vercel**：team `hope-space`，项目 `vibethinking`，生产地址 **https://vibethinking.vercel.app**；
- **自动部署**：Vercel 项目已连接 GitHub 仓库，`git push` 到 main 即自动构建部署；
- 线上版本为**空数据**（BYOK 架构，数据只在各用户的浏览器里，这是特性不是 bug）。

### 2.4 交付物清单

- 完整应用代码（`src/`，约 70 个文件）
- `VibeThinking.md` PRD、`README.md` 运行说明、本文档
- `VibeThinking-示例备份.json` 演示数据（可用应用内「导入」功能一键体验全部功能）+ 生成脚本 `scripts/gen-demo-backup.mjs`

---

## 3. 快速上手（新机器 / 新环境）

### 3.1 环境要求

- **Windows**（所有者环境）；Node ≥ 20（当前用 v24.15.0）；npm 11.x
- ⚠️ **本机怪癖**：Git Bash 里 `node` 可用但 `npm` 不在 PATH。两种解法：
  - 用 PowerShell / CMD 跑 npm 命令（推荐）；
  - 在 Git Bash 里用 `cmd //c "npm run xxx"` 或先把 `C:\Users\HopeYin\AppData\Local\Programs\kimi-desktop\resources\resources\runtime\node` 加入 PATH。

### 3.2 克隆到运行

```powershell
git clone https://github.com/HopeYin/VibeThinking.git
cd VibeThinking
npm install
npm run dev        # http://localhost:5173
```

### 3.3 全部命令

```powershell
npm run dev       # 开发服务器（vite）
npm run build     # tsc --noEmit（strict 类型检查）+ vite build → dist/
npm run test      # vitest run（40 个单测）
npm run lint      # eslint .
npm run format    # prettier --write .
```

### 3.4 体验全部功能（无需 API Key）

打开应用 → 顶栏「导入」→ 选择仓库根目录的 `VibeThinking-示例备份.json` → 确认。
导入后可见：两个示例会话、标签、断点、AI 讨论样例、总结卡片、一篇成品复盘报告。

### 3.5 配置 AI（BYOK）

顶栏「设置」→「模型服务」→「添加 Provider」→ 点 **DeepSeek** 或 **Kimi（Moonshot）** 预设 → 粘贴 API Key → 「测试连接」→ 保存 → 在「当前 Provider / 当前模型」选择生效组合。支持三种 API 格式：OpenAI Chat Completions / OpenAI Responses / Anthropic Messages。

---

## 4. 业务概念与核心决策（推断需求时以此为准）

| 概念 | 含义 |
|---|---|
| **会话 Session** | 一条完整思维链的容器：输出块 + 断点 + AI 讨论 + 复盘报告 |
| **输出块 OutputBlock** | 一条想法记录，思维流基本单元，纯文本（**故意不做 Markdown 编辑器**，PRD D5） |
| **断点 Breakpoint** | 思维流中的阶段分隔线 + 备注；AI 上下文里的语义是「新一个思考阶段」 |
| **标签 Tag** | 思维方法标记；8 个预设（可改可删）+ 用户自定义（名称 + 8 色板颜色） |
| **Provider** | 一家模型服务商配置（格式 + Base URL + Key + 模型列表） |

**五条关键产品决策**（PRD 4.2，改动前必须理解动机）：

- **D1**：命令面板（`Ctrl/⌘+K`）+ 底部快捷工具条，替代旧版悬浮球（桌面端优先）；
- **D2**：AI 上下文 = **完整思维链序列化**，每次请求都携带；对话历史只是附加层。这是与普通聊天机器人的本质区别；
- **D3**：API Key 只存本机 localStorage；**全局备份默认不含 Key**（显式勾选才包含）；Key 绝不进日志、不进导出文件（导入前的自救备份除外，见 7.4）；
- **D4**：标签 = 预设 + 自定义，标签本身是用户的思维资产；
- **D5**：输出块纯文本无摩擦记录；AI 消息**必须**渲染 Markdown。

---

## 5. 架构总览与两条红线

### 5.1 分层

```
src/
├── types/index.ts          # 全部数据模型（Session/Block/Tag/AIMessage/ProviderConfig/Settings…）
├── styles/theme.css        # 设计 token 体系（Tailwind v4 @theme，暗色预留）
├── lib/
│   ├── storage/            # 存储适配层：adapter / keys / migrate / persist / bootstrap / usage
│   ├── ai/                 # AI Provider 抽象层：types / errors / sse / 3 个适配器 / index
│   ├── export/             # download / markdown / backup（+ index 桶文件）
│   ├── prompts.ts          # 全部 prompt 模板 + 思维链序列化与截断策略
│   ├── tagColors.ts        # 标签 8 色板 → Tailwind 字面量类名映射
│   ├── time.ts             # 相对时间格式化
│   └── cn.ts               # className 拼接
├── stores/                 # Zustand：sessions / tags / settings / ui / aiTasks
├── hooks/                  # useAutoResize / useGlobalShortcuts
├── components/
│   ├── ui/                 # 通用组件资产（13 个，见 6.6）
│   └── features/           # 业务组件（17 个 + aiActions.ts 动作层）
├── App.tsx                 # 应用外壳 + 命令面板动作注册
└── main.tsx                # 入口：第一行必须继续是 bootstrap 导入（见 6.2）
```

### 5.2 两条架构红线（违反 = 架构腐败）

1. **UI 不直接碰 localStorage** —— 一律经 `lib/storage`（或经 stores 的 persist 配置）；
2. **UI 不直接发 fetch** —— 一律经 `lib/ai`。

**UI 与 AI 动作之间还有一层约定**：跨组件复用的会话级 AI 动作（总结/复盘）放在 `components/features/aiActions.ts`，直接读写 stores，不从 React 组件层层传参。

### 5.3 状态管理选型

Zustand + persist 中间件。**注意一个非标准用法**（详见 6.2）：persist 写进 localStorage 的是「裸值」而非默认信封，这是 PRD 键设计的硬性要求，改 persist 配置前先看懂 `lib/storage/persist.ts`。

---

## 6. 核心模块详解

### 6.1 数据模型（`src/types/index.ts`）

PRD 7.3 的原样落地，**仅一处有意扩展**：

- `Session.summary?: SessionSummary` —— PRD 数据模型未列，但 F8 要求总结卡片常驻 AI 抽屉顶部，持久化是最合理实现。可选字段，向后兼容（旧备份没有它也合法）。这是 PRD 的 `TODO(question)` 机制记录项，未来若 PRD 更新以其为准。

其余与 PRD 完全一致：`Session / OutputBlock / BreakpointBlock / Tag / AIMessage / ReviewReport / ProviderConfig / Settings / StorageMeta`，`ApiFormat = 'openai-chat' | 'openai-responses' | 'anthropic-messages'`，`TagColor` 为 8 色板字面量联合。

**改数据模型的完整流程**：改 types → `lib/storage/migrate.ts` 把 `CURRENT_SCHEMA_VERSION` +1 并在 `MIGRATIONS` 登记迁移函数 → 检查 `lib/export/backup.ts` 的 `parseBackup` 版本校验 → 补迁移单测。

### 6.2 存储层（`src/lib/storage/`，可复用资产）

| 文件 | 职责 |
|---|---|
| `adapter.ts` | localStorage 唯一通道；JSON 读写，损坏返回 null 不抛出；接口预留换 IndexedDB |
| `keys.ts` | 键空间 `vt:v1:*`（meta / sessions / tags / settings / active-session / legacy-backup），与旧版 `vibethinking:*` 完全隔离，**不迁移旧数据** |
| `migrate.ts` | schema 迁移框架。`CURRENT_SCHEMA_VERSION = 1`；无迁移路径（无 meta 却有数据 / 版本过新 / 迁移表断档）→ 整库备份到 `vt:v1:legacy-backup` 后重置 |
| `persist.ts` | **关键非标件**：`createRawValueStorage(debounceMs)` 桥接 zustand persist，剥掉默认 `{state,version}` 信封，让 localStorage 里就是裸业务数据（PRD 7.4 的键形态要求）。防抖模式用于 sessions 写入（500ms），`beforeunload` + `visibilitychange:hidden` 时强制 flush |
| `bootstrap.ts` | **副作用模块**：跑迁移 + 首启播种 8 个预设标签。`main.tsx` 第一行 `import './lib/storage/bootstrap'` 必须先于任何 store 水合，调整 main.tsx 导入顺序时不要破坏这一点 |
| `usage.ts` | localStorage 占用估算（设置页进度条） |

**zustand persist 的三个配套约定**（在 stores 里，改动时容易踩）：

1. `partialize` 返回**裸数组**（`s.sessions` / `s.tags`），不是对象——所以必须配
2. 自定义 `merge`：数组持久值直接替换对应字段（默认浅合并会把数组摊成数字键）；
3. settings 是普通对象，用默认合并即可。

`activeSessionId` 不走 persist：`stores/sessions.ts` 文件底部的 `subscribe` 把它镜像到 `vt:v1:active-session` 独立键（PRD 键设计要求）。

### 6.3 AI 层（`src/lib/ai/`，可复用资产）

**统一抽象**（`types.ts`）：`ChatMessage / ChatRequest / ChatChunk / ProviderAdapter`。三种 API 格式对上表现为同一个 `chatStream(cfg, req): AsyncGenerator<ChatChunk>` + `testConnection(cfg)`。

| 文件 | 要点 |
|---|---|
| `sse.ts` | 手写 SSE 解析：按行切 `data:` 载荷，事件类型从 JSON 的 `type` 字段判（不依赖 `event:` 行）；`joinUrl` 去末尾斜杠做 Base URL 容错 |
| `openaiChat.ts` | `POST {base}/chat/completions`；`choices[0].delta.content` 增量，`[DONE]` 结束。**DeepSeek / Kimi 预设走它** |
| `openaiResponses.ts` | `POST {base}/responses`；`response.output_text.delta` 增量，`response.completed` 结束，`response.failed`/`error` 抛错 |
| `anthropicMessages.ts` | `POST {base}/messages`；system 消息抽成顶层字段；必须带 `anthropic-dangerous-direct-browser-access: true` 头；`content_block_delta.delta.text` 增量，`message_stop` 结束 |
| `errors.ts` | 统一 `AIError { kind: auth/rate_limit/network/cors/unknown }`；401/403→auth，429→rate_limit，fetch TypeError→network（浏览器 CORS 拦截也表现为它，文案里已提示 proxy 预案） |
| `index.ts` | 分发入口 `streamChat / testProviderConnection`；`generateText`（一次性生成 = 流式攒全文，标签建议/总结/复盘共用）；`PROVIDER_PRESETS`（DeepSeek/Kimi 一键填充，Key 留空）；`API_FORMAT_LABELS` |

**新增一种 API 格式**：写新适配器 → 登记进 `index.ts` 的 `ADAPTERS` → types 的 `ApiFormat` 加字面量 → `API_FORMAT_LABELS` 加文案 → 补 SSE 解析单测（仿照 `ai.test.ts` 的 mock 写法）。

### 6.4 Prompt 层（`src/lib/prompts.ts`）

全部 prompt 集中管理，迭代 prompt 只改这一个文件：

- `serializeThoughtChain`：`[输出块 14:32]（标签：X）内容` / `[断点] 备注`；
- **截断策略**（PRD 7.6.1）：>12000 字符时，保留最近 5 块全文 + 早期总结（无总结则最早 2 块 + 省略提示），system 里显式说明发生了截断。`buildChainContext` 返回 `{ system, truncated, outputCount, breakpointCount }`，后两个字段驱动 AI 抽屉的上下文指示；
- `buildDiscussionMessages`：system = 思维链 + 指令 prompt（会话级 `instructionPrompt` 或默认值），history 只取 `status === 'done'` 的消息；
- 标签建议 `buildSuggestTagsMessages` + 解析 `parseTagSuggestions`（抠第一个 `{...}`，最多 3 个，失败抛错由调用方降级为 toast）；
- 总结 `buildSummaryMessages`（按断点分段 + 总览 ≤300 字）；复盘 `buildReviewMessages`（五段结构固定，**标签分布统计由代码算好注入**，不让模型自己数）。

### 6.5 导出与备份（`src/lib/export/`）

- `markdown.ts`：`sessionToMarkdown`（纯函数，可选附 AI 讨论记录）、`reportToMarkdown`；
- `backup.ts`：`buildBackup`（**默认把 providers 的 apiKey 置空**，`includeApiKey` 时才保留）；`parseBackup` 校验 `app === 'vibethinking'` 且 `schemaVersion` 严格等于当前版本；
- **导入流程**（`ImportButton.tsx`）：选文件 → 校验 → 预览数量 → 确认后**先自动下载当前数据完整备份（含 Key，防丢）** → 三个 store `replaceAll` 整体替换。

### 6.6 UI 组件资产（`src/components/ui/`，13 个）

Button（primary/secondary/ghost/danger × sm/md）、Input、Textarea（自适应高度）、Dialog（portal + Esc + 遮罩）、Toast（Provider + `useToast()`）、Chip（solid/dashed）、Card、IconButton、Popover、ConfirmDialog、EmptyState、CommandPalette（子序列模糊匹配 + 键盘导航）、Tooltip。

约定：每个文件头注释写职责 + 最小使用示例；新增通用组件沿用此约定。

### 6.7 业务组件（`src/components/features/`）

按页面区域记：**TopBar**（产品名/当前模型/导出菜单/导入/设置）、**Sidebar + SessionList**（搜索/双击重命名/HTML5 拖拽排序，**搜索状态下禁用拖拽**防误排序）、**BlockList + OutputBlockItem + BreakpointItem**（思维流）、**QuickToolbar**（底部常驻）、**TagPicker**（已选排前 + 层内新建）、**SettingsDialog + ProviderSection**（标签管理 / 模型服务 / 存储占用）、**AIDrawer + SummaryCard + MarkdownView**（AI 讨论）、**ReportsDialog**（复盘报告）、**ExportMenu / ImportButton / ShortcutHelpDialog**、**aiActions.ts**（总结/复盘动作层）。

### 6.8 Stores 职责表

| Store | 持久化 | 职责 |
|---|---|---|
| `sessions.ts` | `vt:v1:sessions`（500ms 防抖） | 会话 CRUD、块/断点操作、AI 消息、复盘报告、总结；`activeSessionId` 镜像独立键 |
| `tags.ts` | `vt:v1:tags` | 标签增删改 |
| `settings.ts` | `vt:v1:settings` | Provider 管理、当前生效组合、侧栏折叠 |
| `ui.ts` | 不持久化 | 各抽屉/对话框开关（AI 抽屉、设置、命令面板、帮助、导出×2、复盘） |
| `aiTasks.ts` | 不持久化 | 总结/复盘「生成中」标记，防并发重复生成 |

---

## 7. 关键数据流（改代码前先在脑里跑一遍）

### 7.1 块编辑保存

`Textarea onChange → updateBlockContent → zustand set → persist partialize(s.sessions) → createRawValueStorage 防抖 500ms 落盘（页面隐藏/关闭时 flush）`；失焦/Esc → `finalizeBlock` → 空块（trim 后为空）从数组移除——**空块永不落盘**。

### 7.2 AI 讨论一轮

点发送 → 追加 user 消息 + streaming 占位 assistant → `runStream`：`buildDiscussionMessages`（system=思维链+指令，history 仅 done）→ `streamChat` 逐 chunk `patchAIMessage` 累加 → 完成置 `done`；`AbortController` 中断 → `stopped`；异常 → `normalizeException` → toast + 消息置 `error`（「重试上一条」删除失败消息重发）。

### 7.3 总结 / 复盘

命令面板或会话菜单 → `aiActions.runSummarize/runReview`（校验 Provider 已配 → `aiTasks` 置生成中标记 → `generateText` 攒全文 → 写 `session.summary` / 追加 `session.reports`）→ UI 经 store 订阅自动刷新。

### 7.4 备份导入

选 JSON → `parseBackup` 校验 → 预览 → 确认 → **自动下载当前数据完整备份（`includeApiKey: true`，这是 Key 唯一会离开浏览器的场景，落点是用户自己的下载目录）** → `replaceAll` 三 store。

### 7.5 标签删除级联

设置页删标签 → 统计引用数（遍历全部会话的块）→ 确认文案带「N 个输出块正在使用」→ `deleteTag` + `removeTagFromAllBlocks`。

---

## 8. 设计体系（改动时必须遵守的规则）

### 8.1 唯一来源：`src/theme.css`

- 全部设计 token 定义在 `@theme` 块（Tailwind v4 语法）：颜色 `color-*`、字号 `text-*`、圆角 `radius-*`、阴影、字体族。**改颜色/字号/间距只动这里**，组件里不允许出现新的硬编码色值。
- 暗色主题已预留：在 `[data-theme='dark']` 选择器下覆盖同名变量即可生效。目前该选择器内的变量值与亮色相同（等于未做暗色），但机制是通的，做暗色 = 填变量值 + 在 html 元素上切 `data-theme`。
- `.markdown-body` 的排版样式（标题、列表、代码块、引用、表格）也定义在本文件 base 层，AI 输出的 Markdown 渲染靠它。

### 8.2 两条硬规则与一处已知偏离

1. **不写死色值**：组件一律用 `bg-surface`、`text-ink-secondary` 这类语义类。
2. **标签 8 色板必须是字面量类名**：`lib/tagColors.ts` 里每种 `TagColor` 对应完整写死的 Tailwind 类字符串（如 `bg-tag-blue-bg text-tag-blue-fg`）。Tailwind 编译期静态扫描源码生成 CSS，**动态拼接类名（如 `bg-tag-${color}-bg`）会导致样式在生产包中丢失**，这是最容易踩的坑。加新色 = `theme.css` 加变量 + `tagColors.ts` 加字面量 + `types` 的 `TagColor` 联合类型加成员，三处同步。
3. 已知偏离（如实记录）：`SettingsDialog` 的存储占用进度条用了 `style={{ width: ... }}`（动态宽度无法用静态类表达，属合理例外，不要"修复"它）。

---

## 9. 测试与验证现状

### 9.1 自动化测试

40 个单测 / 5 个文件，全部通过（Vitest + jsdom + @testing-library/react）：

| 文件 | 覆盖 |
| --- | --- |
| `lib/storage/storage.test.ts` | 读写、防抖 flush、损坏数据兜底 |
| `lib/ai/ai.test.ts` | OpenAI/Anthropic/Gemini 请求体构造、SSE 解析、错误分支 |
| `lib/export/export.test.ts` | Markdown 导出拼装、文件名清洗 |
| `lib/prompts.test.ts` | 各阶段 prompt 注入上下文变量 |
| `features/inbox/BlockFlow.test.tsx` | 块流渲染、交互（mock 了 `Element.prototype.scrollIntoView`，jsdom 没有该实现） |

jsdom 环境下的既有写法（新测试照抄即可）：AI 测试用 `vi.stubGlobal('fetch', ...)`；`beforeEach` 里清 localStorage；组件测试里 mock scrollIntoView。

### 9.2 唯一欠缺的验收项

**G2（真实 API Key 三 Provider 实测）与 G3（线上生产环境实测）尚未执行。** 代码按各 Provider 官方文档实现、单测覆盖了请求构造与流式解析，但没有用真实 Key 跑通过端到端对话。接手后的第一件事就是补这个（见第 14 章）。

---

## 10. 部署与运维

### 10.1 现状

- GitHub：`HopeYin/VibeThinking`（public，`main` 分支），本地与远端已同步，共 8 个 commit。克隆：`git clone https://github.com/HopeYin/VibeThinking.git`
- Vercel：team `hope-space`，项目 `vibethinking`，生产地址 **https://vibethinking.vercel.app**。已连接 GitHub 仓库，**push 到 main 即自动部署**，不需要手动操作。
- 框架识别为 Vite，构建命令 `npm run build`（先 `tsc -b` 再 `vite build`），输出 `dist/`。纯静态站点，无服务端环境变量。

### 10.2 绝不能提交的东西（已在 .gitignore，重申）

- `.vercel/`（`project.json` 含 projectId `prj_lsa2Q1uCd71iv2qszWZ8sxHmWF9T`、orgId `team_acbm1235cwjcfLAfUonAHYWb`）——这是本地链接状态，不是机密，但属机器本地文件。
- `.env.local`——含 `VERCEL_OIDC_TOKEN`，**是真实凭证，泄露必须立即轮换**。

### 10.3 本机环境备忘

- Node v24.15.0 / npm 11.12.1 / Vite 7.3.6 / Vercel CLI 58.5.1（已 device-flow 登录 HopeYin 账号）。
- **本机网络现象（不是故障）**：在这台机器上 `curl https://vibethinking.vercel.app` 会超时，但外部抓取验证站点完全正常。这是本地网络对 vercel.app 的连通性问题，接手者在本机复现该现象时不要误判为站点挂了——用外部视角（如让有外网的环境访问）验证。
- CORS 兜底预案：`vite.config.ts` 注释里留有 dev 代理配置模板（`/api` → 目标 Provider 的 rewrite 示例）。如果 Anthropic 在浏览器端因 CORS 被拦，启用该代理并给 `AnthropicAdapter` 的 `baseUrl` 传 `/api/anthropic`。

---

## 11. 踩坑清单（每坑一行解决方案）

1. **Git Bash 里 npm 不在 PATH**：本机 `npm` 只能从 `cmd //c "npm ..."` 或 PowerShell 调用；直接 `npm run dev` 会报 command not found。
2. **`chatStream` 必须是 `async function*`**：Provider 接口的流式方法返回 `AsyncGenerator<string>`；在普通 `async` 函数里写 `yield` 编译直接报错。
3. **zustand persist 的 partialize 返回裸数组必须配自定义 merge**：默认浅合并会把数组摊成 `{0: ..., 1: ...}` 数字键对象。`useInboxStore` 的 `merge` 选项就是修这个的，删掉它数据会畸形。
4. **`main.tsx` 第一行必须是 `import './lib/storage/bootstrap'`**：要在任何 store 模块求值（水合）之前完成旧数据迁移。调整 import 顺序会引发"首次启动丢数据"级别的 bug。
5. **SSE 解析只按行处理 `data:` 前缀**：`\r\n` 行尾、`: comment` 心跳行都已处理；不要引入第三方 SSE 库，现有 `sse.ts` 足够且可控。
6. **防抖写入的兜底**：blocks 写入 300ms 防抖，靠 `beforeunload` + `visibilitychange` 触发 `flushBlocks()` 兜底；移除兜底会在快速关页时丢最后一击。
7. **Alt+N / Alt+B / Alt+I 快捷键**在部分平台/输入法下可能与系统快捷键冲突，已知但未改（用户本机验证通过）。
8. **`npm run format` 会重排 Markdown**：曾对 `VibeThinking.md` 造成仅空白的 diff，提交前看一眼 diff 别被吓到。

---

## 12. 定位指南（要改什么 → 去哪里）

| 需求 | 动哪里 |
| --- | --- |
| 改颜色 / 字号 / 圆角 / 排版 | `src/theme.css`（唯一来源） |
| 加新的 Provider API 格式 | `lib/ai/` 新建适配器 → `ADAPTERS` 注册 → `types` 的 `ApiFormat` 加成员 → `API_FORMAT_LABELS` 加文案 → 补单测 |
| 改/加提示词 | `lib/prompts.ts`（含各阶段系统提示与上下文注入） |
| 加命令面板命令 | `App.tsx` 的 actions 列表 |
| 加全局快捷键 | `hooks/useGlobalShortcuts.ts` + `ShortcutHelpDialog.tsx` 里的说明表同步加 |
| 改数据模型（加字段） | `types` → `migrate.ts` 升版本写迁移 → `MIGRATIONS` 注册 → `backup.ts` 的 `parseBackup` 校验 → 补迁移单测。**四步缺一不可**，漏了 parseBackup 会让旧备份导入失败 |
| 加通用 UI 组件 | `components/ui/`，文件头写用法注释示例（项目惯例） |
| 加标签颜色 | `theme.css` 变量 + `tagColors.ts` 字面量类 + `types` 的 `TagColor`，三处同步（见 8.2） |
| 改标签页会话分组/筛选逻辑 | `features/tags/useTagGroups.ts`（纯函数，好测） |

---

## 13. 接手验证清单（确认环境正确再开工）

1. `npm run test` —— 40 个测试全过。
2. `npm run lint` —— 0 error 0 warning。
3. `npm run build` —— 通过，gzip 约 138 KB。
4. `npm run dev` 冒烟，按 PRD（`VibeThinking.md`）第 3 章手动走查四个场景：
   - 碎片捕获：Alt+N 新建块 → 输文字 → 刷新页面不丢；
   - 阶段思考：新建会话 → 发起对话 → AI 流式输出且带历史上下文（需先在设置里配 Key）；
   - 回顾复盘：会话内点复盘 → 生成报告追加到会话；
   - 搜索 + 导出：Cmd/Ctrl+K 搜关键词命中 → 导出 Markdown 文件内容完整。
5. 以上全绿 = 环境可信，可以开始改代码。

---

## 14. 已知限制与下一步建议

### 14.1 已知限制（如实承认，不掩盖）

- **G2/G3 真实 Key 实测未做**（最重要，见第 9.2 节）。
- 单会话 500+ 块无虚拟滚动（PRD 明确非必需，目前靠分页/DOM 量可控撑着）。
- Anthropic 官方 API 浏览器直连大概率被 CORS 拦截，预案见 10.3，未实测。
- `Session.summary` 是 PRD 之外的扩展字段（代码里标了 `TODO(question)`），生成逻辑在复盘流程里，PRD 未定义该行为，后续要决定保留还是对齐 PRD。
- 备份恢复是**整体替换**且要求 backup 版本号严格相等；没有部分恢复/合并模式。
- 存储上限 localStorage 约 5MB，设置页有占用显示；超限后的优雅降级未做。

### 14.2 下一步建议（按优先级）

1. **补 G2/G3 实测**：三种格式各配一个真实 Key 走通对话 + 部署后线上复验。这是上线质量的最后一块拼图。
2. 之后按 PRD 第 13 章候选方向排期：思维链可视化、提示词模板库、使用统计面板、暗色主题（机制已通，只欠填变量）、移动端适配、云同步。

---

> 文档到此为止。读完后按第 13 章清单验证环境，再从第 14 章挑活干。祝顺利。
