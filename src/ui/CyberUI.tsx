import React from 'react';
import './CyberUI.css'; // Assuming you have a CSS file for styling

// Define the structure for a single tower's data
export interface TowerData {
  name: string;
  cost: number;
  techLevel: number;
}

// Define the structure for a single upgrade button's data
export interface UpgradeData {
  cost: number;
  onUpgrade: (cost: number) => void;
}

// Props for a single TowerCard component
export interface TowerCardProps {
  name: string;
  cost: number;
  techLevel: number;
  isSelected?: boolean;
  isLocked?: boolean;
  canAfford?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

// Props for a single UpgradeButton component
export interface UpgradeButtonProps {
  cost: number;
  onUpgrade: () => void;
  canAfford?: boolean;
  variant?: 'orange' | 'blue' | 'pink'; // Optional color variant
}

// Props for the main CyberpunkUI component
interface CyberpunkUIProps {
  towers: TowerData[];
  upgrades: UpgradeData[];
}

// --- Individual Components ---

// A single cyberpunk-styled card for displaying tower info
export const TowerCard: React.FC<TowerCardProps> = ({ 
  name, 
  cost, 
  techLevel, 
  isSelected, 
  isLocked, 
  canAfford = true, 
  onClick, 
  children 
}) => {
  return (
    <div 
      className={`cyberpunk-tower-card ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''} ${!canAfford ? 'cant-afford' : ''}`}
      onClick={!isLocked ? onClick : undefined}
      style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
    >
      <div className="card-content">
        <h3 className="tower-name">{name}</h3>
        <div className="tower-details">
          {isLocked ? (
             <span className="tower-locked">LOCKED</span>
          ) : (
            <>
              <span className="tower-cost">${cost}</span>
              <span className="tower-tech-level">(Tech Lvl {techLevel})</span>
            </>
          )}
        </div>

        {!isLocked && (
          <div className="tower-select-hint" aria-hidden="true">
            {isSelected ? 'SELECTED' : 'CLICK TO SELECT'}
          </div>
        )}

        {children ? (
          <div className="tower-actions" onClick={(e) => e.stopPropagation()}>
            {children}
          </div>
        ) : null}
      </div>
      <div className="card-glow"></div>
    </div>
  );
};

// A single cyberpunk-styled button for upgrades
export const UpgradeButton: React.FC<UpgradeButtonProps> = ({ cost, onUpgrade, canAfford = true, variant = 'orange' }) => {
  return (
    <button
      className={`cyberpunk-upgrade-button ${variant}`}
      onClick={(e) => {
        e.stopPropagation();
        if (canAfford) onUpgrade();
      }}
      disabled={!canAfford}
      style={{ opacity: canAfford ? 1 : 0.5, cursor: canAfford ? 'pointer' : 'not-allowed' }}
    >
      <span className="button-text">Upgrade Tech (${cost})</span>
      <div className="button-glow"></div>
      <div className="sparks"></div>
    </button>
  );
};

// --- Main Component ---

// The main component that renders the entire UI from the image
const CyberpunkUI: React.FC<CyberpunkUIProps> = ({ towers, upgrades }) => {
  // In a real app, you'd probably map these. For now, we'll statically place them to match the image.
  const towerRow1 = towers.slice(0, 3);
  const towerRow2 = towers.slice(3, 6);

  return (
    <div className="cyberpunk-ui-container">
      <div className="tower-row">
        {towerRow1.map((tower, index) => (
          <TowerCard 
            key={index} 
            name={tower.name}
            cost={tower.cost}
            techLevel={tower.techLevel}
          />
        ))}
      </div>
      <div className="tower-row">
        {towerRow2.map((tower, index) => (
          <TowerCard 
            key={index} 
            name={tower.name}
            cost={tower.cost}
            techLevel={tower.techLevel}
          />
        ))}
      </div>
      <div className="upgrade-row">
        {upgrades.map((upgrade, index) => {
          // Assign variants based on index to match the image
          let variant: 'orange' | 'blue' | 'pink' = 'orange';
          if (index === 1) variant = 'blue';
          if (index === 2) variant = 'pink';
          
          return (
            <UpgradeButton
              key={index}
              cost={upgrade.cost}
              onUpgrade={() => upgrade.onUpgrade(upgrade.cost)}
              variant={variant}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CyberpunkUI;

// --- Example Usage ---
/*
// In your parent component:

const towerData: TowerData[] = [
  { name: 'Basic Tower', cost: 100, techLevel: 1 },
  { name: 'Sniper Tower', cost: 200, techLevel: 14 },
  { name: 'Cannon Tower', cost: 150, techLevel: 1 },
  { name: 'Corsair Tower', cost: 180, techLevel: 1 },
  { name: 'Miner Station', cost: 300, techLevel: 3 },
  { name: 'Engineering Dock', cost: 500, techLevel: 2 },
];

const handleUpgrade = (cost: number) => {
  console.log(`Upgrading tech for $${cost}`);
};

const upgradeData: UpgradeData[] = [
  { cost: 300, onUpgrade: handleUpgrade },
  { cost: 800, onUpgrade: handleUpgrade },
  { cost: 2400, onUpgrade: handleUpgrade },
];

// ... inside your render method:
<CyberpunkUI towers={towerData} upgrades={upgradeData} />
*/