import React, { useEffect, useRef } from 'react';
import Artplayer from 'artplayer';
import { vfsApi } from '../../api/client';
import type { AppComponentProps } from '../types';


export const VideoPlayerApp: React.FC<AppComponentProps> = ({ filePath }) => {
  const artRef = useRef<HTMLDivElement | null>(null);
  const artInstance = useRef<Artplayer | null>(null);

  useEffect(() => {
    //
    const safePath = filePath.replace(/^\/+/, '').split('#').map((seg, idx) => idx === 0 ? seg : encodeURIComponent('#') + seg).join('');
    const videoUrl = vfsApi.streamUrl(safePath);

    if (artRef.current) {
      artInstance.current = new Artplayer({
        container: artRef.current,
        url: videoUrl,
        autoplay: true,
        fullscreen: true,
        fullscreenWeb: true,
        pip: true,
        setting: true,
        playbackRate: true,
      });
    }

    return () => {
      if (artInstance.current) {
        artInstance.current.destroy();
      }
    };
  }, [filePath]);

  return (
    <div
      ref={artRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#000'
      }}
    />
  );
};
