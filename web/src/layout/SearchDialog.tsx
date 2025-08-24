import { Modal, Input, List, Divider, Spin, Select, Space } from 'antd';
import { SearchOutlined, FileTextOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import { vfsApi, type SearchResultItem } from '../api/vfs';
import { useNavigate } from 'react-router';


interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

const SEARCH_MODES = [
  { label: '智能搜索', value: 'vector' },
  { label: '名称搜索', value: 'filename' },
];

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onClose }) => {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [searchMode, setSearchMode] = useState<'vector' | 'filename'>('vector');
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await vfsApi.searchFiles(search, 10, searchMode);
      setResults(res.items);
    } catch (e) {
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
      title={null}
      closable={false}
    >
      <Space.Compact style={{ marginBottom: 0, width: '100%' }}>
        <Select
          options={SEARCH_MODES}
          value={searchMode}
          onChange={v => setSearchMode(v as 'vector' | 'filename')}
          style={{
            width: 120,
            fontSize: 18,
            height: 40,
            lineHeight: '40px',
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            borderRight: 0,
            verticalAlign: 'top',
          }}
          styles={{ popup: { root: { fontSize: 18 } } }}
          popupMatchSelectWidth={false}
        />
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="搜索文件 / 标签 / 类型"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            fontSize: 18,
            height: 40,
            width: 'calc(100% - 120px)',
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            verticalAlign: 'top',
          }}
          autoFocus
          onPressEnter={handleSearch}
        />
      </Space.Compact>
      {searched && (
        <>
          <Divider style={{ margin: '12px 0' }}>搜索结果</Divider>
          {loading ? (
            <Spin />
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={results}
              locale={{ emptyText: '未找到相关文件' }}
              renderItem={item => {
                const fullPath = item.path || '';
                const trimmed = fullPath.replace(/\/+$/, '');
                const parts = trimmed.split('/');
                const filename = parts.pop() || '';
                const dir = parts.length ? '/' + parts.join('/') : '/';
                return (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<FileTextOutlined />}
                      title={
                        <a
                          onClick={() => {
                            navigate(`/files${dir === '/' ? '' : dir}`, { state: { highlight: { name: filename } } });
                            onClose();
                          }}
                        >
                          {fullPath}
                        </a>
                      }
                      description={`相关度: ${item.score.toFixed(2)}`}
                    />
                  </List.Item>
                );
              }}
            />
          )}
        </>
      )}
    </Modal>
  );
};

export default SearchDialog;
