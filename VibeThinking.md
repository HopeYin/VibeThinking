# VibeThinking 重写项目文档

> **文档性质**：产品需求文档（PRD）+ 技术方案 + 实施计划的合一文档
> **读者**：本地 AI 编码 agent（Kimi Code / Kimi K3）
> **项目所有者**：个人开发者（vibecoding 初学者，Windows 环境）
> **版本**：v1.0 ｜ 2026-08-03

---

## 0. 给执行 agent 的指引（先读这一节）

你是一名全栈工程师，任务是**从零重写**一个名为 VibeThinking 的思维记录 Web 应用。本文档是你唯一的需求来源，请严格遵守以下约定：

1. **按第 9 章的里程碑顺序执行**（M0 → M5），每个里程碑完成后必须：通过构建、通过测试、向用户汇报「完成了什么 / 如何验证 / 已知限制」。
2. **不得引入本文档未列出的第三方依赖**。如确有必要，先说明理由并征得用户同意。
3. 所有代码使用 **TypeScript strict 模式**，禁止用 `any` 糊墙（与外部 API 响应交互处可用 `unknown` + 类型收窄）。
4. 遇到本文档未覆盖的细节，按「决策理由」体现的原则自行推断；仍无法确定的，记录 `TODO(question): ...` 并在阶段汇报中提出，**不要静默假设**。
5. 用户在 **Windows** 环境工作：所有命令给出 PowerShell 兼容写法，路径注意分隔符，不要使用仅 Unix 可用的 shell 语法。
6. 这是一个**纯前端、无后端、无账号**的项目。不要主动提议加后端。
7. 每个功能完成后，更新项目根目录的 `README.md`（运行方式、当前进度）。

---

## 1. 项目概述

### 1.1 这是什么

VibeThinking 是一个**记录和梳理思维过程的轻量 Web 工具**。核心模型：

- 把一闪而过的想法写进「**输出块**」；
- 用「**断点**」划分思考阶段；
- 给输出块打「**思维方法标签**」（第一性原理、逆向思考、类比……）；
- 让 AI 基于**完整思维链**（而非零散的提问）陪你继续想、帮你总结和复盘。

一句话：**思维的外脑 + AI 的思考陪练**。

### 1.2 为什么重写

项目存在一个旧版本（React 19 + TS + Vite + Tailwind v4，纯 localStorage），本次**完全从零重写**，目的：

1. **沉淀可复用资产**：规范的设计 token 体系、AI Provider 抽象层、存储适配层、组件库写法——这些要能搬进作者未来的其他项目；
2. **重新设计功能与交互**：旧版交互（如悬浮球）有移动端思维残留，桌面端体验不佳；
3. **升级 AI 能力**：从单一 DeepSeek 对话，升级为多模型 BYOK + 自动标签 + 总结 + 复盘报告。

### 1.3 定位

- **自用优先**，做好了再考虑对外发布；
- 因此：不妥协体验，但也不为「想象中的多用户」做任何账号、权限、后端设计。

---

## 2. 目标与非目标

### 2.1 目标（本期必须达成）

| #   | 目标                                                       | 验收方式               |
| --- | ---------------------------------------------------------- | ---------------------- |
| G1  | 核心思维记录链路完整：会话 / 输出块 / 断点 / 标签          | 手动走查通过           |
| G2  | AI 讨论可用：多模型、流式、可停止/重试/清空                | 接入真实 API Key 实测  |
| G3  | AI 增强三件套：自动标签建议、会话总结、思维复盘报告        | 实测生成质量可用       |
| G4  | 明亮简洁的全新设计（类 Notion/Linear 气质），设计 token 化 | 设计规范章节落地为代码 |
| G5  | 数据安全：localStorage 持久化 + 全局 JSON 备份/恢复        | 刷新、导出入库实测     |
| G6  | 本地可跑、可构建静态产物，具备随时部署到静态托管的能力     | `npm run build` 通过   |

### 2.2 非目标（本期明确不做）

- ❌ 账号系统、后端、数据库、云同步
- ❌ 旧版（`vibethinking:*` / `thought-debugger:*`）数据迁移——用户确认不需要
- ❌ 思维链可视化（时间线/图谱）、提示词模板库、使用统计面板——记入「后续候选」（第 12 章）
- ❌ 移动端深度适配（只需不破版，不做移动端交互优化）
- ❌ 暗色主题（但设计 token 结构必须**预留**暗色扩展能力，见 6.2）
- ❌ 协作、分享、发布到公网社区

---

## 3. 用户与使用场景

**唯一用户画像**：开发者本人，大学生，用此工具辅助学习思考、项目构思、自我梳理。

**核心场景**：

1. **碎片想法捕获**：学习/刷手机时冒出一个想法 → 打开工具 → 当前会话尾部新增输出块 → 打完标签继续干别的。
2. **阶段性深度思考**：写一段想法 → 插入断点标记「第一阶段结束」→ 继续写 → 需要碰撞时打开 AI 讨论，AI 已读过整条思维链。
3. **回顾与复盘**：隔几天回来 → 让 AI 总结这个会话 → 生成复盘报告：这段时间我在想什么、卡在哪、下一步建议。
4. **跨项目复用思维**：搜索历史会话标题 → 找到旧思考 → 导出 Markdown 带走。

---

## 4. 产品功能规格

### 4.1 功能总览

| 状态        | 功能                      | 说明                                       |
| ----------- | ------------------------- | ------------------------------------------ |
| 保留+重设计 | 会话管理                  | 创建/切换/删除/重命名/搜索/拖拽排序        |
| 保留+重设计 | 输出块                    | 自适应高度编辑、编辑态/阅读态切换          |
| 保留+重设计 | 思维方法标签              | 预设 + 用户自定义，支持增删改与颜色        |
| 保留+重设计 | 断点                      | 阶段划分 + 备注                            |
| 保留+重设计 | AI 讨论                   | 流式、停止、重试、清空、Markdown 渲染      |
| 保留+重设计 | Markdown 导出             | 单会话导出 `.md`                           |
| 保留+重设计 | 全局备份                  | JSON 导出/导入恢复                         |
| 保留+重设计 | 快捷键                    | 固定快捷键 + 帮助面板                      |
| **替换**    | ~~悬浮球~~ → **命令面板** | 见 4.2 决策说明                            |
| **新增**    | 多模型 Provider 管理      | 预设 DeepSeek/Kimi + 自定义，三种 API 格式 |
| **新增**    | AI 自动标签建议           | 对输出块建议标签，一键采纳                 |
| **新增**    | AI 会话总结               | 对整个会话或断点间阶段生成摘要             |
| **新增**    | AI 思维复盘报告           | 结构化复盘，可再生成、可导出               |

### 4.2 关键决策与理由（agent 推断细节时以此为准）

**D1：用「命令面板 + 快捷工具条」替换「悬浮球」。**
理由：产品定位桌面网页优先。悬浮球是移动端单手场景的交互（遮挡内容、拖动误触），桌面端更高效的等价物是 Linear 式命令面板（`Ctrl/⌘+K` 模糊搜索所有动作）+ 主区底部一条常驻快捷工具条（新输出块 / 插断点 / AI 讨论）。命令面板同时成为快捷键体系的发现入口。

**D2：AI 的上下文 = 完整思维链，而不是对话历史。**
理由：这是本产品与普通聊天机器人的本质区别。每次 AI 请求都携带「当前会话全部输出块 + 断点 + 标签」序列化后的上下文（见 8.3 的截断策略），AI 讨论窗内的多轮对话只是附加层。

**D3：API Key 存浏览器 localStorage，用户自带（BYOK）。**
理由：无后端，没有更安全的存放处；必须在设置页明确提示「Key 仅存储于本机浏览器，不会上传到任何第三方服务器，清除浏览器数据会删除它」。绝不把 Key 写进任何日志、导出文件（全局备份 JSON 默认**不含** Key，提供勾选「包含 API Key」的显式选项）。

**D4：标签系统 = 预设 + 自定义。**
理由：旧版预设「第一性原理/逆向思考/类比」等是用户核心习惯，必须保留为默认预设；同时开放自定义（名称 + 颜色），标签本身也是用户的思维资产。

**D5：纯文本编辑，不做块内 Markdown 编辑器。**
理由：输出块追求「无摩擦记录」，富文本编辑会增加认知负担和实现复杂度。AI 消息则**必须**渲染 Markdown（react-markdown）。

### 4.3 功能详细规格

#### F1 会话管理

- 左侧栏：会话列表，按用户拖拽排序持久化；顶部搜索框按标题过滤。
- 新建会话：默认标题 `未命名会话 + 日期`，进入后可重命名（双击标题或命令面板）。
- 删除会话：二次确认（对话框），删除不可恢复，提示可先导出备份。
- 切换会话：主区切换，记住每个会话的滚动位置（尽力而为，非硬性要求）。

#### F2 输出块

- 主区为按时间正序的「思维流」，输出块是基本单元。
- 阅读态：显示内容 + 标签 chips + 相对时间（如「3 分钟前」）；点击进入编辑态。
- 编辑态：自适应高度 textarea，实时保存（防抖 ~500ms），`Esc` 或点击外部回到阅读态。
- 空块不允许保存（内容为空且从未有内容则删除该块）。
- 块操作（hover 浮现）：编辑标签、AI 建议标签、删除（二次确认）。

#### F3 思维方法标签

- 预设标签（首次启动写入，可改可删）：第一性原理、逆向思考、类比、系统思考、概率思维、机会成本、二八法则、反思。
- 标签管理入口：设置页 + 输出块的标签编辑弹层内「新建标签」。
- 标签属性：名称、颜色（从预设 8 色板选）。
- 输出块标签 UI：已选标签显示为彩色 chips；点「+」展开选择层，已选排前，未选收起（沿用旧版好评交互）。
- 标签删除：若被块引用，提示「N 个输出块正在使用」，确认后从所有块移除。

#### F4 断点

- 断点是思维流中的阶段分隔符：一条横线 + 可编辑备注（如「第一阶段：问题定义完毕」）。
- 插入位置：思维流尾部（通过工具条/命令面板/快捷键）。
- 断点可编辑备注、可删除。
- 断点在 AI 上下文中的语义：「以下是新一个思考阶段」。

#### F5 AI 讨论

- 打开方式：右侧抽屉（宽约 400px），不离开思维流。
- 对话区：用户/AI 气泡，AI 消息渲染 Markdown（代码块带复制按钮）。
- 流式输出 + 「停止生成」按钮；失败可「重试上一条」；可「清空对话」（二次确认，仅清对话不清思维链）。
- 输入框上方可展开「指令 prompt」编辑区（会话级持久化），默认文案见 8.2。
- 上下文指示：输入框旁常驻提示「AI 已读取本会话 N 个输出块 / M 个断点」，让上下文透明可见。

#### F6 多模型 Provider 管理（新增）

- 设置页「模型服务」分区：Provider 列表 + 添加/编辑/删除。
- 每个 Provider：名称、API 格式（三选一）、Base URL、API Key（密码框，显示/隐藏切换）、模型列表（逗号分隔手填）、默认模型。
- 预设模板（一键填充 Base URL 与格式，Key 留空）：
  - **DeepSeek**：`https://api.deepseek.com`，OpenAI Chat Completions 格式，示例模型 `deepseek-chat` / `deepseek-reasoner`；
  - **Kimi（Moonshot）**：`https://api.moonshot.cn/v1`，OpenAI Chat Completions 格式，模型用户自填（如 `kimi-k2` 系列，以官方为准）。
- 自定义：支持三种 API 格式——`OpenAI Chat Completions`、`OpenAI Responses`、`Anthropic Messages`（技术细节见 7.5）。
- 全局「当前生效」组合：一个 Provider + 一个模型，设置页选择，顶栏显示当前模型名。
- 「测试连接」按钮：发一条极短消息验证 Key/格式可用，返回延迟与结果。

#### F7 AI 自动标签建议（新增）

- 输出块 hover 操作「AI 建议标签」→ 调当前模型 → 返回 1~3 个标签建议（仅限现有标签库中选择，prompt 约束）→ 以虚线 chip 形式展示 → 点击采纳 / 忽略。
- 建议不自动写入，必须用户确认（思维资产的所有权在人）。

#### F8 AI 会话总结（新增）

- 会话级操作（命令面板 / 会话菜单）：「总结本会话」。
- 生成结果以一张特殊卡片插入 AI 讨论抽屉顶部（同时可一键复制 Markdown），不落进思维流。
- 总结 prompt 要求：按断点分段概括 + 一段总览，300 字内。

#### F9 AI 思维复盘报告（新增）

- 会话级操作：「生成复盘报告」。
- 报告结构（prompt 中固定要求）：
  1. **思维轨迹**：各阶段（按断点）主题一句话概括；
  2. **思维模式使用**：标签分布统计与简评；
  3. **亮点**：最有价值的 1~3 个想法及原因；
  4. **卡点与盲区**：反复出现但未推进的问题；
  5. **下一步建议**：可执行的 3 条建议。
- 报告存于会话（可查看历史报告、重新生成），支持导出单篇为 `.md`。

#### F10 Markdown 导出

- 导出当前会话为 `{会话标题}.md`：标题、创建时间、按时间序的输出块（含标签）、断点（含备注）、末尾附 AI 讨论记录（可选勾选）。
- 复盘报告单独可导出。

#### F11 全局备份 / 恢复

- 顶栏「导出」：全部会话 + 标签 + 设置（**默认不含 API Key**，提供显式勾选）为一个 JSON 文件下载，文件名含日期。
- 「导入」：选择 JSON → 校验 schema 版本 → 预览将恢复的会话数量 → 确认后**整体替换**当前数据（操作前强制先自动下载一份当前数据备份）。

#### F12 快捷键与命令面板

- 固定快捷键（焦点在输入框时不触发，除命令面板）：
  - `Ctrl/⌘+K`：命令面板
  - `Alt+N`：新输出块
  - `Alt+B`：插入断点
  - `Alt+I`：打开/关闭 AI 讨论
  - `Ctrl/⌘+/`：快捷键帮助面板
- 命令面板：模糊搜索全部动作（新建会话/切换会话/新块/断点/AI 讨论/总结/复盘/导出/备份/设置/测试连接），键盘上下选择，回车执行。

---

## 5. 界面结构与信息架构

### 5.1 整体布局（桌面优先）

```
┌──────────────────────────────────────────────────────────┐
│ 顶栏：产品名 · 当前模型 · 备份/导入 · 设置                  │
├──────────┬───────────────────────────────┬───────────────┤
│ 左侧栏    │ 主区（思维流）                  │ AI 讨论抽屉    │
│ 260px    │ 内容列 max-w-3xl 居中          │ ~400px 可开关  │
│ 会话列表  │ 输出块/断点按时间序             │ 气泡对话       │
│ 搜索·排序 │ 底部快捷工具条                  │ 指令prompt编辑 │
└──────────┴───────────────────────────────┴───────────────┘
```

- 左侧栏可折叠为窄条；AI 抽屉默认关闭，打开时主区内容列不被挤压变形（整体右移或覆盖，取实现简单者）。
- 主区思维流：输出块为卡片，断点为通栏横线分隔。
- 窄屏（<1024px）仅需不破版：侧栏抽屉化，AI 抽屉全屏覆盖。

### 5.2 空状态

- 无会话：主区居中插画位（先用纯文案）+「新建会话」按钮。
- 会话无内容：思维流中央提示「写下第一个想法（Alt+N）」。
- AI 未配置：AI 抽屉内引导跳转设置页配置 Provider。

---

## 6. 设计规范（Design Tokens）

**风格方向**：明亮简洁，类 Notion / Linear 的气质——大面积留白、克制的色彩、清晰的层级、细腻的微交互。**禁止**：渐变滥用、重阴影、圆角过大、花哨动画。

### 6.1 色彩

以 CSS 变量定义，全部通过 Tailwind v4 的 `@theme` 落地（`src/styles/theme.css`）：

| Token                    | 值        | 用途                             |
| ------------------------ | --------- | -------------------------------- |
| `--color-bg`             | `#FFFFFF` | 页面背景                         |
| `--color-bg-subtle`      | `#F7F7F5` | 侧栏、卡片底                     |
| `--color-bg-muted`       | `#EFEFED` | hover、分隔区                    |
| `--color-border`         | `#E5E5E2` | 边框、分隔线                     |
| `--color-text`           | `#1F2328` | 主文字                           |
| `--color-text-secondary` | `#6B7280` | 次要文字                         |
| `--color-text-tertiary`  | `#9CA3AF` | 占位、时间戳                     |
| `--color-accent`         | `#5E6AD2` | 品牌强调（按钮、聚焦环、激活态） |
| `--color-accent-hover`   | `#4F5BC0` | 强调 hover                       |
| `--color-accent-subtle`  | `#EEEFF9` | 强调浅底（选中态背景）           |
| `--color-success`        | `#16A34A` | 成功                             |
| `--color-warning`        | `#D97706` | 警告                             |
| `--color-danger`         | `#DC2626` | 危险/删除                        |

**暗色预留**：所有颜色一律通过语义 token 引用（`bg-bg` / `text-text-secondary` 等），**禁止在组件里写死色值**。未来加暗色只需新增 `[data-theme="dark"]` 下的一套变量覆盖。

**标签 8 色板**（标签 chip 用，浅底深字）：灰 `#6B7280/#F3F4F6`、红 `#DC2626/#FEE2E2`、橙 `#D97706/#FEF3C7`、黄 `#A16207/#FEF9C3`、绿 `#16A34A/#DCFCE7`、蓝 `#2563EB/#DBEAFE`、紫 `#7C3AED/#EDE9FE`、粉 `#DB2777/#FCE7F3`（格式：文字色/背景色）。

### 6.2 字体与排版

- 字体栈：`-apple-system, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`；代码：`ui-monospace, "Cascadia Code", "JetBrains Mono", Consolas, monospace`。
- 字号阶（px）：`12 / 13 / 14 / 16 / 18 / 20 / 24 / 30`；正文默认 14，思维流块内容 15~16。
- 行高：正文 1.6，标题 1.3；字重：400 / 500 / 600。

### 6.3 间距、圆角、阴影、动效

- 间距：4px 基网（4 / 8 / 12 / 16 / 20 / 24 / 32 / 48）。
- 圆角：`6 / 8 / 12`，卡片 8，按钮/输入 6，对话框 12。
- 阴影三级（克制）：`sm: 0 1px 2px rgba(0,0,0,.04)`；`md: 0 4px 12px rgba(0,0,0,.08)`（卡片 hover、下拉）；`lg: 0 8px 24px rgba(0,0,0,.12)`（对话框、命令面板）。
- 动效：`150ms ease-out` 为主（hover、展开）；抽屉/对话框 `200ms`；不用弹性动画。

### 6.4 组件规范清单

需要实现的通用组件（放 `src/components/ui/`，即本项目沉淀的组件资产）：Button（primary/secondary/ghost/danger，sm/md 尺寸）、Input、Textarea（自适应高度）、Chip（标签）、Card、Dialog、Dropdown/Popover、Toast、Tooltip、CommandPalette、EmptyState、IconButton。每个组件受控 + 受设计 token 约束，写最小使用示例于组件文件头注释。

---

## 7. 技术架构

### 7.1 技术选型（选定，勿擅自更换）

| 层            | 选择                                                           | 理由                                 |
| ------------- | -------------------------------------------------------------- | ------------------------------------ |
| 框架          | **React 19 + TypeScript（strict）**                            | 作者技能栈延续，生态最大             |
| 构建          | **Vite**（最新稳定版）                                         | 快、标准、部署产物为纯静态           |
| 样式          | **Tailwind CSS v4**（`@tailwindcss/vite`，CSS-first `@theme`） | token 体系即代码，资产可移植         |
| 状态          | **Zustand**（+ `persist` 中间件）                              | 轻量、与 localStorage 持久化天然契合 |
| 图标          | **lucide-react**                                               | 风格克制，契合设计方向               |
| ID            | **nanoid**                                                     | 小、标准                             |
| Markdown 渲染 | **react-markdown + remark-gfm**                                | 仅用于 AI 消息与报告展示             |
| 测试          | **Vitest + @testing-library/react**                            | 与 Vite 同生态                       |
| 质量          | **ESLint + Prettier**                                          | 提交前可手动跑 `npm run lint`        |

**不引入**：路由库（单视图应用，无多页面）、富文本编辑器、UI 组件库（组件自研即资产）、状态管理重型方案（Redux 等）。

### 7.2 分层架构

```
src/
├── components/        # UI 层
│   ├── ui/            # 通用组件资产（Button/Dialog/CommandPalette…）
│   └── features/      # 业务组件（SessionList/BlockList/AIDrawer…）
├── stores/            # Zustand stores（sessions / tags / settings / ai）
├── lib/
│   ├── storage/       # 存储适配层（localStorage 实现 + 接口）
│   ├── ai/            # AI Provider 抽象层（见 7.5）
│   ├── export/        # Markdown 导出、JSON 备份/恢复
│   └── prompts.ts     # 全部 prompt 模板集中管理
├── types/             # 全部 TS 类型（数据模型）
├── hooks/             # 快捷键、自适应高度等
└── styles/            # theme.css（设计 tokens）
```

原则：**UI 不直接碰 localStorage，不直接发 fetch**——一律经由 storage 层与 ai 层。这两条边界是本项目的架构红线。

### 7.3 数据模型（`src/types/index.ts`）

```ts
// ===== 思维链 =====
interface Session {
  id: string;
  title: string;
  sortOrder: number;
  blocks: Block[]; // 按时间正序
  aiThread: AIMessage[]; // AI 讨论记录
  instructionPrompt: string; // 会话级指令 prompt
  reports: ReviewReport[]; // 复盘报告历史
  createdAt: number;
  updatedAt: number;
}

type Block = OutputBlock | BreakpointBlock;

interface OutputBlock {
  id: string;
  kind: 'output';
  content: string;
  tagIds: string[];
  createdAt: number;
  updatedAt: number;
}

interface BreakpointBlock {
  id: string;
  kind: 'breakpoint';
  note: string; // 阶段备注，可为空
  createdAt: number;
}

interface Tag {
  id: string;
  name: string;
  color: TagColor; // 8 色板之一
  isPreset: boolean;
}

// ===== AI =====
interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status: 'done' | 'streaming' | 'error' | 'stopped';
  createdAt: number;
}

interface ReviewReport {
  id: string;
  content: string; // Markdown
  createdAt: number;
}

// ===== 设置 =====
type ApiFormat = 'openai-chat' | 'openai-responses' | 'anthropic-messages';

interface ProviderConfig {
  id: string;
  name: string;
  apiFormat: ApiFormat;
  baseUrl: string;
  apiKey: string; // 仅存 localStorage，见 D3
  models: string[];
  defaultModel: string;
}

interface Settings {
  providers: ProviderConfig[];
  activeProviderId: string | null;
  activeModel: string | null;
  sidebarCollapsed: boolean;
}
```

### 7.4 存储方案

- 介质：`localStorage`，经 `lib/storage` 适配层访问（接口预留未来换 IndexedDB 的可能）。
- 键设计（全新键空间，与旧版无关）：
  - `vt:v1:meta` → `{ schemaVersion: 1, appVersion }`
  - `vt:v1:sessions` → `Session[]`
  - `vt:v1:tags` → `Tag[]`
  - `vt:v1:settings` → `Settings`
  - `vt:v1:active-session` → `string`
- **版本迁移**：读取时校验 `schemaVersion`，不等于当前版本则按迁移表逐个升级；无迁移路径时备份旧数据到 `vt:v1:legacy-backup` 后初始化。首期 schemaVersion = 1，迁移框架必须先写好（这是资产）。
- 写入策略：Zustand `persist` 自动持久化；块编辑 500ms 防抖落盘。
- 容量注意：localStorage 约 5MB，导出/导入功能是数据安全兜底；设置页显示当前占用估算（`JSON.stringify` 长度）。

### 7.5 AI Provider 抽象层（核心资产，`lib/ai/`）

**统一接口**——三种 API 格式对上表现为同一抽象：

```ts
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model: string;
  signal: AbortSignal; // 停止生成 = abort
}

interface ChatChunk {
  text: string;
} // 增量文本

interface ProviderAdapter {
  readonly format: ApiFormat;
  chatStream(cfg: ProviderConfig, req: ChatRequest): AsyncGenerator<ChatChunk>;
  testConnection(cfg: ProviderConfig): Promise<{ ok: boolean; latencyMs: number; error?: string }>;
}
```

**三个适配器**（都用 `fetch` + `ReadableStream` 手工解析 SSE，不加 SDK 依赖）：

1. **OpenAIChatCompletionsAdapter**（`openai-chat`，DeepSeek / Kimi 预设走它）
   - `POST {baseUrl}/chat/completions`（baseUrl 已含 `/v1` 时注意拼接，做末尾斜杠与路径容错）；
   - Header：`Authorization: Bearer {apiKey}`；Body：`{ model, messages, stream: true }`；
   - 解析：SSE `data:` 行 → `choices[0].delta.content` 增量，`data: [DONE]` 结束。
2. **OpenAIResponsesAdapter**（`openai-responses`）
   - `POST {baseUrl}/responses`；Body：`{ model, input: 转换后的消息, stream: true }`；
   - 解析：SSE 事件流中 `response.output_text.delta` 事件的 `delta` 字段为增量，`response.completed` 结束。
3. **AnthropicMessagesAdapter**（`anthropic-messages`）
   - `POST {baseUrl}/messages`；
   - Headers：`x-api-key: {apiKey}`、`anthropic-version: 2023-06-01`、`anthropic-dangerous-direct-browser-access: true`、`content-type: application/json`；
   - Body：`{ model, max_tokens: 4096, system: 抽出的system消息, messages: 其余消息, stream: true }`；
   - 解析：SSE `content_block_delta` 事件的 `delta.text` 增量，`message_stop` 结束。

**统一错误规范化**：把 HTTP 状态码与各家错误体翻译为 `AIError { kind: 'auth' | 'rate_limit' | 'network' | 'cors' | 'unknown', message }`，UI 用 toast + 消息内错误气泡展示。

**CORS 风险预案（重要）**：浏览器直连各家 API 时，若某服务商不允许跨域，表现为网络错误。应对：开发环境在 `vite.config.ts` 提供**可选** `server.proxy` 配置示例（注释形式写入配置文件并附说明），用户遇到时在设置页把 Base URL 改为本地代理路径即可。生产静态部署同理受限，README 中注明。

### 7.6 Prompt 设计（全部集中在 `lib/prompts.ts`，方便迭代）

1. **思维链序列化**（每次请求的 system 上下文）：
   ```
   你正在使用思维记录工具 VibeThinking 与用户一起思考。以下是用户当前会话的完整思维记录：
   [输出块 14:32]（标签：第一性原理）{内容}
   [断点] {备注}
   [输出块 15:01]（标签：无）{内容}
   ---
   请基于以上思维脉络回应，不要复述记录，直接针对最新进展思考。
   ```
   **截断策略**：思维链超过 ~12000 字符时，保留最近 5 个块全文 + 更早内容的「AI 总结」（无总结则保留最早 2 块 + 省略提示），并在 system 中说明发生了截断。
2. **默认指令 prompt**（会话级，用户可改）：「你是我的思考陪练。请指出我思维链条中的漏洞、盲区与可推进的下一步，风格直接、具体。」
3. **自动标签 prompt**：给出现有标签名列表，要求只返回 JSON：`{"suggestions": ["标签名", ...]}`，最多 3 个，解析失败静默降级为 toast 报错。
4. **总结 prompt**：按断点分段概括 + 一段总览，≤300 字。
5. **复盘 prompt**：按 F9 的五段结构输出 Markdown。

---

## 8. 开发规范（代码资产标准）

1. **TypeScript strict**：开启 `strict`、`noUncheckedIndexedAccess`；公共数据结构必须有类型，禁止 `any`。
2. **命名**：组件 `PascalCase`，函数/变量 `camelCase`，常量 `SCREAMING_SNAKE_CASE`，文件与导出主组件同名。
3. **组件**：函数组件 + hooks；props 有接口定义；单个文件超过 ~250 行考虑拆分。
4. **样式**：一律 Tailwind 工具类 + 语义 token，不写行内 `style`，不写死色值（见 6.1 暗色预留红线）。
5. **注释**：复杂逻辑（SSE 解析、截断策略、迁移）写「为什么」而非「是什么」；`lib/ai` 与 `lib/storage` 每个文件头部写职责说明——这两处是重点沉淀资产。
6. **Git**：建议每个里程碑至少一次提交，提交信息格式 `feat/fix/chore: 描述`（如用户未初始化 git，M0 时提醒其初始化）。
7. **README 维护**：每完成一个里程碑更新 README 的功能清单与运行说明。

---

## 9. 实施计划（里程碑）

> 每个里程碑的「验收」即对该里程碑的 Definition of Done，全部通过才进入下一个。

### M0 脚手架与设计地基

- Vite + React 19 + TS strict 初始化；ESLint + Prettier；Tailwind v4 接入。
- `theme.css` 落地全部设计 tokens；实现 ui 组件中的 Button / Input / Dialog / Toast 并写一个临时 showcase 页面自验。
- **验收**：`npm run dev` 打开 showcase，tokens 生效；`npm run build` 通过；`npm run lint` 无错。

### M1 数据层与核心思维流

- 类型定义（7.3）、storage 适配层 + schema 迁移框架、Zustand stores。
- 左侧栏会话 CRUD；主区输出块/断点的渲染与编辑；标签系统（预设写入、增删改、块标签编辑）。
- **验收**：手动走查场景 1、2（建会话→写块→打标签→插断点→刷新数据还在）；storage 层有 Vitest 单测。

### M2 核心体验完善

- 快捷键体系 + 命令面板 + 底部快捷工具条；会话搜索与拖拽排序；Markdown 导出；全局备份/恢复（含「不含 Key」默认与导入前自动备份）。
- 空状态、加载与删除确认等细节打磨。
- **验收**：F10/F11/F12 全部手动走查通过；备份 JSON 可无损往返（导出→清空→导入→数据一致）。

### M3 AI 底座：Provider 抽象 + AI 讨论

- `lib/ai` 三个适配器 + 错误规范化；设置页 Provider 管理（含预设模板、测试连接）；AI 讨论抽屉（流式、停止、重试、清空、Markdown 渲染、指令 prompt 编辑、上下文指示）。
- **验收**：用真实 DeepSeek 或 Kimi Key 完成至少一轮流式对话；断网/错 Key 的错误提示可读；`lib/ai` 有单测（mock fetch，覆盖三种格式的 SSE 解析）。

### M4 AI 增强三件套

- 自动标签建议（F7）、会话总结（F8）、复盘报告（F9）。
- **验收**：三功能各实测一次，输出质量达到「可直接读」；截断策略在长会话下生效（构造 >12000 字符会话验证）。

### M5 打磨与交付

- 移除 showcase 等临时代码；全量 lint + 测试 + 构建；README 定稿（含 Windows 运行步骤、Provider 配置指引、CORS 说明）；
- 性能检查：会话 50+ / 块 500+ 时无明显卡顿（必要时上虚拟滚动，非必需不做）。
- **验收**：第 2 章 G1~G6 逐条核对通过。

---

## 10. 测试策略

- **单测（Vitest）**覆盖三处逻辑密集区：`lib/storage`（读写、迁移）、`lib/ai`（三种格式 SSE 解析、错误规范化）、`lib/export`（Markdown 生成、备份往返）。
- 组件不测渲染细节，只测关键交互（如输出块空内容不保存）。
- **手动走查清单**即第 3 章四个场景 + 各里程碑验收项。
- 无 E2E 测试要求（本期不引入 Playwright）。

---

## 11. 部署路线

- **本期**：本地 `npm run dev`（默认 `http://localhost:5173`）为唯一运行方式。
- **预留能力**：`npm run build` 产出纯静态 `dist/`，可随时部署到任意静态托管（Vercel / Netlify / GitHub Pages / Cloudflare Pages）。纯 BYOK 架构无服务端密钥，静态托管天然安全（Key 只在用户浏览器）。
- README 中写明部署步骤，但本期不实际执行部署。

---

## 12. 风险与应对

| 风险                          | 概率         | 应对                                                            |
| ----------------------------- | ------------ | --------------------------------------------------------------- |
| 某 API 服务商浏览器 CORS 拦截 | 中           | 7.5 的 Vite proxy 预案 + README 说明                            |
| localStorage 5MB 容量上限     | 低（纯文本） | 设置页显示占用；导出备份兜底；storage 层预留 IndexedDB 切换能力 |
| API Key 泄露顾虑              | 低           | D3：仅存本地、备份默认不含 Key、设置页明确提示                  |
| 各家 API 格式/模型名变动      | 中           | Provider 层隔离变化；模型名全部用户可配，不硬编码               |
| Agent 实现偏差                | 中           | 里程碑验收逐条核对；TODO(question) 机制（第 0 章）              |

---

## 13. 附录

### 13.1 后续候选（本期不做，仅记录）

思维链可视化（时间线/图谱）、提示词与标签模板库、使用统计面板、暗色主题、移动端深度适配、云同步（届时再议账号与后端）。

### 13.2 可复用资产清单（本项目的隐性产出）

1. `theme.css` 设计 token 体系（可直接搬进下一个项目）；
2. `src/components/ui/` 组件资产（含 CommandPalette）；
3. `lib/ai/` 三格式 Provider 抽象层（任何 BYOK 工具可复用）；
4. `lib/storage/` 带版本迁移的本地存储适配层；
5. 本文档本身（PRD + 技术方案模板）。

### 13.3 旧版参考

旧版 README 要点（仅供理解，不照搬实现）：会话管理 / 输出块 / 思维标签 / 断点 / AI 讨论（DeepSeek）/ Markdown 导出 / 悬浮球 / 搜索排序 / 全局备份 / 快捷键 / AI 控制条 / localStorage 持久化。旧版存储键 `vibethinking:*` 与 `thought-debugger:*`——**新版不读取、不迁移**，键空间已更换为 `vt:v1:*`。

### 13.4 术语表

- **输出块**：一条想法记录，思维流的基本单元。
- **断点**：思考阶段的分隔标记，带备注。
- **思维链**：一个会话内全部输出块与断点按时间序的完整序列。
- **BYOK**：Bring Your Own Key，用户自带 API Key。
- **Provider**：一家模型服务商的配置（格式 + 地址 + Key + 模型列表）。

---

_文档完。执行 agent 请回到第 0 章，从 M0 开始。_
