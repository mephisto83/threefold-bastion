import React, { useEffect, useRef } from 'react';
import { useGameState } from '../state/gameState';
import { CHARACTERS } from '../game/config/gameConfig';

export const VideoPlayer: React.FC = () => {
  const { activeVideo, stopVideo, currentSpeaker } = useGameState();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Determine which video to show
  // Priority: activeVideo (explicitly set) > currentSpeaker (talking)
  const effectiveVideo = activeVideo || (currentSpeaker ? {
    url: CHARACTERS[currentSpeaker]?.videos.selected?.[0] || CHARACTERS[currentSpeaker]?.videos.intro?.[0],
    loop: true,
    id: currentSpeaker,
    priority: 0
  } : null);

  useEffect(() => {
    if (videoRef.current && effectiveVideo?.url) {
      // Only update src if it changed to avoid reloading same video
      const currentSrc = videoRef.current.getAttribute('src');
      if (currentSrc !== effectiveVideo.url) {
        videoRef.current.src = effectiveVideo.url;
        videoRef.current.play().catch(e => console.error("Video play failed", e));
      }
    }
  }, [effectiveVideo?.url]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  if (!effectiveVideo || !effectiveVideo.url) return null;

  return (
    <div 
      onClick={togglePlay}
      style={{
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      width: '200px',
      height: '200px',
      border: '4px solid #333',
      borderRadius: '50%', // Circular portrait? Or square? Starcraft is usually square-ish but let's do circle for style or square with border.
      // Let's do a cool tech border.
      background: 'black',
      zIndex: 1000,
      pointerEvents: 'auto',
      cursor: 'pointer',
      overflow: 'hidden',
      boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)'
    }}>
      <video
        ref={videoRef}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        loop={effectiveVideo.loop}
        onEnded={() => {
            if (!effectiveVideo.loop && activeVideo) {
                stopVideo();
            }
        }}
      />
      {/* Scanline effect overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
        backgroundSize: '100% 2px, 3px 100%',
        pointerEvents: 'none'
      }} />
    </div>
  );
};
