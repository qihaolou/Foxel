import { memo, useState } from 'react';
import { Button, Typography, Upload, message, Modal } from 'antd';
import PageCard from '../../components/PageCard';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { backupApi } from '../../api/backup';

const { Title, Paragraph, Text } = Typography;

const BackupPage = memo(function BackupPage() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      await backupApi.export();
      message.success('导出已开始，请检查您的下载。');
    } catch (e: any) {
      message.error(e.message || '导出失败');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (file: File) => {
    Modal.confirm({
      title: '确认导入备份?',
      content: (
        <Typography>
          <Paragraph>您确定要从此文件导入数据吗?</Paragraph>
          <Paragraph strong>警告：此操作将覆盖当前数据库中的所有现有数据，包括用户（含密码）、设置、存储和任务。此操作不可逆！</Paragraph>
        </Typography>
      ),
      okText: '确认导入',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setLoading(true);
        try {
          const response = await backupApi.import(file);
          message.success(response.message || '导入成功！页面将刷新。');
          setTimeout(() => window.location.reload(), 2000);
        } catch (e: any) {
          message.error(e.message || '导入失败');
        } finally {
          setLoading(false);
        }
      },
    });
    return false; // 阻止 antd 的 Upload 组件自动上传
  };

  return (
    <PageCard title="备份和恢复">

      <div style={{ display: 'flex', gap: '16px' }}>
        <PageCard title="导出" style={{ flex: 1 }}>
          <Paragraph>
            点击下面的按钮将所有数据（包括存储、用户、自动化任务和分享）导出为一个 JSON 文件。
            <Text strong>请妥善保管您的备份文件。</Text>
          </Paragraph>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={loading}
          >
            导出备份
          </Button>
        </PageCard>
        <PageCard title="恢复" style={{ flex: 1 }}>
          <Paragraph>
            从之前导出的JSON文件恢复数据。
            <Text strong type="danger">警告：此操作将清除并覆盖现有数据。</Text>
          </Paragraph>
          <Upload
            beforeUpload={handleImport}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />} loading={loading}>
              选择文件并恢复
            </Button>
          </Upload>
        </PageCard>
      </div>
    </PageCard>
  );
});

export default BackupPage;