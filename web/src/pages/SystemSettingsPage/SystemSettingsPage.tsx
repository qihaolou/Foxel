import { Form, Input, Button, message, Tabs, Space, Card, Select, Modal, Radio, InputNumber } from 'antd';
import { useEffect, useState } from 'react';
import PageCard from '../../components/PageCard';
import { getAllConfig, setConfig } from '../../api/config';
import { vectorDBApi } from '../../api/vectorDB';
import { AppstoreOutlined, RobotOutlined, DatabaseOutlined, SkinOutlined } from '@ant-design/icons';
import { useTheme } from '../../contexts/ThemeContext';
import '../../styles/settings-tabs.css';

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

// Theme related config keys
const THEME_KEYS = {
  MODE: 'THEME_MODE',
  PRIMARY: 'THEME_PRIMARY_COLOR',
  RADIUS: 'THEME_BORDER_RADIUS',
  TOKENS: 'THEME_CUSTOM_TOKENS',
  CSS: 'THEME_CUSTOM_CSS',
};

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [config, setConfigState] = useState<Record<string, string> | null>(null);
  const [activeTab, setActiveTab] = useState('appearance');
  const { refreshTheme, previewTheme } = useTheme();

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
      // trigger theme refresh if related keys changed
      if (Object.keys(values).some(k => Object.values(THEME_KEYS).includes(k))) {
        await refreshTheme();
      }
    } catch (e: any) {
      message.error(e.message || '保存失败');
    }
    setLoading(false);
  };

  // 离开“外观设置”时，恢复后端持久化配置（取消未保存的预览）
  useEffect(() => {
    if (activeTab !== 'appearance') {
      refreshTheme();
    }
  }, [activeTab]);

  if (!config) {
    return <PageCard title='系统设置'><div>加载中...</div></PageCard>;
  }

  return (
    <PageCard
      title='系统设置'
    >
      <Space direction="vertical" style={{ width: '100%' }} size={32}>
        <Tabs
          className="fx-settings-tabs"
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          tabPosition="left"
          items={[
            {
              key: 'appearance',
              label: (
                <span>
                  <SkinOutlined style={{ marginRight: 8 }} />
                  外观设置
                </span>
              ),
              children: (
                <Form
                  layout="vertical"
                  initialValues={{
                    [THEME_KEYS.MODE]: config[THEME_KEYS.MODE] ?? 'light',
                    [THEME_KEYS.PRIMARY]: config[THEME_KEYS.PRIMARY] ?? '#111111',
                    [THEME_KEYS.RADIUS]: Number(config[THEME_KEYS.RADIUS] ?? '10'),
                    [THEME_KEYS.TOKENS]: config[THEME_KEYS.TOKENS] ?? '',
                    [THEME_KEYS.CSS]: config[THEME_KEYS.CSS] ?? '',
                  }}
                  onValuesChange={(_, all) => {
                    try {
                      const tokens = all[THEME_KEYS.TOKENS] ? JSON.parse(all[THEME_KEYS.TOKENS]) : undefined;
                      previewTheme({
                        mode: all[THEME_KEYS.MODE],
                        primaryColor: all[THEME_KEYS.PRIMARY],
                        borderRadius: typeof all[THEME_KEYS.RADIUS] === 'number' ? all[THEME_KEYS.RADIUS] : undefined,
                        customTokens: tokens,
                        customCSS: all[THEME_KEYS.CSS],
                      });
                    } catch {
                      // JSON 不合法时忽略 tokens 预览，其他项仍然生效
                      previewTheme({
                        mode: all[THEME_KEYS.MODE],
                        primaryColor: all[THEME_KEYS.PRIMARY],
                        borderRadius: typeof all[THEME_KEYS.RADIUS] === 'number' ? all[THEME_KEYS.RADIUS] : undefined,
                        customCSS: all[THEME_KEYS.CSS],
                      });
                    }
                  }}
                  onFinish={async (vals) => {
                    // Validate JSON if provided
                    if (vals[THEME_KEYS.TOKENS]) {
                      try { JSON.parse(vals[THEME_KEYS.TOKENS]); }
                      catch { return message.error('高级 Token 需为合法 JSON'); }
                    }
                    await handleSave(vals);
                  }}
                  style={{ marginTop: 24 }}
                  key={'appearance-' + JSON.stringify(config)}
                >
                  <Card title="主题">
                    <Form.Item name={THEME_KEYS.MODE} label="主题模式">
                      <Radio.Group buttonStyle="solid">
                        <Radio.Button value="light">亮色</Radio.Button>
                        <Radio.Button value="dark">暗色</Radio.Button>
                        <Radio.Button value="system">跟随系统</Radio.Button>
                      </Radio.Group>
                    </Form.Item>
                    <Form.Item name={THEME_KEYS.PRIMARY} label="主色">
                      <Input type="color" size="large" />
                    </Form.Item>
                    <Form.Item name={THEME_KEYS.RADIUS} label="圆角">
                      <InputNumber min={0} max={24} style={{ width: '100%' }} />
                    </Form.Item>
                  </Card>
                  <Card title="高级" style={{ marginTop: 24 }}>
                    <Form.Item name={THEME_KEYS.TOKENS} label="覆盖 AntD Token（JSON）" tooltip="例如：{ &quot;colorText&quot;: &quot;#222&quot; }">
                      <Input.TextArea autoSize={{ minRows: 4 }} placeholder='{ "colorText": "#222" }' />
                    </Form.Item>
                    <Form.Item name={THEME_KEYS.CSS} label="自定义 CSS">
                      <Input.TextArea autoSize={{ minRows: 6 }} placeholder={":root{ }\n/* 支持任意 CSS */"} />
                    </Form.Item>
                  </Card>
                  <Form.Item style={{ marginTop: 24 }}>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                      保存
                    </Button>
                  </Form.Item>
                </Form>
              )
            },
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
