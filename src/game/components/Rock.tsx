import React, { useMemo, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RockEntity } from '../../state/gameState';
import { ROCK_CONFIG } from '../config/gameConfig';

interface RockProps {
  rock: RockEntity;
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

const RockModel = ({ modelPath, scale }: { modelPath: string, scale: [number, number, number] }) => {
  const { scene } = useGLTF(modelPath);
  const clone = useMemo(() => {
    const clonedScene = scene.clone();
    clonedScene.traverse((child) => {
      if ((child as any).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          // Clone material to ensure we don't affect other instances if we wanted variation,
          // but here we want all rocks to bloom.
          // However, scene.clone() shares materials. If we modify one, we modify all.
          // That's actually fine if we want ALL rocks to bloom.
          // But let's clone to be safe and correct.
          mesh.material = Array.isArray(mesh.material) 
            ? mesh.material.map(m => m.clone()) 
            : mesh.material.clone();
            
          const material = mesh.material as THREE.MeshStandardMaterial;
          material.emissive = new THREE.Color("#00ffff"); // Cyan glow
          material.emissiveIntensity = 1.7;
          material.toneMapped = false;
        }
      }
    });
    return clonedScene;
  }, [scene]);
  return <primitive object={clone} scale={scale} />;
};

const RockFallback = ({ scale }: { scale: [number, number, number] }) => (
  <mesh scale={scale}>
    <dodecahedronGeometry args={[1, 0]} />
    <meshStandardMaterial color="#888888" roughness={0.8} />
  </mesh>
);

export const Rock: React.FC<RockProps> = ({ rock }) => {
  const scale: [number, number, number] = [1 + rock.amount/1000, 1 + rock.amount/1000, 1 + rock.amount/1000];
  
  const rotation = useMemo(() => [
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2
  ] as [number, number, number], [rock.id]);

  return (
    <group position={rock.position} rotation={rotation}>
      <ErrorBoundary fallback={<RockFallback scale={scale} />}>
        <Suspense fallback={<RockFallback scale={scale} />}>
          <RockModel modelPath={ROCK_CONFIG.model} scale={scale} />
        </Suspense>
      </ErrorBoundary>
    </group>
  );
};
