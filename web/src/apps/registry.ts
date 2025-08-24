import type { VfsEntry } from '../api/client';
import type { AppDescriptor } from './types';
const apps: AppDescriptor[] = [];

// 使用 import.meta.glob 动态导入所有应用
// vite-glob-ignore
const appModules = import.meta.glob('./*/index.ts');

async function loadApps() {
  for (const path in appModules) {
    const module = await appModules[path]();
    if (module && typeof module === 'object' && 'descriptor' in module) {
      const descriptor = (module as { descriptor: AppDescriptor }).descriptor;
      if (!apps.find(a => a.key === descriptor.key)) {
        apps.push(descriptor);
      }
    }
  }
}

// 立即加载并注册所有应用
loadApps();


export function getAppsForEntry(entry: VfsEntry): AppDescriptor[] {
  return apps.filter(a => a.supported(entry));
}

export function getDefaultAppForEntry(entry: VfsEntry): AppDescriptor | undefined {
  if (entry.is_dir) return;
  const ext = entry.name.split('.').pop()?.toLowerCase() || '';
  if (!ext) return apps.find(a => a.supported(entry) && a.default);
  const saved = localStorage.getItem(`app.default.${ext}`);
  if (saved) {
    return apps.find(a => a.key === saved && a.supported(entry)) || undefined;
  }
  return apps.find(a => a.supported(entry) && a.default);
}

export type { AppDescriptor };
export type { AppComponentProps } from './types';
