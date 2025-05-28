import React, { useState, useEffect } from 'react';
import Timeline from './components/Timeline';
import PlayerStatus from './components/PlayerStatus';
import { loadGameEvents } from './gameData';
import { GameEvent } from './types';
import './App.css';

// Available game logs with metadata
const AVAILABLE_GAMES = [
  {
    filename: 'game_log_20250527_233816.jsonl',
    date: '2025-05-27',
    time: '23:38',
    title: 'Game #10 - May 27 Night'
  },
  {
    filename: 'game_log_20250527_220743.jsonl',
    date: '2025-05-27',
    time: '22:07',
    title: 'Game #9 - May 27 Late Evening'
  },
  {
    filename: 'game_log_20250527_204500.jsonl',
    date: '2025-05-27',
    time: '20:45',
    title: 'Game #8 - May 27 Evening'
  },
  {
    filename: 'game_log_20250526_223044.jsonl',
    date: '2025-05-26',
    time: '22:30',
    title: 'Game #7 - May 26 Evening'
  },
  {
    filename: 'game_log_20250526_204654.jsonl',
    date: '2025-05-26',
    time: '20:46',
    title: 'Game #6 - May 26 Afternoon'
  },
  {
    filename: 'game_log_20250526_152804.jsonl',
    date: '2025-05-26',
    time: '15:28',
    title: 'Game #5 - May 26 Midday'
  },
  {
    filename: 'game_log_20250526_125240.jsonl',
    date: '2025-05-26',
    time: '12:52',
    title: 'Game #4 - May 26 Morning'
  },
  {
    filename: 'game_log_20250525_161301.jsonl',
    date: '2025-05-25',
    time: '16:13',
    title: 'Game #3 - May 25 Afternoon'
  },
  {
    filename: 'game_log_20250525_133022.jsonl',
    date: '2025-05-25',
    time: '13:30',
    title: 'Game #2 - May 25 Midday'
  },
  {
    filename: 'game_log_20250524_202903.jsonl',
    date: '2025-05-24',
    time: '20:29',
    title: 'Game #1 - May 24 Evening'
  }
];

function App() {
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showCharactersModal, setShowCharactersModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState(AVAILABLE_GAMES[0].filename);
  const [showGameSelector, setShowGameSelector] = useState(false);
  const [timelineWidth, setTimelineWidth] = useState(60); // Percentage
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
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
    setSelectedGame(filename);
    setShowGameSelector(false); // Close the panel after selection
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
  }, [isResizing]);

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
          {AVAILABLE_GAMES.map((game) => (
            <div
              key={game.filename}
              className={`game-item ${selectedGame === game.filename ? 'selected' : ''}`}
              onClick={() => handleGameSelect(game.filename)}
            >
              <div className="game-title">{game.title}</div>
              <div className="game-meta">
                <span className="game-date">{game.date}</span>
                <span className="game-time">{game.time}</span>
              </div>
            </div>
          ))}
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
              Created by <a href="https://www.linkedin.com/in/jamessullivan092/" target="_blank" rel="noopener noreferrer">James Sullivan</a>
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
            showGameSelector={showGameSelector}
            onToggleGameSelector={() => setShowGameSelector(!showGameSelector)}
            selectedGame={selectedGame}
            availableGames={AVAILABLE_GAMES}
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
              <h2>📖 Blood on the Clocktower Rules</h2>
              <button className="modal-close" onClick={() => setShowRulesModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <h3>Game Overview</h3>
              <p>Blood on the Clocktower is a social deduction game where players are divided into two teams: <strong>Good</strong> and <strong>Evil</strong>.</p>
              
              <h3>Teams</h3>
              <ul>
                <li><strong>Good Team:</strong> Townsfolk and Outsiders who must identify and execute the Demon</li>
                <li><strong>Evil Team:</strong> Minions and the Demon who must eliminate the Good players</li>
              </ul>

              <h3>Game Flow</h3>
              <ol>
                <li><strong>Night Phase:</strong> Players with night abilities use them secretly</li>
                <li><strong>Day Phase:</strong> Players discuss, nominate, and vote to execute someone</li>
                <li><strong>Nominations:</strong> Players can nominate others for execution</li>
                <li><strong>Voting:</strong> All players vote on each nomination</li>
                <li><strong>Execution:</strong> The player with the most votes (if above threshold) is executed</li>
              </ol>

              <h3>Win Conditions</h3>
              <ul>
                <li><strong>Good wins</strong> if the Demon is executed</li>
                <li><strong>Evil wins</strong> if only 2 players remain alive (1 Good, 1 Evil)</li>
              </ul>

              <h3>Key Mechanics</h3>
              <ul>
                <li><strong>Dead Vote:</strong> Dead players can vote once per game</li>
                <li><strong>Nominations:</strong> Living players can nominate others for execution</li>
                <li><strong>Majority:</strong> Executions require a majority of living players to vote</li>
                <li><strong>Information:</strong> Good players receive information to help identify Evil</li>
                <li><strong>Bluffing:</strong> Evil players must pretend to be Good characters</li>
              </ul>

              <h3>Special States</h3>
              <ul>
                <li><strong>Drunk:</strong> Player's ability doesn't work, but they don't know it</li>
                <li><strong>Poisoned:</strong> Player's ability is disabled</li>
                <li><strong>Mad:</strong> Player must act as if they believe false information</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Characters Modal */}
      {showCharactersModal && (
        <div className="modal-overlay" onClick={() => setShowCharactersModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👥 Character Reference</h2>
              <button className="modal-close" onClick={() => setShowCharactersModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <h3>🟦 Townsfolk (Good)</h3>
              <div className="character-list">
                <div className="character-item">
                  <strong>Washerwoman:</strong> You start knowing that 1 of 2 players is a particular Townsfolk.
                </div>
                <div className="character-item">
                  <strong>Librarian:</strong> You start knowing that 1 of 2 players is a particular Outsider. (Or that zero are in play.)
                </div>
                <div className="character-item">
                  <strong>Investigator:</strong> You start knowing that 1 of 2 players is a particular Minion.
                </div>
                <div className="character-item">
                  <strong>Chef:</strong> You start knowing how many pairs of evil players there are.
                </div>
                <div className="character-item">
                  <strong>Empath:</strong> Each night, you learn how many of your 2 alive neighbors are evil.
                </div>
                <div className="character-item">
                  <strong>Fortune Teller:</strong> Each night, choose 2 players: you learn if either is a Demon. There is a good player that registers as a Demon to you.
                </div>
                <div className="character-item">
                  <strong>Undertaker:</strong> Each night*, you learn which character died by execution today.
                </div>
                <div className="character-item">
                  <strong>Monk:</strong> Each night*, choose a player (not yourself): they are safe from the Demon tonight.
                </div>
                <div className="character-item">
                  <strong>Ravenkeeper:</strong> If you die at night, you are woken to choose a player: you learn their character.
                </div>
                <div className="character-item">
                  <strong>Virgin:</strong> The 1st time you are nominated, if the nominator is a Townsfolk, they are executed immediately.
                </div>
                <div className="character-item">
                  <strong>Slayer:</strong> Once per game, during the day, publicly choose a player: if they are the Demon, they die.
                </div>
                <div className="character-item">
                  <strong>Soldier:</strong> You are safe from the Demon.
                </div>
                <div className="character-item">
                  <strong>Mayor:</strong> If only 3 players live & no execution occurs, your team wins. If you die at night, another player might die instead.
                </div>
              </div>

              <h3>🟨 Outsiders (Good but problematic)</h3>
              <div className="character-list">
                <div className="character-item">
                  <strong>Butler:</strong> Each night, choose a player (not yourself): tomorrow, you may only vote if they are voting too.
                </div>
                <div className="character-item">
                  <strong>Drunk:</strong> You do not know you are the Drunk. You think you are a Townsfolk character, but you are not.
                </div>
                <div className="character-item">
                  <strong>Recluse:</strong> You might register as evil & as a Minion or Demon, even when dead.
                </div>
                <div className="character-item">
                  <strong>Saint:</strong> If you die during the day, your team loses.
                </div>
              </div>

              <h3>🟥 Minions (Evil)</h3>
              <div className="character-list">
                <div className="character-item">
                  <strong>Poisoner:</strong> Each night, choose a player: they are poisoned tonight and tomorrow day.
                </div>
                <div className="character-item">
                  <strong>Spy:</strong> Each night, you see the Grimoire. You might register as good & as a Townsfolk or Outsider, even when dead.
                </div>
                <div className="character-item">
                  <strong>Scarlet Woman:</strong> If there are 5 or more players alive & the Demon dies, you become the Demon.
                </div>
                <div className="character-item">
                  <strong>Baron:</strong> There are extra Outsiders in play. [+2 Outsiders]
                </div>
              </div>

              <h3>⚫ Demons (Evil)</h3>
              <div className="character-list">
                <div className="character-item">
                  <strong>Imp:</strong> Each night*, choose a player: they die. If you kill yourself this way, a Minion becomes the Imp.
                </div>
              </div>

              <p className="character-note">
                <em>* = Not on the first night</em>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
