import type { AppDescriptor } from '../types';
import { TextEditorApp } from './TextEditor.tsx';

export const descriptor: AppDescriptor = {
  key: 'text-editor',
  name: '文本编辑器',
  supported: (entry) => {
    if (entry.is_dir) return false;
    const ext = entry.name.split('.').pop()?.toLowerCase() || '';
    // Supports common text and markdown formats
    return ['txt', 'md', 'markdown', 'json', 'yaml', 'yml', 'xml', 'html', 'css', 'js', 'ts', 'py', 'sh', 'log'].includes(ext);
  },
  component: TextEditorApp,
  default: true,
  defaultBounds: { width: 1024, height: 768, x: 120, y: 80 }
};