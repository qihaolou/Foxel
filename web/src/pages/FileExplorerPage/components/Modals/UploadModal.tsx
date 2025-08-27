import React, { useEffect } from 'react';
import { Modal, Button, List, Progress, Typography, message, Flex } from 'antd';
import { CopyOutlined, CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import type { UploadFile } from '../../hooks/useUploader';

interface UploadModalProps {
  visible: boolean;
  files: UploadFile[];
  onClose: () => void;
  onStartUpload: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ visible, files, onClose, onStartUpload }) => {

  const allSuccess = files.every(f => f.status === 'success');
  
  useEffect(() => {
    if (visible && files.length > 0 && files.every(f => f.status === 'pending')) {
        onStartUpload();
    }
  }, [visible, files, onStartUpload]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('链接已复制到剪贴板');
  };

  const renderStatus = (file: UploadFile) => {
    switch (file.status) {
      case 'uploading':
        return <Progress percent={Math.round(file.progress)} size="small" />;
      case 'success':
        return (
          <Flex align="center" gap={8}>
            <CheckCircleFilled style={{ color: '#52c41a' }} />
            <Typography.Text type="secondary" style={{ verticalAlign: 'middle' }}>上传成功</Typography.Text>
            <Button icon={<CopyOutlined />} size="small" onClick={() => handleCopy(file.permanentLink!)} type="text" />
          </Flex>
        );
      case 'error':
        return (
            <Flex align="center" gap={8}>
                <CloseCircleFilled style={{ color: '#ff4d4f' }} />
                <Typography.Text type="danger" title={file.error}>上传失败</Typography.Text>
            </Flex>
        );
      default:
        return <Typography.Text type="secondary">等待上传</Typography.Text>;
    }
  };

  return (
    <Modal
      open={visible}
      title="上传文件"
      width={600}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose} disabled={!allSuccess && files.some(f => f.status === 'uploading')}>
          {allSuccess ? '关闭' : '完成'}
        </Button>,
      ]}
    >
      <List
        dataSource={files}
        itemLayout="horizontal"
        renderItem={file => (
          <List.Item
            style={{
              padding: '12px 8px',
              borderRadius: 8,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f0f0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <Flex justify="space-between" align="center" style={{ width: '100%' }}>
              <Typography.Text ellipsis={{ tooltip: file.file.name }} style={{ maxWidth: '60%' }}>
                {file.file.name}
              </Typography.Text>
              <div style={{ minWidth: 180, textAlign: 'right', flexShrink: 0 }}>
                {renderStatus(file)}
              </div>
            </Flex>
          </List.Item>
        )}
      />
    </Modal>
  );
};

export default UploadModal;