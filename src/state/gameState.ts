import { create } from 'zustand';
import { Vector3 } from 'three';
import { TowerType, EnemyType, ROCK_CONFIG, CHARACTERS, TOWERS, ENEMIES } from '../game/config/gameConfig';
import { TIER_GATES } from '../game/config/progressionConfig';
import { generatePaths } from '../game/utils/pathGenerator';
import { soundManager } from '../game/utils/SoundManager';

export type GameStatus = 'start' | 'playing' | 'gameover' | 'victory' | 'wave_intermission' | 'characters' | 'instructions' | 'family_tree';

export type Language = 'en' | 'fr';

export interface VideoState {
  url: string;
  loop: boolean;
  priority: number; // 1: Ambient/Loop, 2: Event/Intro/Outro
  id: string;
}

export interface EnemyEntity {
  id: string;
  type: EnemyType;
  position: Vector3;
  rotation?: [number, number, number];
  offset: Vector3; // Random offset from path center
  pathIndex: number;
  progress: number; // 0 to 1 along the path
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  speed: number;
  scale?: number;
  frozen?: boolean;
  lastFired?: number;
}

export interface RockEntity {
  id: string;
  position: Vector3;
  velocity: Vector3;
  amount: number;
  maxAmount: number;
}

export interface MinerEntity {
  id: string;
  stationId: string; // The station this miner belongs to
  position: Vector3;
  rotation?: [number, number, number];
  targetId: string | null; // Rock ID or Tower ID
  state: 'idle' | 'moving_to_rock' | 'mining' | 'moving_to_tower' | 'depositing' | 'moving_to_station';
  carrying: number;
  maxCapacity: number;
  speed: number;
  miningRate: number;
  health: number;
  maxHealth: number;
  model?: string;
}

export interface EngineerEntity {
  id: string;
  stationId: string;
  position: Vector3;
  rotation?: [number, number, number];
  targetId: string | null; // Tower ID to upgrade
  state: 'idle' | 'moving_to_tower' | 'upgrading' | 'returning';
  speed: number;
  health: number;
  maxHealth: number;
  model?: string;
  workProgress?: number;
}

export interface TowerEntity {
  id: string;
  type: TowerType;
  level: number;
  position: Vector3;
  targetPosition?: Vector3 | null; // For movement
  lastFired: number;
  targetId: string | null;
  energy: number;
  maxEnergy: number;
  health: number;
  maxHealth: number;
  // Buffs
  damageMultiplier?: number;
  fireRateMultiplier?: number;
  rangeMultiplier?: number;
  lastBuffedTime?: number;
  assignedCharacter?: string;
  // Combat Movement
  homePosition?: Vector3;
  combatState?: 'idle' | 'engaging' | 'returning';
  rotation?: [number, number, number];
  // Engineering
  autoUpgradeEnabled?: boolean;
}

export interface ProjectileEntity {
  id: string;
  position: Vector3;
  targetId: string;
  damage: number;
  damageType?: 'kinetic' | 'energy';
  speed: number;
  startPosition: Vector3; // For lerping if needed
  faction: 'player' | 'enemy';
}

export interface EffectEntity {
  id: string;
  type: string;
  position: Vector3;
  startTime: number;
  scale?: number;
}

interface GameState {
  status: GameStatus;
  money: number;
  health: number;
  wave: number;
  paths: Vector3[][];
  enemies: EnemyEntity[];
  towers: TowerEntity[];
  projectiles: ProjectileEntity[];
  effects: EffectEntity[];
  rocks: RockEntity[];
  miners: MinerEntity[];
  engineers: EngineerEntity[];
  selectedTower: TowerType | null;
  selectedTowerId: string | null;
  isMovingMode: boolean;
  pendingMovePosition: Vector3 | null;
  towerBlueprints: Record<TowerType, number>;
  activeVideo: VideoState | null;
  
  // Settings
  isSettingsOpen: boolean;
  isLoading: boolean;
  language: Language;
  toggleSettings: () => void;
  setLoading: (loading: boolean) => void;
  setLanguage: (lang: Language) => void;

  // Actions
  playVideo: (url: string, loop: boolean, priority: number) => void;
  stopVideo: () => void;
  selectTower: (type: TowerType | null) => void;
  selectTowerId: (id: string | null) => void;
  setMovingMode: (isMoving: boolean) => void;
  setPendingMovePosition: (position: Vector3 | null) => void;
  upgradeTowerBlueprint: (type: TowerType) => void;
  
  currentTier: number;
  checkTierUnlock: () => void;

  showCharacters: () => void;
  showInstructions: () => void;
  showFamilyTree: () => void;
  showStartScreen: () => void;

  startGame: () => void;
  endGame: (victory: boolean) => void;
  takeDamage: (amount: number) => void;
  addMoney: (amount: number) => void;
  spendMoney: (amount: number) => boolean;
  nextWave: () => void;
  waveCompleted: () => void;

  spawnEnemy: (enemy: EnemyEntity) => void;
  updateEnemy: (id: string, updates: Partial<EnemyEntity>) => void;
  removeEnemy: (id: string) => void;

  addTower: (tower: TowerEntity) => void;
  updateTower: (id: string, updates: Partial<TowerEntity>) => void;
  removeTower: (id: string) => void;

  addRock: (rock: RockEntity) => void;
  updateRock: (id: string, updates: Partial<RockEntity>) => void;
  removeRock: (id: string) => void;

  addMiner: (miner: MinerEntity) => void;
  updateMiner: (id: string, updates: Partial<MinerEntity>) => void;
  removeMiner: (id: string) => void;

  addEngineer: (engineer: EngineerEntity) => void;
  updateEngineer: (id: string, updates: Partial<EngineerEntity>) => void;
  removeEngineer: (id: string) => void;

  addProjectile: (projectile: ProjectileEntity) => void;
  removeProjectile: (id: string) => void;
  updateProjectile: (id: string, position: Vector3) => void;

  addEffect: (effect: EffectEntity) => void;
  removeEffect: (id: string) => void;

  currentSpeaker: string | null;
  setCurrentSpeaker: (characterId: string | null) => void;
}

export const useGameState = create<GameState>((set, get) => ({
  status: 'start',
  money: 1500,
  health: 20,
  wave: 0,
  paths: generatePaths(1),
  enemies: [],
  towers: [],
  projectiles: [],
  effects: [],
  rocks: [],
  miners: [],
  engineers: [],
  selectedTower: null,
  selectedTowerId: null,
  isMovingMode: false,
  pendingMovePosition: null,
  towerBlueprints: {
    basic: 1,
    sniper: 1,
    cannon: 1,
    miner_station: 1,
    corsair: 1,
    command_node: 1,
    engineering_station: 1
  },
  activeVideo: null,

  isSettingsOpen: false,
  isLoading: true,
  language: 'en',
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
  setLoading: (loading) => set({ isLoading: loading }),
  setLanguage: (lang) => set({ language: lang }),

  playVideo: (url, loop, priority) => set((state) => {
    // If there is an active video with higher or equal priority, don't interrupt unless it's a new high priority event
    // Actually, usually new event > old event. But maybe we want to prevent spam.
    // Let's say: if current is priority 2 (intro), don't interrupt with priority 1 (loop).
    // If current is priority 1, interrupt with anything.
    // If current is priority 2, interrupt with priority 2.
    
    if (state.activeVideo && state.activeVideo.priority > priority) {
      return {};
    }
    return {
      activeVideo: {
        url,
        loop,
        priority,
        id: Math.random().toString(36).substr(2, 9)
      }
    };
  }),

  stopVideo: () => set({ activeVideo: null }),

  selectTower: (type) => set({ selectedTower: type, selectedTowerId: null, isMovingMode: false, pendingMovePosition: null }),
  selectTowerId: (id) => {
    const state = get();
    if (id) {
      const tower = state.towers.find(t => t.id === id);
      if (tower) {
        const config = TOWERS[tower.type];
        const characterId = tower.assignedCharacter || config.character;
        
        if (characterId && CHARACTERS[characterId]) {
          const charConfig = CHARACTERS[characterId];
          const video = charConfig.videos.selected?.[0];
          if (video) {
             state.playVideo(video, true, 1);
          }
          
          // Play audio
          const lang = state.language;
          if (charConfig.audio && charConfig.audio[lang] && charConfig.audio[lang].selected_acknowledged) {
             soundManager.play(charConfig.audio[lang].selected_acknowledged, 0.5);
          }
        }
      }
    } else {
        // Stop video if deselecting? Or maybe keep playing until something else happens?
        // User said "show various videos on loops when a tower or enemy is added or removed, or when selected."
        // If I deselect, maybe I should stop the loop.
        // But 'activeVideo' is global.
        // Let's leave it for now, or maybe clear it if it was a loop.
    }
    set({ selectedTowerId: id, selectedTower: null, isMovingMode: false, pendingMovePosition: null });
  },
  setMovingMode: (isMoving) => set({ isMovingMode: isMoving, pendingMovePosition: null }),
  setPendingMovePosition: (position) => set({ pendingMovePosition: position }),
  
  upgradeTowerBlueprint: (type) => {
    set((state) => ({
      towerBlueprints: {
        ...state.towerBlueprints,
        [type]: state.towerBlueprints[type] + 1
      }
    }));
    get().checkTierUnlock();
  },

  showCharacters: () => set({ status: 'characters' }),
  showInstructions: () => set({ status: 'instructions' }),
  showFamilyTree: () => set({ status: 'family_tree' }),
  showStartScreen: () => set({ status: 'start' }),

  startGame: () => {
    const initialRocks: RockEntity[] = [];
    for (let i = 0; i < 8; i++) {
      // Random position between -20 and 20
      let x = (Math.random() - 0.5) * 40;
      let z = (Math.random() - 0.5) * 40;
      
      // Keep away from center (path area)
      if (Math.sqrt(x*x + z*z) < 10) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 10 + Math.random() * 10;
        x = Math.cos(angle) * dist;
        z = Math.sin(angle) * dist;
      }
      
      initialRocks.push({
        id: `rock-${Date.now()}-${i}`,
        position: new Vector3(x, 0, z),
        velocity: new Vector3((Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.5),
        amount: ROCK_CONFIG.defaultAmount,
        maxAmount: ROCK_CONFIG.defaultAmount
      });
    }

    set({ 
      status: 'wave_intermission', 
      money: 1500, 
      health: 20, 
      wave: 0, 
      paths: generatePaths(1), 
      enemies: [], 
      towers: [], 
      projectiles: [], 
      rocks: initialRocks, 
      miners: [], 
      engineers: [],
      selectedTower: null,
      selectedTowerId: null,
      towerBlueprints: {
        basic: 1,
        sniper: 1,
        cannon: 1,
        miner_station: 1,
        corsair: 1,
        command_node: 1,
        engineering_station: 1
      },
      currentTier: 1
    });
  },
  
  currentTier: 1,
  checkTierUnlock: () => {
    const state = get();
    const nextTier = state.currentTier + 1;
    const gate = TIER_GATES.find(g => g.tier === nextTier);
    
    if (!gate) return;

    const requirementsMet = gate.requirements.every(req => {
      // Check count
      if (req.count) {
        const count = state.towers.filter(t => t.type === req.tower).length;
        if (count < req.count) return false;
      }

      // Check upgrade level
      if (req.minUpgradeLevel) {
        // Check blueprint level
        const level = state.towerBlueprints[req.tower];
        if (level < req.minUpgradeLevel) return false;
      }

      return true;
    });

    if (requirementsMet) {
      set({ currentTier: nextTier });
      // Could play a sound or show a notification here
      console.log(`Tier ${nextTier} Unlocked: ${gate.name}`);
    }
  },

  endGame: (victory) => set({ status: victory ? 'victory' : 'gameover' }),
  
  takeDamage: (amount) => {
    const newHealth = get().health - amount;
    if (newHealth <= 0) {
      get().endGame(false);
    }
    set({ health: Math.max(0, newHealth) });
  },

  addMoney: (amount) => set((state) => ({ money: state.money + amount })),
  spendMoney: (amount) => {
    const { money } = get();
    if (money >= amount) {
      set({ money: money - amount });
      return true;
    }
    return false;
  },
  nextWave: () => set((state) => ({ 
    wave: state.wave + 1, 
    paths: generatePaths(state.wave + 1),
    status: 'playing' 
  })),
  
  waveCompleted: () => {
    const state = get();
    // Play wave clear sound from a random tower
    if (state.towers.length > 0) {
        const randomTower = state.towers[Math.floor(Math.random() * state.towers.length)];
        const charId = randomTower.assignedCharacter || TOWERS[randomTower.type].character;
        const lang = state.language;
        if (charId && CHARACTERS[charId] && CHARACTERS[charId].audio?.[lang]?.kill_wave_clear) {
            soundManager.play(CHARACTERS[charId].audio[lang].kill_wave_clear, 0.6);
        }
    }
    set({ status: 'wave_intermission' });
  },

  spawnEnemy: (enemy) => {
    const state = get();
    const config = ENEMIES[enemy.type];
    if (config.character && CHARACTERS[config.character]) {
        const charConfig = CHARACTERS[config.character];
        const video = charConfig.videos.intro?.[0];
        if (video) {
            state.playVideo(video, false, 2);
        }
    }
    set((state) => ({ enemies: [...state.enemies, enemy] }));
  },
  updateEnemy: (id, updates) => set((state) => ({
    enemies: state.enemies.map((e) => (e.id === id ? { ...e, ...updates } : e))
  })),
  removeEnemy: (id) => {
    const state = get();
    const enemy = state.enemies.find(e => e.id === id);
    if (enemy) {
        const config = ENEMIES[enemy.type];
        if (config.character && CHARACTERS[config.character]) {
            const charConfig = CHARACTERS[config.character];
            const video = charConfig.videos.removed?.[0];
            if (video) {
                state.playVideo(video, false, 2);
            }
        }
    }
    set((state) => ({
        enemies: state.enemies.filter((e) => e.id !== id)
    }));
  },

  addTower: (tower) => {
    const state = get();
    
    // Auto-assign character
    const allCharacterIds = Object.keys(CHARACTERS);
    const assignedIds = new Set(state.towers.map(t => t.assignedCharacter).filter(Boolean));
    const availableId = allCharacterIds.find(id => !assignedIds.has(id));
    
    if (availableId) {
        tower.assignedCharacter = availableId;
    }

    // Play video for the assigned character
    const characterId = tower.assignedCharacter || TOWERS[tower.type].character;
    if (characterId && CHARACTERS[characterId]) {
        const charConfig = CHARACTERS[characterId];
        const video = charConfig.videos.intro?.[0];
        if (video) {
            state.playVideo(video, false, 2);
        }
    }
    set((state) => ({ towers: [...state.towers, tower] }));
    get().checkTierUnlock();
  },
  updateTower: (id, updates) => set((state) => ({
    towers: state.towers.map((t) => (t.id === id ? { ...t, ...updates } : t))
  })),
  removeTower: (id: string) => {
    const state = get();
    const tower = state.towers.find(t => t.id === id);
    if (tower) {
        const config = TOWERS[tower.type];
        const characterId = tower.assignedCharacter || config.character;
        
        if (characterId && CHARACTERS[characterId]) {
            const charConfig = CHARACTERS[characterId];
            const video = charConfig.videos.removed?.[0];
            if (video) {
                state.playVideo(video, false, 2);
            }
        }
    }
    set((state) => ({
        towers: state.towers.filter((t) => t.id !== id)
    }));
  },

  addRock: (rock) => set((state) => ({ rocks: [...state.rocks, rock] })),
  updateRock: (id, updates) => set((state) => ({
    rocks: state.rocks.map((r) => (r.id === id ? { ...r, ...updates } : r))
  })),
  removeRock: (id) => set((state) => ({
    rocks: state.rocks.filter((r) => r.id !== id)
  })),

  addMiner: (miner) => set((state) => ({ miners: [...state.miners, miner] })),
  updateMiner: (id, updates) => set((state) => ({
    miners: state.miners.map((m) => (m.id === id ? { ...m, ...updates } : m))
  })),
  removeMiner: (id) => set((state) => ({
    miners: state.miners.filter((m) => m.id !== id)
  })),

  addEngineer: (engineer) => set((state) => ({ engineers: [...state.engineers, engineer] })),
  updateEngineer: (id, updates) => set((state) => ({
    engineers: state.engineers.map((e) => (e.id === id ? { ...e, ...updates } : e))
  })),
  removeEngineer: (id) => set((state) => ({
    engineers: state.engineers.filter((e) => e.id !== id)
  })),

  addProjectile: (projectile) => set((state) => ({ projectiles: [...state.projectiles, projectile] })),
  removeProjectile: (id) => set((state) => ({
    projectiles: state.projectiles.filter((p) => p.id !== id)
  })),
  updateProjectile: (id, position) => set((state) => ({
    projectiles: state.projectiles.map((p) => (p.id === id ? { ...p, position } : p))
  })),

  addEffect: (effect) => set((state) => ({ effects: [...state.effects, effect] })),
  removeEffect: (id) => set((state) => ({
    effects: state.effects.filter((e) => e.id !== id)
  })),

  currentSpeaker: null,
  setCurrentSpeaker: (characterId) => set({ currentSpeaker: characterId }),
}));
