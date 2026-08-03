# VibeThinking

**思维的外脑 + AI 的思考陪练。** 把一闪而过的想法写进「输出块」，用「断点」划分思考阶段，
给输出块打「思维方法标签」，让 AI 基于**完整思维链**陪你继续想、帮你总结和复盘。

纯前端、无后端、无账号：数据全部保存在本机浏览器 localStorage，API Key 自带（BYOK）且只存本机。

> 需求与技术方案：`VibeThinking.md`（PRD v1.0）。本 README 是运行与使用说明。

## 运行（Windows / PowerShell）

```powershell
npm install
npm run dev        # 打开 http://localhost:5173
```

## 常用命令

```powershell
npm run build      # 类型检查（tsc strict）+ 产出静态产物 dist/
npm run test       # Vitest 单测（storage / ai / export / prompts / 关键组件交互）
npm run lint       # ESLint
npm run format     # Prettier
```

## 功能清单

- **会话管理**：创建 / 切换 / 删除（二次确认）/ 重命名（双击）/ 搜索过滤 / 拖拽排序；侧栏可折叠
- **输出块**：阅读态 / 编辑态切换，自适应高度，实时保存（500ms 防抖落盘），空块自动清理
- **思维方法标签**：8 个预设（第一性原理、逆向思考…）+ 自定义（名称 + 8 色板）；被引用删除时提示并级联移除
- **断点**：思维流中的阶段分隔线 + 可编辑备注
- **AI 讨论**：右侧抽屉，流式输出 / 停止 / 重试 / 清空；Markdown 渲染（代码块带复制按钮）；
  会话级指令 prompt；上下文指示（已读取 N 个输出块 / M 个断点，超长自动截断）
- **AI 增强三件套**：输出块 AI 标签建议（虚线 chip，点击采纳）、会话总结（抽屉顶部卡片，可复制/再生成）、
  五段式思维复盘报告（历史保留、再生成、单篇导出 .md）
- **多模型 Provider 管理**：DeepSeek / Kimi 预设一键填充；自定义三种 API 格式
  （OpenAI Chat Completions / OpenAI Responses / Anthropic Messages）；测试连接；当前生效组合切换
- **数据安全**：顶栏导出全局 JSON 备份（**默认不含 API Key**，显式勾选才包含）；
  导入恢复前自动下载当前数据完整备份；单会话导出 Markdown（可选附 AI 讨论记录）
- **快捷键 + 命令面板**（`Ctrl/⌘+K`）：模糊搜索全部动作（新建/切换/导出/总结/复盘/测试连接…）

## 快捷键

| 按键         | 作用                |
| ------------ | ------------------- |
| `Ctrl/⌘ + K` | 命令面板            |
| `Alt + N`    | 新输出块            |
| `Alt + B`    | 插入断点            |
| `Alt + I`    | 打开 / 关闭 AI 讨论 |
| `Ctrl/⌘ + /` | 快捷键帮助          |
| `Esc`        | 结束编辑 / 关闭弹层 |

（输入框聚焦时 Alt 系快捷键不生效，命令面板除外。）

## 配置模型（BYOK）

1. 顶栏「设置」→「模型服务」→「添加 Provider」；
2. 点预设 **DeepSeek** / **Kimi（Moonshot）** 一键填充 Base URL 与格式（Key 留空），或全自定义；
3. 粘贴你的 API Key，填模型列表（逗号分隔），点「测试连接」验证；
4. 保存后在「当前 Provider / 当前模型」选择生效组合，顶栏会显示当前模型名。

**安全提示**：Key 仅存储于本机浏览器 localStorage，不会上传到任何第三方服务器；
清除浏览器数据会删除它。全局备份**默认不包含 Key**。

### CORS 说明

浏览器直连部分服务商 API 可能被跨域拦截（表现为「网络请求失败」）。应对：

- **开发环境**：打开 `vite.config.ts` 中已注释的 `server.proxy` 示例，把 Provider 的
  Base URL 改为本地代理路径（如 `/proxy/deepseek`）；
- **生产静态部署**：需要托管平台提供等效 rewrite（如 Vercel `vercel.json` 的 `rewrites`），
  或改用允许浏览器跨域的服务商 / 自建轻量代理。

## 备份与恢复

- **导出**：顶栏「导出」→ 全部数据 JSON（文件名含日期）/ 当前会话 Markdown；
- **导入**：顶栏「导入」选择备份 JSON → 校验版本 → 预览数量 → 确认后**先自动下载一份当前
  数据完整备份（含 Key）**，再整体替换；
- localStorage 上限约 5 MB，设置页「本地存储」分区可查看当前占用。

## 部署

```powershell
npm run build   # 产出纯静态 dist/
```

把 `dist/` 部署到任意静态托管即可（Vercel / Netlify / GitHub Pages / Cloudflare Pages）。
纯 BYOK 架构无服务端密钥，静态托管天然安全（Key 只在用户浏览器）。

## 技术架构

React 19 + TypeScript strict（`noUncheckedIndexedAccess`）+ Vite + Tailwind CSS v4（CSS-first `@theme`）

- Zustand（persist）+ react-markdown。无路由库、无 UI 组件库、无 AI SDK。

```
src/
├── components/  ui/ 通用组件资产（Button/Dialog/CommandPalette…）+ features/ 业务组件
├── stores/      Zustand：sessions / tags / settings / ui / aiTasks
├── lib/
│   ├── storage/ 存储适配层：localStorage 适配 + schema 迁移框架 + 裸值 persist 桥接
│   ├── ai/      Provider 抽象层：三种 API 格式适配器 + 错误规范化（手写 SSE 解析）
│   ├── export/  Markdown 导出 + JSON 备份/恢复
│   └── prompts.ts 全部 prompt 模板（思维链序列化 + 截断策略）
└── styles/theme.css 设计 token 体系（暗色预留）
```

可复用资产（可搬进其他项目）：`theme.css` token 体系、`components/ui/` 组件、
`lib/ai/` 三格式 Provider 抽象层、`lib/storage/` 带迁移的存储适配层。

## 开发进度

- [x] M0 脚手架与设计地基
- [x] M1 数据层与核心思维流
- [x] M2 核心体验完善（快捷键 / 命令面板 / 导出 / 备份恢复）
- [x] M3 AI 底座（Provider 抽象 / 设置页 / AI 讨论）
- [x] M4 AI 增强三件套（标签建议 / 总结 / 复盘）
- [x] M5 打磨与交付
