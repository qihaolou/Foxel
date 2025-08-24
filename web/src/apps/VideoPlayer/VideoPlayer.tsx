import React, { useEffect, useRef, useState } from 'react';
import { vfsApi } from '../../api/client';
import type { AppComponentProps } from '../types';
import { Spin, Button } from 'antd';
import {
  PauseOutlined,
  CaretRightOutlined,
  SoundOutlined,
  FullscreenOutlined,
  ReloadOutlined
} from '@ant-design/icons';

export const VideoPlayerApp: React.FC<AppComponentProps> = ({ filePath }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const isMountedRef = useRef(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>();
  const [url, setUrl] = useState<string>();
  const [showControls, setShowControls] = useState(true);
  const [retryKey, setRetryKey] = useState(0);
  const controlsTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (controlsTimerRef.current) {
        window.clearTimeout(controlsTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const safePath = filePath.replace(/^\/+/, '').split('#').map((seg, idx) => idx === 0 ? seg : encodeURIComponent('#') + seg).join('');
    const u = vfsApi.streamUrl(safePath);
    setUrl(u);
    setErr(undefined);
    setLoading(true);
  }, [filePath, retryKey]);

  // 处理视频事件
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    const onLoadedMetadata = () => {
      if (isMountedRef.current) {
        setDuration(video.duration);
      }
    };

    const onTimeUpdate = () => {
      if (isMountedRef.current) {
        setCurrentTime(video.currentTime);
        updateProgressBar();
      }
    };

    const onCanPlay = () => {
      if (isMountedRef.current) {
        setLoading(false);
      }
    };

    const onEnded = () => {
      if (isMountedRef.current) {
        setIsPlaying(false);
      }
    };

    const onError = () => {
      if (isMountedRef.current) {
        setLoading(false);
        setErr('视频加载失败');
      }
    };

    const onPlay = () => {
      if (isMountedRef.current) {
        setIsPlaying(true);
      }
    };

    const onPause = () => {
      if (isMountedRef.current) {
        setIsPlaying(false);
      }
    };

    const onProgress = () => {
      // 监听缓冲进度
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        if (progressBarRef.current) {
          const bufferProgress = bufferedEnd / video.duration * 100;
          progressBarRef.current.style.setProperty('--buffer-width', `${bufferProgress}%`);
        }
      }
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('progress', onProgress);

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('progress', onProgress);
    };
  }, [url]);

  // 处理进度条更新
  const updateProgressBar = () => {
    const video = videoRef.current;
    const progress = progressRef.current;

    if (video && progress && duration > 0) {
      const percentage = (video.currentTime / duration) * 100;
      progress.style.width = `${percentage}%`;
    }
  };

  // 处理进度条点击
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressBarRef.current;
    const video = videoRef.current;

    if (progressBar && video) {
      const rect = progressBar.getBoundingClientRect();
      const clickPosition = e.clientX - rect.left;
      const percentage = clickPosition / rect.width;
      const newTime = percentage * duration;

      video.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // 播放/暂停
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(error => {
        console.error('播放失败:', error);
        setErr('播放失败');
      });
    }
  };

  // 全屏
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error('全屏失败:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // 音量控制
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);

    const video = videoRef.current;
    if (video) {
      video.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  // 静音切换
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    const newMuted = !isMuted;
    setIsMuted(newMuted);
    video.muted = newMuted;
  };

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '00:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 控制栏自动隐藏
  const resetControlsTimer = () => {
    if (controlsTimerRef.current) {
      window.clearTimeout(controlsTimerRef.current);
    }

    setShowControls(true);

    controlsTimerRef.current = window.setTimeout(() => {
      if (isPlaying && isMountedRef.current) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleMouseMove = () => {
    resetControlsTimer();
  };

  const retry = () => setRetryKey(k => k + 1);

  return (
    <div
      style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#000' }}
      ref={containerRef}
      onMouseMove={handleMouseMove}
    >
      <div style={{ flex: 1, position: 'relative', backgroundColor: '#000', overflow: 'hidden' }}>
        {/* 视频元素 */}
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
          src={url}
          controlsList="nodownload"
          crossOrigin="anonymous"
          preload="metadata"
          onClick={togglePlay}
        />

        {/* 加载指示器 */}
        {loading && !err && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', gap: 12 }}>
            <Spin />
            <span style={{ fontSize: 12, color: '#aaa' }}>正在缓冲...</span>
          </div>
        )}

        {/* 错误显示 */}
        {err && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', gap: 12 }}>
            <span style={{ color: '#ff4d4f', fontSize: 13 }}>{err}</span>
            <Button icon={<ReloadOutlined />} size="small" onClick={retry}>重试</Button>
          </div>
        )}

        {/* 控制栏 */}
        {showControls && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
              padding: '30px 15px 10px',
              transition: 'opacity 0.3s',
              opacity: showControls ? 1 : 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            {/* 进度条 */}
            <div
              ref={progressBarRef}
              onClick={handleProgressBarClick}
              style={{
                height: '4px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                cursor: 'pointer',
                position: 'relative',
                borderRadius: '2px',
                '--buffer-width': '0%'
              } as React.CSSProperties}
            >
              <div
                style={{
                  position: 'absolute',
                  height: '100%',
                  width: 'var(--buffer-width)',
                  backgroundColor: 'rgba(255,255,255,0.4)',
                  borderRadius: '2px'
                }}
              />
              <div
                ref={progressRef}
                style={{
                  height: '100%',
                  width: '0%',
                  backgroundColor: '#1890ff',
                  position: 'relative',
                  borderRadius: '2px',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    right: '-6px',
                    top: '-4px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#1890ff',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Button
                  type="text"
                  icon={isPlaying ? <PauseOutlined /> : <CaretRightOutlined />}
                  onClick={togglePlay}
                  style={{ color: '#fff' }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100px' }}>
                  <Button
                    type="text"
                    icon={<SoundOutlined />}
                    onClick={toggleMute}
                    style={{ color: isMuted ? '#888' : '#fff' }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    style={{ width: '60px' }}
                  />
                </div>

                <div style={{ color: '#fff', fontSize: '12px' }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <div>
                <Button
                  type="text"
                  icon={<FullscreenOutlined />}
                  onClick={toggleFullscreen}
                  style={{ color: '#fff' }}
                />
              </div>
            </div>
          </div>
        )}

        {!isPlaying && !loading && !err && (
          <div
            onClick={togglePlay}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <CaretRightOutlined style={{ fontSize: '24px', color: '#fff' }} />
          </div>
        )}
      </div>
    </div>
  );
};
