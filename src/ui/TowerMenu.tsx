import React from 'react';
import { useGameState } from '../state/gameState';
import { TOWERS, TowerType } from '../game/config/gameConfig';
import { TIER_GATES } from '../game/config/progressionConfig';
import { useTranslation } from './hooks/useTranslation';

export const TowerMenu: React.FC = () => {
  const { selectTower, selectedTower, money, towerBlueprints, upgradeTowerBlueprint, spendMoney, currentTier } = useGameState();
  const { t } = useTranslation();

  const handleTechUpgrade = (e: React.MouseEvent, type: TowerType) => {
    e.stopPropagation();
    const config = TOWERS[type];
    const currentLevel = towerBlueprints[type];
    // Tech upgrade cost is higher: Base Upgrade Cost * Level * 2
    const cost = Math.floor((config.upgradeCost || 100) * currentLevel * 2);
    
    if (spendMoney(cost)) {
      upgradeTowerBlueprint(type);
    }
  };

  // Determine unlocked towers
  const unlockedTowers = new Set<TowerType>();
  TIER_GATES.forEach(gate => {
    if (gate.tier <= currentTier) {
      gate.unlocks.forEach(t => unlockedTowers.add(t));
    }
  });

  // Find next gate for UI feedback
  const nextGate = TIER_GATES.find(g => g.tier === currentTier + 1);

  return (
    <>
      {/* Progression Status */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        background: 'rgba(0,0,0,0.7)',
        padding: '15px',
        borderRadius: '10px',
        color: 'white',
        maxWidth: '300px',
        pointerEvents: 'none' // Let clicks pass through
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#00ffff' }}>
          {t('tier', { tier: currentTier, name: t(`tier${currentTier}Name`) })}
        </h3>
        <div style={{ fontSize: '14px', marginBottom: '10px' }}>
          {t(`tier${currentTier}Desc`)}
        </div>
        
        {nextGate && (
          <div style={{ borderTop: '1px solid #555', paddingTop: '10px' }}>
            <div style={{ color: '#aaa', fontSize: '12px', marginBottom: '5px' }}>{t('nextTierRequirements')}</div>
            {nextGate.requirements.map((req, i) => {
              const towerName = t(TOWERS[req.tower].name);
              const currentCount = useGameState.getState().towers.filter(t => t.type === req.tower).length;
              const currentLevel = towerBlueprints[req.tower];
              
              let status = '';
              let met = false;

              if (req.count) {
                met = currentCount >= req.count;
                status = t('placed', { current: currentCount, total: req.count });
              } else if (req.minUpgradeLevel) {
                met = currentLevel >= req.minUpgradeLevel;
                status = t('techLevel', { current: currentLevel, total: req.minUpgradeLevel });
              }

              return (
                <div key={i} style={{ 
                  color: met ? '#4CAF50' : '#FF5252',
                  fontSize: '13px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>{towerName}</span>
                  <span>{status}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '10px',
        background: 'rgba(0,0,0,0.5)',
        padding: '10px',
        borderRadius: '10px',
        pointerEvents: 'all'
      }}>
        {(Object.keys(TOWERS) as TowerType[]).map((type) => {
          const config = TOWERS[type];
          const isSelected = selectedTower === type;
          const canAfford = money >= config.cost;
          const level = towerBlueprints[type];
          const techUpgradeCost = Math.floor((config.upgradeCost || 100) * level * 2);
          const canAffordUpgrade = money >= techUpgradeCost;
          const isUnlocked = unlockedTowers.has(type);

          if (!isUnlocked) {
             // Render locked placeholder or nothing?
             // User said: "Show next-tier holograms" or "Tooltip listing missing towers".
             // For now, let's render a locked button.
             return (
               <div key={type} style={{ display: 'flex', flexDirection: 'column', gap: '5px', opacity: 0.5, filter: 'grayscale(1)' }}>
                  <button
                    style={{
                      padding: '10px',
                      background: '#333',
                      border: '1px solid #555',
                      borderRadius: '5px',
                      cursor: 'not-allowed',
                      minWidth: '120px',
                      color: '#888'
                    }}
                    disabled
                  >
                    <div style={{ fontWeight: 'bold' }}>{t('locked')}</div>
                    <div>{t('requiresTier', { tier: TIER_GATES.find(g => g.unlocks.includes(type))?.tier || '?' })}</div>
                  </button>
               </div>
             );
          }

          return (
            <div key={type} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <button
                onClick={() => selectTower(isSelected ? null : type)}
                style={{
                  padding: '10px',
                  background: isSelected ? '#4CAF50' : canAfford ? '#fff' : '#ccc',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: canAfford ? 'pointer' : 'not-allowed',
                  opacity: canAfford ? 1 : 0.5,
                  minWidth: '120px'
                }}
                disabled={!canAfford && !isSelected}
              >
                <div style={{ fontWeight: 'bold' }}>{t(config.name)}</div>
                <div>${config.cost} ({t('techLvl', { level })})</div>
              </button>
              
              <button
                onClick={(e) => handleTechUpgrade(e, type)}
                style={{
                  padding: '5px',
                  background: canAffordUpgrade ? '#FF9800' : '#555',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: canAffordUpgrade ? 'pointer' : 'not-allowed',
                  fontSize: '12px'
                }}
                disabled={!canAffordUpgrade}
              >
                {t('upgradeTech', { cost: techUpgradeCost })}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
};
