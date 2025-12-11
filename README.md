# Threefold Bastion

A 3D Tower Defense game built with React, TypeScript, and React Three Fiber. Defend your base against waves of enemies using a variety of towers, officers, and strategic upgrades.

## 🎮 Features

*   **3D Gameplay**: Fully immersive 3D environment powered by Three.js and React Three Fiber.
*   **Tower Variety**: Deploy multiple tower types including Basic, Sniper, Cannon, Corsair, and support structures like Miner Stations, Command Nodes, and Engineering Docks.
*   **Character System**: Assign "Officers" to your towers, each with unique catchphrases and video introductions.
*   **Progression**: Advance through tech tiers (Boot Sector, Precision Systems, Mobile Warfare, Industrial Control) to unlock powerful upgrades.
*   **Resource Management**: Balance Money and Energy to build defenses and upgrade your tech level.
*   **Internationalization**: Full support for English and French languages.
*   **Rich Media**: Integrated audio system for music/sfx and video player for character interactions.

## 🛠 Tech Stack

*   **Core**: [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
*   **3D Engine**: [React Three Fiber](https://docs.pmnd.rs/react-three-fiber), [Three.js](https://threejs.org/)
*   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
*   **Helpers**: [Drei](https://github.com/pmndrs/drei) (Camera controls, Stars, etc.)
*   **Post-processing**: [@react-three/postprocessing](https://github.com/pmndrs/react-postprocessing) (Bloom effects)

## 🚀 Getting Started

### Prerequisites

*   Node.js (v16+ recommended)
*   Git LFS (Large File Storage) - Required for audio, video, and 3D model assets.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/mephisto83/threefold-bastion.git
    cd threefold-bastion
    ```

2.  **Install Git LFS:**
    If you haven't already, install Git LFS to pull the large asset files.
    ```bash
    git lfs install
    git lfs pull
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📁 Project Structure

```
threefold-bastion/
├── public/              # Static assets (models, audio, video, images)
├── scripts/             # Build/Utility scripts
├── src/
│   ├── game/            # 3D Game Logic
│   │   ├── components/  # R3F Components (Towers, Enemies, Map)
│   │   ├── config/      # Game configuration and translations
│   │   ├── hooks/       # Game loops and controls
│   │   ├── systems/     # Game systems (Audio, Wave, Logic)
│   │   └── utils/       # Helpers (Path generation, Asset loading)
│   ├── state/           # Global Zustand store (gameState.ts)
│   ├── ui/              # 2D UI Overlays (HUD, Menus, Screens)
│   ├── App.tsx          # Main application entry
│   └── index.tsx        # DOM entry point
└── ...config files
```

## 🕹 Controls

*   **Mouse**: Click to select/place towers.
*   **Camera**: Orbit controls (Left click to rotate, Right click to pan, Scroll to zoom).
*   **UI**: Interact with the HUD to build towers, upgrade tech, and manage game speed.

## 📦 Scripts

*   `npm run dev`: Start the development server.
*   `npm run build`: Build the project for production.
*   `npm run preview`: Preview the production build locally.
*   `npm run generate-config`: Run the character configuration generator script.

## 📄 License

[MIT](LICENSE)
