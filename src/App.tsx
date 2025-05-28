import React, { useState, useEffect } from 'react';
import Timeline from './components/Timeline';
import PlayerStatus from './components/PlayerStatus';
import { loadGameEvents, extractGameMetadata, GameMetadata } from './gameData';
import { GameEvent } from './types';
import './App.css';

// Base game files list (we'll load metadata dynamically)
const GAME_FILES = [
  'game_log_20250528_164924.jsonl',
  'game_log_20250528_162223.jsonl',
  'game_log_20250528_154356.jsonl',
  'game_log_20250527_233816.jsonl',
  'game_log_20250527_220743.jsonl',
  'game_log_20250527_204500.jsonl',
  'game_log_20250526_223044.jsonl',
  'game_log_20250526_204654.jsonl',
  'game_log_20250526_152804.jsonl',
  'game_log_20250526_125240.jsonl',
  'game_log_20250525_161301.jsonl',
  'game_log_20250525_133022.jsonl',
  'game_log_20250524_202903.jsonl'
];

function App() {
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showCharactersModal, setShowCharactersModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState(GAME_FILES[0]);
  const [showGameSelector, setShowGameSelector] = useState(false);
  const [timelineWidth, setTimelineWidth] = useState(60); // Percentage
  const [isResizing, setIsResizing] = useState(false);
  const [highlightedPlayer, setHighlightedPlayer] = useState<string | null>(null);
  const [availableGames, setAvailableGames] = useState<GameMetadata[]>([]);

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

  const handlePlayerHighlight = (playerName: string | null) => {
    setHighlightedPlayer(playerName);
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
          {availableGames.map((game) => (
            <div
              key={game.filename}
              className={`game-item ${selectedGame === game.filename ? 'selected' : ''}`}
              onClick={() => handleGameSelect(game.filename)}
            >
              <div className="game-title">{game.title}</div>
              <div className="game-characters">
                {game.charactersInPlay.join(' • ')}
              </div>
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
            highlightedPlayer={highlightedPlayer}
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
              <p>Blood on the Clocktower is a social deduction game similar to Werewolf (or Mafia). At the start of the game each player is secretly given a character that determines what team they are on and what special abilities they have. There can only be one of each character in the game. Players are either on the Good team or the Evil team. The Evil team members know who each other are but the Good team does not know who anyone but themselves are.</p>

              <h3>Storyteller</h3>
              <p>The game is moderated by the Storyteller who is a neutral agent that will enforce the rules and give information to players. The Storyteller will also have decisions to make about things like what false information to give to players. The Storyteller maintains the complete game state inside of the Grimoire. This include what character each player is and what status effects they have.</p>

              <h3>Objectives</h3>
              <p>The Good team wins if they execute the Demon.</p>
              <p>The Evil team wins if there are only 2 players left alive (and the Demon is still alive).</p>

              <h3>Gameplay</h3>
              <p>The game is played in rounds. Each round has a night phase and then a day phase. The game continues until either team wins.</p>
              <p>During the day players can send messages to each other to persuade, strategize, coordinate, theorize, and share information. At the end of the day players will vote on who they want to nominate for execution and at the end of the day, if a player has been nominated, that player will die.</p>
              <p>During the night the Storyteller will secretly give information to players based on their character's ability or allow them to secretly use their ability. All information at night is secret and only the player receiving the information or using their ability knows about it.</p>

              <h3>Nomination for Execution</h3>
              <p>Towards the end of the day the Storyteller will allow players to nominate each other for execution. Each living player can only nominate one person per day and each person may only be nominated once per day. You can nominate any player including yourself or any other living or dead player.</p>
              <p>During a nomination each player will vote starting with the player who is being nominated and proceeding left to right until all players have voted. Players can vote yes or no. When each player votes, they first get to see the votes of the players who voted before them.</p>
              <p>The number of votes needed for a successful nomination is at least half of the living players rounded up. If a player is successfully nominated, future nominations will need to exceed the number of votes previously cast for that player to become the next nominee. If there is a tie, neither player is nominated and both players are safe for the day. At the end of the day, the currently nominated player will be executed. You do NOT learn what character players are when they die.</p>

              <h3>Alignment</h3>
              <p>The alignment of a player is the team they are on. A player can be on the Good team or the Evil team. By default, Townsfolk and Outsiders are Good players. Minions and the Demon are Evil players.</p>

              <h3>Characters</h3>
              <p>Each player has a character. Each character has an ability. A player's character is separate from their alignment. The moment a player dies, or becomes poisoned or drunk, their character's ability stops affecting the game.</p>

              <h3>Roles</h3>
              <p>The Good team is made up of Townsfolk and Outsiders. Townsfolk are Good players who have an ability that is helpful to the Good team. Outsiders are Good players who have an ability that is harmful to the Good team.</p>
              <p>The Evil team is made up of one Demon and one to three Minions. The Demon is the most important Evil player and the player that the Good team is trying to kill. Minions are also Evil players who have an ability that is helpful to the Evil team. At the start of the game, the Demon is secretly told three good players that are not in play.</p>

              <h3>Dead Players</h3>
              <p>Dead players are still in the game and can still talk to other players, but they no longer have their character's ability, they cannot nominate players for execution, and they only get one vote for the rest of the game.</p>

              <h3>Being Poisoned and Drunk</h3>
              <p>Poisoned and Drunk are status effects that can be applied to players. They function the exact same way and a player will not know if they are Poisoned or Drunk. If a player is Poisoned or Drunk their character's ability will not work and any information that they receive from the Storyteller may be false.</p>

              <h3>Registers</h3>
              <p>The rules and characters abilities sometimes talk about a player "registering" as good/evil, a particular role, or a particular character. This means that the game mechanics will treat them as the character, alignment, or role they are registering as, even if they are not that character, alignment, or role. For example, if a player "might" register as evil, then the Storyteller can decide to show another player a demon character when another player uses their ability to check what character they are.</p>
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
                    <strong>Washerwoman:</strong> Starts knowing that 1 of 2 players is a particular Townsfolk
                  </div>
                  <div className="character-item">
                    <strong>Librarian:</strong> Starts knowing that 1 of 2 players is a particular Outsider (or that zero are in play)
                  </div>
                  <div className="character-item">
                    <strong>Investigator:</strong> Starts knowing that 1 of 2 players is a particular Minion
                  </div>
                  <div className="character-item">
                    <strong>Chef:</strong> Starts knowing how many adjacent pairs of Evil players there are. (If three evil players are adjacent in a line, there are two pairs)
                  </div>
                  <div className="character-item">
                    <strong>Empath:</strong> Each night, learns how many of their 2 alive neighbors are Evil
                  </div>
                  <div className="character-item">
                    <strong>Fortune Teller:</strong> Each night, chooses 2 players and learns if either is a Demon. There is a good player who registers as a Demon.
                  </div>
                  <div className="character-item">
                    <strong>Undertaker:</strong> Each night (except the first), learns which character died by execution that day (players killed by the Demon are not considered executed)
                  </div>
                  <div className="character-item">
                    <strong>Monk:</strong> Each night (except the first), chooses a player to protect from the Demon's attack
                  </div>
                  <div className="character-item">
                    <strong>Ravenkeeper:</strong> If dies at night, wakes to choose a player and learn their character
                  </div>
                  <div className="character-item">
                    <strong>Virgin:</strong> The first time nominated, if the nominator is a Townsfolk, the nominator dies immediately and the nomination continues.
                  </div>
                  <div className="character-item">
                    <strong>Slayer:</strong> Once per game during the day, publicly choose a player; if they're the Demon, they die
                  </div>
                  <div className="character-item">
                    <strong>Mayor:</strong> If only 3 players live and no execution occurs, their team wins; if they die at night, the Storyteller might choose another player to die instead
                  </div>
                  <div className="character-item">
                    <strong>Soldier:</strong> Cannot be killed by the Demon
                  </div>
                </div>

                <h3>Outsiders (Good)</h3>
                <div className="character-list">
                  <div className="character-item">
                    <strong>Butler:</strong> Each night, chooses a player and can only vote if that player votes Yes before it is their turn to vote
                  </div>
                  <div className="character-item">
                    <strong>Drunk:</strong> Thinks they are a Townsfolk but they are Drunk. They Storyteller will treat them as if they are the Townsfolk they think they are but their ability does not work.
                  </div>
                  <div className="character-item">
                    <strong>Recluse:</strong> Might register as Evil and as a Minion or Demon, even if dead
                  </div>
                  <div className="character-item">
                    <strong>Saint:</strong> If executed, their team loses
                  </div>
                </div>

                <h3>Minions (Evil)</h3>
                <div className="character-list">
                  <div className="character-item">
                    <strong>Poisoner:</strong> Each night they choose a player to poison for that night and the next day
                  </div>
                  <div className="character-item">
                    <strong>Spy:</strong> Each night, sees the Grimoire (contains complete information about the game state); might register as Good and as a Townsfolk or Outsider
                  </div>
                  <div className="character-item">
                    <strong>Scarlet_Woman:</strong> If 5+ players are alive and the Demon dies, becomes the Demon
                  </div>
                  <div className="character-item">
                    <strong>Baron:</strong> Adds two extra Outsiders to the game during setup. The player count stays the same and Townsfolk are removed to make room
                  </div>
                </div>

                <h3>Demon (Evil)</h3>
                <div className="character-list">
                  <div className="character-item">
                    <strong>Imp:</strong> Each night (except the first), chooses a player to kill; if they kill themselves, the Storyteller picks a Minion to become the new Imp
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

export default App;
