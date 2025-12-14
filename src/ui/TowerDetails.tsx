import React from 'react';
import { useGameState } from '../state/gameState';
import { TOWERS, getTowerStats, UPGRADE_SOUNDS, CHARACTERS } from '../game/config/gameConfig';
import { soundManager } from '../game/utils/SoundManager';
import { useTranslation } from './hooks/useTranslation';

export const TowerDetails: React.FC = () => {
  const { selectedTowerId, towers, updateTower, spendMoney, isMovingMode, setMovingMode, setPendingMovePosition, miners, updateMiner, language, eliminatedCharacterIds } = useGameState();
  const { t } = useTranslation();

  if (!selectedTowerId) return null;

  const tower = towers.find(t => t.id === selectedTowerId);
  if (!tower) return null;

  const config = TOWERS[tower.type];
  const level = tower.level || 1;
  
  const eliminated = new Set(eliminatedCharacterIds || []);
  const fallbackCharId = config.character && !eliminated.has(config.character) ? config.character : undefined;
  const assignedCharId = tower.assignedCharacter || fallbackCharId;
  const assignedChar = assignedCharId ? CHARACTERS[assignedCharId] : null;

  // Calculate available characters
  const usedCharacterIds = new Set(
    towers
      .filter(t => t.id !== tower.id && t.assignedCharacter)
      .map(t => t.assignedCharacter)
  );
  const totalCharacters = Object.keys(CHARACTERS).length;
  const remainingTotal = Math.max(0, totalCharacters - (eliminatedCharacterIds?.length || 0));
  const availableCount = Math.max(0, remainingTotal - usedCharacterIds.size);

  const currentStats = getTowerStats(tower.type, level, tower.assignedCharacter);
  const nextStats = getTowerStats(tower.type, level + 1, tower.assignedCharacter);
  
  const upgradeCost = Math.floor(nextStats.cost || 0);

  const handleUpgrade = () => {
    if (spendMoney(upgradeCost)) {
      const newLevel = level + 1;
      updateTower(tower.id, { level: newLevel });
      
      // If miner station, update existing miners
      if (tower.type === 'miner_station') {
        const newStats = getTowerStats(tower.type, newLevel, tower.assignedCharacter);
        const stationMiners = miners.filter(m => m.stationId === tower.id);
        stationMiners.forEach(miner => {
            updateMiner(miner.id, {
                speed: newStats.minerSpeed,
                maxCapacity: newStats.minerCapacity,
                miningRate: newStats.minerMiningRate,
                maxHealth: newStats.minerHealth,
                health: Math.min(miner.health, newStats.minerHealth || miner.health), // Don't heal fully, but cap
                model: newStats.minerModel
            });
        });
      }

      // Play random upgrade sound
      const sound = UPGRADE_SOUNDS[Math.floor(Math.random() * UPGRADE_SOUNDS.length)];
      soundManager.play(sound, 0.4);

      // Play character upgrade phrase
      if (assignedChar && assignedChar.audio?.[language]?.upgrade_powerup) {
          soundManager.play(assignedChar.audio[language].upgrade_powerup, 0.6);
      }
    }
  };

  const handleCharacterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCharacterId = e.target.value;
    updateTower(tower.id, { assignedCharacter: newCharacterId });
  };

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      right: 20,
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '20px',
      borderRadius: '10px',
      color: 'white',
      width: '250px',
      pointerEvents: 'all'
    }}>
      <h2 style={{ margin: '0 0 10px 0', color: config.color }}>{t(config.name)}</h2>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#aaa' }}>
            {t('assignedCharacter')} ({availableCount} {t('available')}):
        </label>
        <select 
          value={tower.assignedCharacter || fallbackCharId || ''} 
            onChange={handleCharacterChange}
            style={{
                width: '100%',
                padding: '5px',
                background: '#333',
                color: 'white',
                border: '1px solid #555',
                borderRadius: '4px',
                marginBottom: '10px'
            }}
        >
            <option value="">{t('default')}</option>
            {Object.entries(CHARACTERS).map(([id, char]) => {
                const isUsed = usedCharacterIds.has(id);
            const isEliminated = eliminated.has(id);
                return (
              <option key={id} value={id} disabled={isUsed || isEliminated}>
                  {char.name} {isUsed ? `(${t('assigned')})` : ''}
                    </option>
                );
            })}
        </select>
        
        {assignedChar && (
            <div style={{ marginBottom: '10px', borderRadius: '4px', overflow: 'hidden' }}>
                <video 
                    src={assignedChar.videos.intro?.[0] || assignedChar.videos.selected?.[0]} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    style={{ width: '100%', display: 'block' }} 
                />
            </div>
        )}

        {assignedChar && assignedChar.stats && (
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '5px',
                fontSize: '12px', 
                color: '#4CAF50',
                background: 'rgba(76, 175, 80, 0.1)',
                padding: '8px',
                borderRadius: '4px'
            }}>
                <div>{t('rangeBonus')}: +{assignedChar.stats.rangeBonus.toFixed(1)}</div>
                <div>{t('damageBonus')}: +{assignedChar.stats.damageBonus.toFixed(1)}</div>
                <div>{t('fireRateBonus')}: +{assignedChar.stats.fireRateBonus.toFixed(1)}</div>
                <div>{t('healthBonus')}: +{assignedChar.stats.healthBonus.toFixed(1)}</div>
            </div>
        )}
      </div>

      {tower.type === 'engineering_station' && (
        <div style={{ 
            marginBottom: '15px', 
            padding: '10px', 
            background: 'rgba(0, 255, 255, 0.1)', 
            borderRadius: '5px',
            border: '1px solid rgba(0, 255, 255, 0.3)'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#00ffff', fontWeight: 'bold' }}>
            <input 
              type="checkbox" 
              checked={tower.autoUpgradeEnabled || false}
              onChange={(e) => updateTower(tower.id, { autoUpgradeEnabled: e.target.checked })}
              style={{ marginRight: '10px', transform: 'scale(1.2)' }}
            />
            {t('autoUpgrade')}
          </label>
          <div style={{ fontSize: '11px', color: '#ccc', marginTop: '5px', lineHeight: '1.2' }}>
            Automatically upgrades nearby towers using available money.
          </div>
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <div>{t('level')}: {level}</div>
        <div>{t('health')}: {Math.floor(tower.health)} / {Math.floor(tower.maxHealth)}</div>
        <div>{t('energy')}: {Math.floor(tower.energy)} / {config.maxEnergy}</div>
        {tower.type === 'miner_station' ? (
          <>
            <div>{t('speed')}: {Math.floor(currentStats.minerSpeed || 0)}</div>
            <div>{t('capacity')}: {Math.floor(currentStats.minerCapacity || 0)}</div>
            <div>{t('rate')}: {Math.floor(currentStats.minerMiningRate || 0)}</div>
          </>
        ) : tower.type === 'engineering_station' ? (
           <>
            <div>{t('range')}: {Math.floor(currentStats.range)}</div>
            <div style={{fontSize: '12px', color: '#aaa', marginTop: '2px'}}>Upgrades allies in range</div>
           </>
        ) : (
          <>
            <div>{t('damage')}: {Math.floor(currentStats.damage)}</div>
            <div>{t('range')}: {Math.floor(currentStats.range)}</div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleUpgrade}
          style={{
            flex: 1,
            padding: '10px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {t('upgrade')} (${upgradeCost}) (U)
        </button>

        <button
          onClick={() => {
            if (isMovingMode) {
              setMovingMode(false);
              setPendingMovePosition(null);
            } else {
              setMovingMode(true);
            }
          }}
          style={{
            flex: 1,
            padding: '10px',
            background: isMovingMode ? '#FFC107' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {isMovingMode ? `${t('cancelMove')} (Esc)` : `${t('move')} (M)`}
        </button>
      </div>
      
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#aaa' }}>
        {isMovingMode 
            ? t('clickToPlace') 
            : t('selectMove')}
      </div>
    </div>
  );
};
