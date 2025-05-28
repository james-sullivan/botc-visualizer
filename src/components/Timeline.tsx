import React, { useEffect, useRef } from 'react';
import { GameEvent } from '../types';
import { getPhaseColor, getPhaseIndentation, isEvilCharacter } from '../gameData';
import './Timeline.css';

interface TimelineProps {
  events: GameEvent[];
  currentEventIndex: number;
  onEventClick: (index: number) => void;
  onPlayerHighlight?: (playerName: string | null) => void;
  showGameSelector: boolean;
  onToggleGameSelector: () => void;
  selectedGame: string;
  availableGames: Array<{
    filename: string;
    date: string;
    time: string;
    title: string;
  }>;
}

const Timeline: React.FC<TimelineProps> = ({ 
  events, 
  currentEventIndex, 
  onEventClick,
  onPlayerHighlight,
  showGameSelector,
  onToggleGameSelector,
  selectedGame,
  availableGames
}) => {
  // Debug: Check what events the Timeline component is receiving
  React.useEffect(() => {
    console.log('Timeline received events:', events.length);
    const eventTypes = Array.from(new Set(events.map(e => e.event_type))).sort();
    console.log('Timeline event types:', eventTypes);
    
    const votingRoundEvents = events.filter(e => e.event_type === 'voting_round');
    if (votingRoundEvents.length > 0) {
      console.error('ERROR: Timeline received voting_round events:', votingRoundEvents);
    }
  }, [events]);
  const timelineRef = useRef<HTMLDivElement>(null);
  const eventRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Helper function to format player names with character info
  const formatPlayerName = (playerName: string, event: GameEvent) => {
    const gameState = event.game_state || event.public_game_state;
    const playerState = gameState?.player_state?.find(p => p.name === playerName);
    if (playerState?.character) {
      const isEvil = isEvilCharacter(playerState.character);
      return (
        <>
          <span className={`player-name ${isEvil ? 'evil' : 'good'}`}>
            {playerName}
            {playerState.poisoned && ' 🧪'}
            {playerState.drunk && ' 🍺'}
          </span>
          {' '}
          <span className={`character-name ${isEvil ? 'evil' : 'good'}`}>({playerState.character})</span>
        </>
      );
    }
    return playerName;
  };

  // Helper function to format vote values
  const formatVoteValue = (vote: string) => {
    switch (vote) {
      case 'Yes':
        return '✅';
      case 'No':
        return '❌';
      case 'Cant_Vote':
        return '🤷';
      default:
        return vote;
    }
  };

  // Helper function to format vote display text
  const formatVoteDisplayText = (vote: string) => {
    switch (vote) {
      case 'Yes':
        return '✅ YES';
      case 'No':
        return '❌ NO';
      case 'Cant_Vote':
        return '🤷 CAN\'T VOTE';
      default:
        return vote;
    }
  };

  // Helper function to get the initiating player for an event
  const getInitiatingPlayer = (event: GameEvent): string | null => {
    switch (event.event_type) {
      case 'nomination':
      case 'nomination_complete':
      case 'nomination_result':
        return event.metadata.nominator;
      
      case 'message':
        return event.metadata.sender === 'Storyteller' ? null : event.metadata.sender;
      
      case 'notes_update':
        return event.metadata.player_name;
      
      case 'player_pass':
        return event.metadata.player_name;
      
      // Power events
      case 'slayer_power':
      case 'poisoner_power':
      case 'imp_power':
      case 'empath_power':
      case 'fortuneteller_power':
      case 'spy_power':
      case 'washerwoman_power':
      case 'librarian_power':
      case 'investigator_power':
      case 'chef_power':
      case 'monk_power':
      case 'ravenkeeper_power':
      case 'undertaker_power':
      case 'butler_power':
      case 'virgin_power':
        return event.metadata.player_name;
      
      // Events with no specific initiating player
      case 'game_setup':
      case 'game_start':
      case 'round_start':
      case 'phase_change':
      case 'nominations_open':
      case 'execution':
      case 'player_death':
      case 'game_end':
      case 'death_announcement':
      case 'minion_info':
      case 'demon_info':
      case 'notes_update_combined':
      case 'player_pass_combined':
      default:
        return null;
    }
  };

  // Auto-select middle visible event on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!timelineRef.current) return;

      const container = timelineRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerTop = containerRect.top;
      const containerBottom = containerRect.bottom;
      const containerMiddle = containerTop + (containerBottom - containerTop) / 2;

      let closestToMiddleIndex = -1;
      let closestDistance = Infinity;

      eventRefs.current.forEach((eventElement, index) => {
        if (!eventElement) return;

        const eventRect = eventElement.getBoundingClientRect();
        const eventTop = eventRect.top;
        const eventBottom = eventRect.bottom;

        // Check if event is visible (at least partially)
        if (eventTop < containerBottom && eventBottom > containerTop) {
          const eventMiddle = eventTop + (eventBottom - eventTop) / 2;
          const distanceFromContainerMiddle = Math.abs(eventMiddle - containerMiddle);
          
          if (distanceFromContainerMiddle < closestDistance) {
            closestDistance = distanceFromContainerMiddle;
            closestToMiddleIndex = index;
          }
        }
      });

      if (closestToMiddleIndex !== -1 && closestToMiddleIndex !== currentEventIndex) {
        onEventClick(closestToMiddleIndex);
      }
    };

    const container = timelineRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [currentEventIndex, onEventClick]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getEventIcon = (eventType: string) => {
    const icons: Record<string, string> = {
      'game_setup': '🎮',
      'game_start': '▶️',
      'round_start': '🔄',
      'phase_change': '🌙',
      'nomination': '👆',
      'nominations_open': '🗳️',
      'nomination_complete': '⚖️',
      'nomination_result': '⚖️',
      'voting': '🗳️',
      'execution': '⚔️',
      'player_death': '💀',
      'message': '💬',
      'storyteller_info': '📢',
      'game_end': '🏁',
      'slayer_power': '🏹',
      'poisoner_power': '🧪',
      'imp_power': '👹',
      'empath_power': '💜',
      'fortuneteller_power': '🔮',
      'spy_power': '🕵️',
      'washerwoman_power': '🧺',
      'librarian_power': '📚',
      'investigator_power': '🔍',
      'chef_power': '👨‍🍳',
      'monk_power': '🧘',
      'ravenkeeper_power': '🐦',
      'undertaker_power': '⚰️',
      'butler_power': '🤵',
      'virgin_power': '👸',
      'scarlet_woman': '👩‍🦰',
      'player_setup': '🎭',
      'notes_update': '📝',
      'notes_update_combined': '📝',
      'death_announcement': '💀',
      'minion_info': '👹',
      'demon_info': '😈',
      'player_pass': '⏭️',
      'player_pass_combined': '⏭️',
    };
    return icons[eventType] || '📝';
  };

  const getEventIconBackgroundColor = (eventType: string) => {
    // Good team powers (blue)
    const goodPowers = [
      'slayer_power', 'empath_power', 'fortuneteller_power', 'washerwoman_power',
      'librarian_power', 'investigator_power', 'chef_power', 'monk_power',
      'ravenkeeper_power', 'undertaker_power', 'butler_power', 'virgin_power'
    ];
    
    // Evil team powers (red)
    const evilPowers = [
      'poisoner_power', 'imp_power', 'spy_power', 'scarlet_woman',
      'minion_info', 'demon_info'
    ];
    
    // Setup events (green)
    const setupEvents = [
      'game_setup', 'game_start', 'round_start', 'player_setup'
    ];
    
    if (goodPowers.includes(eventType)) {
      return '#2196F3'; // Blue
    } else if (evilPowers.includes(eventType)) {
      return '#F44336'; // Red
    } else if (setupEvents.includes(eventType)) {
      return '#4CAF50'; // Green
    } else {
      return '#000000'; // Black
    }
  };

  const renderEventDetails = (event: GameEvent) => {
    switch (event.event_type) {
      case 'game_setup':
        return (
          <div className="event-details">
            <div className="compact-setup">
              <span className="setup-icon">🎮</span>
              <span className="setup-text">
                Game Setup: {event.metadata.player_count} players
                {event.metadata.script && ` • ${event.metadata.script}`}
                {event.metadata.model && ` • Model: ${event.metadata.model}`}
              </span>
            </div>
          </div>
        );
      case 'game_start':
        return (
          <div className="event-details">
            <div className="compact-setup">
              <span className="setup-icon">▶️</span>
              <span className="setup-text">
                Game Started
                {event.metadata.max_rounds && ` • Max ${event.metadata.max_rounds} rounds`}
                {event.metadata.player_count && ` • ${event.metadata.player_count} players`}
              </span>
            </div>
          </div>
        );
      case 'nomination':
        return (
          <div className="event-details">
            <div className="event-title">
              <span className="event-title-text">🗳️ Nomination</span>
            </div>
            <div className="nomination-summary">
              <span className="nominator-name">{formatPlayerName(event.metadata.nominator, event)}</span>
              <span className="nomination-verb">nominates</span>
              <span className="nominee-name">{formatPlayerName(event.metadata.nominee, event)}</span>
            </div>
            {event.metadata.public_reasoning && (
              <div className="reasoning-section">
                <div className="reasoning-label">Public Reasoning:</div>
                <div className="reasoning-text">"{event.metadata.public_reasoning}"</div>
              </div>
            )}
            {event.metadata.private_reasoning && (
              <div className="reasoning-section private">
                <div className="reasoning-label">Private Reasoning:</div>
                <div className="reasoning-text">"{event.metadata.private_reasoning}"</div>
              </div>
            )}
            {(event.metadata.required_to_nominate || event.metadata.required_to_tie) && (
              <div className="vote-requirements">
                {event.metadata.required_to_nominate && (
                  <span className="requirement-item">
                    <span className="requirement-label">Votes needed to nominate:</span>
                    <span className="requirement-value">{event.metadata.required_to_nominate}</span>
                  </span>
                )}
                {event.metadata.required_to_tie && (
                  <span className="requirement-item">
                    <span className="requirement-label">Votes needed to tie:</span>
                    <span className="requirement-value">{event.metadata.required_to_tie}</span>
                  </span>
                )}
              </div>
            )}
            {event.metadata.current_chopping_block && (
              <div className="chopping-block-status">
                Current chopping block: {event.metadata.current_chopping_block.nominee || 'Empty'} 
                {event.metadata.current_chopping_block.votes && ` (${event.metadata.current_chopping_block.votes} votes)`}
              </div>
            )}
          </div>
        );
      case 'nomination_complete':
      case 'nomination_result':
        const result = event.metadata.result;
        const votes = event.metadata.votes;
        const requiredVotes = event.metadata.required_to_nominate;
        const voteDetails = event.metadata.vote_details;
        
        return (
          <div className="event-details">
            <div className="nomination-result-header">
              <span className="nomination-result-title">
                {formatPlayerName(event.metadata.nominator, event)} nominates {formatPlayerName(event.metadata.nominee, event)}{' '}
                <span className={`result-status ${result === 'success' ? 'success' : result === 'tie' ? 'tie' : 'failed'}`}>
                  {result === 'success' ? '✅ NOMINATED' : 
                   result === 'tie' ? '🤝 TIED' : 
                   '❌ FAILED'}
                </span>
              </span>
            </div>
            {event.metadata.public_reasoning && (
              <div className="reasoning-section">
                <div className="reasoning-label">Public Reasoning:</div>
                <div className="reasoning-text">"{event.metadata.public_reasoning}"</div>
              </div>
            )}
            {event.metadata.private_reasoning && (
              <div className="reasoning-section private">
                <div className="reasoning-label">Private Reasoning:</div>
                <div className="reasoning-text">"{event.metadata.private_reasoning}"</div>
              </div>
            )}
            <div className="nomination-result-summary">
              <div className="vote-count-summary">
                <span className="vote-count">{votes} votes</span>
                {requiredVotes && (
                  <span className="required-votes">(needed {requiredVotes})</span>
                )}
              </div>
            </div>
            {voteDetails && voteDetails.length > 0 && (
              <div className="vote-breakdown">
                <div className="vote-breakdown-header">Votes:</div>
                <div className="compact-vote-list">
                  {voteDetails.map((voteDetail: any, index: number) => (
                    <div key={index} className={`compact-vote-item ${voteDetail.vote.toLowerCase().replace('_', '-')}`}>
                      <span className="compact-voter-name">{formatPlayerName(voteDetail.voter, event)}</span>
                      <span className={`compact-vote-value ${voteDetail.vote.toLowerCase().replace('_', '-')}`}>
                        {formatVoteValue(voteDetail.vote)}
                      </span>
                    </div>
                  ))}
                </div>
                <details className="voting-breakdown">
                  <summary>View Individual Votes and Reasoning</summary>
                  <div className="individual-votes">
                    {voteDetails.map((voteDetail: any, index: number) => {
                      const voteValue = voteDetail.vote?.toLowerCase();
                      const isYesVote = voteValue === 'yes' || voteValue === 'true' || voteValue === '1';
                      const isNoVote = voteValue === 'no' || voteValue === 'false' || voteValue === '0';
                      const isCantVote = voteValue === 'cant_vote';
                      
                      return (
                        <div key={index} className={`vote-item ${isYesVote ? 'yes' : isNoVote ? 'no' : isCantVote ? 'cant-vote' : 'other'}`}>
                          <div className="vote-header">
                            <span className="voter-name">{formatPlayerName(voteDetail.voter, event)}</span>
                            <span className={`vote-value ${isYesVote ? 'yes' : isNoVote ? 'no' : isCantVote ? 'cant-vote' : 'other'}`}>
                              {formatVoteDisplayText(voteDetail.vote)}
                            </span>
                          </div>
                          <div className="vote-reasoning-container">
                            {voteDetail.public_reasoning && (
                              <div className="vote-reasoning public">
                                <span className="reasoning-label">Public:</span>
                                <span className="reasoning-text">"{voteDetail.public_reasoning}"</span>
                              </div>
                            )}
                            {voteDetail.private_reasoning && (
                              <div className="vote-reasoning private">
                                <span className="reasoning-label">Private:</span>
                                <span className="reasoning-text">"{voteDetail.private_reasoning}"</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>
              </div>
            )}
          </div>
        );
      case 'slayer_power':
        return (
          <div className="event-details">
            <div className="narrative-description">
              <span className="power-icon">{getEventIcon(event.event_type)}</span>
              <span className="narrative-text">
                {formatPlayerName(event.metadata.player_name, event)} tried to slay {formatPlayerName(event.metadata.target, event)}
                {event.metadata.success !== undefined && (
                  <span className={`result-indicator ${event.metadata.success ? 'success' : 'failed'}`}>
                    {event.metadata.success ? ' and succeeded' : ' but failed'}
                  </span>
                )}
              </span>
            </div>
          </div>
        );
      case 'player_pass':
        return (
          <div className="event-details">
            <div className="narrative-description">
              <span className="power-icon">{getEventIcon(event.event_type)}</span>
              <span className="narrative-text">
                {formatPlayerName(event.metadata.player_name, event)} passed their turn
              </span>
            </div>
            {event.metadata.private_reasoning && (
              <div className="reasoning-section private">
                <div className="reasoning-label">Private Reasoning:</div>
                <div className="reasoning-text">"{event.metadata.private_reasoning}"</div>
              </div>
            )}
          </div>
        );
      case 'poisoner_power':
        return (
          <div className="event-details">
            <div className="narrative-description">
              <span className="power-icon">{getEventIcon(event.event_type)}</span>
              <span className="narrative-text">
                {formatPlayerName(event.metadata.player_name, event)} poisoned {formatPlayerName(event.metadata.target, event)}
                {event.metadata.success !== undefined && (
                  <span className={`result-indicator ${event.metadata.success ? 'success' : 'failed'}`}>
                    {event.metadata.success ? '' : ' but it failed'}
                  </span>
                )}
              </span>
            </div>
            {event.metadata.private_reasoning && (
              <div className="reasoning-section private">
                <div className="reasoning-label">Private Reasoning:</div>
                <div className="reasoning-text">"{event.metadata.private_reasoning}"</div>
              </div>
            )}
          </div>
        );
      case 'imp_power':
        return (
          <div className="event-details">
            <div className="narrative-description">
              <span className="power-icon">{getEventIcon(event.event_type)}</span>
              <span className="narrative-text">
                {formatPlayerName(event.metadata.player_name, event)} attacked {formatPlayerName(event.metadata.target, event)}
                {event.metadata.success !== undefined && (
                  <span className={`result-indicator ${event.metadata.success ? 'success' : 'failed'}`}>
                    {event.metadata.success ? ' and killed them' : ' but they survived'}
                  </span>
                )}
              </span>
            </div>
            {event.metadata.private_reasoning && (
              <div className="reasoning-section private">
                <div className="reasoning-label">Private Reasoning:</div>
                <div className="reasoning-text">"{event.metadata.private_reasoning}"</div>
              </div>
            )}
          </div>
        );
      case 'empath_power':
        return (
          <div className="event-details">
            <div className="narrative-description">
              <span className="power-icon">💜</span>
              <span className="narrative-text">
                {formatPlayerName(event.metadata.player_name, event)} checked their neighbors{' '}
                {event.metadata.neighbors && event.metadata.neighbors.map((neighbor: string, index: number) => (
                  <span key={index}>
                    {formatPlayerName(neighbor, event)}
                    {index < event.metadata.neighbors.length - 1 ? ' and ' : ''}
                  </span>
                ))}
                {event.metadata.evil_count !== undefined && (
                  <span className="result-indicator">
                    {' '}and learned that {event.metadata.evil_count} of them {event.metadata.evil_count === 1 ? 'is' : 'are'} evil
                  </span>
                )}
              </span>
            </div>
          </div>
        );
      case 'fortuneteller_power':
        return (
          <div className="event-details">
            <div className="narrative-description">
              <span className="power-icon">🔮</span>
              <span className="narrative-text">
                {formatPlayerName(event.metadata.player_name, event)} chose{' '}
                {event.metadata.choices && event.metadata.choices.map((choice: string, index: number) => (
                  <span key={index}>
                    {formatPlayerName(choice, event)}
                    {index < event.metadata.choices.length - 1 ? ' and ' : ''}
                  </span>
                ))}
                {event.metadata.result && (
                  <span className="result-indicator">
                    {event.metadata.result === 'yes' 
                      ? ' and learned that one of them is the Demon' 
                      : ' and learned that neither is the Demon'}
                  </span>
                )}
              </span>
            </div>
            {event.metadata.private_reasoning && (
              <div className="reasoning-section private">
                <div className="reasoning-label">Private Reasoning:</div>
                <div className="reasoning-text">"{event.metadata.private_reasoning}"</div>
              </div>
            )}
          </div>
        );
      case 'spy_power':
        return (
          <div className="event-details">
            <div className="narrative-description">
              <span className="power-icon">🕵️</span>
              <span className="narrative-text">
                {formatPlayerName(event.metadata.player_name, event)} viewed the Storyteller's grimoire and learned all game information
                {event.metadata.info_sections && (
                  <span className="result-indicator">
                    {' '}(viewed: {event.metadata.info_sections})
                  </span>
                )}
              </span>
            </div>
          </div>
        );
      case 'execution':
        return (
          <div className="event-details">
            <div className="execution-summary">
              <span className="execution-icon">⚔️</span>
              <span className="executed-player">{formatPlayerName(event.metadata.executed_player, event)}</span>
              <span className="execution-label">has been executed</span>
            </div>
          </div>
        );
      case 'player_death':
        const killedByDemon = event.metadata.killed_by_demon;
        
        // Check if the previous event was an execution to determine death cause
        const currentEventIndex = events.findIndex(e => e === event);
        const previousEvent = currentEventIndex > 0 ? events[currentEventIndex - 1] : null;
        const wasExecuted = previousEvent?.event_type === 'execution';
        
        return (
          <div className="event-details">
            <div className="death-summary">
              <span className="death-icon">{killedByDemon ? '👹' : '💀'}</span>
              <span className="dead-player">{formatPlayerName(event.metadata.player_name, event)}</span>
              <span className="death-cause">
                {killedByDemon ? 'killed by Demon' : wasExecuted ? 'died by execution' : 'died'}
              </span>
            </div>
          </div>
        );
      case 'undertaker_power':
        return (
          <div className="event-details">
            <div className="narrative-description">
              <span className="power-icon">{getEventIcon(event.event_type)}</span>
              <span className="narrative-text">
                {formatPlayerName(event.metadata.player_name, event)} learned {formatPlayerName(event.metadata.executed_player, event)} was the{' '}
                <span className={`character-name ${isEvilCharacter(event.metadata.learned_character) ? 'evil' : 'good'}`}>
                  {event.metadata.learned_character}
                </span>
              </span>
            </div>
          </div>
        );
      case 'chef_power':
        return (
          <div className="event-details">
            <div className="narrative-description">
              <span className="power-icon">{getEventIcon(event.event_type)}</span>
              <span className="narrative-text">
                {formatPlayerName(event.metadata.player_name, event)} learned there {event.metadata.evil_pairs === 1 ? 'is' : 'are'}{' '}
                <span className="result-indicator">{event.metadata.evil_pairs} pair{event.metadata.evil_pairs !== 1 ? 's' : ''}</span> of evil players sitting next to each other
              </span>
            </div>
          </div>
        );
      case 'washerwoman_power':
        return (
          <div className="event-details">
            <div className="narrative-description">
              <span className="power-icon">{getEventIcon(event.event_type)}</span>
              <span className="narrative-text">
                {formatPlayerName(event.metadata.player_name, event)} learned that one of{' '}
                {event.metadata.shown_players && event.metadata.shown_players.map((player: string, index: number) => (
                  <span key={index}>
                    {formatPlayerName(player, event)}
                    {index < event.metadata.shown_players.length - 1 ? ' and ' : ''}
                  </span>
                ))}
                {event.metadata.shown_character && (
                  <span className="result-indicator">
                    {' '}is the <span className={`character-name ${isEvilCharacter(event.metadata.shown_character) ? 'evil' : 'good'}`}>
                      {event.metadata.shown_character}
                    </span>
                  </span>
                )}
              </span>
            </div>
          </div>
        );
      case 'librarian_power':
        return (
          <div className="event-details">
            <div className="narrative-description">
              <span className="power-icon">{getEventIcon(event.event_type)}</span>
              <span className="narrative-text">
                {formatPlayerName(event.metadata.player_name, event)} learned that one of{' '}
                {event.metadata.shown_players && event.metadata.shown_players.map((player: string, index: number) => (
                  <span key={index}>
                    {formatPlayerName(player, event)}
                    {index < event.metadata.shown_players.length - 1 ? ' and ' : ''}
                  </span>
                ))}
                {event.metadata.shown_character && (
                  <span className="result-indicator">
                    {' '}is the <span className={`character-name ${isEvilCharacter(event.metadata.shown_character) ? 'evil' : 'good'}`}>
                      {event.metadata.shown_character}
                    </span>
                  </span>
                )}
              </span>
            </div>
          </div>
        );
      case 'investigator_power':
        return (
          <div className="event-details">
            <div className="narrative-description">
              <span className="power-icon">{getEventIcon(event.event_type)}</span>
              <span className="narrative-text">
                {formatPlayerName(event.metadata.player_name, event)} learned that one of{' '}
                {event.metadata.shown_players && event.metadata.shown_players.map((player: string, index: number) => (
                  <span key={index}>
                    {formatPlayerName(player, event)}
                    {index < event.metadata.shown_players.length - 1 ? ' and ' : ''}
                  </span>
                ))}
                {event.metadata.shown_character && (
                  <span className="result-indicator">
                    {' '}is the <span className={`character-name ${isEvilCharacter(event.metadata.shown_character) ? 'evil' : 'good'}`}>
                      {event.metadata.shown_character}
                    </span>
                  </span>
                )}
              </span>
            </div>
          </div>
        );
      case 'monk_power':
        return (
          <div className="event-details">
            <div className="narrative-description">
              <span className="power-icon">{getEventIcon(event.event_type)}</span>
              <span className="narrative-text">
                {formatPlayerName(event.metadata.player_name, event)} chose someone to protect from the Demon
                {event.metadata.target && (
                  <span className="result-indicator">
                    {' '}(protected {formatPlayerName(event.metadata.target, event)})
                  </span>
                )}
              </span>
            </div>
            {event.metadata.private_reasoning && (
              <div className="reasoning-section private">
                <div className="reasoning-label">Private Reasoning:</div>
                <div className="reasoning-text">"{event.metadata.private_reasoning}"</div>
              </div>
            )}
          </div>
        );
      case 'ravenkeeper_power':
        return (
          <div className="event-details">
            <div className="narrative-description">
              <span className="power-icon">{getEventIcon(event.event_type)}</span>
              <span className="narrative-text">
                {formatPlayerName(event.metadata.player_name, event)} learned the character of a chosen player
              </span>
            </div>
          </div>
        );
      case 'butler_power':
        return (
          <div className="event-details">
            <div className="narrative-description">
              <span className="power-icon">{getEventIcon(event.event_type)}</span>
              <span className="narrative-text">
                {formatPlayerName(event.metadata.player_name, event)} chose their master
                {event.metadata.target && (
                  <span className="result-indicator">
                    {' '}(chose {formatPlayerName(event.metadata.target, event)})
                  </span>
                )}
              </span>
            </div>
            {event.metadata.private_reasoning && (
              <div className="reasoning-section private">
                <div className="reasoning-label">Private Reasoning:</div>
                <div className="reasoning-text">"{event.metadata.private_reasoning}"</div>
              </div>
            )}
          </div>
        );
      case 'virgin_power':
        return (
          <div className="event-details">
            <div className="narrative-description">
              <span className="power-icon">{getEventIcon(event.event_type)}</span>
              <span className="narrative-text">
                {formatPlayerName(event.metadata.player_name, event)} was nominated and their virgin power activated
              </span>
            </div>
          </div>
        );
      case 'message':
        const isPrivateMessage = event.metadata.recipients && event.metadata.recipients.length === 1;
        const isStoryteller = event.metadata.sender === 'Storyteller';
        
        // Get all players and message details
        const gameState = event.game_state || event.public_game_state;
        const allPlayers = gameState?.player_state?.map(p => p.name) || [];
        const recipients = event.metadata.recipients || [];
        const sender = event.metadata.sender;
        
        // Calculate expected recipients for "Everyone" (all players except sender)
        const expectedEveryoneRecipients = allPlayers.filter(player => player !== sender);
        
        // Find players who didn't receive the message (excluding the sender)
        const missingPlayers = expectedEveryoneRecipients.filter(player => 
          !recipients.includes(player)
        );
        
        // Determine message type based on recipients
        const isEveryone = missingPlayers.length === 0 && recipients.length === expectedEveryoneRecipients.length;
        const isEveryoneButOne = missingPlayers.length === 1;
        const isEveryoneButTwo = missingPlayers.length === 2;
        
        const isPublicMessage = recipients.length > 1 && !isEveryone && !isEveryoneButOne && !isEveryoneButTwo;
        
        return (
          <div className="event-details">
            <div className="message-header">
              <div className="message-participants">
                <span className="sender-name">
                  {event.metadata.sender === 'Storyteller' ? 'Storyteller' : formatPlayerName(event.metadata.sender, event)}
                </span>
                <span className="message-arrow">→</span>
                <span className={`recipients ${isPrivateMessage ? 'private' : (isPublicMessage || isEveryone || isEveryoneButOne || isEveryoneButTwo) ? 'public' : ''}`}>
                  {isEveryone ? <span className="everyone">Everyone</span> :
                   isEveryoneButOne ? (
                     <><span className="everyone">Everyone</span> <span className="but-text">but</span> {formatPlayerName(missingPlayers[0], event)}</>
                   ) :
                   isEveryoneButTwo ? (
                     <><span className="everyone">Everyone</span> <span className="but-text">but</span> {formatPlayerName(missingPlayers[0], event)} <span className="but-text">and</span> {formatPlayerName(missingPlayers[1], event)}</>
                   ) :
                   event.metadata.recipients?.map((recipient: string, index: number) => (
                     <span key={index}>
                       {recipient === 'Storyteller' ? 'Storyteller' : formatPlayerName(recipient, event)}
                       {index < event.metadata.recipients.length - 1 ? ', ' : ''}
                     </span>
                   ))}
                </span>
              </div>
              <div className="message-type">
                {isStoryteller ? '📢 Storyteller Info' : 
                 isPrivateMessage ? '🔒 Private Message' : 
                 isEveryone ? '📢 Public Message (Everyone)' :
                 isEveryoneButOne ? '📢 Public Message (Excluding One)' :
                 isEveryoneButTwo ? '📢 Public Message (Excluding Two)' :
                 isPublicMessage ? '📢 Public Message' : '💬 Message'}
              </div>
            </div>
            {event.metadata.message && (
              <div className="message-content">
                <div className="message-text">"{event.metadata.message}"</div>
              </div>
            )}
          </div>
        );
      case 'game_end':
        const winner = event.metadata.winner;
        const apiCostSummary = event.metadata.api_cost_summary;
        const gameStats = event.metadata.game_statistics;
        
        return (
          <div className="event-details">
            <div className="event-title">
              <span className="event-title-text">🏁 Game End</span>
            </div>
            <div className="game-end-summary">
              <span className={`winner-team ${winner?.toLowerCase()}`}>
                {winner} Team Wins!
              </span>
            </div>
            
            {gameStats && (
              <div className="game-stats-section">
                <div className="stats-header">Game Statistics</div>
                <div className="game-stats">
                  {gameStats.total_rounds && (
                    <div className="stat-item">
                      <span className="stat-label">Total Rounds:</span>
                      <span className="stat-value">{gameStats.total_rounds}</span>
                    </div>
                  )}
                  {gameStats.total_events && (
                    <div className="stat-item">
                      <span className="stat-label">Total Events:</span>
                      <span className="stat-value">{gameStats.total_events}</span>
                    </div>
                  )}
                  {gameStats.events_by_type?.nomination && (
                    <div className="stat-item">
                      <span className="stat-label">Total Nominations:</span>
                      <span className="stat-value">{gameStats.events_by_type.nomination}</span>
                    </div>
                  )}
                  {gameStats.events_by_type?.message && (
                    <div className="stat-item">
                      <span className="stat-label">Total Messages:</span>
                      <span className="stat-value">{gameStats.events_by_type.message}</span>
                    </div>
                  )}
                  {gameStats.events_by_type?.execution && (
                    <div className="stat-item">
                      <span className="stat-label">Total Executions:</span>
                      <span className="stat-value">{gameStats.events_by_type.execution}</span>
                    </div>
                  )}
                  {gameStats.events_by_type?.voting && (
                    <div className="stat-item">
                      <span className="stat-label">Total Votes:</span>
                      <span className="stat-value">{gameStats.events_by_type.voting}</span>
                    </div>
                  )}
                  {gameStats.events_by_type?.notes_update && (
                    <div className="stat-item">
                      <span className="stat-label">Notes Updates:</span>
                      <span className="stat-value">{gameStats.events_by_type.notes_update}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {apiCostSummary && (
              <div className="api-stats-section">
                <div className="stats-header">API Usage</div>
                <div className="game-stats">
                  <div className="stat-item">
                    <span className="stat-label">Total API Calls:</span>
                    <span className="stat-value">{apiCostSummary.total_api_calls}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total Cost:</span>
                    <span className="stat-value">${apiCostSummary.total_cost_usd.toFixed(4)}</span>
                  </div>
                  {apiCostSummary.total_input_tokens && (
                    <div className="stat-item">
                      <span className="stat-label">Input Tokens:</span>
                      <span className="stat-value">{apiCostSummary.total_input_tokens.toLocaleString()}</span>
                    </div>
                  )}
                  {apiCostSummary.total_output_tokens && (
                    <div className="stat-item">
                      <span className="stat-label">Output Tokens:</span>
                      <span className="stat-value">{apiCostSummary.total_output_tokens.toLocaleString()}</span>
                    </div>
                  )}
                  {apiCostSummary.average_cost_per_call && (
                    <div className="stat-item">
                      <span className="stat-label">Avg Cost/Call:</span>
                      <span className="stat-value">${apiCostSummary.average_cost_per_call.toFixed(6)}</span>
                    </div>
                  )}
                  {apiCostSummary.total_cache_creation_tokens && (
                    <div className="stat-item">
                      <span className="stat-label">Cache Write:</span>
                      <span className="stat-value">{apiCostSummary.total_cache_creation_tokens.toLocaleString()}</span>
                    </div>
                  )}
                  {apiCostSummary.total_cache_read_tokens && (
                    <div className="stat-item">
                      <span className="stat-label">Cache Read:</span>
                      <span className="stat-value">{apiCostSummary.total_cache_read_tokens.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {event.metadata.final_player_states && (
              <div className="final-states-section">
                <div className="stats-header">Final Player States</div>
                <div className="final-players">
                  {event.metadata.final_player_states.map((player: any, index: number) => (
                    <div key={index} className="final-player">
                      <span className={`player-name ${isEvilCharacter(player.character) ? 'evil' : 'good'}`}>
                        {player.name}
                      </span>
                      <span className={`character-name ${isEvilCharacter(player.character) ? 'evil' : 'good'}`}>
                        ({player.character})
                      </span>
                      <span className={`player-status ${player.alive ? 'alive' : 'dead'}`}>
                        {player.alive ? '✅ Alive' : '💀 Dead'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 'round_start':
        return (
          <div className="event-details">
            <div className="compact-setup">
              <span className="setup-icon">🔄</span>
              <span className="setup-text">Round {event.round_number} - {event.phase} begins</span>
            </div>
          </div>
        );
      case 'nominations_open':
        return (
          <div className="event-details">
            <div className="compact-setup">
              <span className="setup-icon">🗳️</span>
              <span className="setup-text">Nominations are now open</span>
            </div>
          </div>
        );
      case 'notes_update':
        return (
          <div className="event-details">
            <div className="notes-header">
              <span className="notes-icon">📝</span>
              <span className="notes-player">{formatPlayerName(event.metadata.player_name, event)}</span>
              <span className="notes-action">updated their notes</span>
            </div>
            <details className="notes-details">
              <summary className="notes-toggle">
                <span className="notes-toggle-text">View Notes</span>
                <span className="notes-toggle-arrow">▼</span>
              </summary>
              <div className="notes-content">
                <div className="notes-text">
                  {event.metadata.notes.split('\n').map((line: string, index: number) => {
                    const trimmedLine = line.trim();
                    const isBulletPoint = trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*');
                    const cleanLine = isBulletPoint ? trimmedLine.substring(1).trim() : trimmedLine;
                    
                    return (
                      <div 
                        key={index} 
                        className={`notes-line ${isBulletPoint ? 'bullet-point' : ''}`}
                        data-bullet={isBulletPoint}
                      >
                        {cleanLine}
                      </div>
                    );
                  })}
                </div>
              </div>
            </details>
          </div>
        );
      case 'notes_update_combined':
        return (
          <div className="event-details">
            <div className="notes-header">
              <span className="notes-icon">📝</span>
              <span className="notes-summary">{event.metadata.count} players updated their notes</span>
            </div>
            <div className="combined-notes-container">
              {event.metadata.notes_updates.map((noteUpdate: any, index: number) => {
                return (
                  <details key={index} className="notes-details">
                    <summary className="notes-toggle">
                      <span className="notes-toggle-text">
                        {formatPlayerName(noteUpdate.player_name, event)} Notes
                      </span>
                      <span className="notes-toggle-arrow">▼</span>
                    </summary>
                  <div className="notes-content">
                    <div className="notes-text">
                      {noteUpdate.notes.split('\n').map((line: string, lineIndex: number) => {
                        const trimmedLine = line.trim();
                        const isBulletPoint = trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*');
                        const cleanLine = isBulletPoint ? trimmedLine.substring(1).trim() : trimmedLine;
                        
                        return (
                          <div 
                            key={lineIndex} 
                            className={`notes-line ${isBulletPoint ? 'bullet-point' : ''}`}
                            data-bullet={isBulletPoint}
                          >
                            {cleanLine}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </details>
                );
              })}
            </div>
          </div>
        );
      case 'death_announcement':
        return (
          <div className="event-details">
            <div className="death-announcement-header">
              <span className="death-announcement-icon">💀</span>
              <span className="death-announcement-title">Death Announcement</span>
            </div>
            <div className="death-announcement-summary">
              {event.metadata.dead_players && event.metadata.dead_players.length > 0 ? (
                <div className="dead-players-list">
                  <span className="dead-players-label">Found dead this morning:</span>
                  <span className="dead-players-names">
                    {event.metadata.dead_players.map((player: string, index: number) => (
                      <span key={index} className="dead-player-name">
                        {formatPlayerName(player, event)}
                        {index < event.metadata.dead_players.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </span>
                </div>
              ) : (
                <div className="no-deaths-message">
                  <span className="no-deaths-text">No one died in the night</span>
                </div>
              )}
            </div>
          </div>
        );
      case 'minion_info':
        return (
          <div className="event-details">
            <div className="narrative-description">
              <span className="power-icon">{getEventIcon(event.event_type)}</span>
              <span className="narrative-text">
                {formatPlayerName(event.participants[1], event)} learned that {formatPlayerName(event.metadata.demon, event)} is the{' '}
                {event.metadata.demon_character && (
                  <span className={`character-name ${isEvilCharacter(event.metadata.demon_character) ? 'evil' : 'good'}`}>
                    {event.metadata.demon_character}
                  </span>
                )}
                {event.metadata.minions && event.metadata.minions.length > 1 && (
                  <>
                    {' '}and their fellow minion{event.metadata.minions.length > 2 ? 's are' : ' is'}{' '}
                    {event.metadata.minions.map((minion: any, index: number) => {
                      const minionName = typeof minion === 'string' ? minion : minion.name;
                      const minionCharacter = typeof minion === 'object' ? minion.character : null;
                      // Skip the current minion (the one receiving this info)
                      if (minionName === event.participants[1]) return null;
                      return (
                        <span key={index}>
                          {formatPlayerName(minionName, event)}
                          {minionCharacter && (
                            <span className={`character-name ${isEvilCharacter(minionCharacter) ? 'evil' : 'good'}`}>
                              {' '}({minionCharacter})
                            </span>
                          )}
                        </span>
                      );
                    }).filter(Boolean).reduce((prev: any, curr: any, index: number, array: any[]) => {
                      if (index === 0) return [curr];
                      if (index === array.length - 1) return [...prev, ' and ', curr];
                      return [...prev, ', ', curr];
                    }, [])}
                  </>
                )}
              </span>
            </div>
          </div>
        );
      case 'demon_info':
        return (
          <div className="event-details">
            <div className="narrative-description">
              <span className="power-icon">{getEventIcon(event.event_type)}</span>
              <span className="narrative-text">
                {formatPlayerName(event.participants[1], event)} learned that{' '}
                {event.metadata.not_in_play && event.metadata.not_in_play.length > 0 && (
                  <>
                    <span className="result-indicator">
                      {event.metadata.not_in_play.join(', ')}
                    </span>
                    {' '}are not in play
                  </>
                )}
                {event.metadata.minions && event.metadata.minions.length > 0 && (
                  <>
                    {event.metadata.not_in_play && event.metadata.not_in_play.length > 0 ? ' and their minion' : 'their minion'}
                    {event.metadata.minions.length > 1 ? 's are ' : ' is '}
                    {event.metadata.minions.map((minion: any, index: number) => {
                      const minionName = typeof minion === 'string' ? minion : minion.name;
                      const minionCharacter = typeof minion === 'object' ? minion.character : null;
                      return (
                        <span key={index}>
                          {formatPlayerName(minionName, event)}
                          {minionCharacter && (
                            <span className={`character-name ${isEvilCharacter(minionCharacter) ? 'evil' : 'good'}`}>
                              {' '}({minionCharacter})
                            </span>
                          )}
                          {index < event.metadata.minions.length - 1 ? ' and ' : ''}
                        </span>
                      );
                    })}
                  </>
                )}
              </span>
            </div>
          </div>
        );
      case 'player_pass_combined':
        return (
          <div className="event-details">
            <div className="notes-header">
              <span className="notes-icon">⏭️</span>
              <span className="notes-summary">{event.metadata.count} players passed their turn</span>
            </div>
            <div className="combined-notes-container">
              {event.metadata.pass_events.map((passEvent: any, index: number) => {
                return (
                  <details key={index} className="notes-details">
                    <summary className="notes-toggle">
                      <span className="notes-toggle-text">
                        {formatPlayerName(passEvent.player_name, event)} Pass
                      </span>
                      <span className="notes-toggle-arrow">▼</span>
                    </summary>
                  <div className="notes-content">
                    <div className="notes-text">
                      {passEvent.private_reasoning && (
                        <div className="reasoning-section private">
                          <div className="reasoning-label">Private Reasoning:</div>
                          <div className="reasoning-text">"{passEvent.private_reasoning}"</div>
                        </div>
                      )}
                    </div>
                  </div>
                </details>
                );
              })}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Instead of grouping by phase, let's just render events in chronological order
  // but still show phase headers when the phase changes
  const eventsWithPhaseBreaks: Array<{ type: 'phase' | 'event'; data: any; index?: number }> = [];
  let currentPhase = '';
  
  events.forEach((event, index) => {
    const phaseKey = `${event.round_number}-${event.phase}`;
    
    // Add phase header if this is a new phase
    if (phaseKey !== currentPhase) {
      currentPhase = phaseKey;
      const phaseEvents = events.filter(e => `${e.round_number}-${e.phase}` === phaseKey);
      eventsWithPhaseBreaks.push({
        type: 'phase',
        data: {
          phaseKey,
          event,
          eventCount: phaseEvents.length
        }
      });
    }
    
    // Add the event
    eventsWithPhaseBreaks.push({
      type: 'event',
      data: event,
      index
    });
  });

  return (
    <div className="timeline">
      <div className="timeline-header">
        <button 
          className="game-selector-button"
          onClick={onToggleGameSelector}
          title="Select Game"
        >
          <span className="selector-icon">☰</span>
        </button>
        <h2>Game Timeline</h2>
      </div>
      <div className="timeline-container" ref={timelineRef}>
        {eventsWithPhaseBreaks.map((item, itemIndex) => {
          if (item.type === 'phase') {
            const { event, eventCount } = item.data;
            const phaseColor = getPhaseColor(event.phase);
            
            return (
              <div 
                key={`phase-${itemIndex}`}
                className="phase-header"
                style={{ borderLeftColor: phaseColor }}
              >
                <span className="phase-title">
                  {event.phase === 'Setup' ? 'Setup' : `Round ${event.round_number} - ${event.phase}`}
                </span>
                <span className="phase-event-count">
                  {eventCount} event{eventCount !== 1 ? 's' : ''}
                </span>
              </div>
            );
          } else {
            const event = item.data;
            const index = item.index!;
            const indentLevel = getPhaseIndentation(event.phase);
            const phaseColor = getPhaseColor(event.phase);
            
            return (
              <div
                key={`event-${index}`}
                ref={(el) => { eventRefs.current[index] = el; }}
                className={`timeline-event indent-${indentLevel} ${index === currentEventIndex ? 'current' : ''} ${index < currentEventIndex ? 'past' : ''}`}
                onClick={() => onEventClick(index)}
                onMouseEnter={() => {
                  onEventClick(index);
                  if (onPlayerHighlight) {
                    const initiatingPlayer = getInitiatingPlayer(event);
                    onPlayerHighlight(initiatingPlayer);
                  }
                }}
                onMouseLeave={() => {
                  if (onPlayerHighlight) {
                    onPlayerHighlight(null);
                  }
                }}
                style={{ 
                  borderLeftColor: phaseColor,
                  marginLeft: `${indentLevel * 20}px`
                }}
              >
                <div className="timeline-marker">
                  <div 
                    className="timeline-dot"
                    style={{ backgroundColor: getEventIconBackgroundColor(event.event_type) }}
                  >
                    <span className="event-icon">{getEventIcon(event.event_type)}</span>
                  </div>
                  {index < events.length - 1 && (
                    <div 
                      className="timeline-line" 
                      style={{ backgroundColor: phaseColor }}
                    />
                  )}
                </div>
                <div className="timeline-content">
                  {renderEventDetails(event) ? (
                    <>
                      <div className="event-time-only">{formatTime(event.timestamp)}</div>
                      {renderEventDetails(event)}
                    </>
                  ) : (
                    <>
                      <div className="event-header">
                        <span className="event-type">{event.event_type.replace(/_/g, ' ')}</span>
                        <span className="event-time">{formatTime(event.timestamp)}</span>
                      </div>
                      <div className="event-description">{event.description}</div>
                    </>
                  )}
                  <details className="event-json-details">
                    <summary className="json-toggle">
                      <span className="json-toggle-text">View JSON</span>
                      <span className="json-toggle-arrow">▼</span>
                    </summary>
                    <div className="json-content">
                      <pre>{JSON.stringify(event, null, 2)}</pre>
                    </div>
                  </details>
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};

export default Timeline; 