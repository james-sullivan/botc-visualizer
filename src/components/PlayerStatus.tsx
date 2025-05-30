import React from 'react';
import { PlayerState } from '../types';
import { isEvilCharacter, getTeamColor, formatCharacterName } from '../gameData';
import './PlayerStatus.css';

interface PlayerStatusProps {
  players: PlayerState[];
  reminderTokens?: Record<string, string>;
  highlightedPlayers?: { originators: string[], affected: string[] };
}

const PlayerStatus: React.FC<PlayerStatusProps> = ({ players, reminderTokens, highlightedPlayers = { originators: [], affected: [] } }) => {
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
    
    // Dynamic sizing: base radius for 6 players, increase by 20px for each additional player
    const baseRadius = 192;
    const additionalRadius = Math.max(0, (totalPlayers - 6) * 20);
    const radius = baseRadius + additionalRadius;
    
    // Use the same geometry calculation as arrows
    const cardGeometry = getPlayerCardGeometry(index, totalPlayers, radius);
    
    return (
      <div 
        key={player.name} 
        className={`player-card ${!player.alive ? 'dead' : ''} ${
          highlightedPlayers.originators.includes(player.name) ? 'highlighted-originator' : 
          highlightedPlayers.affected.includes(player.name) ? 'highlighted-affected' : ''
        }`}
        style={{
          left: `${cardGeometry.x}px`,
          top: `${cardGeometry.y}px`,
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

  // Infrastructure: Calculate the closest point on a rectangle to a given point
  const getClosestPointOnRectangle = (
    rectX: number, 
    rectY: number, 
    rectWidth: number, 
    rectHeight: number, 
    targetX: number, 
    targetY: number
  ) => {
    // Clamp the target point to the rectangle bounds
    const closestX = Math.max(rectX, Math.min(targetX, rectX + rectWidth));
    const closestY = Math.max(rectY, Math.min(targetY, rectY + rectHeight));
    
    return { x: closestX, y: closestY };
  };

  // Calculate player card positions and dimensions
  const getPlayerCardGeometry = (playerIndex: number, totalPlayers: number, radius: number) => {
    const angle = (playerIndex * 360) / totalPlayers;
    const containerSize = (radius + 100) * 2;
    const centerX = containerSize / 2;
    const centerY = containerSize / 2;
    
    const cardWidth = 144;
    const cardHeight = 96;
    
    const cardX = centerX + radius * Math.cos((angle - 90) * Math.PI / 180) - cardWidth / 2;
    const cardY = centerY + radius * Math.sin((angle - 90) * Math.PI / 180) - cardHeight / 2;
    
    return {
      x: cardX,
      y: cardY,
      width: cardWidth,
      height: cardHeight,
      centerX: containerSize / 2,
      centerY: containerSize / 2
    };
  };

  // Calculate arrow paths using closest points
  const calculateArrowPath = (fromIndex: number, toIndex: number, totalPlayers: number, radius: number) => {
    const fromCard = getPlayerCardGeometry(fromIndex, totalPlayers, radius);
    const toCard = getPlayerCardGeometry(toIndex, totalPlayers, radius);
    
    // Get closest points on each card to the circle center
    const fromPoint = getClosestPointOnRectangle(
      fromCard.x, 
      fromCard.y, 
      fromCard.width, 
      fromCard.height,
      fromCard.centerX,
      fromCard.centerY
    );
    
    const toPoint = getClosestPointOnRectangle(
      toCard.x, 
      toCard.y, 
      toCard.width, 
      toCard.height,
      toCard.centerX,
      toCard.centerY
    );
    
    // Create a simple curved path
    const midX = (fromPoint.x + toPoint.x) / 2;
    const midY = (fromPoint.y + toPoint.y) / 2;
    
    // Pull control point toward center for a gentle curve
    const controlX = fromCard.centerX + (midX - fromCard.centerX) * 0.6;
    const controlY = fromCard.centerY + (midY - fromCard.centerY) * 0.6;
    
    return `M ${fromPoint.x} ${fromPoint.y} Q ${controlX} ${controlY} ${toPoint.x} ${toPoint.y}`;
  };

  const renderArrows = () => {
    if (highlightedPlayers.originators.length === 0 || highlightedPlayers.affected.length === 0) {
      return null;
    }

    const totalPlayers = players.length;
    const baseRadius = 192;
    const additionalRadius = Math.max(0, (totalPlayers - 6) * 20);
    const radius = baseRadius + additionalRadius;
    const containerSize = (radius + 100) * 2;

    const arrows: React.JSX.Element[] = [];
    
    highlightedPlayers.originators.forEach(originatorName => {
      const originatorIndex = players.findIndex(p => p.name === originatorName);
      if (originatorIndex === -1) return;
      
      highlightedPlayers.affected.forEach((affectedName, affectedIdx) => {
        const affectedIndex = players.findIndex(p => p.name === affectedName);
        if (affectedIndex === -1) return;
        
        const pathData = calculateArrowPath(originatorIndex, affectedIndex, totalPlayers, radius);
        
        arrows.push(
          <g key={`${originatorName}-${affectedName}`}>
            <path
              d={pathData}
              stroke="#FFD700"
              strokeWidth="2.5"
              fill="none"
              markerEnd="url(#arrowhead)"
              opacity="0.9"
              strokeLinecap="round"
            />
          </g>
        );
      });
    });

    return (
      <svg
        width={containerSize}
        height={containerSize}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 5
        }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#FFD700"
            />
          </marker>
        </defs>
        {arrows}
      </svg>
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
              height: `${(192 + Math.max(0, (players.length - 6) * 20) + 100) * 2}px`,
              position: 'relative'
            }}
          >
            {players.map((player, index) => renderPlayerCard(player, index))}
            {renderArrows()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStatus; 