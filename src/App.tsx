import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import Timeline from './components/Timeline';
import PlayerStatus from './components/PlayerStatus';
import { loadGameEvents, extractGameMetadata, GameMetadata, isEvilCharacter } from './gameData';
import { GameEvent } from './types';
import './App.css';

// Base game files list (we'll load metadata dynamically)
const GAME_FILES = [
  'game_log_20250601_012019.jsonl',
  'game_log_20250531_132017.jsonl',
  'game_log_20250531_135528.jsonl',
  'game_log_20250530_225729.jsonl',
  'game_log_20250530_224034.jsonl',
  'game_log_20250530_222346.jsonl',
  'game_log_20250530_211635.jsonl',
  'game_log_20250530_141837.jsonl',
  'game_log_20250530_163016.jsonl',
  'game_log_20250530_170838.jsonl',
  'game_log_20250530_193714.jsonl',
  'game_log_20250530_201334.jsonl',
  'game_log_20250601_114757.jsonl',
  'game_log_20250601_122402.jsonl',
  'game_log_20250601_131012.jsonl',
  'game_log_20250601_201826.jsonl',
  'game_log_20250601_234518.jsonl',
  'game_log_20250602_230550.jsonl'
];

// Component that handles the main game view with routing
function GameView() {
  const { gameId } = useParams<{ gameId?: string }>();
  const navigate = useNavigate();

  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showCharactersModal, setShowCharactersModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState('');
  const [showGameSelector, setShowGameSelector] = useState(false);
  const [timelineWidth, setTimelineWidth] = useState(60); // Percentage
  const [isResizing, setIsResizing] = useState(false);
  const [highlightedPlayers, setHighlightedPlayers] = useState<{ originators: string[], affected: string[] }>({ originators: [], affected: [] });
  const [availableGames, setAvailableGames] = useState<GameMetadata[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Determine selected game from URL parameter or default to first game
  useEffect(() => {
    if (gameId) {
      // Convert gameId back to filename
      const filename = `game_log_${gameId}.jsonl`;
      if (GAME_FILES.includes(filename)) {
        setSelectedGame(filename);
      } else {
        // If invalid gameId, redirect to first game
        const defaultGameId = GAME_FILES[0].replace('game_log_', '').replace('.jsonl', '');
        navigate(`/game/${defaultGameId}`, { replace: true });
      }
    } else {
      // No gameId in URL, redirect to first game
      const defaultGameId = GAME_FILES[0].replace('game_log_', '').replace('.jsonl', '');
      navigate(`/game/${defaultGameId}`, { replace: true });
    }
  }, [gameId, navigate]);

  // Load game metadata on component mount
  useEffect(() => {
    const loadGameMetadata = async () => {
      console.log('Starting to load game metadata for files:', GAME_FILES);
      const metadataPromises = GAME_FILES.map(filename => extractGameMetadata(filename));
      const metadataResults = await Promise.all(metadataPromises);
      
      console.log('Metadata results:', metadataResults);
      
      // Filter out failed loads and sort by filename (newest first)
      const validMetadata = metadataResults
        .filter((metadata): metadata is GameMetadata => metadata !== null)
        .sort((a, b) => b.filename.localeCompare(a.filename));
      
      console.log('Valid metadata:', validMetadata);
      setAvailableGames(validMetadata);
    };

    loadGameMetadata();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!selectedGame) return; // Don't load if no game selected yet
      
      try {
        setLoading(true);
        const events = await loadGameEvents(selectedGame);
        setGameEvents(events);
        setCurrentEventIndex(0); // Reset to first event when switching games
        setLoading(false);
      } catch (error) {
        console.error('Error loading game data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, [selectedGame]);

  const handleEventClick = (index: number) => {
    setCurrentEventIndex(index);
  };

  const handleGameSelect = (filename: string) => {
    const gameId = filename.replace('game_log_', '').replace('.jsonl', '');
    navigate(`/game/${gameId}`);
    setShowGameSelector(false); // Close the panel after selection
  };

  const handlePlayerHighlight = (playerHighlight: { originators: string[], affected: string[] } | null) => {
    setHighlightedPlayers(playerHighlight || { originators: [], affected: [] });
  };

  // Handle mouse events for resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    const containerWidth = window.innerWidth;
    const newTimelineWidth = (e.clientX / containerWidth) * 100;
    
    // Constrain between 30% and 80%
    const constrainedWidth = Math.max(30, Math.min(80, newTimelineWidth));
    setTimelineWidth(constrainedWidth);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Close modals with Escape key
      if (event.key === 'Escape') {
        setShowRulesModal(false);
        setShowCharactersModal(false);
        return;
      }
      
      // Don't handle arrow keys if a modal is open
      if (showRulesModal || showCharactersModal) {
        return;
      }
      
      if (event.key === 'ArrowDown' && currentEventIndex < gameEvents.length - 1) {
        setCurrentEventIndex(currentEventIndex + 1);
      } else if (event.key === 'ArrowUp' && currentEventIndex > 0) {
        setCurrentEventIndex(currentEventIndex - 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentEventIndex, gameEvents.length, showRulesModal, showCharactersModal]);

  // Toggle a group's expanded state
  const toggleGroupExpanded = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  if (loading) {
    return (
      <div className="app loading">
        <div className="loading-message">Loading Blood on the Clocktower game data...</div>
      </div>
    );
  }

  if (gameEvents.length === 0) {
    return (
      <div className="app error">
        <div className="error-message">No game data found. Please check that the game log file is available.</div>
      </div>
    );
  }

  const currentEvent = gameEvents[currentEventIndex];
  const currentGameState = currentEvent ? (currentEvent.game_state || currentEvent.public_game_state) : undefined;
  
  // Safety check to ensure currentEvent exists
  if (!currentEvent) {
    return (
      <div className="app error">
        <div className="error-message">Invalid event index. Please refresh the page.</div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Game Selector Panel */}
      <div className={`game-selector-panel ${showGameSelector ? 'open' : ''}`}>
        <div className="game-selector-header">
          <h3>Select Game</h3>
          <button 
            className="close-selector"
            onClick={() => setShowGameSelector(false)}
          >
            ×
          </button>
        </div>
        <div className="game-list">
          {/* Group games by player count and characters */}
          {(() => {
            // Create groups based on player count and characters
            const groups: Record<string, GameMetadata[]> = {};
            
            availableGames.forEach(game => {
              // Sort characters to ensure consistent grouping
              const sortedChars = [...game.charactersInPlay].sort().join(',');
              const groupKey = `${game.playerCount}-${sortedChars}`;
              
              if (!groups[groupKey]) {
                groups[groupKey] = [];
              }
              
              groups[groupKey].push(game);
            });
            
            // Sort groups by player count first, then alphabetically by characters
            const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
              const [countA] = a.split('-');
              const [countB] = b.split('-');
              
              // Sort by player count first
              if (countA !== countB) {
                return parseInt(countA) - parseInt(countB);
              }
              
              // Then by character list
              return a.localeCompare(b);
            });
            
            return sortedGroupKeys.map(groupKey => {
              const games = groups[groupKey];
              if (games.length === 0) return null;
              
              // Get the first game for group information
              const firstGame = games[0];
              const isExpanded = !!expandedGroups[groupKey];
              
              // Sort games within group by model name and then date
              const sortedGames = [...games].sort((a, b) => {
                // Special case: Opus models should be last
                const aIsOpus = a.friendlyModelName.toLowerCase().includes('opus');
                const bIsOpus = b.friendlyModelName.toLowerCase().includes('opus');
                
                if (aIsOpus && !bIsOpus) return 1; // Move Opus to the end
                if (!aIsOpus && bIsOpus) return -1; // Keep non-Opus earlier
                
                // For two Opus models or two non-Opus models, sort normally
                // Model first (for same type models)
                if (a.friendlyModelName !== b.friendlyModelName) {
                  return a.friendlyModelName.localeCompare(b.friendlyModelName);
                }
                // Then date
                if (a.date !== b.date) {
                  return a.date.localeCompare(b.date);
                }
                // Then time
                return a.time.localeCompare(b.time);
              });
              
              return (
                <div key={groupKey} className="game-group">
                  <div 
                    className="game-group-header"
                    onClick={() => toggleGroupExpanded(groupKey)}
                    style={{ cursor: 'pointer', padding: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ color: 'white', fontWeight: 'bold' }}>
                        {firstGame.playerCount} Players
                      </div>
                      <div style={{ marginLeft: '8px', color: 'white' }}>
                        <span className="toggle-arrow">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </div>
                    <div style={{ color: 'white', fontSize: '0.9em' }}>
                      {firstGame.charactersInPlay.join(' • ')}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="game-group-content" style={{ paddingLeft: '16px' }}>
                      {sortedGames.map(game => (
                        <div
                          key={game.filename}
                          className={`game-item ${selectedGame === game.filename ? 'selected' : ''}`}
                          onClick={() => handleGameSelect(game.filename)}
                          style={{ 
                            cursor: 'pointer', 
                            margin: '10px 0',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            backgroundColor: selectedGame === game.filename ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                          }}
                        >
                          <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '4px' }}>
                            {game.friendlyModelName}
                          </div>
                          <div style={{ fontSize: '0.9em' }}>
                            {game.date} {game.time}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Game Selector Overlay */}
      {showGameSelector && (
        <div 
          className="game-selector-overlay"
          onClick={() => setShowGameSelector(false)}
        />
      )}

      <div className="app-header">
        <div className="title-area">
          <div className="title-content">
            <h1>Claude plays <a href="https://bloodontheclocktower.com/" target="_blank" rel="noopener noreferrer">Blood on the Clocktower</a></h1>
            <div className="subtitle">
              Created by <a href="https://www.linkedin.com/in/jamessullivan092/" target="_blank" rel="noopener noreferrer">James Sullivan</a>. Not affiliated with The Pandemonium Institute.
            </div>
          </div>
          <div className="header-buttons">
            <button 
              className="header-button"
              onClick={() => setShowRulesModal(true)}
            >
              Rules Summary
            </button>
            <button 
              className="header-button"
              onClick={() => setShowCharactersModal(true)}
            >
              Character Reference
            </button>
          </div>
        </div>
        <div className="game-info">
          <span>Event {currentEventIndex + 1} of {gameEvents.length}</span>
          <span>Round {currentEvent.round_number} - {currentEvent.phase}</span>
          {(() => {
            const currentGameMetadata = availableGames.find(game => game.filename === selectedGame);
            if (currentGameMetadata) {
              return (
                <span>
                  {currentGameMetadata.friendlyModelName}
                  {currentGameMetadata.thinking_token_budget > 0 && (
                    <span> • Thinking Token Budget: {currentGameMetadata.thinking_token_budget.toLocaleString()}</span>
                  )}
                </span>
              );
            }
            return null;
          })()}
        </div>
      </div>
      
      <div className="app-content">
        <div 
          className="timeline-section"
          style={{ width: `${timelineWidth}%` }}
        >
          <Timeline 
            events={gameEvents} 
            currentEventIndex={currentEventIndex} 
            onEventClick={handleEventClick}
            onPlayerHighlight={handlePlayerHighlight}
            showGameSelector={showGameSelector}
            onToggleGameSelector={() => setShowGameSelector(!showGameSelector)}
            selectedGame={selectedGame}
            availableGames={availableGames}
          />
        </div>
        
        <div 
          className="resize-handle"
          onMouseDown={handleMouseDown}
        >
          <div className="resize-line"></div>
        </div>
        
        <div 
          className="player-section"
          style={{ width: `${100 - timelineWidth}%` }}
        >
          <PlayerStatus 
            players={currentEvent?.game_state?.player_state || currentEvent?.public_game_state?.player_state || []}
            reminderTokens={currentEvent?.game_state?.reminder_tokens || currentEvent?.public_game_state?.reminder_tokens}
            highlightedPlayers={highlightedPlayers}
          />
          
          <div className="nomination-status">
            <h3>Nomination Status</h3>
            {currentGameState?.nominations_open ? (
              <>
                <div className="nominations-open-indicator">
                  <span className="status-icon">🗳️</span>
                  <span className="status-text">Nominations are open</span>
                </div>
                {currentGameState?.nominatable_players && currentGameState.nominatable_players.length > 0 ? (
                  <div className="nomination-info">
                    <div className="nominatable-count">
                      {currentGameState.nominatable_players.length} players can be nominated
                    </div>
                    <div className="nominatable-list">
                      {currentGameState.nominatable_players.join(', ')}
                    </div>
                  </div>
                ) : (
                  <div className="no-nominatable-players">
                    No players are currently nominatable
                  </div>
                )}
                {currentGameState?.chopping_block && (
                  <div className="chopping-block-info">
                    <div className="chopping-block-header">On the Chopping Block:</div>
                    <div className="nominee-info">
                      <span className="nominee-name">
                        {currentGameState.chopping_block.nominee}
                      </span>
                      <span className="vote-count">
                        ({currentGameState.chopping_block.votes} votes)
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="nominations-closed">
                <span className="status-icon">🔒</span>
                <span className="status-text">Nominations are closed</span>
              </div>
            )}
          </div>
          
          <div className="controls">
            <h3>Controls</h3>
            <div className="control-info">
              <div>↑/↓ Arrow keys to navigate</div>
              <div>Click events to jump to them</div>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="modal-overlay" onClick={() => setShowRulesModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Blood on the Clocktower Rules</h2>
              <button className="modal-close" onClick={() => setShowRulesModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Blood on the Clocktower is a social deduction game similar to Werewolf (or Mafia). Each player is given a hidden character that determines if they are on the Good team or the Evil team. One player on the Evil team is the Demon. The Good team wins if they execute the Demon. The Evil team wins if there are only 2 players left alive.</p>

              <h3>Day & Night Phases</h3>
              <p>The game is played in rounds. Each round has a night phase and then a day phase. The game continues until either team wins.</p>
              <p>During the day players can send messages to each other and can nominate each other for execution. During the night, players are woken up to secretly receive information or use their character's ability. During the night, the Demon will pick one player to kill.</p>

              <h3>Nomination for Execution</h3>
              <p>Each living player may nominate a player for execution once per day. The votes needed to nominate are half of the living players rounded up. Once a player has been successfully nominated, they are placed on the chopping block and will be executed at the end of the day. Subsequent nominations will require more votes than the previous nomination to place a new player on the chopping block. In the event of a tie with the previous tally, both players are safe.</p>

              <h3>Roles</h3>
              <p>The characters on the Good team are either Townsfolk or Outsiders. Townsfolk are Good players who have an ability that is helpful to the Good team. Outsiders are Good players who have an ability that is harmful to the Good team.</p>
              <p>The characters on the Evil team are either Minions or the Demon. The Demon is the most important Evil player and the player that the Good team is trying to kill. Minions are also Evil players who have an ability that is helpful to the Evil team. Evil players know who each other are and the Demon knows 3 Good characters that are not in play. Those Good characters can be used by the Evil team to bluff.</p>

              <h3>Dead Players</h3>
              <p>Dead players are still in the game. They win or lose with their team and can send and receive messages as normal, but they lose their character ability, cannot nominate, and they only get one more vote for the rest of the game.</p>

              <h3>Storyteller</h3>
              <p>The Storyteller is a neutral agent that is running the game. It is their job to resolve any ambiguities in the rules using their discretion.</p>

              <h3>Being Poisoned and Drunk</h3>
              <p>If a player is Poisoned or Drunk, their character ability will not work and any information they recieve may be false. Players will not know if they are Poisoned or Drunk. Being Poisoned and being Drunk function exactly the same way.</p>

              <h3>Registers</h3>
              <p>Characters abilities sometimes talk about a player "registering" as good/evil, a particular role, or a particular character. This means that the game mechanics will treat them as the character, team, or role they are registering as, even if they are not that character, team, or role. For example, the Recluse "might" register as evil so if the Empath checks the Recluse, they will see them as an Evil player even though they are Good.</p>
            </div>
          </div>
        </div>
      )}

      {/* Characters Modal */}
      {showCharactersModal && (
        <div className="modal-overlay" onClick={() => setShowCharactersModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Character Reference</h2>
              <button className="modal-close" onClick={() => setShowCharactersModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ whiteSpace: 'pre-line' }}>
                <h3>Townsfolk (Good)</h3>
                <div className="character-list">
                  <div className="character-item">
                    <strong style={{ color: isEvilCharacter('Washerwoman') ? '#F44336' : '#2196F3' }}>Washerwoman:</strong> Starts knowing that 1 of 2 players is a particular Townsfolk
                  </div>
                  <div className="character-item">
                    <strong style={{ color: isEvilCharacter('Librarian') ? '#F44336' : '#2196F3' }}>Librarian:</strong> Starts knowing that 1 of 2 players is a particular Outsider (or that zero are in play)
                  </div>
                  <div className="character-item">
                    <strong style={{ color: isEvilCharacter('Investigator') ? '#F44336' : '#2196F3' }}>Investigator:</strong> Starts knowing that 1 of 2 players is a particular Minion
                  </div>
                  <div className="character-item">
                    <strong style={{ color: isEvilCharacter('Chef') ? '#F44336' : '#2196F3' }}>Chef:</strong> Starts knowing how many adjacent pairs of Evil players there are. (If three evil players are adjacent in a line, there are two pairs)
                  </div>
                  <div className="character-item">
                    <strong style={{ color: isEvilCharacter('Empath') ? '#F44336' : '#2196F3' }}>Empath:</strong> Each night, learns how many of their 2 alive neighbors are Evil
                  </div>
                  <div className="character-item">
                    <strong style={{ color: isEvilCharacter('Fortune Teller') ? '#F44336' : '#2196F3' }}>Fortune Teller:</strong> Each night, chooses 2 players and learns if either is a Demon. There is a good player who registers as a Demon.
                  </div>
                  <div className="character-item">
                    <strong style={{ color: isEvilCharacter('Undertaker') ? '#F44336' : '#2196F3' }}>Undertaker:</strong> Each night (except the first), learns which character died by execution that day (players killed by the Demon are not considered executed)
                  </div>
                  <div className="character-item">
                    <strong style={{ color: isEvilCharacter('Monk') ? '#F44336' : '#2196F3' }}>Monk:</strong> Each night (except the first), chooses a player to protect from the Demon\'s attack
                  </div>
                  <div className="character-item">
                    <strong style={{ color: isEvilCharacter('Ravenkeeper') ? '#F44336' : '#2196F3' }}>Ravenkeeper:</strong> If dies at night, wakes to choose a player and learn their character
                  </div>
                  <div className="character-item">
                    <strong style={{ color: isEvilCharacter('Virgin') ? '#F44336' : '#2196F3' }}>Virgin:</strong> The first time nominated, if the nominator is a Townsfolk, the nominator dies immediately and the nomination continues.
                  </div>
                  <div className="character-item">
                    <strong style={{ color: isEvilCharacter('Slayer') ? '#F44336' : '#2196F3' }}>Slayer:</strong> Once per game during the day, publicly choose a player; if they\'re the Demon, they die
                  </div>
                  <div className="character-item">
                    <strong style={{ color: isEvilCharacter('Mayor') ? '#F44336' : '#2196F3' }}>Mayor:</strong> If only 3 players live and no execution occurs, their team wins; if they die at night, the Storyteller might choose another player to die instead
                  </div>
                  <div className="character-item">
                    <strong style={{ color: isEvilCharacter('Soldier') ? '#F44336' : '#2196F3' }}>Soldier:</strong> Cannot be killed by the Demon
                  </div>
                </div>

                <h3>Outsiders (Good)</h3>
                <div className="character-list">
                  <div className="character-item">
                    <strong style={{ color: isEvilCharacter('Butler') ? '#F44336' : '#2196F3' }}>Butler:</strong> Each night, chooses a player and can only vote if that player votes Yes before it is their turn to vote
                  </div>
                  <div className="character-item">
                    <strong style={{ color: isEvilCharacter('Drunk') ? '#F44336' : '#2196F3' }}>Drunk:</strong> Thinks they are a Townsfolk character but they are the Drunk. The Storyteller will treat them as if they are the Townsfolk they think they are but their ability does not work and information they are given may be false.
                  </div>
                  <div className="character-item">
                    <strong style={{ color: isEvilCharacter('Recluse') ? '#F44336' : '#2196F3' }}>Recluse:</strong> Might register as Evil and as a Minion or Demon, even if dead
                  </div>
                  <div className="character-item">
                    <strong style={{ color: isEvilCharacter('Saint') ? '#F44336' : '#2196F3' }}>Saint:</strong> If executed, their team loses
                  </div>
                </div>

                <h3>Minions (Evil)</h3>
                <div className="character-list">
                  <div className="character-item">
                    <strong style={{ color: isEvilCharacter('Poisoner') ? '#F44336' : '#2196F3' }}>Poisoner:</strong> Each night they choose a player to poison for that night and the next day
                  </div>
                  <div className="character-item">
                    <strong style={{ color: isEvilCharacter('Spy') ? '#F44336' : '#2196F3' }}>Spy:</strong> Each night, sees the Grimoire (contains complete information about the game state); might register as Good and as a Townsfolk or Outsider
                  </div>
                  <div className="character-item">
                    <strong style={{ color: isEvilCharacter('Scarlet Woman') ? '#F44336' : '#2196F3' }}>Scarlet Woman:</strong> If 5+ players are alive and the Demon dies, becomes the Demon
                  </div>
                  <div className="character-item">
                    <strong style={{ color: isEvilCharacter('Baron') ? '#F44336' : '#2196F3' }}>Baron:</strong> Adds two extra Outsiders to the game during setup. The player count stays the same and Townsfolk are removed to make room
                  </div>
                </div>

                <h3>Demon (Evil)</h3>
                <div className="character-list">
                  <div className="character-item">
                    <strong style={{ color: isEvilCharacter('Imp') ? '#F44336' : '#2196F3' }}>Imp:</strong> Each night (except the first), chooses a player to kill; if they kill themselves, the Storyteller picks a Minion to become the new Imp
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main App component with routing
function App() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(/Mobi|Android/i.test(navigator.userAgent));
  }, []);

  if (isMobile) {
    return (
      <div className="mobile-unsupported">
        <h2>Unsupported Device</h2>
        <p>This website does not support mobile devices. Please use a desktop browser.</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<GameView />} />
        <Route path="/game/:gameId" element={<GameView />} />
      </Routes>
    </Router>
  );
}

export default App;
