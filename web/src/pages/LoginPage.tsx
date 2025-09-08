import { useState } from 'react';
import { Card, Form, Input, Button, Typography, Space, Alert } from 'antd';
import { UserOutlined, LockOutlined, GithubOutlined, SendOutlined, WechatOutlined, CloudSyncOutlined, SearchOutlined, ShareAltOutlined, ApartmentOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useSystemStatus } from '../contexts/SystemContext';
import { useNavigate } from 'react-router';

const { Title, Text } = Typography;

export default function LoginPage() {
  const status = useSystemStatus();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    const u = username.trim();
    const p = password;
    if (!u || !p) {
      setErr('请输入用户名与密码');
      return;
    }
    console.debug('[LoginPage] submit ->', { username: u, passwordLength: p.length });
    setErr('');
    setLoading(true);
    try {
      await login(u, p);
      navigate('/');
    } catch (e: any) {
      console.error('[LoginPage] login failed:', e);
      setErr(e.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(to right, var(--ant-color-bg-layout, #f0f2f5), var(--ant-color-fill-secondary, #d7d7d7))'
    }}>
      <div style={{
        display: 'flex',
        width: '80%',
        maxWidth: '1200px',
        height: '70%',
        maxHeight: '700px',
        backgroundColor: 'var(--ant-color-bg-container, #fff)',
        borderRadius: '20px',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(5px)',
        border: '1px solid var(--ant-color-border-secondary, #e5e5e5)',
        overflow: 'hidden'
      }}>
        <div style={{
          width: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px'
        }}>
          <div style={{ width: 360 }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                  <img src={status?.logo} alt="Foxel Logo" style={{ width: 32, marginRight: 16 }} />
                  <Title level={2} style={{ margin: 0, color: 'var(--ant-color-text, #111)' }}>欢迎回来</Title>
                </div>
                <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>登录到您的 Foxel 账户</Text>
              </div>

              {err && <Alert message={err} type="error" showIcon style={{ marginBottom: 24 }} />}

              <Form onFinish={handleSubmit} layout="vertical" size="large">
                <Form.Item>
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="用户名/邮箱"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                  />
                </Form.Item>

                <Form.Item>
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="密码"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    style={{ width: '100%' }}
                  >
                    登录
                  </Button>
                </Form.Item>
              </Form>
            </Space>
          </div>
        </div>
        <div style={{
          width: '50%',
          backgroundColor: 'var(--ant-color-fill-tertiary, #f0f2f5)',
          backgroundImage: `radial-gradient(var(--ant-color-fill-secondary, #d7d7d7) 1px, transparent 1px)`,
          backgroundSize: '16px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px'
        }}>
          <div style={{ maxWidth: '500px' }}>
            <Title level={3}>您的下一代文件管理系统</Title>
            <Text type="secondary" style={{ fontSize: '16px', lineHeight: '1.8' }}>
              Foxel 旨在提供一个安全、高效且智能的文件管理解决方案，帮助您轻松组织、访问和共享您的数字资产。
            </Text>
            <div style={{ marginTop: '32px' }}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Card size="small" variant="borderless" style={{ backgroundColor: 'var(--ant-color-bg-container)' }}>
                  <Space>
                    <CloudSyncOutlined style={{ fontSize: '20px', color: 'var(--ant-color-primary, #1677ff)' }} />
                    <Text>跨平台同步，随时随地访问</Text>
                  </Space>
                </Card>
                <Card size="small" variant="borderless" style={{ backgroundColor: 'var(--ant-color-bg-container)' }}>
                  <Space>
                    <SearchOutlined style={{ fontSize: '20px', color: 'var(--ant-color-primary, #1677ff)' }} />
                    <Text>AI 驱动的智能搜索，快速定位文件</Text>
                  </Space>
                </Card>
                <Card size="small" variant="borderless" style={{ backgroundColor: 'var(--ant-color-bg-container)' }}>
                  <Space>
                    <ShareAltOutlined style={{ fontSize: '20px', color: 'var(--ant-color-primary, #1677ff)' }} />
                    <Text>灵活的分享与协作，提升团队效率</Text>
                  </Space>
                </Card>
                <Card size="small" variant="borderless" style={{ backgroundColor: 'var(--ant-color-bg-container)' }}>
                  <Space>
                    <ApartmentOutlined style={{ fontSize: '20px', color: 'var(--ant-color-primary, #1677ff)' }} />
                    <Text>强大的自动化工作流，简化繁琐任务</Text>
                  </Space>
                </Card>
              </Space>
            </div>
            <div style={{ marginTop: '48px', textAlign: 'center' }}>
              <Text type="secondary">加入我们的社区：</Text>
              <Button type="text" icon={<GithubOutlined />} href="https://github.com/DrizzleTime/Foxel" target="_blank">GitHub</Button>
              <Button type="text" icon={<SendOutlined />} href="https://t.me/+thDsBfyqJxZkNTU1" target="_blank">Telegram</Button>
              <Button type="text" icon={<WechatOutlined />}>微信</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
