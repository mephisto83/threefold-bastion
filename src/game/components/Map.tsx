import React, { useState, Suspense } from 'react';
import { Line, Plane } from '@react-three/drei';
import { TOWERS, getTowerModel, getTowerStats, CHARACTERS } from '../config/gameConfig';
import { Vector3, CatmullRomCurve3, Euler } from 'three';
import { useGameState } from '../../state/gameState';
import { v4 as uuidv4 } from 'uuid';
import { TowerModel } from './Tower';
import { SpriteEffect } from './SpriteEffect';
import { Portal } from './Portal';
import { soundManager } from '../utils/SoundManager';

export const Map: React.FC = () => {
  const { selectedTower, addTower, spendMoney, selectTower, towers, paths, selectedTowerId, updateTower, towerBlueprints, isMovingMode, setMovingMode, pendingMovePosition, setPendingMovePosition, effects, language } = useGameState();
  const [hoverPos, setHoverPos] = useState<Vector3 | null>(null);

  const handlePlaneClick = (e: any) => {
    e.stopPropagation();
    
    if (!selectedTower && !selectedTowerId) return;

    const point = e.point;
    // Snap to grid (assuming 1x1 grid or similar)
    const x = Math.round(point.x);
    const z = Math.round(point.z);
    const position = new Vector3(x, 0, z);

    // Check if valid placement
    // Check if tile is occupied by another tower (excluding self if moving)
    if (towers.some(t => t.id !== selectedTowerId && t.position.distanceTo(position) < 0.5)) return;

    if (selectedTower) {
      if (towers.length >= Object.keys(CHARACTERS).length) {
        // TODO: Show error message
        return;
      }

      const config = TOWERS[selectedTower];
      if (spendMoney(config.cost)) {
        const stats = getTowerStats(selectedTower, towerBlueprints[selectedTower]);
        const newTower = {
          id: uuidv4(),
          type: selectedTower,
          level: towerBlueprints[selectedTower],
          position: position,
          lastFired: 0,
          targetId: null,
          energy: config.maxEnergy,
          maxEnergy: config.maxEnergy,
          health: stats.health,
          maxHealth: stats.health,
          assignedCharacter: undefined as string | undefined
        };

        addTower(newTower);

        // Play character placement sound
        // The addTower function auto-assigns a character to the tower object
        const characterId = newTower.assignedCharacter || config.character;
        if (characterId && CHARACTERS[characterId]) {
          const audio = CHARACTERS[characterId].audio?.[language]?.selected_acknowledged;
          if (audio) {
            soundManager.play(audio, 0.6);
          }
        }

        selectTower(null); // Deselect after placement
      }
    } else if (selectedTowerId && isMovingMode) {
      updateTower(selectedTowerId, { targetPosition: position });
      setMovingMode(false);
      setPendingMovePosition(null);

      // Play character move sound
      const tower = towers.find(t => t.id === selectedTowerId);
      if (tower) {
        const config = TOWERS[tower.type];
        const characterId = tower.assignedCharacter || config.character;
        if (characterId && CHARACTERS[characterId]) {
          const audio = CHARACTERS[characterId].audio?.[language]?.selected_acknowledged;
          if (audio) {
            soundManager.play(audio, 0.6);
          }
        }
      }
    }
  };

  const selectedTowerEntity = selectedTowerId ? towers.find(t => t.id === selectedTowerId) : null;

  const handlePointerMove = (e: any) => {
    if (selectedTower || selectedTowerId) {
      const point = e.point;
      setHoverPos(new Vector3(Math.round(point.x), 0.01, Math.round(point.z)));
    } else {
      setHoverPos(null);
    }
  };

  return (
    <group>
      {/* Ghost Tower for Moving Mode */}
      {(pendingMovePosition || (isMovingMode && hoverPos)) && selectedTowerEntity && (
        <group position={pendingMovePosition || hoverPos!}>
          <Suspense fallback={null}>
            <group position={TOWERS[selectedTowerEntity.type].modelOffset as [number, number, number]}>
              <TowerModel 
                model={getTowerModel(selectedTowerEntity.type, selectedTowerEntity.level)} 
                lastFired={0} 
                targetId={null}
                level={selectedTowerEntity.level}
              />
            </group>
          </Suspense>
          {/* Range Indicator for Ghost */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
            <ringGeometry args={[getTowerStats(selectedTowerEntity.type, selectedTowerEntity.level, selectedTowerEntity.assignedCharacter).range - 0.1, getTowerStats(selectedTowerEntity.type, selectedTowerEntity.level, selectedTowerEntity.assignedCharacter).range, 32]} />
            <meshBasicMaterial color="yellow" opacity={0.5} transparent />
          </mesh>
        </group>
      )}

      <Plane 
        args={[100, 100]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.1, 0]}
        onClick={handlePlaneClick}
        onPointerMove={handlePointerMove}
        onPointerOut={() => setHoverPos(null)}
      >
        <meshBasicMaterial visible={false} />
      </Plane>

      {/* Path Visuals */}
      {paths.map((points, i) => {
        const curve = new CatmullRomCurve3(points);
        const curvePoints = curve.getPoints(50);
        const endPoint = points[points.length - 1];
        const prevPoint = points[points.length - 2] || new Vector3(endPoint.x, endPoint.y, endPoint.z + 1);
        const direction = new Vector3().subVectors(prevPoint, endPoint).normalize();
        const angle = Math.atan2(direction.x, direction.z);
        const rotation = new Euler(0, angle, 0);
        
        return (
          <group key={i}>
            <Line
              points={curvePoints}
              color="red"
              lineWidth={3}
            />
            <Portal position={endPoint} rotation={rotation} />
          </group>
        );
      })}
      
      {/* Grid Helper */}
      <gridHelper args={[50, 50]} position={[0, 0.01, 0]} />

      {/* Effects */}
      {effects.map(effect => (
        <SpriteEffect key={effect.id} effect={effect} />
      ))}

      {/* Placement Preview */}
      {((selectedTower) || (selectedTowerId && isMovingMode)) && hoverPos && (
        <mesh position={hoverPos}>
          <boxGeometry args={[1, 0.1, 1]} />
          <meshBasicMaterial color={selectedTower ? "green" : "blue"} opacity={0.5} transparent />
          {selectedTower && (
            <mesh position={[0, 0, 0]} rotation={[-Math.PI/2, 0, 0]}>
              <ringGeometry args={[getTowerStats(selectedTower, towerBlueprints[selectedTower]).range - 0.1, getTowerStats(selectedTower, towerBlueprints[selectedTower]).range, 32]} />
              <meshBasicMaterial color="white" opacity={0.3} transparent />
            </mesh>
          )}
          {selectedTowerId && towers.find(t => t.id === selectedTowerId) && (
             <mesh position={[0, 0, 0]} rotation={[-Math.PI/2, 0, 0]}>
               <ringGeometry args={[getTowerStats(towers.find(t => t.id === selectedTowerId)!.type, towers.find(t => t.id === selectedTowerId)!.level, towers.find(t => t.id === selectedTowerId)!.assignedCharacter).range - 0.1, getTowerStats(towers.find(t => t.id === selectedTowerId)!.type, towers.find(t => t.id === selectedTowerId)!.level, towers.find(t => t.id === selectedTowerId)!.assignedCharacter).range, 32]} />
               <meshBasicMaterial color="white" opacity={0.3} transparent />
             </mesh>
          )}
        </mesh>
      )}
    </group>
  );
};
