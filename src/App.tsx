import { GameCanvas } from './game/GameCanvas';
import { HUD } from './ui/HUD';
import { TowerMenu } from './ui/TowerMenu';
import { TowerDetails } from './ui/TowerDetails';
import { VideoPlayer } from './ui/VideoPlayer';
import { StartScreen } from './ui/StartScreen';
import { CharacterScreen } from './ui/CharacterScreen';
import { WaveIntermissionScreen } from './ui/WaveIntermissionScreen';
import { GameOverScreen } from './ui/GameOverScreen';
import { MusicPlayer } from './ui/MusicPlayer';
import { SettingsScreen } from './ui/SettingsScreen';
import { AssetPreloader } from './game/utils/AssetPreloader';
import { AudioSystem } from './game/systems/AudioSystem';
import { useGameState } from './state/gameState';
import { LoadingScreen } from './ui/LoadingScreen';

function App() {
  const { status } = useGameState();

  return (
    <div className="App">
      <LoadingScreen />
      <AssetPreloader />
      <AudioSystem />
      <MusicPlayer />
      <GameCanvas />
      
      {status === 'start' && <StartScreen />}
      {status === 'characters' && <CharacterScreen />}
      {status === 'wave_intermission' && (
        <>
          <HUD />
          <TowerMenu />
          <TowerDetails />
          <VideoPlayer />
          <WaveIntermissionScreen />
        </>
      )}
      {(status === 'playing' || status === 'gameover' || status === 'victory') && (
        <>
          <HUD />
          <TowerMenu />
          <TowerDetails />
          <VideoPlayer />
        </>
      )}
      {(status === 'gameover' || status === 'victory') && <GameOverScreen />}
      
      <SettingsScreen />
    </div>
  );
}

export default App;
