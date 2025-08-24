import React, { useState, useEffect } from 'react';
import { Modal, Input } from 'antd';

interface CreateDirModalProps {
  open: boolean;
  onOk: (name: string) => void;
  onCancel: () => void;
}

export const CreateDirModal: React.FC<CreateDirModalProps> = ({ open, onOk, onCancel }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
    }
  }, [open]);

  const handleOk = () => {
    onOk(name);
  };

  return (
    <Modal
      title="新建目录"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okButtonProps={{ disabled: !name.trim() }}
      destroyOnClose
    >
      <Input
        placeholder="目录名称"
        value={name}
        onChange={e => setName(e.target.value)}
        onPressEnter={handleOk}
        autoFocus
      />
    </Modal>
  );
};