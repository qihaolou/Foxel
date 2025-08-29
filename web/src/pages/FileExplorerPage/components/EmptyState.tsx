import React from 'react';
import { Typography, theme } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';

interface Props {
  isRoot: boolean;
}

export const EmptyState: React.FC<Props> = ({ isRoot }) => {
  const { token } = theme.useToken();
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:isRoot? '80px 40px':'60px 40px', minHeight: isRoot? '400px':'300px', color: token.colorTextSecondary }}>
      <FolderOpenOutlined style={{ fontSize:64, color: token.colorTextQuaternary, marginBottom:16 }} />
      <Typography.Title level={4} style={{ color: token.colorTextSecondary, marginBottom:8, fontWeight:400 }}>
        {isRoot ? '这里还没有任何文件' : '此目录为空'}
      </Typography.Title>
      <Typography.Text style={{ color: token.colorTextTertiary, marginBottom:24, textAlign:'center', maxWidth:300, lineHeight:1.5 }}>
        {isRoot ? '开始上传文件或创建新目录来组织您的内容' : '您可以在此目录中创建新的文件夹或上传文件'}
      </Typography.Text>
    </div>
  );
};
