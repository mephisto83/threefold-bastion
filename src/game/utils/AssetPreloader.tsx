import { useGLTF } from '@react-three/drei';
import { TOWERS, ENEMIES, EXPLOSION_SOUNDS, ROCK_CONFIG, MINER_CONFIG } from '../config/gameConfig';
import { soundManager } from './SoundManager';
import { useEffect } from 'react';

export const AssetPreloader = () => {
  useEffect(() => {
    // Preload Tower Models
    Object.values(TOWERS).forEach((tower) => {
      useGLTF.preload(tower.model);
      if (tower.shootSound) {
        soundManager.preload(tower.shootSound);
      }
    });

    // Preload Enemy Models
    Object.values(ENEMIES).forEach((enemy) => {
      useGLTF.preload(enemy.model);
    });

    // Preload Rock and Miner Models
    useGLTF.preload(ROCK_CONFIG.model);
    useGLTF.preload(MINER_CONFIG.model);

    // Preload Explosion Sounds
    EXPLOSION_SOUNDS.forEach((sound) => {
      soundManager.preload(sound);
    });
    
    console.log("Assets preloading initiated");
  }, []);

  return null;
};
