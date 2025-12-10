import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameState } from '../../state/gameState';
import { getWaveConfig, ENEMIES } from '../config/gameConfig';
import { Vector3 } from 'three';
import { v4 as uuidv4 } from 'uuid';

export const WaveSystem = () => {
  const { wave, status, spawnEnemy, waveCompleted, enemies, paths, isSettingsOpen } = useGameState();
  
  const stateRef = useRef({
    enemiesSpawned: 0,
    lastSpawnTime: 0,
    waveComplete: false
  });

  useEffect(() => {
    if (status === 'playing' && wave === 1) {
      stateRef.current = {
        enemiesSpawned: 0,
        lastSpawnTime: 0,
        waveComplete: false
      };
    }
  }, [status, wave]);

  useFrame((state) => {
    if (status !== 'playing' || isSettingsOpen) return;

    const now = state.clock.elapsedTime;
    const s = stateRef.current;

    const currentWaveConfig = getWaveConfig(wave);

    // Logic: Spawn enemies for current wave config.
    if (s.enemiesSpawned < currentWaveConfig.count) {
      if (now - s.lastSpawnTime > currentWaveConfig.interval) {
        // Spawn
        const enemyConfig = ENEMIES[currentWaveConfig.type];
        // Random offset
        const offset = new Vector3(
          (Math.random() - 0.5) * 1.875, 
          (Math.random() - 0.5) * 1.0,
          (Math.random() - 0.5) * 1.875
        );
        
        const pathIndex = Math.floor(Math.random() * paths.length);
        const startPoint = paths[pathIndex][0].clone();

        // Difficulty Scaling
        // Health increases by 40% per wave (Power increases more quickly)
        let healthMultiplierFactor = 0.8;
        if(currentWaveConfig.count === 20) {
            healthMultiplierFactor = 1.2;
        }
        const healthMultiplier = 1 + (wave - 1) * healthMultiplierFactor;
        // Scale increases by 10% per wave, capped at 10.0x (Size increases with power)
        const scaleMultiplier = Math.min(40.0, 1 + (wave - 1) * 0.1);

        const maxHealth = Math.floor(enemyConfig.health * healthMultiplier);

        spawnEnemy({
          id: uuidv4(),
          type: currentWaveConfig.type,
          position: startPoint.add(offset),
          offset: offset,
          pathIndex: pathIndex,
          progress: 0,
          health: maxHealth,
          maxHealth: maxHealth,
          speed: enemyConfig.speed,
          scale: scaleMultiplier
        });

        s.enemiesSpawned++;
        s.lastSpawnTime = now;
      }
    } else {
      // Wave spawned completely. Wait for enemies to die?
      if (enemies.length === 0) {
        // Next wave
        s.enemiesSpawned = 0;
        waveCompleted(); // Update UI
      }
    }
  });

  return null;
};
