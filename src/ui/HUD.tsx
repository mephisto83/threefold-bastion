import React from 'react';
import { useGameState } from '../state/gameState';
import { useTranslation } from './hooks/useTranslation';
import { CHARACTERS } from '../game/config/gameConfig';

export const HUD: React.FC = () => {
  const { money, health, wave, toggleSettings, towers, eliminatedCharacterIds } = useGameState();
  const { t } = useTranslation();

  // Calculate available characters
  const usedCharacterIds = new Set(
    towers
      .filter(t => t.assignedCharacter)
      .map(t => t.assignedCharacter)
  );
  const totalCharacters = Object.keys(CHARACTERS).length;
  const eliminatedCount = eliminatedCharacterIds?.length || 0;
  const remainingTotal = Math.max(0, totalCharacters - eliminatedCount);
  const usedCount = usedCharacterIds.size;

  return (
    <>
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '24px',
        pointerEvents: 'none',
        textShadow: '2px 2px 0 #000'
      }}>
        <div>{t('money')}: ${money}</div>
        <div>{t('health')}: {health}</div>
        <div>{t('wave')}: {wave}</div>
        <div>{t('officers')}: {usedCount}/{remainingTotal}</div>
      </div>

      <button
        onClick={toggleSettings}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          background: 'rgba(0, 0, 0, 0.6)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          pointerEvents: 'all',
          color: 'white',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>
    </>
  );
};
