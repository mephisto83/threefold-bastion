import React, { useEffect, useRef, useState } from 'react';
import { useGameState } from '../state/gameState';
import { CHARACTERS } from '../game/config/gameConfig';

export const VideoPlayer: React.FC = () => {
  const { activeVideo, stopVideo, currentSpeaker } = useGameState();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(true);

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
        setIsLoading(true);
        setIsPaused(true);
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
        style={{ width: '100%', height: '100%', objectFit: 'cover', background: 'black' }}
        loop={effectiveVideo.loop}
        onLoadStart={() => setIsLoading(true)}
        onLoadedData={() => setIsLoading(false)}
        onCanPlay={() => setIsLoading(false)}
        onPlaying={() => {
          setIsLoading(false);
          setIsPaused(false);
        }}
        onWaiting={() => setIsLoading(true)}
        onStalled={() => setIsLoading(true)}
        onError={() => setIsLoading(false)}
        onPause={() => setIsPaused(true)}
        onPlay={() => setIsPaused(false)}
        onEnded={() => {
            if (!effectiveVideo.loop && activeVideo) {
                stopVideo();
            }
        }}
      />

      <button
        type="button"
        aria-label={isPaused ? 'Play video' : 'Pause video'}
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 10,
          transform: 'translateX(-50%)',
          padding: '6px 10px',
          fontSize: 12,
          borderRadius: 999,
          border: '1px solid rgba(0, 255, 255, 0.6)',
          background: 'rgba(0, 0, 0, 0.65)',
          color: 'white',
          cursor: 'pointer',
          pointerEvents: 'auto',
          userSelect: 'none',
        }}
      >
        {isPaused ? 'Play' : 'Pause'}
      </button>

      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.35)',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.25)',
              borderTopColor: 'rgba(0,255,255,0.9)',
              animation: 'vbSpin 0.9s linear infinite',
            }}
          />
          <style>{`@keyframes vbSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

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
