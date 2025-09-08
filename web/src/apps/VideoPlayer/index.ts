import type { AppDescriptor } from '../types';
import { VideoPlayerApp } from './VideoPlayer.tsx';

export const descriptor: AppDescriptor = {
  key: 'video-player',
  name: '视频播放器',
  supported: (entry) => {
    if (entry.is_dir) return false;
    const ext = entry.name.split('.').pop()?.toLowerCase() || '';
    return ['mp4','webm','ogg','m4v','mov','mkv','avi','wmv','flv','3gp'].includes(ext);
  },
  component: VideoPlayerApp,
  default: true,
  defaultBounds: { width: 960, height: 600, x: 180, y: 120 }
};