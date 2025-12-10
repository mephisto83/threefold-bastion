import React, { useRef, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Billboard } from '@react-three/drei';
import { Group } from 'three';
import { TowerEntity, useGameState } from '../../state/gameState';
import { TOWERS, getTowerModel, getTowerStats } from '../config/gameConfig';

interface TowerProps {
  tower: TowerEntity;
}

class ErrorBoundary extends React.Component<{ fallback: React.ReactNode, children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const TowerModel: React.FC<{ model: string; lastFired: number; targetId: string | null; level: number; rotation?: [number, number, number] }> = ({ model, targetId, level, rotation }) => {
  const { scene } = useGLTF(model);
  const clone = useMemo(() => {
    const c = scene.clone();
    c.traverse((child: any) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        // Cyber-punk glow effect: Increase emissive intensity with level
        // Level 1: 1.0 (Base)
        // Level 2: 2.0
        // Level 3: 3.0
        child.material.emissiveIntensity = 1.0 + (level - 1) * 1.0;
        child.material.needsUpdate = true;
      }
    });
    return c;
  }, [scene, level]);
  
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    
    if (rotation) {
        groupRef.current.rotation.set(...rotation);
    } else if (targetId) {
      const enemies = useGameState.getState().enemies;
      const target = enemies.find(e => e.id === targetId);
      if (target) {
        groupRef.current.lookAt(target.position);
      }
    }
  });

  return <primitive object={clone} ref={groupRef} />;
};

const TowerFallback: React.FC<{ color: string }> = ({ color }) => (
  <mesh>
    <cylinderGeometry args={[0.5, 0.5, 2]} />
    <meshStandardMaterial color={color} />
  </mesh>
);

export const Tower: React.FC<TowerProps> = ({ tower }) => {
  const config = TOWERS[tower.type];
  const stats = getTowerStats(tower.type, tower.level, tower.assignedCharacter);
  const energyRatio = config.maxEnergy > 0 ? tower.energy / config.maxEnergy : 0;
  const { selectTowerId, selectedTowerId } = useGameState();
  const isSelected = selectedTowerId === tower.id;

  // Determine model based on level
  const modelPath = getTowerModel(tower.type, tower.level, tower.assignedCharacter);

  const handleClick = (e: any) => {
    e.stopPropagation();
    selectTowerId(tower.id);
  };

  return (
    <group position={tower.position} onClick={handleClick}>
      {/* Selection Ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <ringGeometry args={[stats.range - 0.1, stats.range, 32]} />
          <meshBasicMaterial color="white" opacity={0.5} transparent />
        </mesh>
      )}

      {/* Command Node Range Indicator (Always visible if it's a command node?) Or just when selected? */}
      {/* Let's show a faint aura for Command Node to indicate buff range */}
      {tower.type === 'command_node' && (
         <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
            <ringGeometry args={[stats.range - 0.2, stats.range, 64]} />
            <meshBasicMaterial color="orange" opacity={0.2} transparent />
         </mesh>
      )}

      {/* Buff Indicator */}
      {(tower.damageMultiplier && tower.damageMultiplier > 1) && (
        <mesh position={[0, 4, 0]}>
           <sphereGeometry args={[0.3]} />
           <meshBasicMaterial color="orange" />
        </mesh>
      )}

      <group position={config.modelOffset as [number, number, number]}>
        <ErrorBoundary fallback={<TowerFallback color={config.color} />}>
          <Suspense fallback={<TowerFallback color={config.color} />}>
            <TowerModel 
                model={modelPath} 
                lastFired={tower.lastFired} 
                targetId={tower.targetId} 
                level={tower.level} 
                rotation={tower.rotation}
            />
          </Suspense>
        </ErrorBoundary>
      </group>

      {config.maxEnergy > 0 && (
        <Billboard position={[0, 3, 0]}>
          {/* Background */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[1.2, 0.2]} />
            <meshBasicMaterial color="#222" />
          </mesh>
          {/* Energy Bar */}
          <mesh position={[-0.5 + energyRatio / 2, 0, 0]}>
             <planeGeometry args={[energyRatio, 0.15]} />
             <meshBasicMaterial color="#00ffff" toneMapped={false} />
          </mesh>
        </Billboard>
      )}
    </group>
  );
};
