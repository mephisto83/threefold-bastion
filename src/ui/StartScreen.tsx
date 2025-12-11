import React from 'react';
import { useGameState } from '../state/gameState';
import { useTranslation } from './hooks/useTranslation';

export const StartScreen: React.FC = () => {
  const { startGame, showCharacters } = useGameState();
  const { t } = useTranslation();

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
      zIndex: 10,
      gap: '20px'
    }}>
      <img 
        src="/images/title/title_car.jpeg" 
        alt={t('title')}
        style={{ 
          maxWidth: '800px',
          width: '90%',
          marginBottom: '40px',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)',
          borderRadius: '10px'
        }} 
      />
      
      <button 
        onClick={startGame}
        style={{
          padding: '20px 60px',
          fontSize: '24px',
          cursor: 'pointer',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          boxShadow: '0 0 15px rgba(76, 175, 80, 0.5)',
          transition: 'transform 0.2s',
          minWidth: '300px'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {t('startGame')}
      </button>

      <button 
        onClick={showCharacters}
        style={{
          padding: '15px 40px',
          fontSize: '20px',
          cursor: 'pointer',
          background: 'transparent',
          color: 'white',
          border: '2px solid #00ffff',
          borderRadius: '5px',
          minWidth: '300px',
          transition: 'background 0.2s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(0, 255, 255, 0.1)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {t('viewCharacters')}
      </button>
    </div>
  );
};
