import React, { useRef, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group } from 'three';
import { EngineerEntity } from '../../state/gameState';
import { ENGINEER_CONFIG } from '../config/gameConfig';

interface EngineerProps {
  engineer: EngineerEntity;
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

const EngineerModel = ({ modelPath }: { modelPath: string }) => {
  const { scene } = useGLTF(modelPath);
  const clone = useMemo(() => scene.clone(), [scene]);
  return <primitive object={clone} scale={[0.5, 0.5, 0.5]} />;
};

const EngineerFallback = () => (
  <mesh rotation={[0, 0, -Math.PI / 2]}>
    <coneGeometry args={[0.3, 0.8, 8]} />
    <meshStandardMaterial color="cyan" />
  </mesh>
);

export const Engineer: React.FC<EngineerProps> = ({ engineer }) => {
  const groupRef = useRef<Group>(null);
  const innerGroupRef = useRef<Group>(null);
  const modelPath = engineer.model || ENGINEER_CONFIG.model;

  useFrame((state, delta) => {
    if (groupRef.current && engineer.rotation) {
       const currentRotation = groupRef.current.rotation.y;
       const targetRotation = engineer.rotation[1];
       
       // Handle wrapping around PI for smooth turning
       let diff = targetRotation - currentRotation;
       while (diff > Math.PI) diff -= Math.PI * 2;
       while (diff < -Math.PI) diff += Math.PI * 2;

       groupRef.current.rotation.y += diff * delta * 5; // Turn speed
    }

    if (innerGroupRef.current) {
        if (engineer.state === 'upgrading') {
            innerGroupRef.current.position.y = Math.sin(state.clock.elapsedTime * 5) * 0.2;
        } else {
            innerGroupRef.current.position.y = 0;
        }
    }
  });

  return (
    <group ref={groupRef} position={engineer.position}>
      <group ref={innerGroupRef}>
        <Suspense fallback={<EngineerFallback />}>
            <ErrorBoundary fallback={<EngineerFallback />}>
            <EngineerModel modelPath={modelPath} />
            </ErrorBoundary>
        </Suspense>
      </group>
      
      {/* Status Indicator */}
      {engineer.state === 'upgrading' && (
        <mesh position={[0, 1, 0]}>
          <sphereGeometry args={[0.2]} />
          <meshBasicMaterial color="cyan" />
        </mesh>
      )}
    </group>
  );
};
