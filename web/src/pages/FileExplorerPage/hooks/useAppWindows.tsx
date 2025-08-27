import { useState, useCallback } from 'react';
import { Modal, Checkbox } from 'antd';
import type { VfsEntry } from '../../../api/client';
import type { AppDescriptor } from '../../../apps/registry';
import type { AppWindow } from '../types';
import { getAppsForEntry, getDefaultAppForEntry, getAppByKey } from '../../../apps/registry';

export function useAppWindows(path: string) {
  const [appWindows, setAppWindows] = useState<AppWindow[]>([]);

  const openWithApp = useCallback((entry: VfsEntry, app: AppDescriptor) => {
    const fullPath = (path === '/' ? '' : path) + '/' + entry.name;
    setAppWindows(ws => {
      const idx = ws.length;
      const bounds = app.defaultBounds || {};
      const baseX = bounds.x ?? (160 + idx * 32);
      const baseY = bounds.y ?? (100 + idx * 28);
      const baseW = bounds.width ?? 640;
      const baseH = bounds.height ?? 480;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const finalW = Math.min(baseW, vw - 40);
      const finalH = Math.min(baseH, vh - 60);
      const finalX = Math.min(Math.max(0, baseX), vw - finalW - 8);
      const finalY = Math.min(Math.max(48, baseY), vh - finalH - 8);
      return [...ws, {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        app,
        entry,
        filePath: fullPath,
        maximized: !!app.defaultMaximized,
        x: finalX,
        y: finalY,
        width: finalW,
        height: finalH
      }];
    });
  }, [path]);

  const openFileWithDefaultApp = useCallback((entry: VfsEntry) => {
    const apps = getAppsForEntry(entry);
    if (!apps.length) {
      Modal.error({ title: '无法打开该文件：没有可用的应用' });
      return;
    }
    const defaultApp = getDefaultAppForEntry(entry) || apps[0];
    openWithApp(entry, defaultApp);
  }, [openWithApp]);

  const confirmOpenWithApp = useCallback((entry: VfsEntry, appKey: string) => {
    const app = getAppByKey(appKey);
    if (!app) {
      Modal.error({ title: '错误', content: `应用 "${appKey}" 不存在。` });
      return;
    }
    const ext = entry.name.split('.').pop()?.toLowerCase() || '';
    let setDefault = false;
    Modal.confirm({
      title: `使用 ${app.name} 打开`,
      content: (
        <div>
          <div style={{ marginBottom: 8 }}>文件: {entry.name}</div>
          <Checkbox onChange={e => setDefault = e.target.checked}>设为该类型(.{ext})默认应用</Checkbox>
        </div>
      ),
      onOk: () => {
        if (setDefault && ext) {
          localStorage.setItem(`app.default.${ext}`, app.key);
        }
        openWithApp(entry, app);
      }
    });
  }, [openWithApp]);

  const closeWindow = (id: string) => setAppWindows(ws => ws.filter(w => w.id !== id));
  const toggleMax = (id: string) => setAppWindows(ws => ws.map(w => w.id === id ? { ...w, maximized: !w.maximized } : w));
  const bringToFront = (id: string) => setAppWindows(ws => {
    const target = ws.find(w => w.id === id);
    if (!target) return ws;
    return [...ws.filter(w => w.id !== id), target];
  });
  const updateWindow = (id: string, patch: Partial<Omit<AppWindow, 'id' | 'app' | 'entry' | 'filePath'>>) =>
    setAppWindows(ws => ws.map(w => w.id === id ? { ...w, ...patch } : w));

  return {
    appWindows,
    openWithApp,
    openFileWithDefaultApp,
    confirmOpenWithApp,
    closeWindow,
    toggleMax,
    bringToFront,
    updateWindow,
  };
}