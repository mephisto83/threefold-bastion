import React from 'react';
import { useGameState } from '../state/gameState';
import { useTranslation } from './hooks/useTranslation';

export const InstructionsScreen: React.FC = () => {
  const { showStartScreen } = useGameState();
  const { t, language } = useTranslation();

  const instructionVideoByLanguage: Record<string, string> = {
    en: '/video/instructions/en/kling_20251214_Build_Avatar_With_a_ser_923_0.mp4',
    fr: '/video/instructions/fr/kling_20251214_Build_Avatar_With_a_ser_1510_0.mp4',
  };

  const preferredLanguage = (language || 'en').toLowerCase();
  const instructionVideoSrc =
    instructionVideoByLanguage[preferredLanguage] ?? instructionVideoByLanguage.en;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.9)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      zIndex: 10,
      overflowY: 'auto'
    }}>
      <div style={{
        background: '#1a1a1a',
        padding: '40px',
        borderRadius: '10px',
        border: '2px solid #00ffff',
        maxWidth: '800px',
        width: '90%',
        boxShadow: '0 0 30px rgba(0, 255, 255, 0.2)',
        margin: '40px 0'
      }}>
        <h2 style={{ color: '#00ffff', marginTop: 0, marginBottom: '30px', textAlign: 'center', fontSize: '32px' }}>{t('instructionsTitle')}</h2>

        <div style={{
          marginBottom: '30px',
          padding: '16px',
          borderRadius: '10px',
          border: '1px solid rgba(0, 255, 255, 0.25)',
          background: 'rgba(0,0,0,0.35)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <h3 style={{ color: '#00ffff', margin: 0, fontSize: '22px' }}>{t('instructionsMechanics')}</h3>
            <div style={{ color: '#aaa', fontSize: '14px' }}>{(preferredLanguage || 'en').toUpperCase()} Video</div>
          </div>

          <div style={{
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid rgba(0, 255, 255, 0.18)',
            background: 'rgba(0,0,0,0.25)'
          }}>
            <video
              src={instructionVideoSrc}
              controls
              playsInline
              preload="metadata"
              style={{ display: 'block', width: '100%', height: 'auto', background: 'black' }}
            />
          </div>
        </div>
        
        <p style={{ fontSize: '20px', marginBottom: '30px', lineHeight: '1.5' }}>{t('instructionsObjective')}</p>
        <p style={{ marginBottom: '30px', color: '#aaa', fontSize: '18px' }}>{t('instructionsControls')}</p>
        
        <h3 style={{ color: '#00ffff', marginBottom: '20px', fontSize: '24px' }}>{t('instructionsMechanics')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '18px' }}>
          <p style={{ margin: 0 }}>{t('instructionsShields')}</p>
          <p style={{ margin: 0 }}>{t('instructionsHealth')}</p>
          <p style={{ margin: 0 }}>{t('instructionsEnergy')}</p>
          <p style={{ margin: 0 }}>{t('instructionsKinetic')}</p>
          <p style={{ margin: 0 }}>{t('instructionsEconomy')}</p>
          <p style={{ margin: 0 }}>{t('instructionsUpgrades')}</p>
        </div>

        <button 
          onClick={showStartScreen}
          style={{
            marginTop: '40px',
            width: '100%',
            padding: '20px',
            background: '#00ffff',
            color: 'black',
            border: 'none',
            borderRadius: '5px',
            fontSize: '20px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#ccffff';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#00ffff';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
};
