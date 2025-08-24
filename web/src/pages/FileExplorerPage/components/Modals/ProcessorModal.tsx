import React from 'react';
import { Modal, Form, Select, Input, Checkbox } from 'antd';
import type { VfsEntry } from '../../../../api/client';
import type { ProcessorTypeMeta } from '../../../../api/processors';
import { ProcessorConfigForm } from '../../../../components/ProcessorConfigForm';

interface ProcessorModalProps {
  entry: VfsEntry | null;
  visible: boolean;
  loading: boolean;
  processorTypes: ProcessorTypeMeta[];
  selectedProcessor: string;
  config: any;
  savingPath: string;
  overwrite: boolean;
  onOk: () => void;
  onCancel: () => void;
  onSelectedProcessorChange: (type: string) => void;
  onConfigChange: (key: string, value: any) => void;
  onSavingPathChange: (path: string) => void;
  onOverwriteChange: (overwrite: boolean) => void;
}

export const ProcessorModal: React.FC<ProcessorModalProps> = (props) => {
  const {
    entry, visible, loading, processorTypes, selectedProcessor, config,
    savingPath, overwrite, onOk, onCancel, onSelectedProcessorChange,
    onConfigChange, onSavingPathChange, onOverwriteChange
  } = props;
  const [form] = Form.useForm();

  const selectedProcessorMeta = processorTypes.find(pt => pt.type === selectedProcessor);

  // Sync form when modal opens or selected processor changes
  React.useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        processor_type: selectedProcessor,
        config: config,
      });
    }
  }, [visible, selectedProcessor, config, form]);

  const handleFormValuesChange = (changedValues: any) => {
    if (changedValues.config) {
      for (const key in changedValues.config) {
        onConfigChange(key, changedValues.config[key]);
      }
    }
  };

  return (
    <Modal
      title={`使用处理器处理文件${entry ? `: ${entry.name}` : ''}`}
      open={visible}
      onCancel={onCancel}
      onOk={onOk}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onValuesChange={handleFormValuesChange}>
        <Form.Item name="processor_type" label="处理器" required>
          <Select
            onChange={onSelectedProcessorChange}
            options={processorTypes.map(pt => ({ value: pt.type, label: pt.name }))}
            placeholder="请选择处理器"
          />
        </Form.Item>
        <ProcessorConfigForm
          processorMeta={selectedProcessorMeta}
          form={form}
          configPath={['config']}
        />
        {selectedProcessorMeta?.produces_file && (
          <>
            <Form.Item>
              <Checkbox checked={overwrite} onChange={e => onOverwriteChange(e.target.checked)}>
                覆盖原文件
              </Checkbox>
            </Form.Item>
            {!overwrite && (
              <Form.Item label="保存为新文件">
                <Input
                  value={savingPath}
                  onChange={e => onSavingPathChange(e.target.value)}
                  placeholder="如 /newfile.jpg，不填则仅返回处理结果"
                />
              </Form.Item>
            )}
          </>
        )}
      </Form>
    </Modal>
  );
};