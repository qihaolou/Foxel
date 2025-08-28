import { memo, useState, useEffect } from 'react';
import { Card, Spin, Button, Typography, Empty } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { shareApi, type ShareInfo } from '../../api/share';
import { type VfsEntry } from '../../api/vfs';
import { format, parseISO } from 'date-fns';
import ReactMarkdown from 'react-markdown';

const { Title, Text } = Typography;

interface FileViewerProps {
  token: string;
  shareInfo: ShareInfo;
  entry: VfsEntry;
  password?: string;
}

export const FileViewer = memo(function FileViewer({ token, shareInfo, entry, password }: FileViewerProps) {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFileContent = async () => {
      setLoading(true);
      setError('');
      try {
        const url = shareApi.downloadUrl(token, entry.name, password);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('无法加载文件');
        }
        const text = await response.text();
        setContent(text);
      } catch (e: any) {
        setError(e.message || '加载文件失败');
      } finally {
        setLoading(false);
      }
    };

    if (entry.name.endsWith('.md')) {
      loadFileContent();
    } else {
      setLoading(false);
    }
  }, [token, entry.name, password]);

  const renderContent = () => {
    if (loading) {
      return <div style={{ textAlign: 'center', padding: 50 }}><Spin /></div>;
    }
    if (error) {
      return <Empty description={error} />;
    }
    if (entry.name.endsWith('.md')) {
      return <ReactMarkdown>{content}</ReactMarkdown>;
    }
    return (
      <Empty
        description={
          <div>
            <p>暂不支持在线预览此类型文件</p>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              href={shareApi.downloadUrl(token, entry.name, password)}
              download
            >
              下载文件
            </Button>
          </div>
        }
      />
    );
  };

  return (
    <div style={{ padding: '24px', maxWidth: 960, margin: 'auto' }}>
      <Card>
        <Title level={4}>{entry.name}</Title>
        <Text type="secondary">
          创建于 {shareInfo && format(parseISO(shareInfo.created_at), 'yyyy-MM-dd')}
          {shareInfo?.expires_at && `，将于 ${format(parseISO(shareInfo.expires_at), 'yyyy-MM-dd')} 过期`}
        </Text>
        <div style={{ marginTop: 16 }}>
          <Button
            style={{ marginBottom: 16 }}
            icon={<DownloadOutlined />}
            href={shareApi.downloadUrl(token, entry.name, password)}
            download
          >
            下载
          </Button>
        </div>
        <Card>
          {renderContent()}
        </Card>
      </Card>
    </div>
  );
});