import { useFrame } from '@react-three/fiber';
import { Vector3, CatmullRomCurve3 } from 'three';
import { useGameState } from '../../state/gameState';
import { ENEMIES } from '../config/gameConfig';
import { useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const EnemySystem = () => {
  const { enemies, updateEnemy, removeEnemy, takeDamage, paths, miners, towers, addProjectile, isSettingsOpen } = useGameState();

  // Create path curves
  const pathCurves = useMemo(() => {
    return paths.map(path => {
      return new CatmullRomCurve3(path);
    });
  }, [paths]);

  useFrame((state, delta) => {
    if (isSettingsOpen) return;

    const now = state.clock.elapsedTime;

    enemies.forEach(enemy => {
      if (enemy.frozen) return;

      const pathCurve = pathCurves[enemy.pathIndex || 0];
      const config = ENEMIES[enemy.type];
      const moveSpeed = config.speed * 0.1; // Scale speed
      const newProgress = enemy.progress + (moveSpeed * delta) / pathCurve.getLength();

      if (newProgress >= 1) {
        removeEnemy(enemy.id);
        takeDamage(1);
      } else {
        const newPosition = pathCurve.getPointAt(newProgress).add(enemy.offset || new Vector3(0,0,0));
        const tangent = pathCurve.getTangentAt(newProgress).normalize();
        const angleY = Math.atan2(tangent.x, tangent.z);
        
        updateEnemy(enemy.id, {
          progress: newProgress,
          position: newPosition,
          rotation: [0, angleY, 0]
        });

        // Combat Logic
        if (config.damage && config.range) {
          const lastFired = enemy.lastFired || 0;
          if (now - lastFired >= config.fireRate) {
            // Find target (Miner or Tower)
            let targetId: string | null = null;
            let minDist = Infinity;

            // Check Miners
            miners.forEach(miner => {
              const dist = enemy.position.distanceTo(miner.position);
              if (dist <= config.range && dist < minDist) {
                minDist = dist;
                targetId = miner.id;
              }
            });

            // Check Towers (if no miner found or closer)
            towers.forEach(tower => {
              const dist = enemy.position.distanceTo(tower.position);
              if (dist <= config.range && dist < minDist) {
                minDist = dist;
                targetId = tower.id;
              }
            });

            if (targetId) {
              // Fire!
              addProjectile({
                id: uuidv4(),
                position: enemy.position.clone().add(new Vector3(0, 1, 0)),
                targetId: targetId,
                damage: config.damage,
                speed: 8,
                startPosition: enemy.position.clone().add(new Vector3(0, 1, 0)),
                faction: 'enemy'
              });
              updateEnemy(enemy.id, { lastFired: now });
            }
          }
        }
      }
    });
  });

  return null;
};
