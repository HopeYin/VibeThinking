# VibeThinking

思维的外脑 + AI 的思考陪练。纯前端、无后端、无账号的轻量思维记录 Web 工具。

> 需求与技术方案见根目录 `VibeThinking.md`（PRD v1.0）。本 README 记录运行方式与当前进度。

## 运行（Windows / PowerShell）

```powershell
npm install
npm run dev        # 默认 http://localhost:5173
```

## 常用命令

```powershell
npm run build      # 类型检查 + 产出静态产物 dist/
npm run lint       # ESLint 检查
npm run test       # Vitest 单测
npm run format     # Prettier 格式化
```

## 当前进度

- [x] **M0 脚手架与设计地基**：Vite + React 19 + TS strict + Tailwind v4；
      `src/styles/theme.css` 落地全部设计 tokens（色彩/字体/字号/圆角/阴影/标签 8 色板，暗色预留）；
      UI 组件 Button / Input / Textarea / Dialog / Toast；`npm run dev` 打开即为临时 showcase 页（M5 移除）。
- [ ] M1 数据层与核心思维流
- [ ] M2 核心体验完善
- [ ] M3 AI 底座
- [ ] M4 AI 增强三件套
- [ ] M5 打磨与交付

## 部署

`npm run build` 产出纯静态 `dist/`，可部署到任意静态托管（Vercel / Netlify / GitHub Pages / Cloudflare Pages）。
纯 BYOK 架构，无服务端密钥。

## CORS 说明

浏览器直连部分 AI 服务商 API 时可能遇到跨域限制。开发环境可在 `vite.config.ts`
中启用已注释的 `server.proxy` 示例，并在应用「设置 → 模型服务」里把 Base URL 改为本地代理路径。
生产静态部署需要托管平台提供等效 rewrite。
