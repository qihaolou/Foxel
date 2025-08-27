import { useCallback } from 'react';
import { message, Modal } from 'antd';
import { vfsApi, type VfsEntry } from '../../../api/client';

interface FileActionsParams {
  path: string;
  refresh: () => void;
  clearSelection: () => void;
  onShare: (entries: VfsEntry[]) => void;
  onGetDirectLink: (entry: VfsEntry) => void;
}

export function useFileActions({ path, refresh, clearSelection, onShare, onGetDirectLink }: FileActionsParams) {
  const doCreateDir = useCallback(async (name: string) => {
    if (!name.trim()) {
      message.warning('请输入名称');
      return;
    }
    try {
      await vfsApi.mkdir((path === '/' ? '' : path) + '/' + name.trim());
      refresh();
    } catch (e: any) {
      message.error(e.message);
    }
  }, [path, refresh]);

  const doDelete = useCallback(async (entries: VfsEntry[]) => {
    Modal.confirm({
      title: `确认删除 ${entries.length > 1 ? `${entries.length} 项` : entries[0].name} ?`,
      content: entries.length > 1 ? <div style={{ maxHeight: 180, overflow: 'auto' }}>{entries.map(it => <div key={it.name}>{it.name}{it.type === 'mount' && ' (挂载点)'}</div>)}</div> : null,
      onOk: async () => {
        try {
          await Promise.all(entries.map(it => vfsApi.deletePath((path === '/' ? '' : path) + '/' + it.name)));
          clearSelection();
          refresh();
        } catch (e: any) {
          message.error(e.message);
        }
      }
    });
  }, [path, refresh, clearSelection]);

  const doRename = useCallback(async (entry: VfsEntry, newName: string) => {
    if (!newName.trim() || newName.trim() === entry.name) {
      return;
    }
    try {
      await vfsApi.rename(
        (path === '/' ? '' : path) + '/' + entry.name,
        (path === '/' ? '' : path) + '/' + newName.trim()
      );
      refresh();
    } catch (e: any) {
      message.error(e.message);
    }
  }, [path, refresh]);

  const doDownload = useCallback(async (entry: VfsEntry) => {
    if (entry.is_dir) {
      message.warning('暂不支持下载目录');
      return;
    }
    try {
      const buf = await vfsApi.readFile((path === '/' ? '' : path) + '/' + entry.name);
      const blob = new Blob([buf]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = entry.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      message.error(e.message || '下载失败');
    }
  }, [path]);

  const doShare = useCallback((entries: VfsEntry[]) => {
    if (entries.length === 0) {
      message.warning('请选择要分享的文件或目录');
      return;
    }
    onShare(entries);
  }, [onShare]);

  const doGetDirectLink = useCallback((entry: VfsEntry) => {
    if (entry.is_dir) {
      message.warning('不支持获取目录的直链');
      return;
    }
    onGetDirectLink(entry);
  }, [onGetDirectLink]);

  return {
    doCreateDir,
    doDelete,
    doRename,
    doDownload,
    doShare,
    doGetDirectLink,
  };
}