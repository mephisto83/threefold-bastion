import React from 'react';
import { useGameState } from '../state/gameState';
import { useTranslation } from './hooks/useTranslation';

export const SettingsScreen: React.FC = () => {
  const { isSettingsOpen, toggleSettings, language, setLanguage, exitGame } = useGameState();
  const { t } = useTranslation();

  if (!isSettingsOpen) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: '#222',
        padding: '40px',
        borderRadius: '10px',
        minWidth: '300px',
        textAlign: 'center',
        border: '2px solid #444'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '30px', fontSize: '24px' }}>{t('settings')}</h2>
        
        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '10px', color: '#aaa' }}>{t('language')}</label>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button
              onClick={() => setLanguage('en')}
              style={{
                padding: '10px 20px',
                background: language === 'en' ? '#4CAF50' : '#444',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: language === 'en' ? 'bold' : 'normal'
              }}
            >
              {t('english')}
            </button>
            <button
              onClick={() => setLanguage('fr')}
              style={{
                padding: '10px 20px',
                background: language === 'fr' ? '#4CAF50' : '#444',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: language === 'fr' ? 'bold' : 'normal'
              }}
            >
              {t('french')}
            </button>
          </div>
        </div>

        <button
          onClick={toggleSettings}
          style={{
            padding: '12px 30px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            marginTop: '20px'
          }}
        >
          {t('resumeGame')}
        </button>
          &nbsp;&nbsp;
        <button
          onClick={exitGame}
          style={{
            padding: '12px 30px',
            background: '#F44336',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            marginTop: '12px'
          }}
        >
          {t('exitGame')}
        </button>
      </div>
    </div>
  );
};
