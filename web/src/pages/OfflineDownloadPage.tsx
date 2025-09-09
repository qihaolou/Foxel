import { Empty } from 'antd';

import { useI18n } from '../i18n';

export default function OfflineDownloadPage() {
  const { t } = useI18n();
  return <Empty description={t('No offline download tasks')} />;
}
