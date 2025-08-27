import React from 'react';
import { Menu, theme } from 'antd';
import type { VfsEntry } from '../../../api/client';
import { getAppsForEntry, getDefaultAppForEntry } from '../../../apps/registry';
import {
  FolderFilled, AppstoreOutlined, AppstoreAddOutlined, DownloadOutlined,
  EditOutlined, DeleteOutlined, InfoCircleOutlined, UploadOutlined, PlusOutlined, ShareAltOutlined, LinkOutlined
} from '@ant-design/icons';

interface ContextMenuProps {
  x: number;
  y: number;
  entry?: VfsEntry;
  entries: VfsEntry[];
  selectedEntries: string[];
  processorTypes: any[];
  onClose: () => void;
  onOpen: (entry: VfsEntry) => void;
  onOpenWith: (entry: VfsEntry, appKey: string) => void;
  onDownload: (entry: VfsEntry) => void;
  onRename: (entry: VfsEntry) => void;
  onDelete: (entries: VfsEntry[]) => void;
  onDetail: (entry: VfsEntry) => void;
  onProcess: (entry: VfsEntry, processorType: string) => void;
  onUpload: () => void;
  onCreateDir: () => void;
  onShare: (entries: VfsEntry[]) => void;
  onGetDirectLink: (entry: VfsEntry) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = (props) => {
  const { token } = theme.useToken();
  const { x, y, entry, entries, selectedEntries, processorTypes, onClose, ...actions } = props;

  const getContextMenuItems = () => {
    if (!entry) { // Blank context menu
      return [
        { key: 'upload', label: '上传文件', icon: <UploadOutlined />, onClick: actions.onUpload },
        { key: 'mkdir', label: '新建目录', icon: <PlusOutlined />, onClick: actions.onCreateDir },
      ];
    }

    // Entry context menu
    const apps = getAppsForEntry(entry);
    const defaultApp = getDefaultAppForEntry(entry);
    const targetNames = selectedEntries.includes(entry.name) ? selectedEntries : [entry.name];
    const targetEntries = entries.filter(e => targetNames.includes(e.name));

    let processorSubMenu: any[] = [];
    if (!entry.is_dir && processorTypes.length > 0) {
      const ext = entry.name.split('.').pop()?.toLowerCase() || '';
      processorSubMenu = processorTypes
        .filter(pt => pt.supported_exts.includes(ext))
        .map(pt => ({
          key: 'processor-' + pt.type,
          label: pt.name,
          onClick: () => actions.onProcess(entry, pt.type),
        }));
    }

    return [
      (entry.is_dir || apps.length > 0) ? {
        key: 'open',
        label: defaultApp ? `打开 (${defaultApp.name})` : '打开',
        icon: <FolderFilled />,
        onClick: () => actions.onOpen(entry),
      } : null,
      !entry.is_dir && apps.length > 0 ? {
        key: 'openWith',
        label: '打开方式',
        icon: <AppstoreOutlined />,
        children: apps.map(a => ({
          key: 'openWith-' + a.key,
          label: a.name + (a.key === defaultApp?.key ? ' (默认)' : ''),
          onClick: () => actions.onOpenWith(entry, a.key),
        })),
      } : null,
      !entry.is_dir && processorSubMenu.length > 0 ? {
        key: 'process',
        label: '处理器',
        icon: <AppstoreAddOutlined />,
        children: processorSubMenu,
      } : null,
      {
        key: 'share',
        label: '分享',
        icon: <ShareAltOutlined />,
        onClick: () => actions.onShare(targetEntries),
      },
      {
        key: 'directLink',
        label: '获取直链',
        icon: <LinkOutlined />,
        disabled: targetEntries.length !== 1 || targetEntries[0].is_dir,
        onClick: () => actions.onGetDirectLink(targetEntries[0]),
      },
      {
        key: 'download',
        label: '下载',
        icon: <DownloadOutlined />,
        disabled: targetEntries.some(t => t.is_dir) || targetEntries.length > 1,
        onClick: () => actions.onDownload(targetEntries[0]),
      },
      {
        key: 'rename',
        label: '重命名',
        icon: <EditOutlined />,
        disabled: targetEntries.length !== 1 || targetEntries[0].type === 'mount',
        onClick: () => actions.onRename(targetEntries[0]),
      },
      {
        key: 'delete',
        label: '删除',
        icon: <DeleteOutlined />,
        danger: true,
        disabled: targetEntries.some(t => t.type === 'mount'),
        onClick: () => actions.onDelete(targetEntries),
      },
      {
        key: 'detail',
        label: '详情',
        icon: <InfoCircleOutlined />,
        onClick: () => actions.onDetail(entry),
      },
    ].filter(Boolean);
  };

  const items = getContextMenuItems()
    .filter(item => item !== null) // Ensure no null items
    .map(item => ({
      ...item,
      onClick: () => {
        if (item.onClick) item.onClick();
        onClose();
      }
    }));

  return (
    <div
      style={{ position: 'fixed', top: y, left: x, zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,.15)', borderRadius: token.borderRadius, background: token.colorBgElevated }}
      onContextMenu={(e) => e.preventDefault()}
      onClick={onClose} // Close on any click inside the menu area
    >
      <Menu
        items={items as any[]}
        selectable={false}
        style={{ width: 160, borderRadius: token.borderRadius, background: 'transparent' }}
      />
    </div>
  );
};