import React, { useEffect, useRef, useState } from 'react';
import { vfsApi } from '../../api/client';
import type { AppComponentProps } from '../types';
import { Spin, Typography, Button, Tooltip } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, ReloadOutlined, CompressOutlined, CloseOutlined, RotateRightOutlined } from '@ant-design/icons';

export const ImageViewerApp: React.FC<AppComponentProps> = ({ filePath, entry, onRequestClose }) => {
  const [url, setUrl] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>();
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [rotate, setRotate] = useState(0);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const lastDistance = useRef<number | null>(null);
  const transitionRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setErr(undefined);
    vfsApi.getTempLinkToken(filePath.replace(/^\/+/, ''))
      .then(res => {
        if (cancelled) return;
        const publicUrl = vfsApi.getTempPublicUrl(res.token);
        setUrl(publicUrl);
      })
      .catch(e => !cancelled && setErr(e.message || '加载失败'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [filePath]);

  useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setRotate(0);
  }, [url]);

  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  const applyOffset = (next: { x: number; y: number }) => {
    setOffset(next);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    lastPointer.current = { x: e.clientX, y: e.clientY };
    transitionRef.current = false;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !lastPointer.current) return;
    e.preventDefault();
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    applyOffset({ x: offset.x + dx, y: offset.y + dy });
  };
  const onMouseUp = () => {
    setIsDragging(false);
    lastPointer.current = null;
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const cont = containerRef.current;
    const img = imgRef.current;
    if (!cont || !img) return;
    const rect = cont.getBoundingClientRect();
    const cx = e.clientX - rect.left - rect.width / 2;
    const cy = e.clientY - rect.top - rect.height / 2;

    const nextScale = scale > 1.5 ? 1 : 2.5;
    const ratio = nextScale / scale;
    const nextOffset = { x: offset.x - cx * (ratio - 1), y: offset.y - cy * (ratio - 1) };
    setScale(nextScale);
    transitionRef.current = true;
    setTimeout(() => transitionRef.current = false, 200);
    applyOffset(nextOffset);
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY;
    const zoomFactor = delta > 0 ? 1.12 : 0.88;
    const cont = containerRef.current;
    if (!cont) return;
    const rect = cont.getBoundingClientRect();
    const cx = e.clientX - rect.left - rect.width / 2;
    const cy = e.clientY - rect.top - rect.height / 2;

    const nextScale = clamp(scale * zoomFactor, 0.5, 5);
    const ratio = nextScale / scale;
    const nextOffset = { x: offset.x - cx * (ratio - 1), y: offset.y - cy * (ratio - 1) };
    setScale(nextScale);
    transitionRef.current = true;
    setTimeout(() => transitionRef.current = false, 120);
    applyOffset(nextOffset);
  };

  const getTouchDistance = (t1: { clientX: number; clientY: number }, t2: { clientX: number; clientY: number }) =>
    Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      lastPointer.current = { x: t.clientX, y: t.clientY };
    } else if (e.touches.length === 2) {
      lastDistance.current = getTouchDistance(e.touches[0], e.touches[1]);
    }
    transitionRef.current = false;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && lastPointer.current) {
      const t = e.touches[0];
      const dx = t.clientX - lastPointer.current.x;
      const dy = t.clientY - lastPointer.current.y;
      lastPointer.current = { x: t.clientX, y: t.clientY };
      applyOffset({ x: offset.x + dx, y: offset.y + dy });
    } else if (e.touches.length === 2 && lastDistance.current) {
      const d = getTouchDistance(e.touches[0], e.touches[1]);
      const ratio = d / lastDistance.current;
      const nextScale = clamp(scale * ratio, 0.5, 5);
      setScale(nextScale);
      lastDistance.current = d;
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      lastPointer.current = null;
      lastDistance.current = null;
    }
  };
  const doZoom = (factor: number) => {
    const nextScale = clamp(scale * factor, 0.5, 5);
    setScale(nextScale);
    transitionRef.current = true;
    setTimeout(() => transitionRef.current = false, 120);
    applyOffset(offset);
  };
  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setRotate(0);
    transitionRef.current = true;
    setTimeout(() => transitionRef.current = false, 150);
  };
  const fitToContainer = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setRotate(0);
    transitionRef.current = true;
    setTimeout(() => transitionRef.current = false, 150);
  };
  const doRotate = () => {
    setRotate(r => (r + 90) % 360);
    transitionRef.current = true;
    setTimeout(() => transitionRef.current = false, 180);
  };

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(20,20,20,0.8)',
        backdropFilter: 'blur(24px)'
      }}>
        <Spin />
      </div>
    );
  }
  if (err) {
    return (
      <div style={{
        color: 'var(--ant-color-error, #f5222d)',
        padding: 16,
        background: 'rgba(20,20,20,0.8)',
        backdropFilter: 'blur(24px)'
      }}>
        加载失败: {err}
      </div>
    );
  }
  if (!url) {
    return (
      <div style={{
        padding: 16,
        background: 'rgba(20,20,20,0.8)',
        backdropFilter: 'blur(24px)'
      }}>
        无内容
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onWheel={onWheel}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        background: 'rgba(20,20,20,0.8)',
        backdropFilter: 'blur(24px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        touchAction: 'none'
      }}
    >
      {/* 顶部栏：文件名和关闭按钮 */}
      <div style={{
        position: 'absolute',
        top: 32,
        left: 32,
        right: 32,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pointerEvents: 'none'
      }}>
        <Typography.Paragraph
          style={{
            color: '#fff',
            margin: 0,
            fontSize: 15,
            background: 'rgba(0,0,0,0.32)',
            padding: '7px 18px',
            borderRadius: 8,
            boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
            backdropFilter: 'blur(2px)',
            maxWidth: '60vw',
            textAlign: 'left',
            pointerEvents: 'auto'
          }}
          ellipsis
        >
          {entry.name} <span style={{ opacity: 0.7, fontSize: 13 }}>({(entry.size / 1024).toFixed(1)} KB)</span>
        </Typography.Paragraph>
        <Tooltip title="关闭">
          <Button
            shape="circle"
            size="large"
            type="text"
            onClick={() => onRequestClose && onRequestClose()}
            icon={<CloseOutlined />}
            style={{
              color: '#fff',
              background: 'rgba(30,30,30,0.55)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
              border: 'none',
              backdropFilter: 'blur(4px)',
              pointerEvents: 'auto'
            }}
          />
        </Tooltip>
      </div>

      {/* 图片居中显示 */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <img
          ref={imgRef}
          src={url}
          alt={entry.name}
          draggable={false}
          onDragStart={e => e.preventDefault()}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale}) rotate(${rotate}deg)`,
            transition: transitionRef.current ? 'transform 0.18s cubic-bezier(.4,.8,.4,1)' : undefined,
            maxWidth: '80vw',
            maxHeight: '80vh',
            objectFit: 'contain',
            borderRadius: 18,
            boxShadow: '0 8px 40px 0 rgba(0,0,0,0.45)',
            cursor: isDragging ? 'grabbing' : (scale > 1 ? 'grab' : 'zoom-in'),
            willChange: 'transform'
          }}
        />

        {/* 操作按钮组 */}
        <div style={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 18,
          zIndex: 80
        }}>
          <Tooltip title="缩小">
            <Button
              shape="circle"
              size="large"
              icon={<ZoomOutOutlined style={{ fontSize: 22 }} />}
              onClick={() => doZoom(0.8)}
              style={{
                color: '#fff',
                background: 'rgba(30,30,30,0.55)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
                border: 'none',
                backdropFilter: 'blur(4px)'
              }}
            />
          </Tooltip>
          <Tooltip title="放大">
            <Button
              shape="circle"
              size="large"
              icon={<ZoomInOutlined style={{ fontSize: 22 }} />}
              onClick={() => doZoom(1.25)}
              style={{
                color: '#fff',
                background: 'rgba(30,30,30,0.55)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
                border: 'none',
                backdropFilter: 'blur(4px)'
              }}
            />
          </Tooltip>
          <Tooltip title="旋转">
            <Button
              shape="circle"
              size="large"
              icon={<RotateRightOutlined style={{ fontSize: 20 }} />}
              onClick={doRotate}
              style={{
                color: '#fff',
                background: 'rgba(30,30,30,0.55)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
                border: 'none',
                backdropFilter: 'blur(4px)'
              }}
            />
          </Tooltip>
          <Tooltip title="重置">
            <Button
              shape="circle"
              size="large"
              icon={<ReloadOutlined style={{ fontSize: 20 }} />}
              onClick={resetView}
              style={{
                color: '#fff',
                background: 'rgba(30,30,30,0.55)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
                border: 'none',
                backdropFilter: 'blur(4px)'
              }}
            />
          </Tooltip>
          <Tooltip title="适应窗口">
            <Button
              shape="circle"
              size="large"
              icon={<CompressOutlined style={{ fontSize: 20 }} />}
              onClick={fitToContainer}
              style={{
                color: '#fff',
                background: 'rgba(30,30,30,0.55)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
                border: 'none',
                backdropFilter: 'blur(4px)'
              }}
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
