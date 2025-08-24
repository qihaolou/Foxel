import { Layout, Button, Dropdown, theme, Flex } from 'antd';
import { SearchOutlined, UserOutlined, MenuUnfoldOutlined, LogoutOutlined } from '@ant-design/icons';
import { memo, useState } from 'react';
import SearchDialog from './SearchDialog.tsx';
import { authApi } from '../api/auth.ts';
import { useNavigate } from 'react-router';

const { Header } = Layout;

export interface TopHeaderProps {
  collapsed: boolean;
  onToggle(): void;
}

const TopHeader = memo(function TopHeader({ collapsed, onToggle }: TopHeaderProps) {
  const { token } = theme.useToken();
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

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
        搜索文件 / 标签 / 类型
      </Button>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <Flex style={{ marginLeft: 'auto' }} align="center" gap={12}>
        <Dropdown
          menu={{
            items: [
              { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: handleLogout }
            ]
          }}
        >
          <Button icon={<UserOutlined />}>管理员</Button>
        </Dropdown>
      </Flex>
    </Header>
  );
});

export default TopHeader;
