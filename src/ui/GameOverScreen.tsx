import React from 'react';
import { useGameState } from '../state/gameState';
import { useTranslation } from './hooks/useTranslation';

export const GameOverScreen: React.FC = () => {
  const { status, startGame } = useGameState();
  const { t } = useTranslation();

  if (status !== 'gameover' && status !== 'victory') return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      zIndex: 10
    }}>
      <h1 style={{ color: status === 'victory' ? '#4CAF50' : '#F44336' }}>
        {status === 'victory' ? t('victory') : t('gameOver')}
      </h1>
      <button 
        onClick={startGame}
        style={{
          padding: '20px 40px',
          fontSize: '24px',
          cursor: 'pointer',
          background: 'white',
          color: 'black',
          border: 'none',
          borderRadius: '5px'
        }}
      >
        {t('restartGame')}
      </button>
    </div>
  );
};
