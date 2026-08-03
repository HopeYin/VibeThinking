/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // ── CORS 预案（见 VibeThinking.md 7.5）────────────────────────────
    // 浏览器直连 AI 服务商时，若某家不允许跨域（表现为网络错误），
    // 可取消下方注释，并在应用「设置 → 模型服务」中把 Base URL 改为
    // 对应的本地代理路径（如 /proxy/deepseek）。生产静态部署同理受限，
    // 需要托管平台提供等效 rewrite 能力。
    // proxy: {
    //   '/proxy/deepseek': {
    //     target: 'https://api.deepseek.com',
    //     changeOrigin: true,
    //     rewrite: (p) => p.replace(/^\/proxy\/deepseek/, ''),
    //   },
    //   '/proxy/moonshot': {
    //     target: 'https://api.moonshot.cn',
    //     changeOrigin: true,
    //     rewrite: (p) => p.replace(/^\/proxy\/moonshot/, ''),
    //   },
    // },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
  },
});
