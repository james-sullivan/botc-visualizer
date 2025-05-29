import React from 'react';
import { PlayerState } from '../types';
import { isEvilCharacter, getTeamColor, formatCharacterName } from '../gameData';
import './PlayerStatus.css';

interface PlayerStatusProps {
  players: PlayerState[];
  reminderTokens?: Record<string, string>;
  highlightedPlayers?: string[];
}

const PlayerStatus: React.FC<PlayerStatusProps> = ({ players, reminderTokens, highlightedPlayers = [] }) => {
  // Safety check for undefined players
  if (!players || players.length === 0) {
    return (
      <div className="player-status">
        <div className="no-players">No player data available</div>
      </div>
    );
  }

  // Keep players in seating order (as they appear in the game state)
  // Separate players into good and evil teams for counting
  const goodPlayers = players.filter(player => !isEvilCharacter(player.character));
  const evilPlayers = players.filter(player => isEvilCharacter(player.character));

  // Helper function to get reminder tokens for a player
  const getPlayerReminderTokens = (playerName: string) => {
    if (!reminderTokens) return [];
    
    const tokens = [];
    
    // Check for Slayer Power Used
    if (reminderTokens['Slayer_Power_Used'] === playerName) {
      tokens.push({ type: 'power-used', text: 'Power Used' });
    }
    
    // Check for Virgin Power Used
    if (reminderTokens['Virgin_Power_Used'] === playerName) {
      tokens.push({ type: 'power-used', text: 'Power Used' });
    }
    
    // Check for Red Herring
    if (reminderTokens['Fortuneteller_Red_Herring'] === playerName) {
      tokens.push({ type: 'red-herring', text: '🔮 Red Herring' });
    }
    
    // Check for Washerwoman tokens
    if (reminderTokens['Washerwoman_Townsfolk'] === playerName) {
      tokens.push({ type: 'washerwoman', text: '🧺 Townsfolk' });
    }
    if (reminderTokens['Washerwoman_Other'] === playerName) {
      tokens.push({ type: 'washerwoman', text: '🧺 Other' });
    }
    
    // Check for Librarian tokens
    if (reminderTokens['Librarian_Outsider'] === playerName) {
      tokens.push({ type: 'librarian', text: '📚 Outsider' });
    }
    if (reminderTokens['Librarian_Other'] === playerName) {
      tokens.push({ type: 'librarian', text: '📚 Other' });
    }
    
    // Check for Investigator tokens
    if (reminderTokens['Investigator_Minion'] === playerName) {
      tokens.push({ type: 'investigator', text: '🔍 Minion' });
    }
    if (reminderTokens['Investigator_Other'] === playerName) {
      tokens.push({ type: 'investigator', text: '🔍 Other' });
    }
    
    // Check for Butler Master
    if (reminderTokens['Butler_Master'] === playerName) {
      tokens.push({ type: 'butler', text: '🤵 Master' });
    }
    
    // Check for Monk Protected
    if (reminderTokens['Monk_Protected'] === playerName) {
      tokens.push({ type: 'monk', text: '🧘 Protected' });
    }
    
    return tokens;
  };

  const renderPlayerCard = (player: PlayerState, index: number) => {
    const totalPlayers = players.length;
    const angle = (index * 360) / totalPlayers;
    
    // Dynamic sizing: base radius for 6 players, increase by 20px for each additional player
    const baseRadius = 192;
    const additionalRadius = Math.max(0, (totalPlayers - 6) * 20);
    const radius = baseRadius + additionalRadius;
    
    // Dynamic container size based on radius
    const containerSize = (radius + 100) * 2; // Add padding around the circle
    const centerX = containerSize / 2;
    const centerY = containerSize / 2;
    
    // Calculate position using trigonometry
    const x = centerX + radius * Math.cos((angle - 90) * Math.PI / 180) - 72; // -72 to center the card (half of card width: 144px/2)
    const y = centerY + radius * Math.sin((angle - 90) * Math.PI / 180) - 48; // -48 to center the card (approximate half of card height)
    
    return (
      <div 
        key={player.name} 
        className={`player-card ${!player.alive ? 'dead' : ''} ${highlightedPlayers.includes(player.name) ? 'highlighted' : ''}`}
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
          {formatCharacterName(player.character)}
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
          {getPlayerReminderTokens(player.name).map((token, tokenIndex) => (
            <span 
              key={tokenIndex}
              className={`reminder-token ${token.type}`}
              title={`Reminder token: ${token.text}`}
            >
              {token.text}
            </span>
          ))}
        </div>
        {player.drunk && player.drunk_character && (
          <div className="drunk-character-info">
            <span className="drunk-label">Thinks they are:</span>
            <span 
              className="drunk-character"
              style={{ color: getTeamColor(player.drunk_character) }}
            >
              {formatCharacterName(player.drunk_character)}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="player-status">
      <div className="teams-container">
        <div className="team-column" style={{ flex: '1 1 100%' }}>
          <div className="team-header">
            <h3 style={{ color: '#FFF' }}>Players (Seating Order)</h3>
            <span className="team-count">
              {goodPlayers.length} Good, {evilPlayers.length} Evil
            </span>
          </div>
          <div 
            className="players-grid"
            style={{
              width: `${(192 + Math.max(0, (players.length - 6) * 20) + 100) * 2}px`,
              height: `${(192 + Math.max(0, (players.length - 6) * 20) + 100) * 2}px`
            }}
          >
            {players.map((player, index) => renderPlayerCard(player, index))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStatus; 