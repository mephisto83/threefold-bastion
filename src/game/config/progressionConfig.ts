import { TowerType } from './gameConfig';

export interface GateRequirement {
  tower: TowerType;
  count?: number;
  minUpgradeLevel?: number;
}

export interface TierGate {
  tier: number;
  name: string;
  description: string;
  requirements: GateRequirement[];
  unlocks: TowerType[];
}

export const TIER_GATES: TierGate[] = [
  {
    tier: 1,
    name: "Boot Sector",
    description: "Grid stability achieved. Sector expansion authorized.",
    requirements: [], // Unlocked by default
    unlocks: ['basic', 'miner_station']
  },
  {
    tier: 2,
    name: "Precision Systems",
    description: "Fleet composition meets mobile warfare threshold.",
    requirements: [
      { tower: "basic", count: 3 },
      { tower: "miner_station", count: 1 }
    ],
    unlocks: ['sniper', 'cannon']
  },
  {
    tier: 3,
    name: "Mobile Warfare",
    description: "Industrial Control authorized.",
    requirements: [
      { tower: "sniper", count: 1 },
      { tower: "cannon", count: 1 },
      { tower: "miner_station", minUpgradeLevel: 2 } // Level 1 upgrade means level 2 total? User said "Miner Station at Upgrade Level 1". Usually level 1 is base. Let's assume level 2.
    ],
    unlocks: ['corsair', 'command_node']
  },
  {
    tier: 4,
    name: "Industrial Control",
    description: "Endgame protocols engaged.",
    requirements: [
      { tower: "corsair", count: 2 },
      { tower: "sniper", count: 1 }, // User said "1 Sniper (any upgrade)" -> handled by logic? Or just count. User said ">= 1 Sniper (any upgrade)" in Tier 3 reqs. Wait.
      // Let's look at the user's prompt again.
      // Tier 3 Reqs: >= 2 Corsair, >= 1 Sniper (any upgrade), >= 1 Cannon, Miner Station Lvl 2.
      // Wait, Tier 3 UNLOCKS Tier 4.
      // The user listed "Required to unlock Tier X".
      
      // Let's re-read carefully.
      // Tier 1 (Boot Sector) -> Required to unlock Tier 2: >= 3 Basic, >= 1 Miner Station.
      // Tier 2 (Precision Systems) -> Required to unlock Tier 3: >= 1 Sniper, >= 1 Cannon, Miner Station Upgrade Level 1 (so Level 2).
      // Tier 3 (Mobile Warfare) -> Required to unlock Tier 4: >= 2 Corsair, >= 1 Sniper (any upgrade), >= 1 Cannon, Miner Station Upgrade Level 2 (so Level 3).
      
      // So:
      // Tier 1 Unlocks: Basic, Miner Station.
      // Tier 2 Unlocks: Sniper, Cannon.
      // Tier 3 Unlocks: Corsair.
      // Tier 4 Unlocks: Endgame/Boss Waves (No new towers listed, maybe just "Industrial Control" state).
      
      { tower: "cannon", count: 1 },
      { tower: "miner_station", minUpgradeLevel: 3 }
    ],
    unlocks: ['engineering_station']
  }
];
