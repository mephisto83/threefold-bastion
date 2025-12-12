import React from 'react';
import { ProjectileEntity } from '../../state/gameState';

interface ProjectileProps {
  projectile: ProjectileEntity;
}

export const Projectile: React.FC<ProjectileProps> = ({ projectile }) => {
  const isEnergy = projectile.damageType === 'energy';
  const color = isEnergy ? "#00ffff" : "gold"; // Cyan for energy, Gold for kinetic
  const emissive = isEnergy ? "#0000ff" : "orange"; // Blue glow for energy, Orange glow for kinetic

  return (
    <mesh position={projectile.position}>
      <sphereGeometry args={[0.2, 8, 8]} />
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={2} />
    </mesh>
  );
};
