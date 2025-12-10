import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Map } from './components/Map';
import { Enemy } from './components/Enemy';
import { Tower } from './components/Tower';
import { Projectile } from './components/Projectile';
import { Miner } from './components/Miner';
import { Engineer } from './components/Engineer';
import { Rock } from './components/Rock';
import { SpriteEffect } from './components/SpriteEffect';
import { EnemySystem } from './systems/EnemySystem';
import { TowerSystem } from './systems/TowerSystem';
import { ProjectileSystem } from './systems/ProjectileSystem';
import { WaveSystem } from './systems/WaveSystem';
import { MiningSystem } from './systems/MiningSystem';
import { EngineeringSystem } from './systems/EngineeringSystem';
import { GameLogicSystem } from './systems/GameLogicSystem';
import { useGameState } from '../state/gameState';
import { useGameLoop } from './hooks/useGameLoop';
import { useKeyboardControls } from './hooks/useKeyboardControls';

const GameContent = () => {
  const { enemies, towers, projectiles, miners, engineers, rocks, effects } = useGameState();
  useGameLoop();
  useKeyboardControls();

  return (
    <>
      <ambientLight intensity={0.168} />
      <pointLight position={[10, 10, 10]} castShadow intensity={.1} />
      <directionalLight position={[-5, 10, 5]} intensity={1.5} castShadow />
      <hemisphereLight groundColor="black" intensity={0.5} />
      <color attach="background" args={['black']} />
      <Stars />
      
      <EffectComposer>
        <Bloom luminanceThreshold={1} luminanceSmoothing={0.99} height={300} />
      </EffectComposer>

      <Map />
      
      {enemies.map(enemy => (
        <Enemy key={enemy.id} enemy={enemy} />
      ))}
      
      {towers.map(tower => (
        <Tower key={tower.id} tower={tower} />
      ))}
      
      {projectiles.map(projectile => (
        <Projectile key={projectile.id} projectile={projectile} />
      ))}

      {miners.map(miner => (
        <Miner key={miner.id} miner={miner} />
      ))}

      {engineers.map(engineer => (
        <Engineer key={engineer.id} engineer={engineer} />
      ))}

      {rocks.map(rock => (
        <Rock key={rock.id} rock={rock} />
      ))}

      {effects.map(effect => (
        <SpriteEffect key={effect.id} effect={effect} />
      ))}

      <EnemySystem />
      <TowerSystem />
      <ProjectileSystem />
      <WaveSystem />
      <MiningSystem />
      <EngineeringSystem />
      <GameLogicSystem />
      
      <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.1} />
    </>
  );
};

export const GameCanvas = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas shadows camera={{ position: [0, 20, 20], fov: 50 }}>
        <Suspense fallback={null}>
          <GameContent />
        </Suspense>
      </Canvas>
    </div>
  );
};
