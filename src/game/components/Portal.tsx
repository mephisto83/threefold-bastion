import React, { useRef } from 'react';
import { useVideoTexture } from '@react-three/drei';
import { Vector3, DoubleSide, Euler } from 'three';
import { useFrame } from '@react-three/fiber';

interface PortalProps {
  position: Vector3;
  rotation?: Euler;
}

export const Portal: React.FC<PortalProps> = ({ position, rotation }) => {
  const texture = useVideoTexture('/video/portals/portal_1.mp4');
  const meshRef = useRef<any>(null);

  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.z += delta * 0.5;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Vertical Portal */}
      <mesh ref={meshRef} position={[0, 2, 0]} rotation={[0, 0, 0]}>
        <circleGeometry args={[2, 32]} />
        <meshBasicMaterial map={texture} side={DoubleSide} transparent opacity={0.9} />
      </mesh>
      
      {/* Glow effect behind */}
      <mesh position={[0, 2, -0.1]}>
        <circleGeometry args={[2.2, 32]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};
