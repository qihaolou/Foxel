import { Layout, Button, Dropdown, theme, Flex } from 'antd';
import { SearchOutlined, UserOutlined, MenuUnfoldOutlined, LogoutOutlined } from '@ant-design/icons';
import { memo, useState } from 'react';
import SearchDialog from './SearchDialog.tsx';
import { authApi } from '../api/auth.ts';
import { useNavigate } from 'react-router';
import { useI18n } from '../i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';

const { Header } = Layout;

export interface TopHeaderProps {
  collapsed: boolean;
  onToggle(): void;
}

const TopHeader = memo(function TopHeader({ collapsed, onToggle }: TopHeaderProps) {
  const { token } = theme.useToken();
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleLogout = () => {
    authApi.logout();
    navigate('/login', { replace: true });
  };

  return (
    <Header style={{ background: token.colorBgContainer, borderBottom: `1px solid ${token.colorBorderSecondary}`, display: 'flex', alignItems: 'center', gap: 16, backdropFilter: 'saturate(180%) blur(8px)' }}>
      {collapsed && (
        <Button
          type="text"
          icon={<MenuUnfoldOutlined />}
          onClick={onToggle}
          style={{ fontSize: 18, marginRight: 8 }}
        />
      )}
      <Button
        icon={<SearchOutlined />}
        style={{ maxWidth: 420 }}
        onClick={() => setSearchOpen(true)}
      >
        {t('Search files / tags / types')}
      </Button>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <Flex style={{ marginLeft: 'auto' }} align="center" gap={12}>
        <LanguageSwitcher />
        <Dropdown
          menu={{
            items: [
              { key: 'logout', label: t('Log Out'), icon: <LogoutOutlined />, onClick: handleLogout }
            ]
          }}
        >
          <Button icon={<UserOutlined />}>{t('Admin')}</Button>
        </Dropdown>
      </Flex>
    </Header>
  );
});

export default TopHeader;
