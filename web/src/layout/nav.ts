import React from 'react';
import {
  FolderOpenOutlined,
  ApiOutlined,
  ShareAltOutlined,
  CloudDownloadOutlined,
  SettingOutlined,
  RobotOutlined,
  BugOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';

export interface NavItem { key: string; icon: ReactNode; label: string; }
export interface NavGroup { key: string; title?: string; children: NavItem[]; }

export const navGroups: NavGroup[] = [
  {
    key: 'library',
    title: '',
    children: [
      { key: 'files', icon: React.createElement(FolderOpenOutlined), label: '全部文件' },
    ]
  },
  {
    key: 'manage',
    title: '管理',
    children: [
      { key: 'tasks', icon: React.createElement(RobotOutlined), label: '自动化' },
      { key: 'share', icon: React.createElement(ShareAltOutlined), label: '我的分享' },
      { key: 'offline', icon: React.createElement(CloudDownloadOutlined), label: '离线下载' },
      { key: 'adapters', icon: React.createElement(ApiOutlined), label: '存储挂载' },
    ]
  },
  {
    key: 'system',
    title: '系统',
    children: [
      { key: 'settings', icon: React.createElement(SettingOutlined), label: '系统设置' },
      { key: 'backup', icon: React.createElement(DatabaseOutlined), label: '备份恢复' },
      { key: 'logs', icon: React.createElement(BugOutlined), label: '系统日志' }
    ]
  }
];

export const primaryNav: NavItem[] = navGroups.flatMap(g => g.children);
