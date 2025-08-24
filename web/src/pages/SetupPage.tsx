import { useState } from 'react';
import { Form, Input, Button, Card, message, Steps, Select, Space, Typography } from 'antd';
import { UserOutlined, LockOutlined, HddOutlined } from '@ant-design/icons';
import { adaptersApi } from '../api/adapters';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;
const { Step } = Steps;

const SetupPage = () => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const { login, register } = useAuth();
  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await register(values.username, values.password, values.email, values.full_name);
      await login(values.username, values.password);
        message.success('初始化成功！正在为您登录，请不要刷新。');
      setTimeout(async () => {
        await adaptersApi.create({
          name: values.adapter_name,
          type: values.adapter_type,
          config: {
            root: values.root_dir
          },
          sub_path: null,
          mount_path: values.mount_path,
          enabled: true
        });
        window.location.href = '/';
      }, 2000);
    } catch (error: any) {
      console.log(error)
      message.error(error.response?.data?.msg || '初始化失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const stepFields = [
    ['db_driver', 'vector_db_driver'],
    ['adapter_name', 'adapter_type', 'mount_path', 'root_dir'],
    ['username', 'full_name', 'email', 'password', 'confirm'],
  ]

  const next = () => {
    form.validateFields(stepFields[currentStep]).then(() => {
      setCurrentStep(currentStep + 1);
    })
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const steps = [
    {
      title: '数据库设置',
      content: (
        <>
          <Title level={4}>选择数据库驱动</Title>
          <Text type="secondary" style={{ marginBottom: 24, display: 'block' }}>选择用于存储系统数据的数据库和向量数据库。</Text>
          <Form.Item
            label="数据库驱动"
            name="db_driver"
            initialValue="sqlite"
            rules={[{ required: true }]}
          >
            <Select size="large" prefix={<HddOutlined />} disabled options={[{ label: 'SQLite', value: 'sqlite' }]} />
          </Form.Item>
          <Form.Item
            label="向量数据库驱动"
            name="vector_db_driver"
            initialValue="milvus"
            rules={[{ required: true }]}
          >
            <Select size="large" disabled options={[{ label: 'Milvus', value: 'milvus' }]} />
          </Form.Item>
        </>
      )
    },
    {
      title: '初始化挂载',
      content: (
        <>
          <Title level={4}>配置初始存储</Title>
          <Text type="secondary" style={{ marginBottom: 24, display: 'block' }}>为您的文件创建第一个存储挂载点。</Text>
          <Form.Item
            label="挂载名称"
            name="adapter_name"
            initialValue="本地存储"
            rules={[{ required: true, message: '请输入挂载名称！' }]}
          >
            <Input size="large" prefix={<HddOutlined />} />
          </Form.Item>
          <Form.Item
            label="存储类型"
            name="adapter_type"
            initialValue="local"
            rules={[{ required: true }]}
          >
            <Select size="large" disabled options={[{ label: '本地存储', value: 'local' }]} />
          </Form.Item>
          <Form.Item
            label="挂载路径"
            name="mount_path"
            initialValue="/local"
            rules={[{ required: true, message: '请输入挂载路径！' }]}
          >
            <Input size="large" prefix={<HddOutlined />} />
          </Form.Item>
          <Form.Item
            label="根目录"
            name="root_dir"
            initialValue="data/mount"
            rules={[{ required: true, message: '请输入根目录！' }]}
          >
            <Input size="large" placeholder="例如: data/ 或 /var/foxel/data" />
          </Form.Item>
        </>
      )
    },
    {
      title: '创建管理员',
      content: (
        <>
          <Title level={4}>创建管理员账户</Title>
          <Text type="secondary" style={{ marginBottom: 24, display: 'block' }}>这是系统的第一个账户，将拥有最高权限。</Text>
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名！' }]}
          >
            <Input size="large" prefix={<UserOutlined />} />
          </Form.Item>

          <Form.Item
            label="昵称"
            name="full_name"
          >
            <Input size="large" prefix={<UserOutlined />} />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[{ type: 'email', message: '请输入有效的邮箱地址！' }]}
          >
            <Input size="large" prefix={<UserOutlined />} />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码！' }]}
          >
            <Input.Password size="large" prefix={<LockOutlined />} />
          </Form.Item>

          <Form.Item
            label="确认密码"
            name="confirm"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: '请确认您的密码！' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致！'));
                },
              }),
            ]}
          >
            <Input.Password size="large" prefix={<LockOutlined />} />
          </Form.Item>
        </>
      )
    },
  ];

  return (
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(to right, #f0f2f5, #d7d7d7)'
    }}>
      <Card style={{ width: 'clamp(400px, 40vw, 600px)', padding: '24px 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo.svg" alt="Foxel Logo" style={{ width: 48, marginBottom: 16 }} />
          <Title level={2}>系统初始化</Title>
        </div>
        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>

        <Form form={form} name="setup" onFinish={onFinish} layout="vertical">
          {steps.map((step, index) => (
            <div key={step.title} style={{ display: currentStep === index ? 'block' : 'none' }}>
              {step.content}
            </div>
          ))}
        </Form>

        <div style={{ marginTop: 24 }}>
          <Space>
            {currentStep > 0 && (
              <Button style={{ margin: '0 8px' }} onClick={() => prev()}>
                上一步
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button type="primary" onClick={() => next()}>
                下一步
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button type="primary" htmlType="submit" loading={loading} onClick={() => form.submit()}>
                完成初始化
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default SetupPage;