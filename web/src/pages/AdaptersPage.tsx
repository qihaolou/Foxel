import { memo, useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Drawer, Form, Input, Switch, message, Typography, Popconfirm, Select } from 'antd';
import PageCard from '../components/PageCard';
import { adaptersApi, type AdapterItem } from '../api/client';


interface AdapterTypeField {
  key: string;
  label: string;
  type: 'string' | 'password' | 'number';
  required?: boolean;
  placeholder?: string;
  default?: any;
}
interface AdapterTypeMeta {
  type: string;
  name: string;
  config_schema: AdapterTypeField[];
}

const AdaptersPage = memo(function AdaptersPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AdapterItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdapterItem | null>(null);
  const [form] = Form.useForm();
  const [availableTypes, setAvailableTypes] = useState<AdapterTypeMeta[]>([]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const [list, types] = await Promise.all([
        adaptersApi.list(),
        adaptersApi.available()
      ]);
      setData(list);
      setAvailableTypes(types);
    } catch (e: any) {
      message.error(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    const defaultType = availableTypes[0]?.type || 'local';
    const typeMeta = availableTypes.find(t => t.type === defaultType);
    const cfgDefaults: Record<string, any> = {};
    typeMeta?.config_schema.forEach(f => {
      if (f.default !== undefined) cfgDefaults[f.key] = f.default;
    });
    form.setFieldsValue({
      name: '',
      type: defaultType,
      path: '/',
      sub_path: '',
      enabled: true,
      config: cfgDefaults
    });
    setOpen(true);
  };

  const openEdit = (rec: AdapterItem) => {
    setEditing(rec);
    form.resetFields();
    form.setFieldsValue({
      name: rec.name,
      type: rec.type,
      path: rec.path || '/',
      sub_path: rec.sub_path || '',
      enabled: rec.enabled,
      config: rec.config || {}
    });
    setOpen(true);
  };

  const submit = async () => {
    try {
      const values = await form.validateFields();
      const cfg = values.config || {};
      const typeMeta = availableTypes.find(t => t.type === values.type);
      const miss: string[] = [];
      typeMeta?.config_schema.forEach(f => {
        if (f.required && (cfg[f.key] === undefined || cfg[f.key] === null || cfg[f.key] === '')) {
          miss.push(f.label || f.key);
        }
      });
      if (miss.length) {
        message.error('缺少必填配置: ' + miss.join(', '));
        return;
      }
      const body = {
        name: values.name.trim(),
        type: values.type,
        path: values.path || '/',
        sub_path: values.sub_path?.trim() || null,
        enabled: values.enabled,
        config: cfg
      };
      setLoading(true);
      if (editing) {
        await adaptersApi.update(editing.id, body as any);
        message.success('更新成功');
      } else {
        await adaptersApi.create(body as any);
        message.success('创建成功');
      }
      setOpen(false);
      setEditing(null);
      fetchList();
    } catch (e: any) {
      if (e?.errorFields) return; // 表单校验
      message.error(e.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const doDelete = async (rec: AdapterItem) => {
    try {
      await adaptersApi.remove(rec.id);
      message.success('已删除');
      fetchList();
    } catch (e: any) {
      message.error(e.message || '删除失败');
    }
  };

  const handleToggleEnabled = async (rec: AdapterItem, checked: boolean) => {
    try {
      setLoading(true);
      await adaptersApi.update(rec.id, { ...rec, enabled: checked });
      message.success('状态已更新');
      fetchList();
    } catch (e: any) {
      message.error(e.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: '名称', dataIndex: 'name' },
    { title: '类型', dataIndex: 'type', width: 100 },
    { title: '挂载路径', dataIndex: 'path', width: 140, render: (v: string) => v || '-' },
    { title: '子路径', dataIndex: 'sub_path', width: 140, render: (v: string) => v || '-' },
    {
      title: '启用',
      dataIndex: 'enabled',
      width: 80,
      render: (v: boolean, rec: AdapterItem) => (
        <Switch
          checked={v}
          size="small"
          loading={loading}
          onChange={checked => handleToggleEnabled(rec, checked)}
        />
      )
    },
    {
      title: '操作',
      width: 160,
      render: (_: any, rec: AdapterItem) => (
        <Space size="small">
          <Button size="small" onClick={() => openEdit(rec)}>编辑</Button>
          <Popconfirm title="确认删除?" onConfirm={() => doDelete(rec)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const selectedType = Form.useWatch('type', form);
  const currentTypeMeta = availableTypes.find(t => t.type === selectedType);

  function renderConfigFields() {
    if (!currentTypeMeta) return <Typography.Text type="secondary">无配置项</Typography.Text>;
    return currentTypeMeta.config_schema.map(field => {
      const rules = field.required ? [{ required: true, message: `请输入${field.label}` }] : [];
      let inputNode: any = <Input placeholder={field.placeholder} />;
      if (field.type === 'password') inputNode = <Input.Password placeholder={field.placeholder} />;
      if (field.type === 'number') inputNode = <Input type="number" placeholder={field.placeholder} />;
      return (
        <Form.Item
          key={field.key}
          name={['config', field.key]}
          label={field.label}
          rules={rules}
        >
          {inputNode}
        </Form.Item>
      );
    });
  }

  return (
    <PageCard
      title="存储适配器"
      extra={
        <Space>
          <Button onClick={fetchList} loading={loading}>刷新</Button>
          <Button type="primary" onClick={openCreate}>新建适配器</Button>
        </Space>
      }
    >
      <Table
        rowKey="id"
        dataSource={data}
        columns={columns as any}
        loading={loading}
        pagination={false}
        style={{ marginBottom: 0 }}
      />
      <Drawer
        title={editing ? `编辑: ${editing.name}` : '新建适配器'}
        width={480}
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={() => { setOpen(false); setEditing(null); }}>取消</Button>
            <Button type="primary" onClick={submit} loading={loading}>提交</Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ enabled: true }}
        >
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="唯一名称" />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select
              placeholder="选择适配器类型"
              options={availableTypes.map(t => ({ value: t.type, label: `${t.name} (${t.type})` }))}
              onChange={() => {
                const t = availableTypes.find(v => v.type === form.getFieldValue('type'));
                const cfgDefaults: Record<string, any> = {};
                t?.config_schema.forEach(f => {
                  if (f.default !== undefined) cfgDefaults[f.key] = f.default;
                });
                form.setFieldsValue({ config: cfgDefaults });
              }}
            />
          </Form.Item>
          <Form.Item name="path" label="挂载路径" rules={[{ required: true, message: '请输入挂载路径' }]}>
            <Input placeholder="/或/drive" />
          </Form.Item>
          <Form.Item name="sub_path" label="子路径(可选)">
            <Input placeholder="适配器内部子目录" />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Typography.Title level={5} style={{ marginTop: 8, fontSize: 14 }}>适配器配置</Typography.Title>
          {renderConfigFields()}
        </Form>
      </Drawer>
    </PageCard>
  );
});

export default AdaptersPage;
