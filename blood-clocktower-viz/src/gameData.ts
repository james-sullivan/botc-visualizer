import { GameEvent } from './types';

export async function loadGameEvents(): Promise<GameEvent[]> {
  try {
    const response = await fetch(`/game_log_20250525_161301.jsonl?t=${Date.now()}`);
    const text = await response.text();
    const lines = text.trim().split('\n');
    const rawEvents = lines.map(line => JSON.parse(line) as GameEvent);
    console.log('Raw events loaded:', rawEvents.length);
    const processedEvents = processEvents(rawEvents);
    console.log('Processed events:', processedEvents.length);
    return processedEvents;
  } catch (error) {
    console.error('Error loading game events:', error);
    return [];
  }
}

function processEvents(events: GameEvent[]): GameEvent[] {
  // Filter out events we want to ignore for a cleaner timeline
  const filteredEvents = events.filter(event => {
    const ignoredEventTypes = [
      'player_pass',
      'notes_update',
      'info_broadcast',
      'player_setup', // This is usually just character assignment
      'phase_change',  // Remove phase_change events as they're redundant with phase headers
      'voting_round',  // Remove voting_round events as they're now integrated into nomination results
      'voting'         // Remove individual voting events as they're now integrated into nomination results
    ];
    
    // Debug: Log any voting_round events we encounter
    if (event.event_type === 'voting_round') {
      console.log('Found voting_round event (should be filtered):', event);
    }
    
    return !ignoredEventTypes.includes(event.event_type) &&
           event.description !== 'Player passed their turn';
  });

  console.log('Filtered events:', filteredEvents.length);
  console.log('Event types after filtering:', Array.from(new Set(filteredEvents.map(e => e.event_type))).sort());

  // Group consecutive voting events
  const processedEvents: GameEvent[] = [];
  let i = 0;

  while (i < filteredEvents.length) {
    const currentEvent = filteredEvents[i];

    // Just add all events without combining nominations and results
    processedEvents.push(currentEvent);
    i++;
  }

  console.log('Final processed events:', processedEvents.length);
  console.log('Final event types:', Array.from(new Set(processedEvents.map(e => e.event_type))).sort());
  
  // Debug: Check for any voting_round events in final output
  const votingRoundEvents = processedEvents.filter(e => e.event_type === 'voting_round');
  if (votingRoundEvents.length > 0) {
    console.error('ERROR: Found voting_round events in final output:', votingRoundEvents);
  }
  
  // Debug: Check for any nomination_complete events in final output
  const nominationCompleteEvents = processedEvents.filter(e => e.event_type === 'nomination_complete');
  if (nominationCompleteEvents.length > 0) {
    console.error('ERROR: Found nomination_complete events in final output:', nominationCompleteEvents);
  }
  
  return processedEvents;
}





// We'll load this from the actual file later
export const gameEvents: GameEvent[] = [];

export function getCharacterColor(character: string): string {
  const colors: Record<string, string> = {
    // Townsfolk (Good)
    'Slayer': '#4CAF50',        // Green
    'Mayor': '#2196F3',         // Blue
    'Empath': '#9C27B0',        // Purple
    'Undertaker': '#795548',    // Brown
    'Fortuneteller': '#E91E63', // Pink
    'Washerwoman': '#00BCD4',   // Cyan
    'Librarian': '#8BC34A',     // Light Green
    'Investigator': '#FF5722',  // Deep Orange
    'Chef': '#FFC107',          // Amber
    'Monk': '#9E9E9E',          // Grey
    'Ravenkeeper': '#607D8B',   // Blue Grey
    'Soldier': '#3F51B5',       // Indigo
    'Virgin': '#FFEB3B',        // Yellow
    
    // Outsiders (Good but problematic)
    'Butler': '#FF9800',        // Orange
    'Drunk': '#9C27B0',         // Purple
    'Recluse': '#795548',       // Brown
    'Saint': '#CDDC39',         // Lime
    
    // Minions (Evil)
    'Poisoner': '#F44336',      // Red
    'Spy': '#E91E63',           // Pink
    'Scarlet Woman': '#AD1457', // Dark Pink
    'Baron': '#D32F2F',         // Dark Red
    
    // Demons (Evil)
    'Imp': '#B71C1C',           // Very Dark Red
  };
  return colors[character] || '#757575';
}

export function isEvilCharacter(character: string): boolean {
  const evilCharacters = [
    // Demons
    'Imp',
    // Minions  
    'Poisoner', 'Spy', 'Baron', 'Scarlet Woman'
  ];
  return evilCharacters.includes(character);
}

export function getTeamColor(character: string): string {
  return isEvilCharacter(character) ? '#F44336' : '#2196F3'; // Red for evil, blue for good
}

export function getEventTypeColor(eventType: string): string {
  const colors: Record<string, string> = {
    'game_setup': '#4CAF50',
    'game_start': '#4CAF50',
    'round_start': '#2196F3',
    'phase_change': '#9C27B0',
    'nomination': '#FF9800',
    'nomination_complete': '#FF9800',
    'nomination_result': '#FF9800',
    'voting': '#FFC107',
    'execution': '#F44336',
    'player_death': '#F44336',
    'message': '#607D8B',
    'storyteller_info': '#795548',
    'game_end': '#4CAF50',
    'player_setup': '#9E9E9E',
    
    // Power events
    'slayer_power': '#4CAF50',
    'poisoner_power': '#F44336',
    'imp_power': '#B71C1C',
    'empath_power': '#9C27B0',
    'fortuneteller_power': '#E91E63',
    'spy_power': '#E91E63',
    'washerwoman_power': '#00BCD4',
    'librarian_power': '#8BC34A',
    'investigator_power': '#FF5722',
    'chef_power': '#FFC107',
    'monk_power': '#9E9E9E',
    'ravenkeeper_power': '#607D8B',
    'undertaker_power': '#795548',
    'butler_power': '#FF9800',
    'virgin_power': '#FFEB3B',
    'scarlet_woman': '#AD1457',
  };
  return colors[eventType] || '#757575';
}

export function getPhaseColor(phase: string): string {
  const phaseColors: Record<string, string> = {
    'setup': '#4CAF50',
    'night': '#3F51B5',
    'day': '#FF9800',
    'discussion': '#FF9800',
    'nomination': '#FF5722',
    'voting': '#F44336',
    'execution': '#9C27B0',
    'end': '#607D8B',
  };
  
  // Handle phase variations
  const normalizedPhase = phase.toLowerCase();
  if (normalizedPhase.includes('night')) return phaseColors.night;
  if (normalizedPhase.includes('day') || normalizedPhase.includes('discussion')) return phaseColors.day;
  if (normalizedPhase.includes('nomination')) return phaseColors.nomination;
  if (normalizedPhase.includes('voting')) return phaseColors.voting;
  if (normalizedPhase.includes('execution')) return phaseColors.execution;
  if (normalizedPhase.includes('setup')) return phaseColors.setup;
  if (normalizedPhase.includes('end')) return phaseColors.end;
  
  return phaseColors[normalizedPhase] || '#757575';
}

export function getPhaseIndentation(phase: string): number {
  // Return indentation level (0-3) based on phase hierarchy
  const normalizedPhase = phase.toLowerCase();
  
  if (normalizedPhase.includes('setup') || normalizedPhase.includes('start') || normalizedPhase.includes('end')) {
    return 0; // Game-level events
  }
  if (normalizedPhase.includes('night')) {
    return 1; // Night phase events
  }
  if (normalizedPhase.includes('day') || normalizedPhase.includes('discussion')) {
    return 1; // Day phase events
  }
  if (normalizedPhase.includes('nomination') || normalizedPhase.includes('voting')) {
    return 2; // Nomination/voting sub-phases
  }
  
  return 1; // Default indentation
} 