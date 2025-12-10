import React, { useState } from 'react';
import { useGameState } from '../state/gameState';
import { CHARACTERS } from '../game/config/gameConfig';
import { useTranslation } from './hooks/useTranslation';
import { soundManager } from '../game/utils/SoundManager';

export const CharacterScreen: React.FC = () => {
  const { showStartScreen, language } = useGameState();
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleCharClick = (key: string) => {
    setSelectedChar(key);
  };

  const handleBack = () => {
    showStartScreen();
  };

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
      color: 'white',
      zIndex: 20,
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>{t('characters')}</h1>
        <button 
          onClick={handleBack}
          style={{
            padding: '10px 20px',
            fontSize: '18px',
            cursor: 'pointer',
            background: '#555',
            color: 'white',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          {t('back')}
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '20px', overflow: 'hidden' }}>
        {/* Character List */}
        <div style={{ 
          width: '300px', 
          overflowY: 'auto', 
          borderRight: '1px solid #333', 
          paddingRight: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {Object.entries(CHARACTERS).map(([key, char]) => (
            <button
              key={key}
              onClick={() => handleCharClick(key)}
              style={{
                padding: '15px',
                textAlign: 'left',
                background: selectedChar === key ? '#4CAF50' : '#222',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              {char.name}
            </button>
          ))}
        </div>

        {/* Character Details */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {selectedChar ? (
            <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
              {/* Video Section */}
              <div style={{
                width: '400px',
                height: '400px',
                background: 'black',
                border: '2px solid #444',
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: '0 0 30px rgba(0,0,0,0.5)',
                flexShrink: 0
              }}>
                {(CHARACTERS[selectedChar].videos.intro?.[0] || CHARACTERS[selectedChar].videos.selected?.[0]) ? (
                  <video
                    key={selectedChar} // Force re-render on char change
                    src={CHARACTERS[selectedChar].videos.intro?.[0] || CHARACTERS[selectedChar].videos.selected?.[0]}
                    loop
                    autoPlay
                    muted
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                    No Video
                  </div>
                )}
              </div>

              {/* Stats Section */}
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '36px', marginTop: 0, color: '#4CAF50' }}>{CHARACTERS[selectedChar].name}</h2>
                
                {CHARACTERS[selectedChar].stats && (
                  <div style={{ display: 'grid', gap: '15px', marginTop: '30px' }}>
                    <div style={{ background: '#333', padding: '15px', borderRadius: '5px' }}>
                      <div style={{ color: '#aaa', fontSize: '14px' }}>{t('rangeBonus')}</div>
                      <div style={{ fontSize: '24px', color: '#4CAF50' }}>+{CHARACTERS[selectedChar].stats.rangeBonus.toFixed(1)}</div>
                    </div>
                    <div style={{ background: '#333', padding: '15px', borderRadius: '5px' }}>
                      <div style={{ color: '#aaa', fontSize: '14px' }}>{t('damageBonus')}</div>
                      <div style={{ fontSize: '24px', color: '#4CAF50' }}>+{CHARACTERS[selectedChar].stats.damageBonus.toFixed(1)}</div>
                    </div>
                    <div style={{ background: '#333', padding: '15px', borderRadius: '5px' }}>
                      <div style={{ color: '#aaa', fontSize: '14px' }}>{t('fireRateBonus')}</div>
                      <div style={{ fontSize: '24px', color: '#4CAF50' }}>+{CHARACTERS[selectedChar].stats.fireRateBonus.toFixed(1)}</div>
                    </div>
                    <div style={{ background: '#333', padding: '15px', borderRadius: '5px' }}>
                      <div style={{ color: '#aaa', fontSize: '14px' }}>{t('healthBonus')}</div>
                      <div style={{ fontSize: '24px', color: '#4CAF50' }}>+{CHARACTERS[selectedChar].stats.healthBonus.toFixed(1)}</div>
                    </div>
                  </div>
                )}

                {/* Audio Section */}
                {CHARACTERS[selectedChar].audio && CHARACTERS[selectedChar].audio[language] && (
                  <div style={{ marginTop: '30px' }}>
                    <h3 style={{ color: '#aaa', marginBottom: '15px' }}>{t('catchPhrases')}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                      {Object.entries(CHARACTERS[selectedChar].audio[language]).map(([key, url]) => (
                        <button
                          key={key}
                          onClick={() => soundManager.play(url)}
                          style={{
                            padding: '10px',
                            background: '#333',
                            border: '1px solid #555',
                            borderRadius: '5px',
                            color: 'white',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#444'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#333'}
                        >
                          <span style={{ color: '#4CAF50' }}>▶</span>
                          <span style={{ textTransform: 'capitalize', fontSize: '14px' }}>
                            {key.replace(/_/g, ' ')}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#555',
              fontSize: '24px'
            }}>
              {t('selectCharacter')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
