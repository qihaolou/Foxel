import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import '@ant-design/v5-patch-for-react-19';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'antd/dist/reset.css';
import foxelTheme from './theme';
import './global.css';
import { BrowserRouter } from 'react-router';

createRoot(document.getElementById('root')!).render(
  <ConfigProvider locale={zhCN} theme={foxelTheme}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ConfigProvider>
);
