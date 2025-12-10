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
    addMoney,
    addEffect,
    isSettingsOpen,
    language
  } = useGameState();

  useFrame((state, delta) => {
    if (isSettingsOpen) return;

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

        const newHealth = (target.health || 0) - projectile.damage;
        
        if (newHealth <= 0) {
          // Play random explosion sound
          const randomSound = EXPLOSION_SOUNDS[Math.floor(Math.random() * EXPLOSION_SOUNDS.length)];
          soundManager.play(randomSound, 0.3);
          
          // Big death explosion
          addEffect({
            id: uuidv4(),
            type: 'explosion_3',
            position: target.position.clone(),
            startTime: now,
            scale: 3
          });

          if (targetType === 'enemy') {
            removeEnemy(target.id);
            // @ts-ignore
            const reward = ENEMIES[target.type].reward;
            addMoney(reward);
          } else if (targetType === 'miner') {
            removeMiner(target.id);
          } else if (targetType === 'tower') {
            // removeTower(target.id); // Need to implement removeTower in gameState
            // For now, let's just disable it or remove it from the array manually if removeTower isn't exposed
            // Actually, let's check gameState.ts again, I think I saw removeTower? No, I didn't.
            // I'll need to add removeTower to gameState.
             useGameState.setState(state => ({
              towers: state.towers.filter(t => t.id !== target.id)
            }));
          }
        } else {
          if (targetType === 'enemy') {
            updateEnemy(target.id, { health: newHealth });
          } else if (targetType === 'miner') {
            updateMiner(target.id, { health: newHealth });
          } else if (targetType === 'tower') {
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
