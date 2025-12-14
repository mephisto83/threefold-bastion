import React, { useEffect, useState } from 'react';
import { useGameState } from '../state/gameState';
import CyberpunkFamilyTree, { FamilyData } from './cyberpunk_family_tree';
import { useTranslation } from './hooks/useTranslation';

export const FamilyTreeScreen: React.FC = () => {
  const { showStartScreen } = useGameState();
  const { t } = useTranslation();
  const [familyData, setFamilyData] = useState<FamilyData | null>(null);

  useEffect(() => {
    fetch('/json/pre_source.json')
      .then(res => res.json())
      .then(data => setFamilyData(data))
      .catch(err => console.error('Failed to load family tree data:', err));
  }, []);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'black',
      zIndex: 20,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 30
      }}>
        <button 
          onClick={showStartScreen}
          style={{
            padding: '10px 20px',
            fontSize: '18px',
            cursor: 'pointer',
            background: '#555',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            boxShadow: '0 0 10px rgba(0,0,0,0.5)'
          }}
        >
          {t('back')}
        </button>
      </div>
      
      {familyData ? (
        <CyberpunkFamilyTree 
          data={familyData} 
          assetBaseUrl="/" 
          minNodeDistance={220}
        />
      ) : (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%', 
          color: '#00ffff',
          fontSize: '24px'
        }}>
          Loading Neural Network...
        </div>
      )}
    </div>
  );
};
