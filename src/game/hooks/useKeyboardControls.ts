import { useEffect } from 'react';
import { useGameState } from '../../state/gameState';
import { getTowerStats, UPGRADE_SOUNDS } from '../config/gameConfig';
import { soundManager } from '../utils/SoundManager';

export const useKeyboardControls = () => {
  const { 
    selectedTowerId, 
    towers, 
    updateTower, 
    spendMoney, 
    isMovingMode, 
    setMovingMode, 
    pendingMovePosition, 
    setPendingMovePosition,
    selectTowerId,
    selectTower,
    selectedTower,
    miners,
    updateMiner
  } = useGameState();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input (though we don't have inputs yet, good practice)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'm':
          if (selectedTowerId) {
            // Toggle Move Mode
            if (isMovingMode) {
              setMovingMode(false);
              setPendingMovePosition(null);
            } else {
              setMovingMode(true);
            }
          }
          break;

        case 'u':
          if (selectedTowerId) {
            const tower = towers.find(t => t.id === selectedTowerId);
            if (tower) {
              const level = tower.level || 1;
              const nextStats = getTowerStats(tower.type, level + 1, tower.assignedCharacter);
              const upgradeCost = Math.floor(nextStats.cost || 0);

              if (spendMoney(upgradeCost)) {
                const newLevel = level + 1;
                updateTower(tower.id, { level: newLevel });

                // If miner station, update existing miners
                if (tower.type === 'miner_station') {
                  const newStats = getTowerStats(tower.type, newLevel, tower.assignedCharacter);
                  const stationMiners = miners.filter(m => m.stationId === tower.id);
                  stationMiners.forEach(miner => {
                      updateMiner(miner.id, {
                          speed: newStats.minerSpeed,
                          maxCapacity: newStats.minerCapacity,
                          miningRate: newStats.minerMiningRate,
                          maxHealth: newStats.minerHealth,
                          health: Math.min(miner.health, newStats.minerHealth || miner.health),
                          model: newStats.minerModel
                      });
                  });
                }

                // Play random upgrade sound
                const sound = UPGRADE_SOUNDS[Math.floor(Math.random() * UPGRADE_SOUNDS.length)];
                soundManager.play(sound, 0.4);
              }
            }
          }
          break;

        case 'escape':
          if (pendingMovePosition) {
            // Cancel pending move, but stay in move mode? 
            // User said "cancel out and stop selecting the tower" for escape generally.
            // But usually escape goes back one step.
            // Step 1: Clear pending move
            setPendingMovePosition(null);
          } else if (isMovingMode) {
            // Step 2: Exit move mode
            setMovingMode(false);
          } else if (selectedTowerId || selectedTower) {
            // Step 3: Deselect
            selectTowerId(null);
            selectTower(null);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedTowerId, 
    towers, 
    updateTower, 
    spendMoney, 
    isMovingMode, 
    setMovingMode, 
    pendingMovePosition, 
    setPendingMovePosition, 
    selectTowerId, 
    selectTower, 
    selectedTower,
    miners,
    updateMiner
  ]);
};
