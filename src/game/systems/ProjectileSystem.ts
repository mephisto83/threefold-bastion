import { useFrame } from '@react-three/fiber';
import { useGameState } from '../../state/gameState';
import { ENEMIES, EXPLOSION_SOUNDS, TOWERS, CHARACTERS } from '../config/gameConfig';
import { soundManager } from '../utils/SoundManager';
import { v4 as uuidv4 } from 'uuid';

export const ProjectileSystem = () => {
  const { 
    projectiles, 
    enemies, 
    miners,
    towers,
    updateProjectile, 
    removeProjectile, 
    updateEnemy, 
    removeEnemy, 
    updateMiner,
    removeMiner,
    updateTower,
    destroyTower,
    addMoney,
    addEffect,
    recordEnemyKill,
    isSettingsOpen,
    language,
    status
  } = useGameState();

  useFrame((state, delta) => {
    if (isSettingsOpen || status === 'gameover' || status === 'victory') return;

    const now = state.clock.elapsedTime;
    projectiles.forEach(projectile => {
      let target: any = null;
      let targetType: 'enemy' | 'miner' | 'tower' | null = null;

      if (projectile.faction === 'enemy') {
        // Enemy projectiles hit Miners or Towers
        target = miners.find(m => m.id === projectile.targetId);
        if (target) {
          targetType = 'miner';
        } else {
          target = towers.find(t => t.id === projectile.targetId);
          if (target) targetType = 'tower';
        }
      } else {
        // Player projectiles hit Enemies
        target = enemies.find(e => e.id === projectile.targetId);
        if (target) targetType = 'enemy';
      }

      if (!target) {
        removeProjectile(projectile.id);
        return;
      }

      const direction = target.position.clone().sub(projectile.position).normalize();
      const distance = projectile.position.distanceTo(target.position);
      const moveDist = projectile.speed * delta;

      if (distance <= moveDist) {
        // Hit!
        removeProjectile(projectile.id);
        
        // Small hit explosion
        addEffect({
            id: uuidv4(),
            type: 'explosion_1',
            position: projectile.position.clone(),
            startTime: now,
            scale: 1
        });

        // Damage Calculation with Shields
        let finalDamage = projectile.damage;
        let shieldDamage = 0;
        let healthDamage = 0;

        if (targetType === 'enemy') {
            // Enemy Damage Logic (Shields + Health)
            const damageType = projectile.damageType || 'kinetic';
            
            if (target.shield > 0) {
                // Energy weapons deal 200% damage to shields, Kinetic deals 50%
                let shieldMultiplier = 1.0;
                if (damageType === 'energy') shieldMultiplier = 2.0;
                if (damageType === 'kinetic') shieldMultiplier = 0.5;

                const effectiveShieldDamage = finalDamage * shieldMultiplier;
                
                if (target.shield >= effectiveShieldDamage) {
                    shieldDamage = effectiveShieldDamage;
                    healthDamage = 0;
                } else {
                    shieldDamage = target.shield;
                    // Remaining damage spills over to health
                    const remainingRawDamage = (effectiveShieldDamage - target.shield) / shieldMultiplier;
                    
                    let healthMultiplier = 1.0;
                    if (damageType === 'kinetic') healthMultiplier = 1.5;
                    if (damageType === 'energy') healthMultiplier = 0.5;

                    healthDamage = remainingRawDamage * healthMultiplier;
                }
            } else {
                // No shield, direct health damage
                let healthMultiplier = 1.0;
                if (damageType === 'kinetic') healthMultiplier = 1.5;
                if (damageType === 'energy') healthMultiplier = 0.5;
                
                healthDamage = finalDamage * healthMultiplier;
            }

            const newShield = Math.max(0, target.shield - shieldDamage);
            const newHealth = Math.max(0, target.health - healthDamage);
            
            updateEnemy(target.id, { 
                shield: newShield,
                health: newHealth
            });

            if (newHealth <= 0) {
                // Death logic
                const randomSound = EXPLOSION_SOUNDS[Math.floor(Math.random() * EXPLOSION_SOUNDS.length)];
                soundManager.play(randomSound, 0.3);
                
                addEffect({
                    id: uuidv4(),
                    type: 'explosion_3',
                    position: target.position.clone(),
                    startTime: now,
                    scale: 3
                });

                removeEnemy(target.id);
                recordEnemyKill(projectile.sourceCharacterId || null);
                // @ts-ignore
                const reward = ENEMIES[target.type].reward;
                addMoney(reward);
            }

        } else {
            // Standard logic for non-enemies (Miners/Towers don't have shields yet)
            const newHealth = (target.health || 0) - projectile.damage;
            
            if (targetType === 'miner') updateMiner(target.id, { health: newHealth });
            if (targetType === 'tower') {
                updateTower(target.id, { health: newHealth });
                
                // Play under attack sound (rarely)
                if (Math.random() < 0.1) {
                    const tower = towers.find(t => t.id === target.id);
                    if (tower) {
                        const charId = tower.assignedCharacter || TOWERS[tower.type].character;
                        if (charId && CHARACTERS[charId] && CHARACTERS[charId].audio?.[language]?.under_attack_pressure) {
                            soundManager.play(CHARACTERS[charId].audio[language].under_attack_pressure, 0.5);
                        }
                    }
                }
            }

            if (newHealth <= 0) {
                // Death logic
                const randomSound = EXPLOSION_SOUNDS[Math.floor(Math.random() * EXPLOSION_SOUNDS.length)];
                soundManager.play(randomSound, 0.3);
                
                addEffect({
                    id: uuidv4(),
                    type: 'explosion_3',
                    position: target.position.clone(),
                    startTime: now,
                    scale: 3
                });

                if (targetType === 'miner') removeMiner(target.id);
                if (targetType === 'tower') {
                  destroyTower(target.id);
                }
            }
        }
      } else {
        // Move
        const newPos = projectile.position.clone().add(direction.multiplyScalar(moveDist));
        updateProjectile(projectile.id, newPos);
      }
    });
  });

  return null;
};
