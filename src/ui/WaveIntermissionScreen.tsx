import React from 'react';
import { useGameState } from '../state/gameState';
import { useTranslation } from './hooks/useTranslation';

export const WaveIntermissionScreen: React.FC = () => {
  const { nextWave, wave } = useGameState();
  const { t } = useTranslation();

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
          {t('startWave', { wave: wave + 1 })}
        </button>
      </div>
    </div>
  );
};
