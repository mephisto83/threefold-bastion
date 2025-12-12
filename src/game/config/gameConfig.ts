import { CHARACTERS, CharacterConfig } from './characterConfig';
export { CHARACTERS, type CharacterConfig };

export interface TowerStats {
    range: number;
    damage: number;
    fireRate: number;
    health: number;
    cost?: number; // Cost to upgrade TO this level
    model?: string;
    moveSpeed?: number;
    damageType?: 'kinetic' | 'energy'; // New damage type
    // Miner specific stats
    minerSpeed?: number;
    minerCapacity?: number;
    minerMiningRate?: number;
    minerHealth?: number;
    minerModel?: string;
}

export const TOWERS = {
    basic: {
        name: "Basic Tower",
        character: "adam",
        model: "/models/towers/interceptorfighter/interceptor_fighter.glb",
        range: 8,
        damage: 10,
        fireRate: 1,
        cost: 100,
        color: "blue", // Fallback color if model fails
        modelOffset: [0, 1.5, 0],
        shootSound: "/audio/soundeffects/lasers/laser_shot_1.mp3",
        maxEnergy: 100,
        energyConsumption: 7,
        health: 200,
        upgradeCost: 150,
        moveSpeed: 2,
        damageType: 'kinetic',
        upgrades: [] as TowerStats[]
    },
    sniper: {
        name: "Sniper Tower",
        character: "jordan_porter",
        model: "/models/towers/gunship/gunship.glb",
        range: 15,
        damage: 40,
        fireRate: 0.5,
        cost: 200,
        color: "green",
        modelOffset: [0, 1.5, 0],
        shootSound: "/audio/soundeffects/lasers/laser_shot_2.mp3",
        maxEnergy: 100,
        energyConsumption: 10,
        health: 150,
        upgradeCost: 300,
        moveSpeed: 3,
        damageType: 'kinetic',
        upgrades: [
            {
                range: 20,
                damage: 80,
                fireRate: 0.6,
                model: "/models/towers/gunship/gunship.glb",
                cost: 300,
                moveSpeed: 15,
                damageType: 'kinetic'
            },
            {
                range: 25,
                damage: 150,
                fireRate: 0.7,
                model: "/models/towers/gunship/gunship.glb", // Placeholder for lv3
                cost: 500,
                moveSpeed: 18,
                damageType: 'kinetic'
            }
        ] as TowerStats[]
    },
    cannon: {
        name: "Cannon Tower",
        character: "adam",
        model: "/models/towers/cannon/cannon_ship.glb",
        range: 10,
        damage: 50,
        fireRate: 1.5,
        cost: 150,
        color: "black",
        modelOffset: [0, 1.5, 0],
        shootSound: "/audio/soundeffects/lasers/laser_shot_3.mp3",
        maxEnergy: 150,
        energyConsumption: 5,
        health: 300,
        upgradeCost: 250,
        moveSpeed: 2,
        damageType: 'energy',
        upgrades: [] as TowerStats[]
    },
    corsair: {
        name: "Corsair Tower",
        character: "adam",
        model: "/models/towers/corsairs/corsairs_1.glb",
        range: 12,
        damage: 30,
        fireRate: 1.2,
        cost: 180,
        color: "purple",
        modelOffset: [0, 2, 0],
        shootSound: "/audio/soundeffects/lasers/laser_shot_4.mp3",
        maxEnergy: 120,
        energyConsumption: 8,
        health: 250,
        upgradeCost: 280,
        moveSpeed: 4,
        damageType: 'energy',
        upgrades: [{
            range: 20,
            damage: 80,
            fireRate: 0.6,
            model: "/models/towers/corsairs/corsairs_2.glb",
            cost: 300,
            moveSpeed: 4,
            damageType: 'energy'
        }, {
            range: 20,
            damage: 80,
            fireRate: 0.7,
            model: "/models/towers/corsairs/corsairs_3.glb",
            cost: 400,
            moveSpeed: 5,
            damageType: 'energy'
        }, {
            range: 20,
            damage: 90,
            fireRate: 0.9,
            model: "/models/towers/corsairs/corsairs_4.glb",
            cost: 500,
            moveSpeed: 6,
            damageType: 'energy'
        }, {
            range: 20,
            damage: 100,
            fireRate: 1.0,
            model: "/models/towers/corsairs/corsairs_5.glb",
            cost: 700,
            moveSpeed: 7,
            damageType: 'energy'
        }, {
            range: 20,
            damage: 180,
            fireRate: 1.1,
            model: "/models/towers/corsairs/corsairs_6.glb",
            cost: 1000,
            moveSpeed: 8,
            damageType: 'energy'
        }] as TowerStats[]
    },
    miner_station: {
        name: "Miner Station",
        character: "adam",
        model: "/models/towers/heavycarriership/heavy_carrier_ship.glb", // Placeholder
        range: 30, // Radius for miners
        damage: 0,
        fireRate: 0,
        cost: 300,
        color: "yellow",
        modelOffset: [0, 0, 0],
        shootSound: "",
        maxEnergy: 0,
        energyConsumption: 0,
        health: 500,
        upgradeCost: 500,
        moveSpeed: 1,
        damageType: 'kinetic',
        minerSpeed: 4,
        minerCapacity: 150,
        minerMiningRate: 15,
        minerHealth: 200,
        upgrades: [
            {
                range: 35,
                damage: 0,
                fireRate: 0,
                cost: 500,
                model: "/models/towers/heavycarriership/heavy_carrier_ship.glb",
                minerSpeed: 5,
                minerCapacity: 200,
                minerMiningRate: 20,
                minerHealth: 300,
                minerModel: "/models/towers/miners/miner.glb"
            },
            {
                range: 40,
                damage: 0,
                fireRate: 0,
                cost: 800,
                model: "/models/towers/heavycarriership/heavy_carrier_ship.glb",
                minerSpeed: 6,
                minerCapacity: 350,
                minerMiningRate: 40,
                minerHealth: 500,
                minerModel: "/models/towers/miners/miner.glb"
            },
            {
                range: 45,
                damage: 0,
                fireRate: 0,
                cost: 800,
                model: "/models/towers/heavycarriership/heavy_carrier_ship.glb",
                minerSpeed: 7,
                minerCapacity: 400,
                minerMiningRate: 45,
                minerHealth: 600,
                minerModel: "/models/towers/miners/miner.glb"
            }
        ] as TowerStats[]
    },
    command_node: {
        name: "Command Node",
        character: "alexander_porter",
        model: "/models/towers/command/command.glb", // Placeholder
        range: 15, // Buff radius
        damage: 0,
        fireRate: .1,
        cost: 400,
        color: "orange",
        modelOffset: [0, 0, 0],
        shootSound: "",
        maxEnergy: 0,
        energyConsumption: 0,
        health: 400,
        upgradeCost: 400,
        moveSpeed: 2,
        damageType: 'kinetic',
        upgrades: [
            {
                range: 20,
                damage: 0,
                fireRate: 1,
                health: 600,
                cost: 600,
                model: "/models/towers/command/command_2.glb"
            },
            {
                range: 25,
                damage: 0,
                fireRate: 2,
                health: 800,
                cost: 800,
                model: "/models/towers/stations/station_2.glb"
            }
        ] as TowerStats[]
    },
    engineering_station: {
        name: "Engineering Dock",
        character: "bob",
        model: "/models/towers/engineering/engineering_1.glb",
        range: 40, // Operational radius
        damage: 0,
        fireRate: 0,
        cost: 500,
        color: "cyan",
        modelOffset: [0, 0, 0],
        shootSound: "",
        maxEnergy: 0,
        energyConsumption: 0,
        health: 400,
        upgradeCost: 600,
        moveSpeed: 1,
        damageType: 'kinetic',
        upgrades: [] as TowerStats[]
    }
} as const;

export const ENGINEER_CONFIG = {
    speed: 8,
    model: "/models/towers/engineering/engineering_craft_1.glb",
    health: 150
};

export const MINER_CONFIG = {
    speed: 1, // Slightly faster
    maxCapacity: 150,
    miningRate: 15, // Faster mining
    model: "/models/towers/miners/miner.glb", // Placeholder
    health: 200,
    upgrades: [
        {
            speed: 2,
            maxCapacity: 200,
            miningRate: 20,
            health: 300,
            model: "/models/towers/miners/miner.glb"
        },
        {
            speed: 3,
            maxCapacity: 300,
            miningRate: 30,
            health: 400,
            model: "/models/towers/miners/miner.glb"
        },
        {
            speed: 4,
            maxCapacity: 450,
            miningRate: 45,
            health: 600,
            model: "/models/towers/miners/miner.glb"
        }
    ]
};

export const ROCK_CONFIG = {
    defaultAmount: 1000,
    model: "/models/environment/rock.glb"
};

export type TowerType = keyof typeof TOWERS;

export const ENEMIES = {
    grunt: {
        name: "Scarab",
        character: "adam",
        model: "/models/enemies/bugs/bug_1.glb",
        speed: 10,
        health: 150,
        shield: 50,
        reward: 10,
        color: "red",
        damage: 5,
        range: 5,
        fireRate: 2
    },
    ship: {
        name: "Wasp",
        character: "bob",
        model: "/models/enemies/bugs/bug_2.glb",
        speed: 6,
        health: 350,
        shield: 100,
        reward: 50,
        color: "blue",
        damage: 20,
        range: 8,
        fireRate: 1
    },
    tank: {
        name: "Beetle",
        character: "christophe",
        model: "/models/enemies/bugs/bug_3.glb",
        speed: 8,
        health: 550,
        shield: 200,
        reward: 25,
        color: "darkred",
        damage: 15,
        range: 6,
        fireRate: 1.5
    },
    spider: {
        name: "Spider",
        character: "adam",
        model: "/models/enemies/bugs/bug_4.glb",
        speed: 12,
        health: 120,
        shield: 30,
        reward: 15,
        color: "purple",
        damage: 8,
        range: 4,
        fireRate: 2.5
    },
    dragonfly: {
        name: "Dragonfly",
        character: "bob",
        model: "/models/enemies/bugs/bug_5.glb",
        speed: 14,
        health: 180,
        shield: 60,
        reward: 30,
        color: "cyan",
        damage: 12,
        range: 6,
        fireRate: 2
    },
    mantis: {
        name: "Mantis",
        character: "christophe",
        model: "/models/enemies/bugs/bug_6.glb",
        speed: 9,
        health: 400,
        shield: 150,
        reward: 40,
        color: "green",
        damage: 25,
        range: 3,
        fireRate: 1.2
    }
} as const;

export type EnemyType = keyof typeof ENEMIES;

export const EXPLOSION_SOUNDS = [
    '/audio/soundeffects/explosions/explosion_1.mp3',
    '/audio/soundeffects/explosions/explosion_2.mp3',
    '/audio/soundeffects/explosions/explosion_3.mp3',
    '/audio/soundeffects/explosions/explosion_4.mp3',
];

export const UPGRADE_SOUNDS = [
    '/audio/soundeffects/upgrade/upgrade_1.mp3',
    '/audio/soundeffects/upgrade/upgrade_2.mp3',
    '/audio/soundeffects/upgrade/upgrade_3.mp3',
    '/audio/soundeffects/upgrade/upgrade_4.mp3',
];

export const getWaveConfig = (wave: number) => {
    const enemyTypes = Object.keys(ENEMIES) as EnemyType[];
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

    // Scale difficulty
    // Increase count more slowly to improve performance
    const count = Math.min(15,   5 + Math.floor(wave * 0.2)); 
   
    const interval = Math.max(0.5, 2 - (wave * 0.05)); // Decrease interval slightly, min 0.5s

    return {
        count,
        interval,
        type
    };
};

export const getTowerStats = (type: TowerType, level: number, characterId?: string): TowerStats => {
    const config = TOWERS[type];
    
    // Calculate base stats based on level
    let stats: TowerStats;

    if (level <= 1) {
        stats = {
            range: config.range,
            damage: config.damage,
            fireRate: config.fireRate,
            health: config.health,
            model: config.model,
            moveSpeed: (config as any).moveSpeed || 15,
            cost: 0
        };
    } else {
        // Check for explicit upgrade config
        let upgradeStats: Partial<TowerStats> | null = null;
        if ('upgrades' in config && Array.isArray((config as any).upgrades)) {
            const upgrades = (config as any).upgrades as TowerStats[];
            if (upgrades.length > 0) {
                const index = Math.min(level - 2, upgrades.length - 1);
                if (index >= 0) {
                    upgradeStats = upgrades[index];
                }
            }
        }

        if (upgradeStats) {
             stats = {
                range: config.range,
                damage: config.damage,
                fireRate: config.fireRate,
                health: config.health,
                moveSpeed: (config as any).moveSpeed || 15,
                cost: 0,
                ...upgradeStats,
                model: upgradeStats.model || config.model
            };
        } else {
            // Fallback formula
            stats = {
                range: config.range * (1 + (level - 1) * 0.1),
                damage: config.damage * (1 + (level - 1) * 0.2),
                fireRate: Math.max(0.1, config.fireRate * (1 - (level - 1) * 0.05)),
                health: config.health * (1 + (level - 1) * 0.2),
                model: config.model,
                cost: (config.upgradeCost || 100) * (1 + (level - 1) * 0.5),
                moveSpeed: ((config as any).moveSpeed || 15) * (1 + (level - 1) * 0.1),
                minerSpeed: ((config as any).minerSpeed || 8) * (1 + (level - 1) * 0.1),
                minerCapacity: ((config as any).minerCapacity || 150) * (1 + (level - 1) * 0.2),
                minerMiningRate: ((config as any).minerMiningRate || 15) * (1 + (level - 1) * 0.2),
                minerHealth: ((config as any).minerHealth || 200) * (1 + (level - 1) * 0.2),
                minerModel: (config as any).minerModel || MINER_CONFIG.model
            };
        }
    }

    // Apply Character Bonuses
    const activeCharacterId = characterId || config.character;
    if (activeCharacterId && CHARACTERS[activeCharacterId]) {
        const charConfig = CHARACTERS[activeCharacterId];
        if (charConfig.stats) {
            stats.range += charConfig.stats.rangeBonus;
            stats.damage += charConfig.stats.damageBonus;
            // Fire rate is delay, so reduce it. 
            // Using formula: newDelay = oldDelay / (1 + bonus/10)
            stats.fireRate = stats.fireRate / (1 + charConfig.stats.fireRateBonus / 10);
            stats.health += charConfig.stats.healthBonus * 10;
        }
    }

    return stats;
};

export const getTowerModel = (type: TowerType, level: number, characterId?: string): string => {
    const stats = getTowerStats(type, level, characterId);
    return stats.model || TOWERS[type].model;
};


