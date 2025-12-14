import React from 'react';
import { useGameState } from '../state/gameState';
import { TOWERS, TowerType, CHARACTERS } from '../game/config/gameConfig';
import { TIER_GATES } from '../game/config/progressionConfig';
import { useTranslation } from './hooks/useTranslation';
import { TowerCard, UpgradeButton } from './CyberUI';

export const TowerMenu: React.FC = () => {
  const { selectTower, selectedTower, money, towerBlueprints, upgradeTowerBlueprint, spendMoney, currentTier, towers, eliminatedCharacterIds } = useGameState();
  const { t } = useTranslation();

  const eliminated = new Set(eliminatedCharacterIds);
  const aliveIds = Object.keys(CHARACTERS).filter((id) => !eliminated.has(id));
  const assignedIds = new Set(towers.map((tw) => tw.assignedCharacter).filter(Boolean) as string[]);
  const hasAvailableOfficer = aliveIds.some((id) => !assignedIds.has(id));

  const handleTechUpgrade = (type: TowerType) => {
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
              const currentCount = towers.filter(t => t.type === req.tower).length;
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
        pointerEvents: 'all',
        overflowX: 'auto',
        maxWidth: '100vw',
        justifyContent: 'center'
      }}>
        {(Object.keys(TOWERS) as TowerType[]).map((type) => {
          const config = TOWERS[type];
          const isSelected = selectedTower === type;
          const canAfford = money >= config.cost && hasAvailableOfficer;
          const level = towerBlueprints[type];
          const techUpgradeCost = Math.floor((config.upgradeCost || 100) * level * 2);
          const canAffordUpgrade = money >= techUpgradeCost;
          const isUnlocked = unlockedTowers.has(type);

          if (!isUnlocked) {
             return (
               <TowerCard
                  key={type}
                  name={t(config.name)}
                  cost={config.cost}
                  techLevel={level}
                  isLocked={true}
               />
             );
          }

          return (
            <TowerCard
              key={type}
              name={t(config.name)}
              cost={config.cost}
              techLevel={level}
              isSelected={isSelected}
              canAfford={canAfford}
              onClick={() => {
                if (!hasAvailableOfficer) return;
                selectTower(isSelected ? null : type);
              }}
            >
              <UpgradeButton
                cost={techUpgradeCost}
                onUpgrade={() => handleTechUpgrade(type)}
                canAfford={canAffordUpgrade}
                variant="orange"
              />
            </TowerCard>
          );
        })}
      </div>
    </>
  );
};
