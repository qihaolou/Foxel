import React, { useState, useEffect } from 'react';
import { Modal, Input } from 'antd';
import type { VfsEntry } from '../../../../api/client';

interface RenameModalProps {
  entry: VfsEntry | null;
  onOk: (entry: VfsEntry, newName: string) => void;
  onCancel: () => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({ entry, onOk, onCancel }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (entry) {
      setName(entry.name);
    }
  }, [entry]);

  const handleOk = () => {
    if (entry) {
      onOk(entry, name);
    }
  };

  return (
    <Modal
      title="重命名"
      open={!!entry}
      onOk={handleOk}
      onCancel={onCancel}
      okButtonProps={{ disabled: !name.trim() || name.trim() === entry?.name }}
      destroyOnClose
    >
      <Input
        placeholder="新的名称"
        value={name}
        onChange={e => setName(e.target.value)}
        onPressEnter={handleOk}
        autoFocus
      />
    </Modal>
  );
};