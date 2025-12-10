import React, { useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Billboard } from '@react-three/drei';
import { NearestFilter } from 'three';
import { EffectEntity, useGameState } from '../../state/gameState';
import { EFFECTS } from '../config/effectConfig';

export const SpriteEffect: React.FC<{ effect: EffectEntity }> = ({ effect }) => {
  const config = EFFECTS[effect.type];
  const removeEffect = useGameState(state => state.removeEffect);

  // Generate URLs
  const urls = useMemo(() => {
    const paths = [];
    for (let i = 0; i < config.frameCount; i++) {
      const frameNum = i + config.startFrame;
      const frameStr = frameNum.toString().padStart(2, '0');
      paths.push(`/images/sprites/19 sprite effects/${config.folder}/${config.folder}_${frameStr}.png`);
    }
    return paths;
  }, [config]);

  // Load textures
  const textures = useTexture(urls);

  // Configure textures
  useMemo(() => {
    textures.forEach(t => {
      t.magFilter = NearestFilter;
      t.minFilter = NearestFilter;
    });
  }, [textures]);

  const [currentFrame, setCurrentFrame] = useState(0);

  useFrame((state) => {
    const now = state.clock.elapsedTime;
    const age = now - effect.startTime;
    
    if (!config.loop && age >= config.duration) {
        removeEffect(effect.id);
        return;
    }

    // Calculate frame
    let frameIndex = Math.floor((age / config.duration) * config.frameCount);
    
    if (config.loop) {
        frameIndex = frameIndex % config.frameCount;
    } else {
        frameIndex = Math.min(frameIndex, config.frameCount - 1);
    }
    
    setCurrentFrame(frameIndex);
  });

  const texture = textures[currentFrame];

  return (
    <Billboard position={effect.position}>
      <mesh scale={[config.scale || 1, config.scale || 1, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>
    </Billboard>
  );
};
