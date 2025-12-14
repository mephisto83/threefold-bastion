import React, { useState } from 'react';
import { useGameState, Language } from '../state/gameState';
import { useTranslation } from './hooks/useTranslation';

const INTRO_VIDEOS = {
  en: '/video/intros/en/kling_20251214_Build_Avatar___showcasi_564_0.mp4',
  fr: '/video/intros/fr/kling_20251214_Build_Avatar_With_a_ser_705_0.mp4'
};

export const StartScreen: React.FC = () => {
  const { startGame, showCharacters, showInstructions, showFamilyTree, language, setLanguage, isLoading } = useGameState();
  const { t } = useTranslation();
  const [showIntro, setShowIntro] = useState(true);

  // Replay intro when language changes
  React.useEffect(() => {
    setShowIntro(true);
  }, [language]);

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
      <div style={{ 
        position: 'relative',
        maxWidth: '800px',
        width: '90%',
        marginBottom: '20px',
        boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)',
        borderRadius: '10px',
        overflow: 'hidden',
        aspectRatio: '16/9' // Assuming 16:9 video/image
      }}>
        {showIntro && !isLoading ? (
          <video 
            src={INTRO_VIDEOS[language]} 
            autoPlay 
            muted={false}
            controls={false}
            onEnded={() => setShowIntro(false)}
            onClick={(e) => {
              if (e.currentTarget.paused) {
                e.currentTarget.play();
              } else {
                e.currentTarget.pause();
              }
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
          />
        ) : (
          <>
            <img 
              src="/images/title/title_car.jpeg" 
              alt={t('title')}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            {!isLoading && (
              <button
                onClick={() => setShowIntro(true)}
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  right: '20px',
                  padding: '10px 20px',
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: '#00ffff',
                  border: '1px solid #00ffff',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                ↺ Replay Intro
              </button>
            )}
          </>
        )}
      </div>

      {/* Language Selection */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        {(['en', 'fr'] as Language[]).map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            style={{
              padding: '10px 20px',
              fontSize: '18px',
              cursor: 'pointer',
              background: language === lang ? '#00ffff' : 'transparent',
              color: language === lang ? 'black' : 'white',
              border: '2px solid #00ffff',
              borderRadius: '5px',
              transition: 'all 0.2s',
              fontWeight: 'bold'
            }}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>
      
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
        onClick={showInstructions}
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
        {t('howToPlay')}
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

      <button 
        onClick={showFamilyTree}
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
        Family Tree
      </button>
    </div>
  );
};
