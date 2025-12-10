export interface EffectConfig {
    folder: string;
    frameCount: number;
    startFrame: number; // 0 or 1
    duration: number; // seconds
    loop?: boolean;
    scale?: number;
}

export const EFFECTS: Record<string, EffectConfig> = {
    explosion_1: {
        folder: 'explosion_1',
        frameCount: 9,
        startFrame: 0,
        duration: 0.5,
        scale: 1
    },
    explosion_2: {
        folder: 'explosion_2',
        frameCount: 9,
        startFrame: 0,
        duration: 0.5,
        scale: 1
    },
    explosion_3: {
        folder: 'explosion_3',
        frameCount: 16,
        startFrame: 0,
        duration: 0.8,
        scale: 2
    },
    fire_big: {
        folder: 'fire_big',
        frameCount: 8,
        startFrame: 0,
        duration: 0.6,
        loop: true,
        scale: 1.5
    },
    electricity: {
        folder: 'electricity',
        frameCount: 36,
        startFrame: 0,
        duration: 1.0,
        loop: true,
        scale: 1.4
    },
    health_up: {
        folder: 'health_up',
        frameCount: 13,
        startFrame: 0,
        duration: 1.0,
        scale: 1.5
    },
    smoke_1: {
        folder: 'smoke_1',
        frameCount: 18,
        startFrame: 1,
        duration: 1.5,
        scale: 2
    }
};

export type EffectType = keyof typeof EFFECTS;
