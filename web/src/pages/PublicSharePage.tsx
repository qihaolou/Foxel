import { memo, useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router';
import { Card, message, Spin, List, Typography, Button, Empty, Breadcrumb, Input, Form } from 'antd';
import { FileOutlined, FolderOutlined, DownloadOutlined } from '@ant-design/icons';
import { shareApi, type ShareInfo } from '../api/share';
import { type VfsEntry } from '../api/vfs';
import { format, parseISO } from 'date-fns';

const { Title, Text } = Typography;

const PublicSharePage = memo(function PublicSharePage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [entries, setEntries] = useState<VfsEntry[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [verified, setVerified] = useState(false);

  const loadData = useCallback(async (p: string, pwd?: string) => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      let info = shareInfo;
      if (!info) {
        info = await shareApi.get(token);
        setShareInfo(info);
      }
      
      if (info?.access_type === 'password' && !verified) {
        // Do not load files until password is verified
        setLoading(false);
        return;
      }

      const currentPassword = pwd || password;
      const listing = await shareApi.listDir(token, p, currentPassword);
      setEntries(listing.entries || []);
      setCurrentPath(p);
    } catch (e: any) {
      setError(e.message || '加载分享失败');
      if (e.message === '需要密码') {
        setVerified(false);
      }
    } finally {
      setLoading(false);
    }
  }, [token, shareInfo, password, verified]);

  useEffect(() => {
    loadData(currentPath);
  }, [loadData, currentPath]);

  const handleEntryClick = (entry: VfsEntry) => {
    if (entry.is_dir) {
      const newPath = (currentPath === '/' ? '' : currentPath) + '/' + entry.name;
      loadData(newPath);
    } else {
      // Preview logic can be added here
      message.info('暂不支持预览');
    }
  };

  const handleBreadcrumbClick = (path: string) => {
    loadData(path);
  };

  const renderBreadcrumb = () => {
    const parts = currentPath.split('/').filter(Boolean);
    const items = [{ title: '全部文件', path: '/' }];
    parts.forEach((part, i) => {
      const path = '/' + parts.slice(0, i + 1).join('/');
      items.push({ title: part, path });
    });
    return (
      <Breadcrumb>
        {items.map((item, i) => (
          <Breadcrumb.Item key={i}>
            {i === items.length - 1 ? (
              <span>{item.title}</span>
            ) : (
              <a onClick={() => handleBreadcrumbClick(item.path)}>{item.title}</a>
            )}
          </Breadcrumb.Item>
        ))}
      </Breadcrumb>
    );
  };

  const handlePasswordSubmit = async (values: { password_input: string }) => {
    if (!token) return;
    try {
      await shareApi.verifyPassword(token, values.password_input);
      setPassword(values.password_input);
      setVerified(true);
      setError('');
      loadData(currentPath, values.password_input);
    } catch (e: any) {
      message.error(e.message || '密码错误');
    }
  };

  if (loading && !shareInfo) {
    return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
  }

  if (error && !error.includes('需要密码')) {
    return <div style={{ textAlign: 'center', padding: 50 }}><Empty description={error} /></div>;
  }

  if (shareInfo?.access_type === 'password' && !verified) {
    return (
      <div style={{ padding: '24px', maxWidth: 400, margin: '100px auto' }}>
        <Card title="需要密码">
          <Form onFinish={handlePasswordSubmit}>
            <Form.Item name="password_input" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                确认
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: 960, margin: 'auto' }}>
      <Card>
        <Title level={4}>{shareInfo?.name}</Title>
        <Text type="secondary">
          创建于 {shareInfo && format(parseISO(shareInfo.created_at), 'yyyy-MM-dd')}
          {shareInfo?.expires_at && `，将于 ${format(parseISO(shareInfo.expires_at), 'yyyy-MM-dd')} 过期`}
        </Text>
        <div style={{ margin: '16px 0' }}>
          {renderBreadcrumb()}
        </div>
        <List
          loading={loading}
          dataSource={entries}
          renderItem={item => (
            <List.Item
              actions={[
                !item.is_dir ? <Button type="text" icon={<DownloadOutlined />} href={shareApi.downloadUrl(token!, (currentPath === '/' ? '' : currentPath) + '/' + item.name, password)} download /> : null
              ]}
            >
              <List.Item.Meta
                avatar={item.is_dir ? <FolderOutlined /> : <FileOutlined />}
                title={<a onClick={() => handleEntryClick(item)}>{item.name}</a>}
                description={!item.is_dir ? `${(item.size / 1024).toFixed(2)} KB` : ''}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
});

export default PublicSharePage;