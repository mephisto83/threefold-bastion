import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useGameState } from '../../state/gameState';
import { TOWERS, ROCK_CONFIG } from '../config/gameConfig';
import { v4 as uuidv4 } from 'uuid';

export const MiningSystem = () => {
  const { miners, rocks, towers, updateMiner, updateRock, updateTower, removeRock, addRock, addMoney, isSettingsOpen } = useGameState();

  useFrame((_state, delta) => {
    if (isSettingsOpen) return;

    // Maintain minimum rock count
    if (rocks.length < 8) {
      const angle = Math.random() * Math.PI * 2;
      // Spawn closer if we are low on rocks, to ensure playability
      const spawnDist = 30 + Math.random() * 20; // 30-50 units
      const spawnPos = new Vector3(Math.cos(angle) * spawnDist, 0, Math.sin(angle) * spawnDist);
      
      // Velocity towards center (roughly)
      const targetPos = new Vector3((Math.random() - 0.5) * 20, 0, (Math.random() - 0.5) * 20);
      const velocity = targetPos.sub(spawnPos).normalize().multiplyScalar(0.5 + Math.random() * 0.5);

      addRock({
        id: uuidv4(),
        position: spawnPos,
        velocity: velocity,
        amount: ROCK_CONFIG.defaultAmount,
        maxAmount: ROCK_CONFIG.defaultAmount
      });
    }

    // Update Rocks
    rocks.forEach(rock => {
      // Move rock
      const newPos = rock.position.clone().add(rock.velocity.clone().multiplyScalar(delta));
      updateRock(rock.id, { position: newPos });

      // Check bounds (remove if too far)
      if (newPos.length() > 60) {
        removeRock(rock.id);
        // Don't respawn here immediately, let the min count check handle it next frame
        // This prevents double spawning and centralizes the spawn logic
      }
    });

    miners.forEach(miner => {
      switch (miner.state) {
        case 'idle':
          const station = towers.find(t => t.id === miner.stationId);
          const stationPos = station ? station.position : miner.position;
          const searchRadius = 30; // Radius for miners

          // Decide what to do
          if (miner.carrying >= miner.maxCapacity) {
            // 1. Find tower that needs energy within radius
            const candidates = towers
              .filter(t => {
                const config = TOWERS[t.type];
                return t.type !== 'miner_station' && 
                       config.maxEnergy > 0 && 
                       t.energy < config.maxEnergy &&
                       t.position.distanceTo(stationPos) <= searchRadius;
              })
              .map(t => ({
                tower: t,
                ratio: t.energy / TOWERS[t.type].maxEnergy
              }))
              .sort((a, b) => a.ratio - b.ratio)
              .slice(0, 5);

            if (candidates.length > 0) {
              // ... existing weighted random selection ...
              const weights = [0.4, 0.3, 0.1, 0.1, 0.1].slice(0, candidates.length);
              const totalWeight = weights.reduce((a, b) => a + b, 0);
              let random = Math.random() * totalWeight;
              
              let selectedCandidate = candidates[0];
              for (let i = 0; i < candidates.length; i++) {
                random -= weights[i];
                if (random <= 0) {
                  selectedCandidate = candidates[i];
                  break;
                }
              }
              
              updateMiner(miner.id, { state: 'moving_to_tower', targetId: selectedCandidate.tower.id });
            } else if (station) {
              // 2. If no towers need energy, return to station to sell
              updateMiner(miner.id, { state: 'moving_to_tower', targetId: station.id });
            }
          } else {
            // Find nearest rock within radius of station
            let bestRock: any = null;
            let minDist = Infinity;

            rocks.forEach(r => {
              // Check if rock is within station radius
              if (r.position.distanceTo(stationPos) > searchRadius) return;

              // Limit miners per rock
              const minersOnRock = miners.filter(m => m.targetId === r.id && m.id !== miner.id).length;
              if (minersOnRock >= 4) return;

              const dist = miner.position.distanceTo(r.position);
              if (dist < minDist) {
                minDist = dist;
                bestRock = r;
              }
            });

            if (bestRock) {
              updateMiner(miner.id, { state: 'moving_to_rock', targetId: bestRock.id });
            }
          }
          break;

        case 'moving_to_rock':
          if (!miner.targetId) {
            updateMiner(miner.id, { state: 'idle' });
            return;
          }
          const rock = rocks.find(r => r.id === miner.targetId);
          if (!rock) {
            updateMiner(miner.id, { state: 'idle', targetId: null });
            return;
          }

          const distToRock = miner.position.distanceTo(rock.position);
          if (distToRock < 1.5) {
            updateMiner(miner.id, { state: 'mining' });
          } else {
            const dir = rock.position.clone().sub(miner.position).normalize();
            const move = dir.multiplyScalar(miner.speed * delta);
            const angle = Math.atan2(dir.x, dir.z);
            updateMiner(miner.id, { 
              position: miner.position.clone().add(move),
              rotation: [0, angle, 0]
            });
          }
          break;

        case 'mining':
          if (!miner.targetId) {
            updateMiner(miner.id, { state: 'idle' });
            return;
          }
          const targetRock = rocks.find(r => r.id === miner.targetId);
          if (!targetRock) {
            updateMiner(miner.id, { state: 'idle', targetId: null });
            return;
          }

          // Mine
          const amountToMine = Math.min(
            miner.miningRate * delta, 
            targetRock.amount,
            miner.maxCapacity - miner.carrying
          );

          if (amountToMine > 0) {
            const newRockAmount = targetRock.amount - amountToMine;
            updateRock(targetRock.id, { amount: newRockAmount });
            updateMiner(miner.id, { carrying: miner.carrying + amountToMine });

            if (newRockAmount <= 0) {
              removeRock(targetRock.id);
              updateMiner(miner.id, { state: 'idle', targetId: null });
              // New rock will be spawned by the min count check in the next frame
            } else if (miner.carrying >= miner.maxCapacity) {
              updateMiner(miner.id, { state: 'idle', targetId: null });
            }
          } else {
             updateMiner(miner.id, { state: 'idle', targetId: null });
          }
          break;

        case 'moving_to_tower':
          if (!miner.targetId) {
            updateMiner(miner.id, { state: 'idle' });
            return;
          }
          const tower = towers.find(t => t.id === miner.targetId);
          if (!tower) {
            updateMiner(miner.id, { state: 'idle', targetId: null });
            return;
          }

          const distToTower = miner.position.distanceTo(tower.position);
          if (distToTower < 1.5) {
            updateMiner(miner.id, { state: 'depositing' });
          } else {
            const dir = tower.position.clone().sub(miner.position).normalize();
            const move = dir.multiplyScalar(miner.speed * delta);
            const angle = Math.atan2(dir.x, dir.z);
            updateMiner(miner.id, { 
              position: miner.position.clone().add(move),
              rotation: [0, angle, 0]
            });
          }
          break;

        case 'depositing':
          if (!miner.targetId) {
            updateMiner(miner.id, { state: 'idle' });
            return;
          }
          const targetTower = towers.find(t => t.id === miner.targetId);
          if (!targetTower) {
            updateMiner(miner.id, { state: 'idle', targetId: null });
            return;
          }

          // Handle Station Deposit (Money)
          if (targetTower.type === 'miner_station') {
             addMoney(Math.floor(miner.carrying));
             updateMiner(miner.id, { carrying: 0, state: 'idle', targetId: null });
             return;
          }

          const config = TOWERS[targetTower.type];
          const space = config.maxEnergy - targetTower.energy;
          const transfer = Math.min(space, miner.carrying, 50 * delta); // Transfer speed

          if (transfer > 0) {
            updateTower(targetTower.id, { energy: targetTower.energy + transfer });
            updateMiner(miner.id, { carrying: miner.carrying - transfer });
          }

          if (miner.carrying <= 0 || targetTower.energy >= config.maxEnergy) {
            updateMiner(miner.id, { state: 'idle', targetId: null });
          }
          break;
      }
    });
  });

  return null;
};
