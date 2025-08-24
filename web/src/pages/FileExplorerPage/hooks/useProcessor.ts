import { useState, useCallback } from 'react';
import { message } from 'antd';
import { processorsApi, type ProcessorTypeMeta } from '../../../api/processors';
import type { VfsEntry } from '../../../api/client';

interface ProcessorParams {
  path: string;
  processorTypes: ProcessorTypeMeta[];
  refresh: () => void;
}

export function useProcessor({ path, processorTypes, refresh }: ProcessorParams) {
  const [modal, setModal] = useState<{ entry: VfsEntry | null; visible: boolean }>({ entry: null, visible: false });
  const [selectedProcessor, setSelectedProcessor] = useState<string>('');
  const [config, setConfig] = useState<any>({});
  const [savingPath, setSavingPath] = useState('');
  const [overwrite, setOverwrite] = useState(true);
  const [loading, setLoading] = useState(false);

  const openModal = useCallback((entry: VfsEntry) => {
    const ptMeta = processorTypes.find(p => p.type === selectedProcessor);
    setModal({ entry, visible: true });
    setSavingPath((path === '/' ? '' : path) + '/' + entry.name);
    setOverwrite(!!ptMeta?.produces_file);
  }, [path, selectedProcessor, processorTypes]);

  const handleOk = useCallback(async () => {
    if (!modal.entry || !selectedProcessor) return;
    setLoading(true);
    try {
      const schema = processorTypes.find(pt => pt.type === selectedProcessor)?.config_schema || [];
      const finalConfig: any = {};
      schema.forEach(field => {
        let val = config[field.key];
        if ((field.type as any) === 'object' && typeof val === 'string') {
          try { val = JSON.parse(val); } catch { /* ignore */ }
        }
        if (val === undefined) val = field.default;
        finalConfig[field.key] = val;
      });

      const params = {
        path: (path === '/' ? '' : path) + '/' + modal.entry.name,
        processor_type: selectedProcessor,
        config: finalConfig,
        save_to: overwrite ? undefined : savingPath || undefined,
        overwrite: overwrite ? true : undefined,
      };

      await processorsApi.process(params);
      message.success('处理完成');
      setModal({ entry: null, visible: false });
      if (overwrite || savingPath) refresh();
    } catch (e: any) {
      message.error(e.message || '处理失败');
    } finally {
      setLoading(false);
    }
  }, [modal.entry, selectedProcessor, processorTypes, config, path, overwrite, savingPath, refresh]);

  const handleCancel = useCallback(() => {
    setModal({ entry: null, visible: false });
    setSelectedProcessor('');
    setConfig({});
    setSavingPath('');
    setOverwrite(false);
  }, []);

  const handleConfigChange = useCallback((key: string, value: any) => {
    setConfig((c: any) => ({ ...c, [key]: value }));
  }, []);

  const handleProcessorTypeChange = useCallback((type: string) => {
    setSelectedProcessor(type);
    const meta = processorTypes.find(p => p.type === type);
    const newConfig: any = {};
    if (meta?.config_schema) {
      for (const field of meta.config_schema) {
        if (field.default !== undefined) {
          newConfig[field.key] = field.default;
        }
      }
    }
    setConfig(newConfig);
    setOverwrite(!!meta?.produces_file);
  }, [processorTypes]);

  return {
    processorModal: modal,
    selectedProcessor,
    processorConfig: config,
    processorSavingPath: savingPath,
    processorOverwrite: overwrite,
    processorLoading: loading,
    openProcessorModal: openModal,
    handleProcessorOk: handleOk,
    handleProcessorCancel: handleCancel,
    setSelectedProcessor: handleProcessorTypeChange,
    setProcessorConfig: handleConfigChange,
    setProcessorSavingPath: setSavingPath,
    setProcessorOverwrite: setOverwrite,
  };
}