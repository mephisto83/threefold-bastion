import { useFrame } from '@react-three/fiber';
import { useGameState } from '../../state/gameState';

export const useGameLoop = () => {
  const { status, health, endGame } = useGameState();

  useFrame((_state, _delta) => {
    if (status !== 'playing') return;

    // Global game loop logic here if needed
    // Most logic is distributed in systems
    
    if (health <= 0) {
      endGame(false);
    }
  });
};
