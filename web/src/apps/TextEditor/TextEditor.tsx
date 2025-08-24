import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout, Spin, Button, Space, message } from 'antd';
import MDEditor from '@uiw/react-md-editor';
import type { AppComponentProps } from '../types';
import { vfsApi } from '../../api/vfs';

const { Header, Content } = Layout;

export const TextEditorApp: React.FC<AppComponentProps> = ({ filePath, entry, onRequestClose }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState('');
  const [initialContent, setInitialContent] = useState('');
  const isDirty = content !== initialContent;

  // 使用 ref 来持有最新的 onRequestClose 函数，避免它成为 effect 的依赖项
  const onRequestCloseRef = useRef(onRequestClose);
  onRequestCloseRef.current = onRequestClose;

  useEffect(() => {
    const loadFile = async () => {
      try {
        setLoading(true);
        const data = await vfsApi.readFile(filePath);
        const text = typeof data === 'string' ? data : new TextDecoder().decode(data);
        setContent(text);
        setInitialContent(text);
      } catch (error) {
        message.error(`加载文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
        onRequestCloseRef.current();
      } finally {
        setLoading(false);
      }
    };
    loadFile();
  }, [filePath]); // effect 只依赖 filePath，因此只在文件路径变化时执行一次

  const handleSave = useCallback(async () => {
    if (!isDirty) return;
    try {
      setSaving(true);
      const blob = new Blob([content], { type: 'text/plain' });
      await vfsApi.uploadFile(filePath, blob);
      setInitialContent(content);
      message.success('保存成功');
    } catch (error) {
      message.error(`保存文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setSaving(false);
    }
  }, [content, filePath, isDirty]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSave]);

  return (
    <Layout style={{ height: '100%', background: '#ffffff' }}>
      <Header
        style={{
          background: '#f0f2f5',
          padding: '0 16px',
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #d9d9d9'
        }}
      >
        <span style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
          {entry.name} {isDirty && '*'}
        </span>
        <Space>
          <Button type="primary" size="small" onClick={handleSave} loading={saving} disabled={!isDirty}>
            保存
          </Button>
        </Space>
      </Header>
      <Content style={{ position: 'relative', overflow: 'auto', height: 'calc(100% - 40px)' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Spin />
          </div>
        ) : (
          <MDEditor
            value={content}
            onChange={(val) => setContent(val || '')}
            height="100%"
            preview="live"
          />
        )}
      </Content>
    </Layout>
  );
};