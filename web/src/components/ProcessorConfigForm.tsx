import React from 'react';
import { Form, Input, Select, Typography } from 'antd';
import type { ProcessorTypeMeta } from '../api/processors';

interface ProcessorConfigFormProps {
  processorMeta: ProcessorTypeMeta | undefined;
  form: any;
  configPath: string[]; 
}

export const ProcessorConfigForm: React.FC<ProcessorConfigFormProps> = ({ processorMeta, configPath }) => {
  if (!processorMeta) {
    return <Typography.Text type="secondary">请先选择处理器</Typography.Text>;
  }
  if (!processorMeta.config_schema?.length) {
    return <Typography.Text type="secondary">该处理器无配置项</Typography.Text>;
  }

  return (
    <>
      {processorMeta.config_schema.map(field => {
        const rules = field.required ? [{ required: true, message: `请输入${field.label}` }] : [];
        let inputNode: React.ReactNode;

        switch (field.type) {
          case 'password':
            inputNode = <Input.Password placeholder={field.placeholder} />;
            break;
          case 'number':
            inputNode = <Input type="number" placeholder={field.placeholder} />;
            break;
          case 'select':
            inputNode = (
              <Select placeholder={field.placeholder || '请选择'}>
                {field.options?.map((opt: any) => (
                  <Select.Option key={String(opt.value)} value={opt.value}>
                    {opt.label}
                  </Select.Option>
                ))}
              </Select>
            );
            break;
          default:
            inputNode = <Input placeholder={field.placeholder} />;
        }

        return (
          <Form.Item
            key={field.key}
            name={[...configPath, field.key]}
            label={field.label}
            rules={rules}
            initialValue={field.default}
          >
            {inputNode}
          </Form.Item>
        );
      })}
    </>
  );
};