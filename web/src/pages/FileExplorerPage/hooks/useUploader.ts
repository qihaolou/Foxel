import { useState, useCallback, useRef } from 'react';
import { vfsApi } from '../../../api/client';
import { message }
from 'antd';

export interface UploadFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  permanentLink?: string;
}

export function useUploader(path: string, onUploadComplete: () => void) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openModal = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
    setFiles([]);
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const newFiles: UploadFile[] = Array.from(selectedFiles).map(file => ({
        id: `${file.name}-${Date.now()}`,
        file,
        status: 'pending',
        progress: 0,
      }));
      setFiles(newFiles);
      setIsModalVisible(true);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileDrop = (droppedFiles: FileList) => {
    if (droppedFiles && droppedFiles.length > 0) {
      const newFiles: UploadFile[] = Array.from(droppedFiles).map(file => ({
        id: `${file.name}-${Date.now()}`,
        file,
        status: 'pending',
        progress: 0,
      }));
      setFiles(newFiles);
      setIsModalVisible(true);
    }
  };

  const startUpload = useCallback(async () => {
    if (files.length === 0) {
      return;
    }

    const dir = path === '/' ? '' : path;

    for (const uploadFile of files) {
      if (uploadFile.status !== 'pending') continue;
      
      setFiles(prev => prev.map(f => f.id === uploadFile.id ? { ...f, status: 'uploading' } : f));
      
      const dest = (dir + '/' + uploadFile.file.name).replace(/\/+/g, '/');

      try {
        await vfsApi.uploadStream(dest, uploadFile.file, true, (loaded, total) => {
          const progress = total > 0 ? (loaded / total) * 100 : 0;
          setFiles(prev => prev.map(f => f.id === uploadFile.id ? { ...f, progress } : f));
        });

        const link = await vfsApi.getTempLinkToken(dest, 60 * 60 * 24 * 365 * 10); 
        const permanentLink = vfsApi.getTempPublicUrl(link.token);

        setFiles(prev => prev.map(f => f.id === uploadFile.id ? { ...f, status: 'success', progress: 100, permanentLink } : f));
      } catch (e: any) {
        setFiles(prev => prev.map(f => f.id === uploadFile.id ? { ...f, status: 'error', error: e.message } : f));
        message.error(`Upload failed: ${uploadFile.file.name} - ${e.message}`);
      }
    }
    
    onUploadComplete();
  }, [files, path, onUploadComplete]);

  return {
    files,
    isModalVisible,
    fileInputRef,
    openModal,
    closeModal,
    handleFileChange,
    handleFileDrop,
    startUpload,
  };
}
