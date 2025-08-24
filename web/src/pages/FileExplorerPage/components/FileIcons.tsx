import React from 'react';
import { 
  FileOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FileZipOutlined,
  CodeOutlined,
  FileMarkdownOutlined,
  SettingOutlined,
  DatabaseOutlined,
  FontSizeOutlined,
} from '@ant-design/icons';

export const getFileIcon = (fileName: string, size: number = 16) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const iconStyle: React.CSSProperties = { fontSize: size, marginRight: size === 16 ? 6 : 0 };

  const make = (node: React.ReactNode, color: string) => React.cloneElement(node as any, { style: { ...iconStyle, color } });

  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff'].includes(ext)) return make(<FileImageOutlined />, '#52c41a');
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v', '3gp'].includes(ext)) return make(<VideoCameraOutlined />, '#fa541c');
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'].includes(ext)) return make(<AudioOutlined />, '#722ed1');
  if (['pdf'].includes(ext)) return make(<FilePdfOutlined />, '#f5222d');
  if (['doc', 'docx'].includes(ext)) return make(<FileWordOutlined />, '#1890ff');
  if (['xls', 'xlsx'].includes(ext)) return make(<FileExcelOutlined />, '#52c41a');
  if (['ppt', 'pptx'].includes(ext)) return make(<FilePptOutlined />, '#fa8c16');
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) return make(<FileZipOutlined />, '#faad14');
  if (['js','jsx','ts','tsx','vue','html','css','scss','less','json','xml','yaml','yml','py','java','cpp','c','h','php','rb','go','rs','swift','kt'].includes(ext)) return make(<CodeOutlined />, '#13c2c2');
  if (['md', 'markdown'].includes(ext)) return make(<FileMarkdownOutlined />, '#1890ff');
  if (['txt', 'log', 'ini', 'cfg', 'conf'].includes(ext)) return make(<FileTextOutlined />, '#8c8c8c');
  if (['ttf', 'otf', 'woff', 'woff2', 'eot'].includes(ext)) return make(<FontSizeOutlined />, '#eb2f96');
  if (['db', 'sqlite', 'sql'].includes(ext)) return make(<DatabaseOutlined />, '#fa541c');
  if (['env', 'config', 'properties', 'toml'].includes(ext)) return make(<SettingOutlined />, '#faad14');
  return make(<FileOutlined />, '#8c8c8c');
};
