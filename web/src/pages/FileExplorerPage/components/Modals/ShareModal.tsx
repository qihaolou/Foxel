import { memo, useState, useEffect } from 'react';
import { Modal, Form, Input, Radio, InputNumber, message } from 'antd';
import type { VfsEntry } from '../../../../api/client';
import { shareApi } from '../../../../api/share';

interface ShareModalProps {
  entries: VfsEntry[];
  path: string;
  open: boolean;
  onOk: () => void;
  onCancel: () => void;
}

export const ShareModal = memo(function ShareModal({ entries, path, open, onOk, onCancel }: ShareModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [accessType, setAccessType] = useState('public');

  const defaultName = entries.length > 1 
    ? `分享 ${entries.length} 个项目` 
    : (entries.length === 1 ? entries[0].name : '');

  useEffect(() => {
    if (open) {
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

      await shareApi.create({
        name: values.name,
        paths: fullPaths,
        access_type: values.accessType,
        password: values.password,
        expires_in_days: values.expiresInDays,
      });
      message.success('分享链接已创建');
      onOk();
    } catch (e: any) {
      message.error(e.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="创建分享"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      destroyOnClose
    >
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
    </Modal>
  );
});