import React from 'react';
import { ProjectileEntity } from '../../state/gameState';

interface ProjectileProps {
  projectile: ProjectileEntity;
}

export const Projectile: React.FC<ProjectileProps> = ({ projectile }) => {
  return (
    <mesh position={projectile.position}>
      <sphereGeometry args={[0.2, 8, 8]} />
      <meshStandardMaterial color="yellow" emissive="orange" emissiveIntensity={2} />
    </mesh>
  );
};
