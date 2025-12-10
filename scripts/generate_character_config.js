import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIDEO_ROOT = path.join(__dirname, '../public/video/characters');
const AUDIO_ROOT = path.join(__dirname, '../public/audio/characters/catch_phrases');
const OUTPUT_FILE = path.join(__dirname, '../src/game/config/characterConfig.ts');

// Map folder names to config keys
const FOLDER_MAPPING = {
    'intro': 'intro',
    'selected': 'selected',
    'loop': 'selected', // Alias loop to selected
    'removed': 'removed',
    'outro': 'removed'  // Alias outro to removed
};

// Seeded random number generator
function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

// String hashing function
function cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return (h1^h2^h3^h4)>>>0;
}

function generateStats(name) {
    const seed = cyrb128(name);
    const rand = mulberry32(seed);
    
    // We want 4 stats: range, damage, fireRate, health
    // Total = 10
    // Min per stat = 0.5 (arbitrary, but ensures > 0)
    
    const minVal = 0.5;
    const numStats = 4;
    const total = 10;
    const available = total - (minVal * numStats); // 8
    
    const weights = [rand(), rand(), rand(), rand()];
    const weightSum = weights.reduce((a, b) => a + b, 0);
    
    const stats = weights.map(w => {
        const share = (w / weightSum) * available;
        return Number((minVal + share).toFixed(2));
    });
    
    // Adjust rounding errors to ensure exactly 10
    const currentSum = stats.reduce((a, b) => a + b, 0);
    const diff = total - currentSum;
    stats[0] = Number((stats[0] + diff).toFixed(2));
    
    return {
        rangeBonus: stats[0],
        damageBonus: stats[1],
        fireRateBonus: stats[2],
        healthBonus: stats[3]
    };
}

function getFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
        .filter(file => file.endsWith('.mp4') || file.endsWith('.webm'))
        .map(file => path.join(dir, file));
}

function generateConfig() {
    if (!fs.existsSync(VIDEO_ROOT)) {
        console.error(`Directory not found: ${VIDEO_ROOT}`);
        return;
    }

    const characters = {};
    const charDirs = fs.readdirSync(VIDEO_ROOT, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    charDirs.forEach(charName => {
        const charPath = path.join(VIDEO_ROOT, charName);
        const charConfig = {
            name: '',
            videos: {
                intro: [],
                selected: [],
                removed: []
            }
        };

        // Fix name capitalization properly
        charConfig.name = charName.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        // Generate stats based on name
        charConfig.stats = generateStats(charName);

        const subDirs = fs.readdirSync(charPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        subDirs.forEach(subDir => {
            const configKey = FOLDER_MAPPING[subDir.toLowerCase()];
            if (configKey) {
                const files = getFiles(path.join(charPath, subDir));
                // Convert absolute paths to public-relative URL paths
                const urls = files.map(f => {
                    const relative = path.relative(path.join(__dirname, '../public'), f);
                    return '/' + relative.replace(/\\/g, '/'); // Ensure forward slashes
                });
                charConfig.videos[configKey].push(...urls);
            }
        });

        characters[charName] = charConfig;

        // Audio Logic
        charConfig.audio = { en: {}, fr: {} };
        if (fs.existsSync(AUDIO_ROOT)) {
            ['en', 'fr'].forEach(lang => {
                const audioPath = path.join(AUDIO_ROOT, charName, lang);
                if (fs.existsSync(audioPath)) {
                    const audioFiles = fs.readdirSync(audioPath)
                        .filter(file => file.endsWith('.mp3'));
                    
                    audioFiles.forEach(file => {
                        const key = path.basename(file, '.mp3');
                        const relative = path.relative(path.join(__dirname, '../public'), path.join(audioPath, file));
                        charConfig.audio[lang][key] = '/' + relative.replace(/\\/g, '/');
                    });
                }
            });
        }
    });

    const fileContent = `// This file is auto-generated by scripts/generate_character_config.js
// Do not edit manually.

export interface CharacterConfig {
    name: string;
    videos: {
        intro?: string[];
        selected?: string[];
        removed?: string[];
    };
    audio: {
        en: Record<string, string>;
        fr: Record<string, string>;
    };
    stats: {
        rangeBonus: number;
        damageBonus: number;
        fireRateBonus: number;
        healthBonus: number;
    };
}

export const CHARACTERS: Record<string, CharacterConfig> = ${JSON.stringify(characters, null, 4)};
`;

    fs.writeFileSync(OUTPUT_FILE, fileContent);
    console.log(`Character config generated at ${OUTPUT_FILE}`);
}

generateConfig();
