import React, { useEffect, useRef } from 'react';
import { GameEvent } from '../types';
import { getEventTypeColor, getPhaseColor, getPhaseIndentation, isEvilCharacter } from '../gameData';
import './Timeline.css';

interface TimelineProps {
  events: GameEvent[];
  currentEventIndex: number;
  onEventClick: (index: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({ events, currentEventIndex, onEventClick }) => {
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
    const playerState = event.public_game_state?.player_state?.find(p => p.name === playerName);
    if (playerState?.character) {
      const isEvil = isEvilCharacter(playerState.character);
      return (
        <>
          <span className={`player-name ${isEvil ? 'evil' : 'good'}`}>{playerName}</span>{' '}
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
      'nomination_complete': '⚖️',
      'nomination_result': '⚖️',
      'voting': '🗳️',
      'execution': '⚔️',
      'player_death': '💀',
      'message': '💬',
      'storyteller_info': '📢',
      'game_end': '🏁',
      'slayer_power': '⚡',
      'poisoner_power': '☠️',
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
    };
    return icons[eventType] || '📝';
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
      case 'poisoner_power':
      case 'imp_power':
        const powerType = event.event_type.replace('_power', '').replace(/^\w/, c => c.toUpperCase());
        return (
          <div className="event-details">
            <div className="power-header">
              <span className="power-icon">{getEventIcon(event.event_type)}</span>
              <span className="power-player">{formatPlayerName(event.metadata.player_name, event)}</span>
              <span className="power-type">{powerType}</span>
            </div>
            {event.metadata.target && (
              <div className="power-info">
                <span className="info-label">Target:</span>
                <span className="info-value">{formatPlayerName(event.metadata.target, event)}</span>
              </div>
            )}
            {event.metadata.success !== undefined && (
              <div className="power-result">
                <span className="result-label">Result:</span>
                <span className={`result-value ${event.metadata.success ? 'yes' : 'no'}`}>
                  {event.metadata.success ? '✅ Success' : '❌ Failed'}
                </span>
              </div>
            )}
          </div>
        );
      case 'empath_power':
        return (
          <div className="event-details">
            <div className="power-header">
              <span className="power-icon">💜</span>
              <span className="power-player">{formatPlayerName(event.metadata.player_name, event)}</span>
              <span className="power-type">Empath</span>
            </div>
            {event.metadata.neighbors && (
              <div className="power-info">
                <span className="info-label">Neighbors:</span>
                <span className="info-value">
                  {event.metadata.neighbors.map((neighbor: string, index: number) => (
                    <span key={index}>
                      {formatPlayerName(neighbor, event)}
                      {index < event.metadata.neighbors.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </span>
              </div>
            )}
            {event.metadata.evil_count !== undefined && (
              <div className="power-result">
                <span className="result-label">Evil Count:</span>
                <span className="result-value">{event.metadata.evil_count}</span>
              </div>
            )}
          </div>
        );
      case 'fortuneteller_power':
        return (
          <div className="event-details">
            <div className="power-header">
              <span className="power-icon">🔮</span>
              <span className="power-player">{formatPlayerName(event.metadata.player_name, event)}</span>
              <span className="power-type">Fortune Teller</span>
            </div>
            {event.metadata.choices && (
              <div className="power-info">
                <span className="info-label">Checked:</span>
                <span className="info-value">
                  {event.metadata.choices.map((choice: string, index: number) => (
                    <span key={index}>
                      {formatPlayerName(choice, event)}
                      {index < event.metadata.choices.length - 1 ? ' & ' : ''}
                    </span>
                  ))}
                </span>
              </div>
            )}
            {event.metadata.result && (
              <div className="power-result">
                <span className="result-label">Result:</span>
                <span className={`result-value ${event.metadata.result.toLowerCase()}`}>
                  {event.metadata.result === 'yes' ? '✅ YES - One is the Demon' : '❌ NO - Neither is the Demon'}
                </span>
              </div>
            )}
          </div>
        );
      case 'spy_power':
        return (
          <div className="event-details">
            <div className="power-header">
              <span className="power-icon">🕵️</span>
              <span className="power-player">{formatPlayerName(event.metadata.player_name, event)}</span>
              <span className="power-type">Spy</span>
            </div>
            <div className="power-info">
              <span className="info-label">Grimoire Access:</span>
              <span className="info-value">Full access to all game information</span>
            </div>
            {event.metadata.info_sections && (
              <div className="power-result">
                <span className="result-label">Sections viewed:</span>
                <span className="result-value">{event.metadata.info_sections}</span>
              </div>
            )}
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
        return (
          <div className="event-details">
            <div className="death-summary">
              <span className="death-icon">{killedByDemon ? '👹' : '💀'}</span>
              <span className="dead-player">{formatPlayerName(event.metadata.player_name, event)}</span>
              <span className="death-cause">
                {killedByDemon ? 'killed by Demon' : 'died by execution'}
              </span>
            </div>
          </div>
        );
      case 'washerwoman_power':
      case 'librarian_power':
      case 'investigator_power':
      case 'chef_power':
      case 'monk_power':
      case 'ravenkeeper_power':
      case 'undertaker_power':
      case 'butler_power':
      case 'virgin_power':
        const powerName = event.event_type.replace('_power', '').replace(/^\w/, c => c.toUpperCase());
        return (
          <div className="event-details">
            <div className="power-header">
              <span className="power-icon">{getEventIcon(event.event_type)}</span>
              <span className="power-player">{formatPlayerName(event.metadata.player_name, event)}</span>
              <span className="power-type">{powerName}</span>
            </div>
            <div className="power-info">
              <span className="info-label">Power activated</span>
              <span className="info-value">Information received privately</span>
            </div>
          </div>
        );
      case 'message':
        const isPrivateMessage = event.metadata.recipients && event.metadata.recipients.length === 1;
        const isStoryteller = event.metadata.sender === 'Storyteller';
        
        // Check if it's everyone except one player (excluding sender)
        const allPlayers = event.public_game_state?.player_state?.map(p => p.name) || [];
        const recipients = event.metadata.recipients || [];
        const sender = event.metadata.sender;
        
        // Find players who didn't receive the message (excluding the sender)
        const missingPlayers = allPlayers.filter(player => 
          !recipients.includes(player) && player !== sender
        );
        
        const isEveryoneButOne = missingPlayers.length === 1;
        const missingPlayer = isEveryoneButOne ? missingPlayers[0] : null;
        
        const isPublicMessage = event.metadata.recipients && event.metadata.recipients.length > 1 && !isEveryoneButOne;
        
        return (
          <div className="event-details">
            <div className="message-header">
              <div className="message-participants">
                <span className="sender-name">
                  {event.metadata.sender === 'Storyteller' ? 'Storyteller' : formatPlayerName(event.metadata.sender, event)}
                </span>
                <span className="message-arrow">→</span>
                <span className={`recipients ${isPrivateMessage ? 'private' : (isPublicMessage || isEveryoneButOne) ? 'public' : ''}`}>
                  {isPublicMessage ? <span className="everyone">Everyone</span> : 
                   isEveryoneButOne && missingPlayer ? (
                     <><span className="everyone">Everyone</span> <span className="but-text">but</span> {formatPlayerName(missingPlayer, event)}</>
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
                 isEveryoneButOne ? '📢 Public Message (Excluding One)' :
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
        const gameStats = event.metadata.game_stats;
        
        return (
          <div className="event-details">
            <div className="event-title">
              <span className="event-title-text">🏁 Game End</span>
            </div>
            <div className="game-end-summary">
              <span className="game-end-icon">🏁</span>
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
                  {gameStats.total_nominations && (
                    <div className="stat-item">
                      <span className="stat-label">Total Nominations:</span>
                      <span className="stat-value">{gameStats.total_nominations}</span>
                    </div>
                  )}
                  {gameStats.total_executions && (
                    <div className="stat-item">
                      <span className="stat-label">Total Executions:</span>
                      <span className="stat-value">{gameStats.total_executions}</span>
                    </div>
                  )}
                  {gameStats.game_duration && (
                    <div className="stat-item">
                      <span className="stat-label">Game Duration:</span>
                      <span className="stat-value">{gameStats.game_duration}</span>
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
      <h2>Game Timeline</h2>
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
                onMouseEnter={() => onEventClick(index)}
                style={{ 
                  borderLeftColor: phaseColor,
                  marginLeft: `${indentLevel * 20}px`
                }}
              >
                <div className="timeline-marker">
                  <div 
                    className="timeline-dot"
                    style={{ backgroundColor: getEventTypeColor(event.event_type) }}
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