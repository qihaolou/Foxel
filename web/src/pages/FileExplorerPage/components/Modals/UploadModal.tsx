import React, { useEffect } from 'react';
import { Modal, Button, List, Progress, Typography, message, Flex } from 'antd';
import { CopyOutlined, CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import type { UploadFile } from '../../hooks/useUploader';
import { useI18n } from '../../../../i18n';

interface UploadModalProps {
  visible: boolean;
  files: UploadFile[];
  onClose: () => void;
  onStartUpload: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ visible, files, onClose, onStartUpload }) => {
  const { t } = useI18n();

  const allSuccess = files.every(f => f.status === 'success');
  
  useEffect(() => {
    if (visible && files.length > 0 && files.every(f => f.status === 'pending')) {
        onStartUpload();
    }
  }, [visible, files, onStartUpload]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success(t('Copied to clipboard'));
  };

  const renderStatus = (file: UploadFile) => {
    switch (file.status) {
      case 'uploading':
        return <Progress percent={Math.round(file.progress)} size="small" />;
      case 'success':
        return (
          <Flex align="center" gap={8}>
            <CheckCircleFilled style={{ color: 'var(--ant-color-success, #52c41a)' }} />
            <Typography.Text type="secondary" style={{ verticalAlign: 'middle' }}>{t('Upload succeeded')}</Typography.Text>
            <Button icon={<CopyOutlined />} size="small" onClick={() => handleCopy(file.permanentLink!)} type="text" />
          </Flex>
        );
      case 'error':
        return (
            <Flex align="center" gap={8}>
                <CloseCircleFilled style={{ color: 'var(--ant-color-error, #ff4d4f)' }} />
                <Typography.Text type="danger" title={file.error}>{t('Upload failed')}</Typography.Text>
            </Flex>
        );
      default:
        return <Typography.Text type="secondary">{t('Waiting to upload')}</Typography.Text>;
    }
  };

  return (
    <Modal
      open={visible}
      title={t('Upload File')}
      width={600}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose} disabled={!allSuccess && files.some(f => f.status === 'uploading')}>
          {allSuccess ? t('Close') : t('Done')}
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
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ant-color-fill-tertiary, #f0f0f0)'; }}
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
