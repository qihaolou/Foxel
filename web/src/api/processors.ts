import request from './client';

export interface ProcessorTypeField {
  key: string;
  label: string;
  type: 'string' | 'password' | 'number' | 'select';
  required?: boolean;
  placeholder?: string;
  default?: any;
  options?: { label: string; value: string | number }[];
}

export interface ProcessorTypeMeta {
  type: string;
  name: string;
  supported_exts: string[];
  config_schema: ProcessorTypeField[];
  produces_file:boolean;
}

export const processorsApi = {
  list: () => request<ProcessorTypeMeta[]>('/processors', {
    method: 'GET'
  }),
  process: (params: {
    path: string;
    processor_type: string;
    config: any;
    save_to?: string;
    overwrite?: boolean;
  }) =>
    request<any>('/processors/process', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: {
        'Content-Type': 'application/json'
      }
    }),
};
