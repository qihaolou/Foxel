import { memo, useState, useEffect, useCallback } from 'react';
import { Table, message, Tag, Input, Select, Button, Space, Modal, DatePicker } from 'antd';
import PageCard from '../components/PageCard';
import { logsApi, type LogItem, type PaginatedLogs } from '../api/logs';
import { useI18n } from '../i18n';
import { format, formatISO } from 'date-fns';

const { RangePicker } = DatePicker;

const LOG_LEVELS = ['API', 'INFO', 'WARNING', 'ERROR'];

const LogsPage = memo(function LogsPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PaginatedLogs | null>(null);
  const [filters, setFilters] = useState({
    page: 1,
    page_size: 20,
    level: '',
    source: '',
    start_time: '',
    end_time: '',
  });
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);
  const { t } = useI18n();

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (!params.start_time) delete (params as any).start_time;
      if (!params.end_time) delete (params as any).end_time;

      const res = await logsApi.list(params);
      setData(res);
    } catch (e: any) {
      message.error(e.message || t('Load failed'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleClearLogs = () => {
    Modal.confirm({
      title: t('Confirm clear logs?'),
      content: t('This will delete logs in selected range irreversibly.'),
      onOk: async () => {
        try {
          const params = { start_time: filters.start_time, end_time: filters.end_time };
          if (!params.start_time) delete (params as any).start_time;
          if (!params.end_time) delete (params as any).end_time;
          const res = await logsApi.clear(params);
          message.success(t('Cleared {count} logs', { count: String(res.deleted_count) }));
          fetchList();
        } catch (e: any) {
          message.error(e.message || t('Clear failed'));
        }
      },
    });
  };

  const columns = [
    {
      title: t('Time'),
      dataIndex: 'timestamp',
      width: 180,
      render: (ts: string) => format(new Date(ts), 'yyyy-MM-dd HH:mm:ss'),
    },
    {
      title: t('Level'),
      dataIndex: 'level',
      width: 100,
      render: (level: string) => {
        const color = { API: 'blue', INFO: 'green', WARNING: 'orange', ERROR: 'red' }[level] || 'default';
        return <Tag color={color}>{level}</Tag>;
      },
    },
    { title: t('Source'), dataIndex: 'source', width: 180 },
    { title: t('Message'), dataIndex: 'message', ellipsis: true },
    {
      title: t('Actions'),
      width: 100,
      render: (_: any, rec: LogItem) => (
        <Button size="small" onClick={() => setSelectedLog(rec)}>{t('Details')}</Button>
      ),
    },
  ];

  return (
    <PageCard
      title={t('System Logs')}
      extra={
        <Space>
          <RangePicker
            showTime
            onChange={dates => {
              setFilters(f => ({
                ...f,
                start_time: dates?.[0] ? formatISO(dates[0].toDate()) : '',
                end_time: dates?.[1] ? formatISO(dates[1].toDate()) : '',
                page: 1,
              }));
            }}
          />
          <Select
            style={{ width: 120 }}
            placeholder={t('Level')}
            allowClear
            value={filters.level || undefined}
            onChange={level => setFilters(f => ({ ...f, level: level || '', page: 1 }))}
            options={LOG_LEVELS.map(l => ({ value: l, label: l }))}
          />
          <Input.Search
            style={{ width: 240 }}
            placeholder={t('Search source')}
            onSearch={source => setFilters(f => ({ ...f, source, page: 1 }))}
            allowClear
          />
          <Button onClick={fetchList} loading={loading}>{t('Refresh')}</Button>
          <Button danger onClick={handleClearLogs}>{t('Clear')}</Button>
        </Space>
      }
    >
      <Table
        rowKey="id"
        dataSource={data?.items}
        columns={columns}
        loading={loading}
        pagination={{
          current: filters.page,
          pageSize: filters.page_size,
          total: data?.total,
          showSizeChanger: true,
          onChange: (page, pageSize) => setFilters(f => ({ ...f, page, page_size: pageSize })),
        }}
      />
      <Modal
        title={t('Log Details')}
        open={!!selectedLog}
        onCancel={() => setSelectedLog(null)}
        footer={null}
        width={800}
      >
        {selectedLog && (
          <pre style={{ maxHeight: '60vh', overflow: 'auto', background: 'var(--ant-color-fill-tertiary, #f5f5f5)', padding: 12 }}>
            {JSON.stringify(selectedLog.details, null, 2)}
          </pre>
        )}
      </Modal>
    </PageCard>
  );
});

export default LogsPage;
