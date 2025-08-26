import { memo, useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, message, Popconfirm, Tag, Tooltip } from 'antd';
import PageCard from '../components/PageCard';
import { shareApi, type ShareInfo } from '../api/share';
import { format, parseISO } from 'date-fns';
import { LinkOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons';

const SharePage = memo(function SharePage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ShareInfo[]>([]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const list = await shareApi.list();
      setData(list);
    } catch (e: any) {
      message.error(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const doCopy = (rec: ShareInfo) => {
    const shareUrl = `${window.location.origin}/share/${rec.token}`;
    navigator.clipboard.writeText(shareUrl);
    message.success('链接已复制');
  };

  const doDelete = async (rec: ShareInfo) => {
    try {
      await shareApi.remove(rec.id);
      message.success('分享已取消');
      fetchList();
    } catch (e: any) {
      message.error(e.message || '取消失败');
    }
  };

  const columns = [
    { 
      title: '分享名称', 
      dataIndex: 'name',
      render: (name: string, rec: ShareInfo) => (
        <a href={`/share/${rec.token}`} target="_blank" rel="noopener noreferrer">
          <LinkOutlined style={{ marginRight: 8 }} />
          {name}
        </a>
      )
    },
    { 
      title: '分享内容', 
      dataIndex: 'paths',
      ellipsis: true,
      render: (paths: string[]) => (
        <Tooltip title={paths.join(', ')}>
          <span>{paths.join(', ')}</span>
        </Tooltip>
      )
    },
    { 
      title: '创建时间', 
      dataIndex: 'created_at', 
      width: 180,
      render: (v: string) => format(parseISO(v), 'yyyy-MM-dd HH:mm')
    },
    {
      title: '过期时间',
      dataIndex: 'expires_at',
      width: 180,
      render: (v?: string) => v ? <Tag color="orange">{format(parseISO(v), 'yyyy-MM-dd HH:mm')}</Tag> : <Tag>永久有效</Tag>
    },
    {
      title: '访问',
      dataIndex: 'access_type',
      width: 100,
      render: (v: 'public' | 'password') => v === 'password' ? <Tag color="red">密码</Tag> : <Tag color="green">公开</Tag>
    },
    {
      title: '操作',
      width: 160,
      render: (_: any, rec: ShareInfo) => (
        <Space size="small">
          <Button size="small" icon={<CopyOutlined />} onClick={() => doCopy(rec)}>复制</Button>
          <Popconfirm title="确认取消分享?" onConfirm={() => doDelete(rec)}>
            <Button size="small" danger icon={<DeleteOutlined />}>取消</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <PageCard
      title="我的分享"
      extra={<Button onClick={fetchList} loading={loading}>刷新</Button>}
    >
      <Table
        rowKey="id"
        dataSource={data}
        columns={columns as any}
        loading={loading}
        pagination={false}
      />
    </PageCard>
  );
});

export default SharePage;
