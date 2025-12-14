import React, { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { useGameState } from '../state/gameState';

export const LoadingScreen: React.FC = () => {
  const { progress, active } = useProgress();
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const { setLoading } = useGameState();

  useEffect(() => {
    if (progress === 100 && !active) {
      // Add a small delay before fading out to ensure everything is ready
      const timer = setTimeout(() => {
        setFadeOut(true);
        // Remove from DOM after fade out animation
        setTimeout(() => {
          setVisible(false);
          setLoading(false);
        }, 500);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [progress, active, setLoading]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'black',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.5s ease-in-out',
      pointerEvents: fadeOut ? 'none' : 'auto'
    }}>
      <img 
        src="/images/title/loading_image.jpeg" 
        alt="Loading..."
        style={{
          maxWidth: '800px',
          width: '90%',
          marginBottom: '40px',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)',
          borderRadius: '10px'
        }}
      />
      
      <div style={{
        width: '300px',
        height: '4px',
        background: '#333',
        borderRadius: '2px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: '#00ffff',
          boxShadow: '0 0 10px #00ffff',
          transition: 'width 0.2s ease-out'
        }} />
      </div>
      
      <div style={{
        color: '#00ffff',
        marginTop: '10px',
        fontFamily: 'monospace',
        fontSize: '14px'
      }}>
        LOADING SYSTEM... {Math.round(progress)}%
      </div>
    </div>
  );
};
