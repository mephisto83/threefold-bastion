import { useFrame } from '@react-three/fiber';
import { useGameState } from '../../state/gameState';
import { TOWERS } from '../config/gameConfig';

export const GameLogicSystem = () => {
  const { towers, money, status, endGame, isSettingsOpen } = useGameState();

  useFrame(() => {
    if (status !== 'playing' || isSettingsOpen) return;

    // Check for Game Over condition: No towers and not enough money to buy the cheapest one
    if (towers.length === 0) {
      const minCost = Math.min(...Object.values(TOWERS).map(t => t.cost));
      
      if (money < minCost) {
        endGame(false);
      }
    }
  });

  return null;
};
