import React, { useEffect, useState } from 'react';
import { Spin, Result, Button } from 'antd';
import type { AppComponentProps } from '../types';
import { vfsApi } from '../../api/client';

export const PdfViewerApp: React.FC<AppComponentProps> = ({ filePath, onRequestClose }) => {
  const [url, setUrl] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(undefined);
    setUrl(undefined);

    vfsApi.getTempLinkToken(filePath.replace(/^\/+/, ''))
      .then(res => {
        if (cancelled) return;
        const publicUrl = vfsApi.getTempPublicUrl(res.token);
        setUrl(publicUrl + '#toolbar=1&navpanes=1');
      })
      .catch(e => {
        if (!cancelled) setErr(e.message || '获取临时链接失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [filePath]);

  if (loading) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin tip="正在加载 PDF..." />
      </div>
    );
  }
  if (err) {
    return (
      <Result
        status="error"
        title="无法加载 PDF"
        subTitle={err}
        extra={<Button type="primary" onClick={onRequestClose}>关闭</Button>}
      />
    );
  }

  if (!url) {
    return (
      <Result
        status="warning"
        title="无可用链接"
        subTitle="未能生成 PDF 的临时访问链接"
        extra={<Button type="primary" onClick={onRequestClose}>关闭</Button>}
      />
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--ant-color-bg-container, #fff)' }}>
      <iframe
        src={url}
        width="100%"
        height="100%"
        title="PDF Viewer"
        style={{ border: 'none' }}
      />
    </div>
  );
};

