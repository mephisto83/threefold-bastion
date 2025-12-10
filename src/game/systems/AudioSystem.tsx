import React, { useEffect } from 'react';
import { useGameState } from '../../state/gameState';
import { soundManager } from '../utils/SoundManager';
import { CHARACTERS } from '../config/gameConfig';

export const AudioSystem: React.FC = () => {
  const setCurrentSpeaker = useGameState(state => state.setCurrentSpeaker);

  useEffect(() => {
    soundManager.onPlayCallback = (url: string) => {
      // Check if url contains a character ID
      // URL format: .../catch_phrases/<char_id>/...
      const match = url.match(/catch_phrases\/([^/]+)\//);
      if (match && match[1]) {
        const charId = match[1];
        if (CHARACTERS[charId]) {
          setCurrentSpeaker(charId);
        }
      }
    };

    soundManager.onEndCallback = (url: string) => {
      const match = url.match(/catch_phrases\/([^/]+)\//);
      if (match && match[1]) {
         const current = useGameState.getState().currentSpeaker;
         if (current === match[1]) {
             setCurrentSpeaker(null);
         }
      }
    };

    return () => {
      soundManager.onPlayCallback = undefined;
      soundManager.onEndCallback = undefined;
    };
  }, [setCurrentSpeaker]);

  return null;
};
