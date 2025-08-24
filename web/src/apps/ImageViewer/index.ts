import type { AppDescriptor } from '../types';
import { ImageViewerApp } from './ImageViewer.tsx';

export const descriptor: AppDescriptor = {
  key: 'image-viewer',
  name: '图片查看器',
  supported: (entry) => {
    if (entry.is_dir) return false;
    const ext = entry.name.split('.').pop()?.toLowerCase() || '';
    return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'].includes(ext);
  },
  component: ImageViewerApp,
  default: true,
  defaultMaximized:true,
  useSystemWindow:false,
  defaultBounds: { width: 820, height: 620, x: 140, y: 96 }
};