import React, { useState, useEffect } from 'react';
import Timeline from './components/Timeline';
import PlayerStatus from './components/PlayerStatus';
import { loadGameEvents } from './gameData';
import { GameEvent } from './types';
import './App.css';

function App() {
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const events = await loadGameEvents();
        setGameEvents(events);
        setLoading(false);
      } catch (error) {
        console.error('Error loading game data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleEventClick = (index: number) => {
    setCurrentEventIndex(index);
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
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
  }, [currentEventIndex, gameEvents.length]);

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
      <div className="app-header">
        <div className="title-area">
          <h1>Claude plays <a href="https://bloodontheclocktower.com/" target="_blank" rel="noopener noreferrer">Blood on the Clocktower</a></h1>
          <div className="subtitle">
            Created by <a href="https://www.linkedin.com/in/jamessullivan092/" target="_blank" rel="noopener noreferrer">James Sullivan</a>
          </div>
        </div>
        <div className="game-info">
          <span>Event {currentEventIndex + 1} of {gameEvents.length}</span>
          <span>Round {currentEvent.round_number} - {currentEvent.phase}</span>
        </div>
      </div>
      
      <div className="app-content">
        <div className="timeline-section">
          <Timeline 
            events={gameEvents}
            currentEventIndex={currentEventIndex}
            onEventClick={handleEventClick}
          />
        </div>
        
        <div className="player-section">
          <PlayerStatus 
            players={currentGameState?.player_state || []} 
            reminderTokens={currentGameState?.reminder_tokens}
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
    </div>
  );
}

export default App;
