import React from 'react';
import { useGameState } from '../state/gameState';
import { useTranslation } from './hooks/useTranslation';
import { CHARACTERS } from '../game/config/gameConfig';

export const GameOverScreen: React.FC = () => {
  const { status, startGame, runStats, characterRunStats } = useGameState();
  const { t } = useTranslation();

  if (status !== 'gameover' && status !== 'victory') return null;

  const durationMs = runStats.startedAtMs && runStats.endedAtMs ? runStats.endedAtMs - runStats.startedAtMs : null;
  const durationSec = durationMs != null ? Math.max(0, Math.floor(durationMs / 1000)) : null;

  const rows = Object.entries(CHARACTERS)
    .map(([id, char]) => ({
      id,
      name: char.name,
      stats: characterRunStats[id],
    }))
    .filter((r) => {
      const s = r.stats;
      return s && (s.towersAssigned > 0 || s.towersLost > 0 || s.enemyKills > 0);
    });

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      zIndex: 10
    }}>
      <h1 style={{ color: status === 'victory' ? '#4CAF50' : '#F44336' }}>
        {status === 'victory' ? t('victory') : t('gameOver')}
      </h1>

      <div
        style={{
          width: 'min(900px, 92vw)',
          maxHeight: '55vh',
          overflow: 'auto',
          background: 'rgba(0,0,0,0.55)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 10,
          padding: 16,
          marginBottom: 18,
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 10, letterSpacing: '0.06em' }}>RUN STATS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontFamily: 'monospace' }}>
          <div>Duration: {durationSec == null ? '-' : `${durationSec}s`}</div>
          <div>Damage Taken: {runStats.damageTaken}</div>
          <div>Waves Started: {runStats.wavesStarted}</div>
          <div>Waves Completed: {runStats.wavesCompleted}</div>
          <div>Enemies Defeated: {runStats.enemiesKilled}</div>
          <div>Money Earned: {runStats.moneyEarned}</div>
          <div>Money Spent: {runStats.moneySpent}</div>
          <div>Towers Built: {runStats.towersBuilt}</div>
          <div>Towers Lost: {runStats.towersDestroyed}</div>
          <div>Officers Lost: {runStats.officersLost}</div>
        </div>

        {rows.length > 0 && (
          <>
            <div style={{ fontWeight: 800, marginTop: 16, marginBottom: 10, letterSpacing: '0.06em' }}>OFFICER STATS</div>
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.18)' }}>
                    <th style={{ padding: '8px 6px' }}>Officer</th>
                    <th style={{ padding: '8px 6px' }}>Towers Assigned</th>
                    <th style={{ padding: '8px 6px' }}>Towers Lost</th>
                    <th style={{ padding: '8px 6px' }}>Enemy Kills</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <td style={{ padding: '8px 6px' }}>{r.name}</td>
                      <td style={{ padding: '8px 6px' }}>{r.stats?.towersAssigned ?? 0}</td>
                      <td style={{ padding: '8px 6px' }}>{r.stats?.towersLost ?? 0}</td>
                      <td style={{ padding: '8px 6px' }}>{r.stats?.enemyKills ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <button 
        onClick={startGame}
        style={{
          padding: '20px 40px',
          fontSize: '24px',
          cursor: 'pointer',
          background: 'white',
          color: 'black',
          border: 'none',
          borderRadius: '5px'
        }}
      >
        {t('restartGame')}
      </button>
    </div>
  );
};
