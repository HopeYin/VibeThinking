// bootstrap 必须先于一切 store 水合：迁移 + 预设标签写入（副作用模块）
import './lib/storage/bootstrap';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ToastProvider } from './components/ui/Toast';
import './styles/theme.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);
