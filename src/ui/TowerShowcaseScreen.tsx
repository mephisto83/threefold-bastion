import React, { Suspense, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Box3, Group, Vector3 } from 'three';
import { useGameState } from '../state/gameState';
import { TOWERS, TowerType } from '../game/config/gameConfig';
import { useTranslation } from './hooks/useTranslation';

function VideoWithFallback({
  preferredSrc,
  fallbackSrc,
}: {
  preferredSrc: string;
  fallbackSrc?: string;
}) {
  const [src, setSrc] = useState(preferredSrc);
  const [triedFallback, setTriedFallback] = useState(false);
  const [failed, setFailed] = useState(false);

  React.useEffect(() => {
    setSrc(preferredSrc);
    setTriedFallback(false);
    setFailed(false);
  }, [preferredSrc]);

  if (failed) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#aaa',
          padding: '16px',
          textAlign: 'center',
        }}
      >
        No video available for this tower.
      </div>
    );
  }

  return (
    <video
      key={src}
      src={src}
      autoPlay
      loop
      muted
      playsInline
      controls
      preload="metadata"
      onError={() => {
        if (!triedFallback && fallbackSrc) {
          setTriedFallback(true);
          setSrc(fallbackSrc);
          return;
        }
        setFailed(true);
      }}
      style={{ width: '100%', height: '100%', objectFit: 'cover', background: 'black' }}
    />
  );
}

function RotatingRig({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<Group>(null);
  useFrame((_state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.6;
  });
  return <group ref={ref}>{children}</group>;
}

function PlatformModel() {
  const { scene } = useGLTF('/models/environment/platform/basic_platform.glb');
  const clone = useMemo(() => scene.clone(), [scene]);
  return <primitive object={clone} />;
}

function TowerPreviewModel({ type }: { type: TowerType }) {
  const cfg = TOWERS[type];
  const { scene } = useGLTF(cfg.model);

  const { model, scale } = useMemo(() => {
    const clone = scene.clone(true);
    const box = new Box3().setFromObject(clone);
    const size = new Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x || 0, size.y || 0, size.z || 0);
    const target = 3.2;
    const normalizedScale = maxDim > 0 ? target / maxDim : 1;
    return { model: clone, scale: normalizedScale };
  }, [scene]);

  return (
    <group position={cfg.modelOffset as [number, number, number]} scale={[scale, scale, scale]}>
      <primitive object={model} />
    </group>
  );
}

function TowerPreviewScene({ type }: { type: TowerType }) {
  return (
    <>
      <color attach="background" args={['#05060a']} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 10, 6]} intensity={1.25} />
      <directionalLight position={[-6, 6, -6]} intensity={0.6} />

      <RotatingRig>
        <Suspense fallback={null}>
          <PlatformModel />
        </Suspense>
        <Suspense fallback={null}>
          <TowerPreviewModel type={type} />
        </Suspense>
      </RotatingRig>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[8, 64]} />
        <meshStandardMaterial color="#0b0e18" />
      </mesh>
    </>
  );
}

export const TowerShowcaseScreen: React.FC = () => {
  const { showStartScreen, language } = useGameState();
  const { t } = useTranslation();

  const towerTypes = useMemo(() => Object.keys(TOWERS) as TowerType[], []);
  const [selected, setSelected] = useState<TowerType>(towerTypes[0]);

  const preferredLang = (language || 'en').toLowerCase();
  const preferredVideo = `/video/towers/${preferredLang}/${selected}.mp4`;
  const fallbackVideo = `/video/towers/en/${selected}.mp4`;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        flexDirection: 'column',
        color: 'white',
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(0,255,255,0.18)',
        }}
      >
        <button
          onClick={showStartScreen}
          style={{
            padding: '10px 14px',
            background: 'transparent',
            color: '#00ffff',
            border: '2px solid #00ffff',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Back
        </button>
        <div style={{ color: '#00ffff', fontWeight: 800, letterSpacing: '0.12em' }}>TOWERS</div>
        <div style={{ width: 84 }} />
      </div>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: '16px',
          padding: '16px',
          overflow: 'hidden',
        }}
      >
        {/* Tower selector */}
        <div
          style={{
            border: '1px solid rgba(0,255,255,0.22)',
            borderRadius: '10px',
            background: 'rgba(0,0,0,0.35)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ color: '#00ffff', fontWeight: 800, letterSpacing: '0.12em', fontSize: 12 }}>SELECT A TOWER</div>
          </div>
          <div style={{ overflowY: 'auto', padding: '10px' }}>
            {towerTypes.map((type) => {
              const cfg = TOWERS[type];
              const isActive = type === selected;
              return (
                <button
                  key={type}
                  onClick={() => setSelected(type)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 12px',
                    marginBottom: '10px',
                    background: isActive ? 'rgba(0,255,255,0.14)' : 'rgba(0,0,0,0.25)',
                    color: 'white',
                    border: `1px solid ${isActive ? 'rgba(0,255,255,0.55)' : 'rgba(0,255,255,0.18)'}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 900, color: '#ffff00' }}>{t(cfg.name) || cfg.name}</div>
                  <div style={{ marginTop: 6, fontSize: 12, color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#00ffff' }}>${cfg.cost}</span>
                    <span style={{ color: '#ff00ff' }}>{type}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview area */}
        <div
          style={{
            border: '1px solid rgba(0,255,255,0.22)',
            borderRadius: '10px',
            background: 'rgba(0,0,0,0.35)',
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1px',
          }}
        >
          <div style={{ minHeight: 0 }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ color: '#00ffff', fontWeight: 800, letterSpacing: '0.12em', fontSize: 12 }}>3D PREVIEW</div>
            </div>
            <div style={{ height: 'calc(100% - 45px)' }}>
              <Canvas camera={{ position: [0, 4.2, 7.5], fov: 45 }}>
                <Suspense fallback={null}>
                  <TowerPreviewScene type={selected} />
                </Suspense>
              </Canvas>
            </div>
          </div>

          <div style={{ minHeight: 0 }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ color: '#00ffff', fontWeight: 800, letterSpacing: '0.12em', fontSize: 12 }}>VIDEO</div>
            </div>
            <div style={{ height: 'calc(100% - 45px)' }}>
              <VideoWithFallback preferredSrc={preferredVideo} fallbackSrc={fallbackVideo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

useGLTF.preload('/models/environment/platform/basic_platform.glb');
