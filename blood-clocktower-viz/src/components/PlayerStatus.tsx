import React from 'react';
import { PlayerState } from '../types';
import { isEvilCharacter, getTeamColor } from '../gameData';
import './PlayerStatus.css';

interface PlayerStatusProps {
  players: PlayerState[];
}

const PlayerStatus: React.FC<PlayerStatusProps> = ({ players }) => {
  // Safety check for undefined players
  if (!players || players.length === 0) {
    return (
      <div className="player-status">
        <h2>Player Status</h2>
        <div className="no-players">No player data available</div>
      </div>
    );
  }

  // Keep players in seating order (as they appear in the game state)
  // Separate players into good and evil teams for counting
  const goodPlayers = players.filter(player => !isEvilCharacter(player.character));
  const evilPlayers = players.filter(player => isEvilCharacter(player.character));

  const renderPlayerCard = (player: PlayerState, index: number) => {
    const totalPlayers = players.length;
    const angle = (index * 360) / totalPlayers;
    const radius = 160; // Distance from center
    const centerX = 200; // Half of container width (400px)
    const centerY = 200; // Half of container height (400px)
    
    // Calculate position using trigonometry
    const x = centerX + radius * Math.cos((angle - 90) * Math.PI / 180) - 60; // -60 to center the card (half of card width)
    const y = centerY + radius * Math.sin((angle - 90) * Math.PI / 180) - 40; // -40 to center the card (approximate half of card height)
    
    return (
      <div 
        key={player.name} 
        className={`player-card ${!player.alive ? 'dead' : ''}`}
        style={{
          left: `${x}px`,
          top: `${y}px`,
        }}
      >
        <div className="seat-number">{index + 1}</div>
        <div className="player-name">{player.name}</div>
        <div 
          className="player-character"
          style={{ color: getTeamColor(player.character) }}
        >
          {player.character}
        </div>
        <div className="player-status-indicators">
          <span className={`status-indicator ${player.alive ? 'alive' : 'dead'}`}>
            {player.alive ? 'ALIVE' : 'DEAD'}
          </span>
          {player.used_dead_vote && (
            <span className="dead-vote-used" title="Used dead vote">
              VOTED
            </span>
          )}
          {player.drunk && (
            <span className="status-drunk" title="This player is drunk">
              DRUNK
            </span>
          )}
          {player.poisoned && (
            <span className="status-poisoned" title="This player is poisoned">
              POISONED
            </span>
          )}
        </div>
        {player.drunk && player.drunk_character && (
          <div className="drunk-character-info">
            <span className="drunk-label">Thinks they are:</span>
            <span 
              className="drunk-character"
              style={{ color: getTeamColor(player.drunk_character) }}
            >
              {player.drunk_character}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="player-status">
      <h2>Player Status</h2>
      <div className="teams-container">
        <div className="team-column" style={{ flex: '1 1 100%' }}>
          <div className="team-header">
            <h3 style={{ color: '#FFF' }}>Players (Seating Order)</h3>
            <span className="team-count">
              {goodPlayers.length} Good, {evilPlayers.length} Evil
            </span>
          </div>
          <div className="players-grid">
            {players.map((player, index) => renderPlayerCard(player, index))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStatus; 