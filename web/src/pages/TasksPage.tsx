import { memo, useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Drawer, Form, Input, Switch, message, Typography, Popconfirm, Select, Card } from 'antd';
import { tasksApi, type AutomationTask } from '../api/tasks';
import { processorsApi, type ProcessorTypeMeta } from '../api/processors';
import { ProcessorConfigForm } from '../components/ProcessorConfigForm';

const TasksPage = memo(function TasksPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AutomationTask[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AutomationTask | null>(null);
  const [form] = Form.useForm();
  const [availableProcessors, setAvailableProcessors] = useState<ProcessorTypeMeta[]>([]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const [list, processors] = await Promise.all([
        tasksApi.list(),
        processorsApi.list()
      ]);
      setData(list);
      setAvailableProcessors(processors);
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
    form.setFieldsValue({
      name: '',
      event: 'file_written',
      enabled: true,
      processor_config: {}
    });
    setOpen(true);
  };

  const openEdit = (rec: AutomationTask) => {
    setEditing(rec);
    form.resetFields();
    form.setFieldsValue({
      ...rec,
      processor_config: rec.processor_config || {}
    });
    setOpen(true);
  };

  const submit = async () => {
    try {
      const values = await form.validateFields();
      const body = { ...values };
      setLoading(true);
      if (editing) {
        await tasksApi.update(editing.id, body);
        message.success('更新成功');
      } else {
        await tasksApi.create(body);
        message.success('创建成功');
      }
      setOpen(false);
      setEditing(null);
      fetchList();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const doDelete = async (rec: AutomationTask) => {
    try {
      await tasksApi.remove(rec.id);
      message.success('已删除');
      fetchList();
    } catch (e: any) {
      message.error(e.message || '删除失败');
    }
  };

  const columns = [
    { title: '名称', dataIndex: 'name' },
    { title: '触发事件', dataIndex: 'event', width: 120 },
    { title: '处理器', dataIndex: 'processor_type', width: 180 },
    { title: '启用', dataIndex: 'enabled', width: 80, render: (v: boolean) => <Switch checked={v} size="small" disabled /> },
    {
      title: '操作',
      width: 160,
      render: (_: any, rec: AutomationTask) => (
        <Space size="small">
          <Button size="small" onClick={() => openEdit(rec)}>编辑</Button>
          <Popconfirm title="确认删除?" onConfirm={() => doDelete(rec)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const selectedProcessor = Form.useWatch('processor_type', form);
  const currentProcessorMeta = availableProcessors.find(p => p.type === selectedProcessor);


  return (
    <Card
      title="自动化任务"
      style={{ margin: 0 }}
      extra={
        <Space>
          <Button onClick={fetchList} loading={loading}>刷新</Button>
          <Button type="primary" onClick={openCreate}>新建任务</Button>
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
        title={editing ? `编辑任务: ${editing.name}` : '新建自动化任务'}
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
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="任务名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="event" label="触发事件" rules={[{ required: true }]}>
            <Select options={[
              { value: 'file_written', label: '文件写入' },
              { value: 'file_deleted', label: '文件删除' },
            ]} />
          </Form.Item>
          <Typography.Title level={5} style={{ marginTop: 8, fontSize: 14 }}>匹配规则</Typography.Title>
          <Form.Item name="path_pattern" label="路径前缀 (可选)">
            <Input placeholder="/images/screenshots" />
          </Form.Item>
          <Form.Item name="filename_regex" label="文件名正则 (可选)">
            <Input placeholder=".*\.png$" />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Typography.Title level={5} style={{ marginTop: 8, fontSize: 14 }}>执行动作</Typography.Title>
          <Form.Item name="processor_type" label="处理器" rules={[{ required: true }]}>
            <Select
              placeholder="选择一个处理器"
              options={availableProcessors.map(p => ({ value: p.type, label: `${p.name} (${p.type})` }))}
            />
          </Form.Item>
          <ProcessorConfigForm
            processorMeta={currentProcessorMeta}
            form={form}
            configPath={['processor_config']}
          />
        </Form>
      </Drawer>
    </Card>
  );
});

export default TasksPage;
