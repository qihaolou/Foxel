import { memo, useEffect, useMemo, useState } from 'react';
import { Button, Modal, Form, Input, Tag, message, Card, Typography, Popconfirm, Empty, Skeleton, theme, Divider } from 'antd';
import { GithubOutlined, LinkOutlined } from '@ant-design/icons';
import { pluginsApi, type PluginItem } from '../api/plugins';
import { loadPluginFromUrl, ensureManifest } from '../plugins/runtime';
import { reloadPluginApps } from '../apps/registry';

const PluginsPage = memo(function PluginsPage() {
  const [data, setData] = useState<PluginItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [form] = Form.useForm<{ url: string }>();
  const { token } = theme.useToken();

  const reload = async () => {
    try { setLoading(true); setData(await pluginsApi.list()); } finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, []);

  const handleAdd = async () => {
    try {
      const { url } = await form.validateFields();
      const created = await pluginsApi.create({ url });
      try {
        const p = await loadPluginFromUrl(created.url);
        await ensureManifest(created.id, p);
      } catch {}
      setAdding(false);
      form.resetFields();
      await reload();
      await reloadPluginApps();
      message.success('安装成功');
    } catch {}
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data;
    return data.filter(p => (
      (p.name || '').toLowerCase().includes(s)
      || (p.author || '').toLowerCase().includes(s)
      || (p.url || '').toLowerCase().includes(s)
      || (p.description || '').toLowerCase().includes(s)
      || (p.supported_exts || []).some(e => e.toLowerCase().includes(s))
    ));
  }, [data, q]);

  const renderCard = (p: PluginItem) => {
    const icon = p.icon || '/plugins/demo-text-viewer.svg';
    const name = p.name || `插件 ${p.id}`;
    const exts = (p.supported_exts || []).slice(0, 6);
    const more = (p.supported_exts || []).length - exts.length;
    const title = (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src={icon} alt={name} style={{ width: 24, height: 24, objectFit: 'contain' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/plugins/demo-text-viewer.svg'; }} />
        <span>{name}</span>
        {p.version && <Tag color="blue" style={{ marginLeft: 'auto' }}>{p.version}</Tag>}
      </div>
    );
    return (
      <Card
        key={p.id}
        title={title}
        hoverable
        size="small"
        styles={{ body: { padding: 12 } } as any}
        style={{ borderRadius: 10, boxShadow: token.boxShadowTertiary }}
        actions={[
          <a key="open" href={p.url} target="_blank" rel="noreferrer">打开链接</a>,
          <Button key="copy" type="link" size="small" onClick={async () => { try { await navigator.clipboard.writeText(p.url); message.success('已复制链接'); } catch {} }}>复制链接</Button>,
          <Popconfirm key="del" title="确认删除该插件？" onConfirm={async () => { await pluginsApi.remove(p.id); await reload(); await reloadPluginApps(); }}>
            <Button type="link" danger size="small">删除</Button>
          </Popconfirm>
        ]}
      >
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Typography.Paragraph style={{ marginBottom: 8 }} ellipsis={{ rows: 2 }}>
              {p.description || '（暂无描述）'}
            </Typography.Paragraph>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {(exts.length > 0 ? exts : ['任意']).map(e => <Tag key={e}>{e}</Tag>)}
              {more > 0 && <Tag>+{more}</Tag>}
            </div>
            <Divider style={{ margin: '8px 0' }} />
            {(p.author || p.github || p.website) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: token.colorTextTertiary, fontSize: 12 }}>
                {p.author && <span>作者: {p.author}</span>}
                <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {p.github && (
                    <a href={p.github || undefined} target="_blank" rel="noreferrer" title="GitHub">
                      <GithubOutlined style={{ fontSize: 16, color: token.colorTextTertiary }} />
                    </a>
                  )}
                  {p.website && (
                    <a href={p.website || undefined} target="_blank" rel="noreferrer" title="官网">
                      <LinkOutlined style={{ fontSize: 16, color: token.colorTextTertiary }} />
                    </a>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <Button type="primary" onClick={() => setAdding(true)}>安装应用</Button>
        <Button onClick={reload} loading={loading}>刷新</Button>
        <Input
          placeholder="搜索 名称/作者/链接/扩展名"
          value={q}
          onChange={e => setQ(e.target.value)}
          allowClear
          style={{ maxWidth: 320, marginLeft: 'auto' }}
          onPressEnter={() => reload()}
        />
      </div>
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} style={{ borderRadius: 10 }}>
              <Skeleton active avatar paragraph={{ rows: 3 }} />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Empty description="暂无插件" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {filtered.map(renderCard)}
        </div>
      )}
      <Modal
        title="安装应用"
        open={adding}
        onCancel={() => setAdding(false)}
        onOk={handleAdd}
        okText="安装"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="url" label="应用链接" rules={[{ required: true }, { type: 'url', message: '请输入合法的 URL' }]}>
            <Input placeholder="https://example.com/plugin.js" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
});

export default PluginsPage;
