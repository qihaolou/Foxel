import React from 'react';
import { Modal, Typography, Spin, theme, Card, Descriptions, Divider, Badge, Space, message } from 'antd';
import { FileOutlined, FolderOutlined, CameraOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { VfsEntry } from '../../../api/client';

interface Props {
  entry: VfsEntry | null;
  loading: boolean;
  data: any;
  onClose: () => void;
}

const exifFieldMap: Record<string, { label: string; format?: (v: any) => string }> = {
  '271': { label: '设备品牌' },
  '272': { label: '设备型号' },
  '306': { label: '拍摄时间' },
  '282': { label: '水平分辨率', format: v => `${v} dpi` },
  '283': { label: '垂直分辨率', format: v => `${v} dpi` },
  '33434': { label: '曝光时间', format: v => `${v} 秒` },
  '33437': { label: '光圈值', format: v => `f/${v}` },
  '34855': { label: 'ISO' },
  '37377': { label: '焦距', format: v => `${v} mm` },
  '40962': { label: '宽度', format: v => `${v} px` },
  '40963': { label: '高度', format: v => `${v} px` },
};

function renderExif(exif: Record<string, any>) {
  const items = Object.entries(exifFieldMap)
    .filter(([key]) => exif[key] !== undefined)
    .map(([key, { label, format }]) => ({
      key,
      label,
      value: format ? format(exif[key]) : exif[key]
    }));

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
        <InfoCircleOutlined style={{ fontSize: 20, marginBottom: 8 }} />
        <div>无常见EXIF信息</div>
      </div>
    );
  }

  return (
    <Descriptions
      size="small"
      column={1}
      bordered
      items={items.map(item => ({
        key: item.key,
        label: <span style={{ fontWeight: 500, color: '#595959' }}>{item.label}</span>,
        children: <span style={{ color: '#262626' }}>{item.value}</span>
      }))}
      contentStyle={{ padding: '8px 12px' }}
      labelStyle={{ padding: '8px 12px', backgroundColor: '#fafafa', width: '30%' }}
    />
  );
}

function formatFileSize(size: number | string): string {
  if (typeof size !== 'number') return String(size);
  
  const units = ['字节', 'KB', 'MB', 'GB'];
  let index = 0;
  let fileSize = size;
  
  while (fileSize >= 1024 && index < units.length - 1) {
    fileSize /= 1024;
    index++;
  }
  
  return `${fileSize.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export const FileDetailModal: React.FC<Props> = ({ entry, loading, data, onClose }) => {
  const { token } = theme.useToken();
  
  return (
    <Modal
      title={
        <Space>
          <InfoCircleOutlined style={{ color: token.colorPrimary }} />
          <span>文件属性</span>
          {entry && (
            <Typography.Text type="secondary" style={{ fontSize: 14 }}>
              - {entry.name}
            </Typography.Text>
          )}
        </Space>
      }
      open={!!entry}
      onCancel={onClose}
      footer={null}
      width={800}
      styles={{
        body: { padding: '20px 0px' }
      }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: token.colorTextSecondary }}>加载文件信息...</div>
        </div>
      ) : data ? (
        data.error ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Typography.Text type="danger" style={{ fontSize: 16 }}>
              {data.error}
            </Typography.Text>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {/* 左侧：基本信息 */}
            <div style={{ flex: 1 }}>
              <Card 
                size="small"
                title={
                  <Space>
                    {data.is_dir ? <FolderOutlined /> : <FileOutlined />}
                    基本信息
                  </Space>
                }
                style={{ borderRadius: 8, height: 'fit-content' }}
              >
                <Descriptions
                  column={1}
                  size="small"
                  items={[
                    {
                      key: 'name',
                      label: '名称',
                      children: <Typography.Text strong>{data.name}</Typography.Text>
                    },
                    {
                      key: 'type',
                      label: '类型',
                      children: (
                        <Badge 
                          status={data.is_dir ? 'processing' : 'default'} 
                          text={data.type || (data.is_dir ? '文件夹' : '文件')}
                        />
                      )
                    },
                    {
                      key: 'size',
                      label: '大小',
                      children: formatFileSize(data.size)
                    },
                    {
                      key: 'mtime',
                      label: '修改时间',
                      children: data.mtime ? (
                        typeof data.mtime === 'number' 
                          ? new Date(data.mtime * 1000).toLocaleString('zh-CN')
                          : data.mtime
                      ) : '-'
                    },
                    {
                      key: 'path',
                      label: '路径',
                      children: (
                        <Typography.Text style={{ display: 'block', marginTop: 4 }}>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              try {
                                if (navigator.clipboard) {
                                  navigator.clipboard.writeText(data.path).then(() => {
                                    message.success('路径已复制到剪贴板');
                                  }).catch(() => {
                                    message.error('复制失败');
                                  });
                                } else {
                                  const textarea = document.createElement('textarea');
                                  textarea.value = data.path;
                                  document.body.appendChild(textarea);
                                  textarea.select();
                                  const ok = document.execCommand('copy');
                                  document.body.removeChild(textarea);
                                  message[ok ? 'success' : 'error'](ok ? '路径已复制到剪贴板' : '复制失败');
                                }
                              } catch {
                                message.error('复制失败');
                              }
                            }}
                            style={{
                              fontSize: 12,
                              wordBreak: 'break-all',
                              backgroundColor: token.colorFillAlter,
                              padding: '4px 8px',
                              borderRadius: 4,
                              display: 'inline-block'
                            }}
                          >
                            {data.path}
                          </a>
                        </Typography.Text>
                      )
                    }
                  ]}
                  contentStyle={{ 
                    fontSize: 14,
                    color: token.colorText
                  }}
                  labelStyle={{ 
                    fontWeight: 500,
                    color: token.colorTextSecondary,
                    width: '30%'
                  }}
                />
                {data.mode !== undefined && (
                  <>
                    <Divider style={{ margin: '12px 0' }} />
                    <div>
                      <span style={{ fontWeight: 500, color: token.colorTextSecondary }}>权限：</span>
                      <Typography.Text code>{data.mode.toString(8)}</Typography.Text>
                    </div>
                  </>
                )}
              </Card>
            </div>

            {/* 右侧：EXIF 信息 */}
            {data.exif && (
              <div style={{ flex: 1 }}>
                <Card 
                  size="small"
                  title={
                    <Space>
                      <CameraOutlined />
                      EXIF信息
                    </Space>
                  }
                  style={{ borderRadius: 8, height: 'fit-content' }}
                >
                  {renderExif(data.exif)}
                </Card>
              </div>
            )}
          </div>
        )
      ) : null}
    </Modal>
  );
};

export default FileDetailModal;
