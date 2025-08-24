import { Layout, Menu, theme, Button } from 'antd';
import { navGroups } from './nav.ts';
import type { NavItem, NavGroup } from './nav.ts';
import { memo } from 'react';
import { useSystemStatus } from '../contexts/SystemContext.tsx';
import { MenuFoldOutlined } from '@ant-design/icons';
import '../styles/sider-menu.css';

const { Sider } = Layout;

export interface SideNavProps {
  collapsed: boolean;
  onToggle(): void;
  activeKey: string;
  onChange(key: string): void;
}

const SideNav = memo(function SideNav({ collapsed, activeKey, onChange, onToggle }: SideNavProps) {
  const status = useSystemStatus();
  const { token } = theme.useToken();
  return (
    <Sider
      collapsedWidth={60}
      collapsible
      trigger={null}
      collapsed={collapsed}
      width={208}
      style={{ background: token.colorBgContainer, borderRight: `1px solid ${token.colorBorderSecondary}` }}
    >
      <div style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: '0 14px',
        fontWeight: 600,
        fontSize: 18,
        letterSpacing: .5
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src={status?.logo}
            alt="Foxel"
            style={{
              width: 24,
              height: 24,
              objectFit: 'contain',
              marginRight: collapsed ? 0 : 8,
              ...(status?.logo?.endsWith('.svg') && { filter: 'brightness(0) saturate(100%)' })
            }}
          />
          {!collapsed && <span style={{ fontWeight: 700 }}>{status?.title}</span>}
        </div>
        {/* 展开时显示收缩按钮 */}
        {!collapsed && (
          <Button
            type="text"
            icon={<MenuFoldOutlined />}
            onClick={onToggle}
            style={{ fontSize: 18 }}
          />
        )}
      </div>
      {/* 分组渲染 */}
      <div style={{ overflowY: 'auto', height: 'calc(100% - 56px)', padding: '4px 4px 8px' }}>
        {navGroups.map((group: NavGroup) => (
          <div key={group.key} style={{ marginBottom: 12 }}>
            {group.title && (
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: .5,
                  padding: '6px 10px 4px',
                  color: token.colorTextTertiary,
                  textTransform: 'uppercase'
                }}
              >{group.title}</div>
            )}
            <Menu
              mode="inline"
              selectable
              inlineIndent={12}
              selectedKeys={[activeKey]}
              onClick={(e) => onChange(e.key)}
              items={group.children.map((i: NavItem) => ({ key: i.key, icon: i.icon, label: i.label }))}
              style={{ borderInline: 'none', background: 'transparent' }}
              className="sider-menu-group foxel-sider-menu"
            />
          </div>
        ))}
      </div>
    </Sider>
  );
});

export default SideNav;
