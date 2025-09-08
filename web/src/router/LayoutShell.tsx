import { Layout, Flex } from 'antd';
import { memo, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import SideNav from '../layout/SideNav.tsx';
import TopHeader from '../layout/TopHeader.tsx';
import FileExplorerPage from '../pages/FileExplorerPage/FileExplorerPage.tsx';
import AdaptersPage from '../pages/AdaptersPage.tsx';
import SharePage from '../pages/SharePage.tsx';
import TasksPage from '../pages/TasksPage.tsx';
import OfflineDownloadPage from '../pages/OfflineDownloadPage.tsx';
import SystemSettingsPage from '../pages/SystemSettingsPage/SystemSettingsPage.tsx';
import LogsPage from '../pages/LogsPage.tsx';
import BackupPage from '../pages/SystemSettingsPage/BackupPage.tsx';
import PluginsPage from '../pages/PluginsPage.tsx';

const LayoutShell = memo(function LayoutShell() {
  const { navKey = 'files' } = useParams();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <SideNav
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        activeKey={navKey}
        onChange={(key) => navigate(`/${key}`)}
      />
      <Layout>
        <TopHeader collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
        <Layout.Content style={{ padding: 16 }}>
          <div style={{ minHeight: 'calc(100vh - 56px - 32px)' }}>
            <Flex vertical gap={16}>
              {navKey === 'adapters' && <AdaptersPage />}
              {navKey === 'files' && <FileExplorerPage />}
              {navKey === 'share' && <SharePage />}
              {navKey === 'tasks' && <TasksPage />}
              {navKey === 'offline' && <OfflineDownloadPage />}
              {navKey === 'plugins' && <PluginsPage />}
              {navKey === 'settings' && <SystemSettingsPage />}
              {navKey === 'logs' && <LogsPage />}
              {navKey === 'backup' && <BackupPage />}
            </Flex>
          </div>
        </Layout.Content>
      </Layout>
    </Layout>
  );
});

export default LayoutShell;
