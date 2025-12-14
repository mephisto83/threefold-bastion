import { useFrame } from '@react-three/fiber';
import { Vector3, Object3D } from 'three';
import { useMemo, useRef } from 'react';
import { useGameState } from '../../state/gameState';
import { TOWERS, MINER_CONFIG, getTowerStats, ENEMIES, CHARACTERS } from '../config/gameConfig';
import { v4 as uuidv4 } from 'uuid';
import { soundManager } from '../utils/SoundManager';

export const TowerSystem = () => {
  const { towers, enemies, addProjectile, updateTower, addMiner, miners, selectTowerId, addEffect, isSettingsOpen, language } = useGameState();
  const dummy = useMemo(() => new Object3D(), []);
  const lastCommanderSoundTime = useRef(0);

  useFrame((state, delta) => {
    if (isSettingsOpen) return;

    const now = state.clock.elapsedTime;

    // 1. Reset Buffs
    towers.forEach(t => {
      if (t.damageMultiplier !== 1 || t.fireRateMultiplier !== 1 || t.rangeMultiplier !== 1) {
        updateTower(t.id, { damageMultiplier: 1, fireRateMultiplier: 1, rangeMultiplier: 1 });
      }
    });

    // 2. Apply Buffs from Command Nodes
    towers.forEach(node => {
      if (node.type === 'command_node') {
        const stats = getTowerStats(node.type, node.level, node.assignedCharacter);
        const range = stats.range;
        
        towers.forEach(target => {
          if (target.id !== node.id && target.type !== 'command_node' && target.type !== 'miner_station') {
            if (node.position.distanceTo(target.position) <= range) {
              // Apply buff (e.g., +20% damage, +20% fire rate)
              // We use updateTower but we need to be careful not to overwrite if multiple nodes buff.
              // For simplicity, let's just set it. If we want stacking, we'd need a different approach.
              // Let's assume non-stacking for now or simple max.
              
              // Actually, since we reset above, we can just apply.
              // But wait, updateTower is async/state update. It won't reflect immediately in the next line of code in the same frame?
              // Zustand updates are usually synchronous but React re-renders are not.
              // However, we are inside useFrame.
              // If we call updateTower, it updates the store.
              // But we are iterating `towers` which is a const from the hook at the start of the frame.
              // So we won't see the updates until next frame.
              // That's fine.
              
              const shouldShowEffect = now - (target.lastBuffedTime || 0) > 2.0;

              if (shouldShowEffect) {
                addEffect({
                  id: uuidv4(),
                  type: 'health_up',
                  position: target.position.clone().add(new Vector3(0, 2, 0)),
                  startTime: now,
                  scale: 2,
                });

                // Play commander sound
                // Limit to ~10 times a minute (every 6 seconds)
                if (now - lastCommanderSoundTime.current > 6.0 && Math.random() < 0.2) {
                    const charId = node.assignedCharacter || TOWERS[node.type].character;
                    if (charId && CHARACTERS[charId] && CHARACTERS[charId].audio?.[language]?.commander_ai) {
                        soundManager.play(CHARACTERS[charId].audio[language].commander_ai, 0.5);
                        lastCommanderSoundTime.current = now;
                    }
                }
              }

              updateTower(target.id, { 
                damageMultiplier: 1.2, 
                fireRateMultiplier: 1.2,
                ...(shouldShowEffect ? { lastBuffedTime: now } : {})
              });
            }
          }
        });
      }
    });

    towers.forEach(tower => {
      // Movement Logic
      if (tower.targetPosition) {
        const stats = getTowerStats(tower.type, tower.level, tower.assignedCharacter);
        const speed = stats.moveSpeed || 15;
        
        // Horizontal movement
        const targetFlat = new Vector3(tower.targetPosition.x, 0, tower.targetPosition.z);
        const currentFlat = new Vector3(tower.position.x, 0, tower.position.z);
        
        const distance = currentFlat.distanceTo(targetFlat);
        const moveDist = speed * delta;

        if (distance <= moveDist) {
          // Snap to final position
          updateTower(tower.id, { position: tower.targetPosition, targetPosition: null, homePosition: tower.targetPosition });
          selectTowerId(null);
        } else {
          const direction = targetFlat.clone().sub(currentFlat).normalize();
          const newPos = currentFlat.add(direction.multiplyScalar(moveDist));
          
          // Flying height logic
          const targetHeight = 4;
          let newY = tower.position.y;
          
          // Ascend if far, descend if close
          if (distance < 3) {
             // Descend
             newY = Math.max(0, newY - delta * 10);
          } else {
             // Ascend
             newY = Math.min(targetHeight, newY + delta * 10);
          }
          
          newPos.y = newY;
          
          updateTower(tower.id, { position: newPos });
        }
        return; // Disable other logic while moving
      }

      const config = TOWERS[tower.type];

      // Corsair Logic
      if (tower.type === 'corsair') {
        const homePos = tower.homePosition || tower.position;
        // Ensure homePosition is set
        if (!tower.homePosition) {
             updateTower(tower.id, { homePosition: tower.position.clone() });
        }

        const stats = getTowerStats(tower.type, tower.level, tower.assignedCharacter);
        const moveSpeed = (stats.moveSpeed || 5) * 1.5; 
        const patrolRange = stats.range * 1.2; 
        
        // Find target relative to HOME position
        let combatTarget = null;
        let minDist = Infinity;
        
        for (const enemy of enemies) {
            const dist = homePos.distanceTo(enemy.position);
            if (dist <= patrolRange && dist < minDist) {
                minDist = dist;
                combatTarget = enemy;
            }
        }

        let newPos = tower.position.clone();
        let newCombatState: 'idle' | 'engaging' | 'returning' = tower.combatState || 'idle';

        if (combatTarget) {
            newCombatState = 'engaging';
            const targetPos = combatTarget.position.clone();
            const distToTarget = newPos.distanceTo(targetPos);
            
            // Smart Positioning: Stay out of enemy range if possible
            const enemyConfig = ENEMIES[combatTarget.type];
            const enemyRange = enemyConfig.range;
            // Target distance: Enemy Range + 2 (Safety buffer), but capped at My Range - 2 (To ensure I can hit)
            // Minimum 4 to avoid clipping
            const desiredDist = Math.min(stats.range - 2, Math.max(4, enemyRange + 2));

            if (distToTarget > desiredDist + 1) {
                // Move towards
                const dir = targetPos.clone().sub(newPos).normalize();
                newPos.add(dir.multiplyScalar(moveSpeed * delta));
            } else if (distToTarget < desiredDist - 1) {
                // Too close! Back off
                const dir = newPos.clone().sub(targetPos).normalize();
                newPos.add(dir.multiplyScalar(moveSpeed * delta));
            } else {
                // Orbit
                const dirToTarget = targetPos.clone().sub(newPos).normalize();
                const orbitDir = new Vector3(-dirToTarget.z, 0, dirToTarget.x).normalize();
                newPos.add(orbitDir.multiplyScalar(moveSpeed * delta));
                
                // Maintain distance
                const currentDist = newPos.distanceTo(targetPos);
                const correction = (currentDist - desiredDist) * 2.0 * delta;
                newPos.add(dirToTarget.multiplyScalar(correction));
            }
            
            // Height
            newPos.y = 4 + Math.sin(now * 3) * 0.5;
            
        } else {
            // Return home
            const distToHome = newPos.distanceTo(homePos);
            if (distToHome < 0.2) {
                newPos.copy(homePos);
                newCombatState = 'idle';
            } else {
                newCombatState = 'returning';
                const dir = homePos.clone().sub(newPos).normalize();
                newPos.add(dir.multiplyScalar(moveSpeed * delta));
                
                // Smooth landing/height return
                // Assuming homePos.y is ground level (0)
                if (distToHome < 2) {
                    // Lerp height down
                    newPos.y = Math.max(homePos.y, newPos.y - delta * 2);
                } else {
                    // Stay flying
                    newPos.y = 4;
                }
            }
        }
        
        if (newCombatState !== 'idle' || tower.combatState !== 'idle') {
             // Calculate rotation
             if (newPos.distanceTo(tower.position) > 0.01) {
                 dummy.position.copy(tower.position);
                 dummy.lookAt(newPos);
             } else if (newCombatState === 'idle') {
                 dummy.rotation.set(0, 0, 0);
             }

             updateTower(tower.id, { 
                position: newPos, 
                combatState: newCombatState,
                rotation: [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z]
            });
        }
      }

      // Miner Station Logic
      if (tower.type === 'miner_station') {
        const stationMiners = miners.filter(m => m.stationId === tower.id);
        // Support up to 5 miners per station (5 stations = 25 miners)
        if (stationMiners.length < 5 && now - tower.lastFired > 2) {
           const stats = getTowerStats(tower.type, tower.level, tower.assignedCharacter);
           // Spawn miner
           addMiner({
             id: uuidv4(),
             stationId: tower.id,
             position: tower.position.clone().add(new Vector3(2, 0, 0)),
             targetId: null,
             state: 'idle',
             carrying: 0,
             maxCapacity: stats.minerCapacity || MINER_CONFIG.maxCapacity,
             speed: stats.minerSpeed || MINER_CONFIG.speed,
             miningRate: stats.minerMiningRate || MINER_CONFIG.miningRate,
             health: stats.minerHealth || MINER_CONFIG.health,
             maxHealth: stats.minerHealth || MINER_CONFIG.health,
             model: stats.minerModel || MINER_CONFIG.model
           });
           updateTower(tower.id, { lastFired: now });
        }
        return;
      }

      // Engineering Station Logic - No combat
      if (tower.type === 'engineering_station') {
        return;
      }
      
      // Combat Tower Logic
      // Check Energy
      if (tower.energy < config.energyConsumption) return;

      // Calculate stats based on level and buffs
      const level = tower.level || 1;
      const baseStats = getTowerStats(tower.type, level, tower.assignedCharacter);
      
      const damage = baseStats.damage * (tower.damageMultiplier || 1);
      const fireRate = baseStats.fireRate / (tower.fireRateMultiplier || 1); // Higher multiplier = lower delay = faster fire
      const range = baseStats.range * (tower.rangeMultiplier || 1);

      // Find target
      let targetId: string | null = null;
      let minDist = Infinity;

      // Simple closest target logic
      for (const enemy of enemies) {
        const dist = tower.position.distanceTo(enemy.position);
        if (dist <= range && dist < minDist) {
          minDist = dist;
          targetId = enemy.id;
        }
      }

      const shouldFire = targetId && (now - tower.lastFired >= fireRate);
      const targetChanged = targetId !== tower.targetId;

      if (shouldFire || targetChanged) {
        if (shouldFire && targetId) {
           // Play sound
           if (config.shootSound) {
             soundManager.play(config.shootSound, 0.2);
           }

           // Play character phrase (rarely)
           if (Math.random() < 0.05) {
               const charId = tower.assignedCharacter || config.character;
               if (charId && CHARACTERS[charId] && CHARACTERS[charId].audio?.[language]?.attack_firing) {
                   soundManager.play(CHARACTERS[charId].audio[language].attack_firing, 0.4);
               }
           }

           addProjectile({
            id: uuidv4(),
            position: tower.position.clone().add(new Vector3(0, 2, 0)), // Fire from top
            targetId: targetId,
            damage: damage,
            damageType: config.damageType,
            speed: 10, // Projectile speed
            startPosition: tower.position.clone().add(new Vector3(0, 2, 0)),
            faction: 'player',
            sourceTowerId: tower.id,
            sourceCharacterId: tower.assignedCharacter || config.character
          });
          
          // Consume Energy
          updateTower(tower.id, { 
            lastFired: now, 
            targetId: targetId,
            energy: tower.energy - config.energyConsumption
          });
        } else {
          // Just update target
          updateTower(tower.id, { targetId: targetId });
        }
      }
    });
  });

  return null;
};
