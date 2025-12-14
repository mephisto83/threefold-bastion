import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGameState } from '../state/gameState';
import { useTranslation } from './hooks/useTranslation';

export const WaveIntermissionScreen: React.FC = () => {
  const { nextWave, wave, status } = useGameState();
  const { t } = useTranslation();

  const AUTO_START_SECONDS = 60;
  const [secondsLeft, setSecondsLeft] = useState(AUTO_START_SECONDS);
  const autoStartedRef = useRef(false);

  useEffect(() => {
    if (status !== 'wave_intermission') {
      autoStartedRef.current = false;
      return;
    }

    autoStartedRef.current = false;
    setSecondsLeft(AUTO_START_SECONDS);

    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) return 0;
        return s - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [status, wave]);

  useEffect(() => {
    if (status !== 'wave_intermission') return;
    if (secondsLeft > 0) return;
    if (autoStartedRef.current) return;
    autoStartedRef.current = true;
    nextWave();
  }, [status, secondsLeft, nextWave]);

  const mmss = useMemo(() => {
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, [secondsLeft]);

  if (status !== 'wave_intermission') return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0)', // Transparent background
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      zIndex: 10,
      pointerEvents: 'none' // Allow clicks to pass through to the game
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.8)',
        padding: '20px',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'all' // Re-enable clicks for the modal content
      }}>
        <h1>{wave === 0 ? t('prepareForBattle') : t('waveComplete', { wave })}</h1>
        <p style={{ marginBottom: '20px' }}>{t('buildTowers')}</p>
        <button 
          onClick={nextWave}
          style={{
            padding: '15px 30px',
            fontSize: '20px',
            cursor: 'pointer',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          {t('startWave', { wave: wave + 1 })} ({mmss})
        </button>
      </div>
    </div>
  );
};
