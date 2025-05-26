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
            players={currentEvent.public_game_state?.player_state || []} 
          />
          
          <div className="nomination-status">
            <h3>Nomination Status</h3>
            {currentEvent.public_game_state?.nominatable_players && currentEvent.public_game_state.nominatable_players.length > 0 ? (
              <>
                <div className="nomination-info">
                  <div className="nominatable-count">
                    {currentEvent.public_game_state.nominatable_players.length} players can be nominated
                  </div>
                  <div className="nominatable-list">
                    {currentEvent.public_game_state.nominatable_players.join(', ')}
                  </div>
                </div>
                {currentEvent.public_game_state?.chopping_block && (
                  <div className="chopping-block-info">
                    <div className="chopping-block-header">On the Chopping Block:</div>
                    <div className="nominee-info">
                      <span className="nominee-name">
                        {currentEvent.public_game_state.chopping_block.nominee}
                      </span>
                      <span className="vote-count">
                        ({currentEvent.public_game_state.chopping_block.votes} votes)
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="nominations-closed">
                Nominations have not been opened yet
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
