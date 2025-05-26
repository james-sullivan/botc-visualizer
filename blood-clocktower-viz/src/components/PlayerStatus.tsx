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

  // Separate players into good and evil teams
  const goodPlayers = players.filter(player => !isEvilCharacter(player.character));
  const evilPlayers = players.filter(player => isEvilCharacter(player.character));

  const renderPlayerCard = (player: PlayerState) => (
    <div 
      key={player.name} 
      className={`player-card ${!player.alive ? 'dead' : ''}`}
    >
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

  return (
    <div className="player-status">
      <h2>Player Status</h2>
      <div className="teams-container">
        <div className="team-column good-team">
          <div className="team-header">
            <h3 style={{ color: '#2196F3' }}>Good Team</h3>
            <span className="team-count">{goodPlayers.length} players</span>
          </div>
          <div className="players-grid">
            {goodPlayers.map(renderPlayerCard)}
          </div>
        </div>
        
        <div className="team-column evil-team">
          <div className="team-header">
            <h3 style={{ color: '#F44336' }}>Evil Team</h3>
            <span className="team-count">{evilPlayers.length} players</span>
          </div>
          <div className="players-grid">
            {evilPlayers.map(renderPlayerCard)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStatus; 