import { memo, useState, useEffect } from 'react';
import { Modal, Form, Input, Radio, InputNumber, message, Button, Typography } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { VfsEntry, ShareInfoWithPassword } from '../../../../api/client';
import { shareApi } from '../../../../api/share';
import { useSystemStatus } from '../../../../contexts/SystemContext';

interface ShareModalProps {
  entries: VfsEntry[];
  path: string;
  open: boolean;
  onOk: () => void;
  onCancel: () => void;
}

export const ShareModal = memo(function ShareModal({ entries, path, open, onOk, onCancel }: ShareModalProps) {
  const systemStatus = useSystemStatus();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [accessType, setAccessType] = useState('public');
  const [createdShare, setCreatedShare] = useState<ShareInfoWithPassword | null>(null);

  const defaultName = entries.length > 1
    ? `分享 ${entries.length} 个项目`
    : (entries.length === 1 ? entries[0].name : '');

  useEffect(() => {
    if (open) {
      setCreatedShare(null);
      form.setFieldsValue({
        name: defaultName,
        accessType: 'public',
        expiresInDays: 7,
        password: '',
      });
      setAccessType('public');
    }
  }, [open, defaultName, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const fullPaths = entries.map(e => {
        const p = path === '/' ? '' : path;
        return `${p}/${e.name}`;
      });

      const result = await shareApi.create({
        name: values.name,
        paths: fullPaths,
        access_type: values.accessType,
        password: values.password,
        expires_in_days: values.expiresInDays,
      });
      message.success('分享链接已创建');
      setCreatedShare(result);
    } catch (e: any) {
      message.error(e.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('已复制到剪贴板');
  };

  const baseUrl = systemStatus?.app_domain || window.location.origin;
  const shareUrl = createdShare ? new URL(`/share/${createdShare.token}`, baseUrl).href : '';

  const renderForm = () => (
    <Form form={form} layout="vertical" initialValues={{ name: defaultName, accessType: 'public', expiresInDays: 7 }}>
      <Form.Item name="name" label="分享名称" rules={[{ required: true }]} >
        <Input />
      </Form.Item>
      <Form.Item name="accessType" label="访问权限">
        <Radio.Group onChange={(e) => setAccessType(e.target.value)}>
          <Radio value="public">公开</Radio>
          <Radio value="password">密码访问</Radio>
        </Radio.Group>
      </Form.Item>
      {accessType === 'password' && (
        <Form.Item name="password" label="访问密码" rules={[{ required: true, message: '请输入密码' }]} >
          <Input.Password />
        </Form.Item>
      )}
      <Form.Item name="expiresInDays" label="有效期 (天)" help="设置为 0 或负数表示永久有效">
        <InputNumber min={-1} style={{ width: '100%' }} />
      </Form.Item>
    </Form>
  );

  const renderSuccess = () => (
    <div>
      <Typography.Paragraph>分享链接已成功创建！</Typography.Paragraph>
      <Form layout="vertical">
        <Form.Item label="分享链接">
          <div style={{ display: 'flex', gap: 8 }}>
        <Input readOnly value={shareUrl} style={{ flex: 1 }} />
        <Button icon={<CopyOutlined />} onClick={() => handleCopy(shareUrl)}>
          复制
        </Button>
          </div>
        </Form.Item>
        {createdShare?.password && (
          <Form.Item label="访问密码">
        <div style={{ display: 'flex', gap: 8 }}>
          <Input readOnly value={createdShare.password} style={{ flex: 1 }} />
          <Button icon={<CopyOutlined />} onClick={() => handleCopy(createdShare.password!)}>
            复制
          </Button>
        </div>
          </Form.Item>
        )}
      </Form>
      <Typography.Text type="secondary">
        有效期至: {createdShare?.expires_at ? new Date(createdShare.expires_at).toLocaleString() : '永久有效'}
      </Typography.Text>
    </div>
  );

  return (
    <Modal
      title={createdShare ? "分享创建成功" : "创建分享"}
      open={open}
      onOk={createdShare ? onOk : handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      destroyOnHidden
      okText={createdShare ? "完成" : "创建"}
    >
      {createdShare ? renderSuccess() : renderForm()}
    </Modal>
  );
});