export const TRANSLATIONS = {
  en: {
    // Music Player
    musicPlayer: "Music Player",

    // HUD
    money: "Money",
    health: "Health",
    wave: "Wave",
    
    // Settings
    settings: "Settings",
    language: "Language",
    resumeGame: "Resume Game",
    english: "English",
    french: "Français",

    // Start Screen
    title: "Tower Defense 3D",
    startGame: "Start Game",
    viewCharacters: "View Characters",

    // Game Over
    gameOver: "Game Over",
    victory: "Victory!",
    restartGame: "Restart Game",

    // Wave Intermission
    waveCompleted: "Wave Completed",
    nextWave: "Next Wave",
    prepareForBattle: "Prepare for Battle!",
    waveComplete: "Wave {wave} Complete!",
    buildTowers: "Build towers and prepare for the next wave.",
    startWave: "Start Wave {wave}",

    // Tower Details
    assignedCharacter: "Assigned Officer",
    officers: "Officers",
    catchPhrases: "Catch Phrases",
    available: "Available",
    assigned: "Assigned",
    default: "Default",
    damage: "Damage",
    range: "Range",
    fireRate: "Fire Rate",
    upgrade: "Upgrade",
    cost: "Cost",
    level: "Level",
    energy: "Energy",
    speed: "Speed",
    capacity: "Capacity",
    rate: "Rate",
    move: "Move",
    cancelMove: "Cancel Move",
    clickToPlace: "Click map to place tower.",
    selectMove: "Select 'Move' to reposition.",

    // Tower Menu
    tier: "Tier {tier}: {name}",
    nextTierRequirements: "NEXT TIER REQUIREMENTS:",
    placed: "{current}/{total} Placed",
    techLevel: "Lvl {current}/{total} Tech",
    techLvl: "Tech Lvl {level}",
    upgradeTech: "Upgrade Tech (${cost})",
    locked: "LOCKED",
    requiresTier: "Requires Tier {tier}",

    // Tower Names
    "Basic Tower": "Basic Tower",
    "Sniper Tower": "Sniper Tower",
    "Cannon Tower": "Cannon Tower",
    "Corsair Tower": "Corsair Tower",
    "Miner Station": "Miner Station",
    "Command Node": "Command Node",
    "Engineering Dock": "Engineering Dock",

    // Character Screen
    characters: "Characters",
    selectCharacter: "Select a character to view details",
    back: "Back",
    rangeBonus: "Range Bonus",
    damageBonus: "Damage Bonus",
    fireRateBonus: "Fire Rate Bonus",
    healthBonus: "Health Bonus",

    // Progression
    tier1Name: "Boot Sector",
    tier1Desc: "Grid stability achieved. Sector expansion authorized.",
    tier2Name: "Precision Systems",
    tier2Desc: "Fleet composition meets mobile warfare threshold.",
    tier3Name: "Mobile Warfare",
    tier3Desc: "Industrial Control authorized.",
    tier4Name: "Industrial Control",
    tier4Desc: "Endgame protocols engaged.",

    // Auto Upgrade
    autoUpgrade: "Auto Upgrade",
  },
  fr: {
    // Music Player
    musicPlayer: "Lecteur Musique",

    // HUD
    money: "Argent",
    health: "Santé",
    wave: "Vague",
    
    // Settings
    settings: "Paramètres",
    language: "Langue",
    resumeGame: "Reprendre",
    english: "English",
    french: "Français",

    // Start Screen
    title: "Tower Defense 3D",
    startGame: "Commencer",
    viewCharacters: "Voir Personnages",

    // Game Over
    gameOver: "Partie Terminée",
    victory: "Victoire !",
    restartGame: "Recommencer",

    // Wave Intermission
    waveCompleted: "Vague Terminée",
    nextWave: "Vague Suivante",
    prepareForBattle: "Préparez-vous au Combat !",
    waveComplete: "Vague {wave} Terminée !",
    buildTowers: "Construisez des tours et préparez-vous pour la vague suivante.",
    startWave: "Lancer Vague {wave}",

    // Tower Details
    assignedCharacter: "Officier Assigné",
    officers: "Officiers",
    catchPhrases: "Phrases d'accroche",
    available: "Disponible",
    assigned: "Assigné",
    default: "Défaut",
    damage: "Dégâts",
    range: "Portée",
    fireRate: "Cadence",
    upgrade: "Améliorer",
    cost: "Coût",
    level: "Niveau",
    energy: "Énergie",
    speed: "Vitesse",
    capacity: "Capacité",
    rate: "Taux",
    move: "Déplacer",
    cancelMove: "Annuler",
    clickToPlace: "Cliquez sur la carte pour placer.",
    selectMove: "Sélectionnez 'Déplacer' pour repositionner.",

    // Tower Menu
    tier: "Niveau {tier}: {name}",
    nextTierRequirements: "PRÉREQUIS NIVEAU SUIVANT :",
    placed: "{current}/{total} Placé",
    techLevel: "Niv {current}/{total} Tech",
    techLvl: "Tech Niv {level}",
    upgradeTech: "Améliorer Tech (${cost})",
    locked: "VERROUILLÉ",
    requiresTier: "Requis Niveau {tier}",

    // Tower Names
    "Basic Tower": "Tour Basique",
    "Sniper Tower": "Tour Sniper",
    "Cannon Tower": "Tour Canon",
    "Corsair Tower": "Corsair",
    "Miner Station": "Station Minière",
    "Command Node": "Nœud de Commande",
    "Engineering Dock": "Quai d'Ingénierie",

    // Character Screen
    characters: "Personnages",
    selectCharacter: "Sélectionnez un personnage pour voir les détails",
    back: "Retour",
    rangeBonus: "Bonus Portée",
    damageBonus: "Bonus Dégâts",
    fireRateBonus: "Bonus Cadence",
    healthBonus: "Bonus Santé",

    // Progression
    tier1Name: "Secteur d'Amorçage",
    tier1Desc: "Stabilité de la grille atteinte. Expansion du secteur autorisée.",
    tier2Name: "Systèmes de Précision",
    tier2Desc: "La composition de la flotte atteint le seuil de guerre mobile.",
    tier3Name: "Guerre Mobile",
    tier3Desc: "Contrôle Industriel autorisé.",
    tier4Name: "Contrôle Industriel",
    tier4Desc: "Protocoles de fin de partie engagés.",

    // Auto Upgrade
    autoUpgrade: "Amélioration Auto",
  }
};

export type TranslationKey = keyof typeof TRANSLATIONS.en;
