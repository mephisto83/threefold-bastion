import React, { useRef, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group } from 'three';
import { MinerEntity } from '../../state/gameState';
import { MINER_CONFIG } from '../config/gameConfig';

interface MinerProps {
  miner: MinerEntity;
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

const MinerModel = ({ modelPath }: { modelPath: string }) => {
  const { scene } = useGLTF(modelPath);
  const clone = useMemo(() => scene.clone(), [scene]);
  return <primitive object={clone} scale={[0.5, 0.5, 0.5]} />;
};

const MinerFallback = () => (
  <mesh rotation={[0, 0, -Math.PI / 2]}>
    <coneGeometry args={[0.3, 0.8, 8]} />
    <meshStandardMaterial color="orange" />
  </mesh>
);

export const Miner: React.FC<MinerProps> = ({ miner }) => {
  const groupRef = useRef<Group>(null);
  const modelPath = miner.model || MINER_CONFIG.model;

  useFrame((_, delta) => {
    if (groupRef.current && miner.rotation) {
       const currentRotation = groupRef.current.rotation.y;
       const targetRotation = miner.rotation[1];
       
       // Handle wrapping around PI for smooth turning
       let diff = targetRotation - currentRotation;
       while (diff > Math.PI) diff -= Math.PI * 2;
       while (diff < -Math.PI) diff += Math.PI * 2;
       
       // Smoothly interpolate rotation
       groupRef.current.rotation.y += diff * delta * 10; 
    }
  });

  return (
    <group position={miner.position} ref={groupRef}>
      <ErrorBoundary fallback={<MinerFallback />}>
        <Suspense fallback={<MinerFallback />}>
          <MinerModel modelPath={modelPath} />
        </Suspense>
      </ErrorBoundary>
      
      {/* Capacity Indicator */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.5, 0.1, 0.1]} />
        <meshBasicMaterial color="gray" />
      </mesh>
      <mesh position={[0, 1, 0]} scale={[miner.carrying / miner.maxCapacity, 1, 1]}>
        <boxGeometry args={[0.5, 0.1, 0.1]} />
        <meshBasicMaterial color="yellow" />
      </mesh>
    </group>
  );
};
