import React, { useRef, useState } from 'react';
import type { AppComponentProps } from '../types';
import { vfsApi } from '../../api/vfs';
import { loadPluginFromUrl, ensureManifest, type RegisteredPlugin } from '../../plugins/runtime';
import type { PluginItem } from '../../api/plugins';
import { useAsyncSafeEffect } from '../../hooks/useAsyncSafeEffect';

export interface PluginAppHostProps extends AppComponentProps {
  plugin: PluginItem;
}

export const PluginAppHost: React.FC<PluginAppHostProps> = ({ plugin, filePath, entry, onRequestClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const onCloseRef = useRef(onRequestClose);
  onCloseRef.current = onRequestClose;

  const pluginRef = useRef<RegisteredPlugin | null>(null);

  useAsyncSafeEffect(
    async ({ isDisposed }) => {
      try {
        const p = await loadPluginFromUrl(plugin.url);
        if (isDisposed()) return;
        pluginRef.current = p;
        await ensureManifest(plugin.id, p);
        if (isDisposed()) return;
        const token = await vfsApi.getTempLinkToken(filePath);
        if (isDisposed()) return;
        const downloadUrl = vfsApi.getTempPublicUrl(token.token);
        if (isDisposed() || !containerRef.current) return;
        await p.mount(containerRef.current, {
          filePath,
          entry,
          urls: { downloadUrl },
          host: { close: () => onCloseRef.current() },
        });
      } catch (e: any) {
        if (!isDisposed()) setError(e?.message || '插件运行失败');
      }
    },
    [plugin.id, plugin.url, filePath],
    () => {
      try {
        if (pluginRef.current?.unmount && containerRef.current) {
          pluginRef.current.unmount(containerRef.current);
        }
      } catch {}
    },
  );

  if (error) {
    return <div style={{ padding: 12, color: 'red' }}>插件错误: {error}</div>;
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'auto' }} />;
};
