import { useEffect, useRef, useState } from 'react';
import { useTranslation } from './hooks/useTranslation';

const TRACKS = [
  '/audio/music/Untitled.mp3',
  '/audio/music/Untitled (1).mp3',
  '/audio/music/Untitled (2).mp3',
  '/audio/music/Untitled (3).mp3',
  '/audio/music/Untitled (4).mp3',
  '/audio/music/Untitled (5).mp3',
  '/audio/music/Untitled (6).mp3',
  '/audio/music/Untitled (7).mp3',
  '/audio/music/Untitled (8).mp3',
  '/audio/music/Untitled (9).mp3',
  '/audio/music/Untitled (10).mp3',
];

export const MusicPlayer = () => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    // Try to play on mount, but browsers might block it until interaction
    const playAudio = async () => {
      try {
        if (audioRef.current) {
          await audioRef.current.play();
          setIsPlaying(true);
        }
      } catch (err) {
        console.log("Autoplay blocked, waiting for interaction");
        setIsPlaying(false);
      }
    };
    playAudio();
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
      setHasInteracted(true);
    }
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setHasInteracted(true);
  };

  // Handle track change
  useEffect(() => {
    if (audioRef.current) {
      // Only auto-play if we were already playing or if the user has interacted
      if (isPlaying || hasInteracted) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log("Playback prevented:", error);
            setIsPlaying(false);
          });
        }
        setIsPlaying(true);
      }
    }
  }, [currentTrackIndex]);

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '50%',
      transform: 'translateX(50%)',
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '15px',
      borderRadius: '12px',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      zIndex: 1000,
      border: '1px solid rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(5px)',
      width: '200px'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '5px'
      }}>
        <span style={{ 
          fontSize: '14px', 
          fontWeight: 'bold',
          color: '#4a9eff'
        }}>{t('musicPlayer')}</span>
        <span style={{ fontSize: '10px', color: '#aaa' }}>
          {currentTrackIndex + 1} / {TRACKS.length}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
        <button 
          onClick={togglePlay} 
          style={{ 
            cursor: 'pointer', 
            background: 'rgba(255, 255, 255, 0.1)', 
            border: '1px solid rgba(255, 255, 255, 0.2)', 
            color: 'white', 
            fontSize: '18px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button 
          onClick={nextTrack} 
          style={{ 
            cursor: 'pointer', 
            background: 'rgba(255, 255, 255, 0.1)', 
            border: '1px solid rgba(255, 255, 255, 0.2)', 
            color: 'white', 
            fontSize: '18px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
        >
          ⏭
        </button>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px' }}>🔈</span>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.05" 
          value={volume} 
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          style={{ 
            width: '100%',
            accentColor: '#4a9eff',
            height: '4px'
          }}
        />
        <span style={{ fontSize: '12px' }}>🔊</span>
      </div>

      <audio 
        ref={audioRef} 
        src={TRACKS[currentTrackIndex]} 
        onEnded={nextTrack}
      />
    </div>
  );
};
