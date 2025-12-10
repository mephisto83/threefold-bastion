import { useFrame } from '@react-three/fiber';
import { useGameState } from '../../state/gameState';
import { ENGINEER_CONFIG, getTowerStats } from '../config/gameConfig';
import { Vector3 } from 'three';
import { v4 as uuidv4 } from 'uuid';
import { soundManager } from '../utils/SoundManager';

export const EngineeringSystem = () => {
  const { 
    towers, 
    engineers, 
    addEngineer, 
    updateEngineer, 
    updateTower, 
    spendMoney, 
    addEffect,
    money,
    status,
    isSettingsOpen,
    towerBlueprints
  } = useGameState();

  useFrame((_state, delta) => {
    // Allow engineering during playing and wave intermission (building phase)
    if ((status !== 'playing' && status !== 'wave_intermission') || isSettingsOpen) return;

    // 1. Spawn Engineers for Stations
    towers.forEach(tower => {
      if (tower.type === 'engineering_station') {
        const existingEngineer = engineers.find(e => e.stationId === tower.id);
        if (!existingEngineer) {
          addEngineer({
            id: uuidv4(),
            stationId: tower.id,
            position: tower.position.clone(),
            targetId: null,
            state: 'idle',
            speed: ENGINEER_CONFIG.speed,
            health: ENGINEER_CONFIG.health,
            maxHealth: ENGINEER_CONFIG.health,
            model: ENGINEER_CONFIG.model,
            workProgress: 0
          });
        }
      }
    });

    // 2. Update Engineers
    engineers.forEach(engineer => {
      const station = towers.find(t => t.id === engineer.stationId);
      
      // If station is destroyed, remove engineer or let it die? 
      // For now, let's keep it simple: if station gone, engineer stays idle or disappears.
      if (!station) return; 

      const speed = engineer.speed * delta;

      switch (engineer.state) {
        case 'idle':
          if (station.autoUpgradeEnabled) {
            const stationStats = getTowerStats(station.type, station.level, station.assignedCharacter);

            // Find target
            // Filter towers: not self, not max level, affordable
            const potentialTargets = towers.filter(t => {
              if (t.id === station.id) return false; // Don't upgrade self (or maybe allow it?)
              if (t.type === 'miner_station') return false; // Don't upgrade miner stations
              
              // Check if upgrade available
              // Logic from getTowerStats: if level > 1, check upgrades array.
              // Or simpler: check if next level cost > 0
              const currentLevel = t.level || 1;
              const maxTechLevel = towerBlueprints[t.type] || 1;
              
              if (currentLevel >= maxTechLevel) return false; // Capped by tech level

              const nextStats = getTowerStats(t.type, currentLevel + 1, t.assignedCharacter);
              const upgradeCost = nextStats.cost || 0;

              if (upgradeCost <= 0) return false; // Max level or no upgrade
              if (money < upgradeCost) return false; // Can't afford

              // Check range
              if (t.position.distanceTo(station.position) > stationStats.range) return false;

              return true;
            });

            if (potentialTargets.length > 0) {
              // Sort by lowest level first, then by distance
              potentialTargets.sort((a, b) => {
                const levelA = a.level || 1;
                const levelB = b.level || 1;
                if (levelA !== levelB) return levelA - levelB;
                return a.position.distanceTo(engineer.position) - b.position.distanceTo(engineer.position);
              });
              
              const target = potentialTargets[0];
              updateEngineer(engineer.id, {
                state: 'moving_to_tower',
                targetId: target.id,
                workProgress: 0
              });
            } else {
                // Return to station if not there
                if (engineer.position.distanceTo(station.position) > 1) {
                    updateEngineer(engineer.id, { state: 'returning', targetId: null });
                }
            }
          } else {
             // Return to station if disabled
             if (engineer.position.distanceTo(station.position) > 1) {
                updateEngineer(engineer.id, { state: 'returning', targetId: null });
            }
          }
          break;

        case 'moving_to_tower':
          if (engineer.targetId) {
            const target = towers.find(t => t.id === engineer.targetId);
            if (target) {
              const dist = engineer.position.distanceTo(target.position);
              if (dist < 1.5) {
                // Arrived
                updateEngineer(engineer.id, { state: 'upgrading', workProgress: 0 });
              } else {
                // Move
                const dir = new Vector3().subVectors(target.position, engineer.position).normalize();
                const newPos = engineer.position.clone().add(dir.multiplyScalar(speed));
                
                // Rotation
                const angle = Math.atan2(dir.x, dir.z);
                
                updateEngineer(engineer.id, { 
                    position: newPos,
                    rotation: [0, angle, 0]
                });
              }
            } else {
              // Target gone
              updateEngineer(engineer.id, { state: 'idle', targetId: null });
            }
          }
          break;

        case 'upgrading':
          if (engineer.targetId) {
            const target = towers.find(t => t.id === engineer.targetId);
            if (target) {
                // Work progress
                const newProgress = (engineer.workProgress || 0) + delta;
                
                if (newProgress >= 2.0) { // 2 seconds to upgrade
                    // Double check money
                    const currentLevel = target.level || 1;
                    const nextStats = getTowerStats(target.type, currentLevel + 1, target.assignedCharacter);
                    const upgradeCost = nextStats.cost || 0;

                    if (upgradeCost > 0 && spendMoney(upgradeCost)) {
                        updateTower(target.id, { level: currentLevel + 1 });
                        soundManager.play('/audio/soundeffects/upgrade/upgrade_1.mp3', 0.5); // Use generic sound
                        
                        // Spawn effect
                        addEffect({
                            id: uuidv4(),
                            type: 'health_up',
                            position: target.position.clone().add(new Vector3(0, 2, 0)),
                            startTime: _state.clock.elapsedTime
                        });
                    }
                    // Return to station
                    updateEngineer(engineer.id, { state: 'returning', targetId: null, workProgress: 0 });
                } else {
                    updateEngineer(engineer.id, { workProgress: newProgress });
                }
            } else {
                updateEngineer(engineer.id, { state: 'returning', targetId: null });
            }
          }
          break;

        case 'returning':
            const dist = engineer.position.distanceTo(station.position);
            if (dist < 1.0) {
                updateEngineer(engineer.id, { state: 'idle' });
            } else {
                const dir = new Vector3().subVectors(station.position, engineer.position).normalize();
                const newPos = engineer.position.clone().add(dir.multiplyScalar(speed));
                 // Rotation
                const angle = Math.atan2(dir.x, dir.z);
                
                updateEngineer(engineer.id, { 
                    position: newPos,
                    rotation: [0, angle, 0]
                });
            }
            break;
      }
    });
  });

  return null;
};
