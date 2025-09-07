import { Form, Input, Button, message, Tabs, Space, Card, Select, Modal } from 'antd';
import { useEffect, useState } from 'react';
import PageCard from '../../components/PageCard';
import { getAllConfig, setConfig } from '../../api/config';
import { vectorDBApi } from '../../api/vectorDB';
import { AppstoreOutlined, RobotOutlined, DatabaseOutlined } from '@ant-design/icons';

const APP_CONFIG_KEYS: {key: string, label: string, default?: string}[] = [
  { key: 'APP_NAME', label: '应用名称' },
  { key: 'APP_LOGO', label: 'LOGO地址' },
  { key: 'APP_DOMAIN', label: '应用域名' },
  { key: 'FILE_DOMAIN', label: '文件域名' },
];

const VISION_CONFIG_KEYS = [
  { key: 'AI_VISION_API_URL', label: '视觉模型 API 地址' },
  { key: 'AI_VISION_MODEL', label: '视觉模型', default: 'Qwen/Qwen2.5-VL-32B-Instruct' },
  { key: 'AI_VISION_API_KEY', label: '视觉模型 API Key' },
];

const EMBED_CONFIG_KEYS = [
  { key: 'AI_EMBED_API_URL', label: '嵌入模型 API 地址' },
  { key: 'AI_EMBED_MODEL', label: '嵌入模型', default: 'Qwen/Qwen3-Embedding-8B' },
  { key: 'AI_EMBED_API_KEY', label: '嵌入模型 API Key' },
];

const ALL_AI_KEYS = [...VISION_CONFIG_KEYS, ...EMBED_CONFIG_KEYS];

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [config, setConfigState] = useState<Record<string, string> | null>(null);
  const [activeTab, setActiveTab] = useState('app');

  useEffect(() => {
    getAllConfig().then((data) => setConfigState(data as Record<string, string>));
  }, []);

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      for (const [key, value] of Object.entries(values)) {
        await setConfig(key, String(value ?? ''));
      }
      message.success('保存成功');
      setConfigState({ ...config, ...values });
    } catch (e: any) {
      message.error(e.message || '保存失败');
    }
    setLoading(false);
  };

  if (!config) {
    return <PageCard title='系统设置'><div>加载中...</div></PageCard>;
  }

  return (
    <PageCard
      title='系统设置'
    >
      <Space direction="vertical" style={{ width: '100%' }} size={32}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          tabPosition="left"
          items={[
            {
              key: 'app',
              label: (
                <span>
                  <AppstoreOutlined style={{ marginRight: 8 }} />
                  应用设置
                </span>
              ),
              children: (
                <Form
                  layout="vertical"
                  initialValues={{
                    ...Object.fromEntries(APP_CONFIG_KEYS.map(({ key, default: def }) => [key, config[key] ?? def ?? ''])),
                  }}
                  onFinish={handleSave}
                  style={{ marginTop: 24 }}
                  key={JSON.stringify(config)}
                >
                  {APP_CONFIG_KEYS.map(({ key, label }) => (
                    <Form.Item key={key} name={key} label={label}>
                      <Input size="large" />
                    </Form.Item>
                  ))}
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                      保存
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'ai',
              label: (
                <span>
                  <RobotOutlined style={{ marginRight: 8 }} />
                  AI设置
                </span>
              ),
              children: (
                <Form
                  layout="vertical"
                  initialValues={{
                    ...Object.fromEntries(ALL_AI_KEYS.map(({ key, default: def }) => [key, config[key] ?? def ?? ''])),
                  }}
                  onFinish={handleSave}
                  style={{ marginTop: 24 }}
                  key={JSON.stringify(config)}
                >
                  <Card title="视觉模型" style={{ marginBottom: 24 }}>
                    {VISION_CONFIG_KEYS.map(({ key, label }) => (
                      <Form.Item key={key} name={key} label={label}>
                        <Input size="large" />
                      </Form.Item>
                    ))}
                  </Card>
                  <Card title="嵌入模型">
                    {EMBED_CONFIG_KEYS.map(({ key, label }) => (
                      <Form.Item key={key} name={key} label={label}>
                        <Input size="large" />
                      </Form.Item>
                    ))}
                  </Card>
                  <Form.Item style={{ marginTop: 24 }}>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                      保存
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'vector-db',
              label: (
                <span>
                  <DatabaseOutlined style={{ marginRight: 8 }} />
                  向量数据库
                </span>
              ),
              children: (
                <Card title="向量数据库设置" style={{ marginTop: 24 }}>
                  <Form layout="vertical">
                    <Form.Item label="数据库类型">
                      <Select
                        size="large"
                        value="Milvus Lite"
                        disabled
                        options={[{ value: 'Milvus Lite', label: 'Milvus Lite' }]}
                      />
                    </Form.Item>
                    <Form.Item>
                      <Button
                        danger
                        block
                        onClick={() => {
                          Modal.confirm({
                            title: '确认清空向量数据库？',
                            content: '此操作将删除所有集合中的所有数据，且不可逆。',
                            okText: '确认清空',
                            okType: 'danger',
                            cancelText: '取消',
                            onOk: async () => {
                              try {
                                await vectorDBApi.clearAll();
                                message.success('向量数据库已清空');
                              } catch (e: any) {
                                message.error(e.message || '清空失败');
                              }
                            },
                          });
                        }}
                      >
                        清空向量库
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              ),
            },
          ]}
        />
      </Space>
    </PageCard>
  );
}
