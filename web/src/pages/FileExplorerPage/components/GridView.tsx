import React, { useRef, useState, useEffect } from 'react';
import { Tooltip, Spin, theme } from 'antd';
import { FolderFilled, PictureOutlined } from '@ant-design/icons';
import type { VfsEntry } from '../../../api/client';
import { getFileIcon } from './FileIcons';
import { EmptyState } from './EmptyState';

interface Props {
  entries: VfsEntry[];
  thumbs: Record<string,string>;
  // ...existing code...
  // selected was single entry before; now use selectedEntries for multi-select
  selectedEntries: string[];
  loading: boolean;
  path: string;
  // onSelect: clicked entry, additive indicates Ctrl/Cmd click to toggle
  onSelect: (e: VfsEntry, additive?: boolean) => void;
  // onSelectRange: called when marquee/selecting multiple by box
  onSelectRange: (names: string[]) => void;
  onOpen: (e: VfsEntry) => void;
  onContextMenu: (e: React.MouseEvent, entry: VfsEntry) => void;
  onCreateDir: () => void;
  onGoUp: () => void;
}

const formatSize = (size: number) => {
  if (size < 1024) return size + ' B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
  if (size < 1024 * 1024 * 1024) return (size / 1024 / 1024).toFixed(1) + ' MB';
  return (size / 1024 / 1024 / 1024).toFixed(1) + ' GB';
};

export const GridView: React.FC<Props> = ({ entries, thumbs, selectedEntries, loading, path, onSelect, onSelectRange, onOpen, onContextMenu, onCreateDir, onGoUp }) => {
  const { token } = theme.useToken();

  // refs for marquee selection
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const startRef = useRef<{x:number,y:number} | null>(null);
  const [rect, setRect] = useState<{left:number,top:number,width:number,height:number} | null>(null);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    const onMove = (ev: MouseEvent) => {
      if (!startRef.current) return;
      const cx = ev.clientX;
      const cy = ev.clientY;
      const s = startRef.current;
      const left = Math.min(s.x, cx);
      const top = Math.min(s.y, cy);
      const width = Math.abs(cx - s.x);
      const height = Math.abs(cy - s.y);
      setRect({ left, top, width, height });
    };
    const onUp = () => { // 不需要 MouseEvent 参数，避免未使用警告
      if (!startRef.current) return;
      setSelecting(false);
      const r = rect;
      if (r) {
        // compute intersecting items
        const container = containerRef.current;
        if (container) {
          const sel: string[] = [];
          entries.forEach(ent => {
            const el = itemRefs.current[ent.name];
            if (!el) return;
            const br = el.getBoundingClientRect();
            const rr = { left: r.left, top: r.top, right: r.left + r.width, bottom: r.top + r.height };
            const br2 = { left: br.left, top: br.top, right: br.right, bottom: br.bottom };
            const intersect = !(br2.left > rr.right || br2.right < rr.left || br2.top > rr.bottom || br2.bottom < rr.top);
            if (intersect) sel.push(ent.name);
          });
          if (sel.length > 0) onSelectRange(sel);
        }
      }
      startRef.current = null;
      setRect(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    if (selecting) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [selecting, rect, entries, onSelectRange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // only left button and not on an item actionable element
    if (e.button !== 0) return;
    // start marquee if click on empty space inside container
    const target = e.target as HTMLElement;
    if (target.closest('.fx-grid-item')) {
      return; // clicks on item handled separately
    }
    startRef.current = { x: e.clientX, y: e.clientY };
    setSelecting(true);
    setRect({ left: e.clientX, top: e.clientY, width: 0, height: 0 });
    // prevent text selection
    e.preventDefault();
  };

  return (
    <div className="fx-grid" style={{ padding: 16 }} ref={containerRef} onMouseDown={handleMouseDown}>
      {entries.map(ent => {
        const isImg = thumbs[ent.name];
        const ext = ent.name.split('.').pop()?.toLowerCase();
        const isPictureType = ['png','jpg','jpeg','gif','webp','svg'].includes(ext || '');
        const isSelected = selectedEntries.includes(ent.name);
        return (
          <div
            key={ent.name}
            ref={(el) => { itemRefs.current[ent.name] = el; }} // 确保函数不返回值，匹配 Ref 类型
            className={['fx-grid-item', isSelected ? 'selected' : '', ent.is_dir? 'dir':'file'].join(' ')}
            onClick={(ev) => {
              // click selection: support ctrl/cmd to toggle
              const additive = ev.ctrlKey || ev.metaKey;
              onSelect(ent, additive);
            }}
            onDoubleClick={() => onOpen(ent)}
            onContextMenu={(e)=> onContextMenu(e, ent)}
            style={{ userSelect:'none' }}
          >
            <div className="thumb" style={{ background: ent.is_dir ? 'linear-gradient(#fafafa,#f2f2f2)' : '#fff' }}>
              {ent.is_dir && <FolderFilled style={{ fontSize:32, color: token.colorPrimary }} />}
              {!ent.is_dir && (isImg ? <img src={isImg} alt={ent.name} style={{ maxWidth:'100%', maxHeight:'100%'}} /> : isPictureType ? <PictureOutlined style={{ fontSize:32, color:'#8c8c8c' }} /> : getFileIcon(ent.name,32))}
              {ent.type === 'mount' && <span className="badge">M</span>}
            </div>
            <Tooltip title={ent.name}><div className="name ellipsis" style={{ userSelect:'none' }}>{ent.name}</div></Tooltip>
            <div className="meta ellipsis" style={{ fontSize:11, color: token.colorTextSecondary, userSelect:'none' }}>{ent.is_dir ? '目录' : formatSize(ent.size)}</div>
          </div>
        )
      })}
      {rect && (
        <div
          style={{
            position: 'fixed',
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            border: '1px dashed rgba(0,0,0,0.4)',
            background: 'rgba(0, 120, 212, 0.08)',
            zIndex: 999
          }}
        />
      )}
      {loading && <div style={{ width:'100%', textAlign:'center', padding:40 }}><Spin /></div>}
      {!loading && entries.length === 0 && <EmptyState isRoot={path==='/' } onCreateDir={onCreateDir} onGoUp={onGoUp} />}
    </div>
  );
};
