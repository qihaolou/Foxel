import { useState, useEffect } from 'react';
import { AppRouter } from './router/index.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { status as getStatus } from './api/config.ts';
import type { SystemStatus } from './api/config.ts';
import { SystemContext } from './contexts/SystemContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { Spin, ConfigProvider } from 'antd';
import { Routes, Route, Navigate } from 'react-router';
import SetupPage from './pages/SetupPage.tsx';
import { I18nProvider, useI18n } from './i18n';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';

function AppInner() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  useEffect(() => {
    async function checkInitialization() {
      try {
        const status = await getStatus();
        setStatus(status);
        document.title = status.title;
        const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (favicon) {
          favicon.href = status.logo;
        }
      } catch (error) {
        console.error("Failed to check initialization status:", error);
      }
    }
    checkInitialization();
  }, []);

  if (status === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const { lang } = useI18n();
  const locale = lang === 'zh' ? zhCN : enUS;

  return (
    <ConfigProvider locale={locale}>
      <SystemContext.Provider value={status}>
        <AuthProvider>
          <ThemeProvider>
            {!status.is_initialized ? (
              <Routes>
                <Route path="/setup" element={<SetupPage />} />
                <Route path="*" element={<Navigate to="/setup" replace />} />
              </Routes>
            ) : (
              <AppRouter />
            )}
          </ThemeProvider>
        </AuthProvider>
      </SystemContext.Provider>
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppInner />
    </I18nProvider>
  );
}
