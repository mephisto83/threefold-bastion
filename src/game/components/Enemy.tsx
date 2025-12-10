import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { EnemyEntity } from '../../state/gameState';
import { ENEMIES } from '../config/gameConfig';

interface EnemyProps {
  enemy: EnemyEntity;
}

const EnemyModel: React.FC<{ model: string }> = ({ model }) => {
  const { scene } = useGLTF(model);
  const clone = useMemo(() => scene.clone(), [scene]);
  return <primitive object={clone} />;
};

export const Enemy: React.FC<EnemyProps> = ({ enemy }) => {
  const config = ENEMIES[enemy.type];
  const rotation: [number, number, number] = enemy.rotation 
    ? [enemy.rotation[0], enemy.rotation[1], enemy.rotation[2]] 
    : [0, 0, 0];
  
  const scale = enemy.scale || 1;

  return (
    <group position={enemy.position} rotation={rotation} scale={[scale, scale, scale]}>
      <EnemyModel model={config.model} />
      
      {/* Health Bar - Scale inversely so it stays same size relative to screen? Or scale with enemy? 
          Usually scaling with enemy is fine, but maybe we want it readable. 
          If we scale the group, the health bar scales too. That's probably what we want for "bigger enemies".
      */}
      <mesh position={[0, 2, 0]}>
        <planeGeometry args={[1, 0.1]} />
        <meshBasicMaterial color="red" />
      </mesh>
      <mesh position={[-(1 - enemy.health / enemy.maxHealth) / 2, 2, 0.01]}>
        <planeGeometry args={[enemy.health / enemy.maxHealth, 0.1]} />
        <meshBasicMaterial color="green" />
      </mesh>
    </group>
  );
};
