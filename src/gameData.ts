import { GameEvent } from './types';

// Map technical model names to friendly display names
const MODEL_NAME_MAP: Record<string, string> = {
  'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
  'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
  'claude-sonnet-4-20250514': 'Claude 4 Sonnet',
  'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
  'claude-3-haiku-20240307': 'Claude 3 Haiku',
  'claude-3-opus-20240229': 'Claude 3 Opus',
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o Mini',
  'gpt-4-turbo': 'GPT-4 Turbo',
  'gpt-4': 'GPT-4',
  'gpt-3.5-turbo': 'GPT-3.5 Turbo',
};

// Helper function to get friendly model name
const getFriendlyModelName = (modelName: string): string => {
  return MODEL_NAME_MAP[modelName] || modelName;
};

// Helper function to format character names for display (convert underscores to spaces)
export const formatCharacterName = (characterName: string): string => {
  return characterName.replace(/_/g, ' ');
};

export interface GameMetadata {
  filename: string;
  playerCount: number;
  model: string;
  friendlyModelName: string;
  title: string;
  date: string;
  time: string;
  charactersInPlay: string[];
}

// Extract metadata from a game file
export const extractGameMetadata = async (filename: string): Promise<GameMetadata | null> => {
  try {
    // Use the same base path logic as loadGameEvents
    const basePath = process.env.PUBLIC_URL || '';
    const response = await fetch(`${basePath}/${filename}?t=${Date.now()}`);
    if (!response.ok) {
      console.warn(`Could not fetch ${filename}: ${response.status}`);
      return null;
    }
    
    const text = await response.text();
    const lines = text.trim().split('\n');
    
    // Extract date and time from filename (format: game_log_YYYYMMDD_HHMMSS.jsonl)
    const dateTimeMatch = filename.match(/game_log_(\d{8})_(\d{6})\.jsonl/);
    let date = 'Unknown';
    let time = 'Unknown';
    
    if (dateTimeMatch) {
      const dateStr = dateTimeMatch[1]; // YYYYMMDD
      const timeStr = dateTimeMatch[2]; // HHMMSS
      
      // Format date as YYYY-MM-DD
      date = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
      
      // Format time as HH:MM
      time = `${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}`;
    }
    
    // Look for game_setup event in the first few lines
    for (const line of lines.slice(0, 5)) {
      try {
        const event = JSON.parse(line);
        if (event.event_type === 'game_setup' && event.metadata) {
          const playerCount = event.metadata.player_count || 0;
          const model = event.metadata.model || 'unknown';
          const friendlyModelName = getFriendlyModelName(model);
          const title = `${playerCount} Players - ${friendlyModelName}`;
          
          // Extract characters in play from the game_state
          const charactersInPlay: string[] = [];
          if (event.game_state?.player_state) {
            const characters = event.game_state.player_state
              .map((player: any) => player.character)
              .filter((char: string) => char && char !== 'unknown')
              .sort((a: string, b: string) => a.localeCompare(b));
            charactersInPlay.push(...characters);
          }
          
          return {
            filename,
            playerCount,
            model,
            friendlyModelName,
            title,
            date,
            time,
            charactersInPlay
          };
        }
      } catch (parseError) {
        // Skip invalid JSON lines
        continue;
      }
    }
    
    console.warn(`No game_setup event found in ${filename}`);
    return null;
  } catch (error) {
    console.error(`Error extracting metadata from ${filename}:`, error);
    return null;
  }
};

export const loadGameEvents = async (filename: string = 'game_log_20250528_154356.jsonl'): Promise<GameEvent[]> => {
  try {
    // Use process.env.PUBLIC_URL to get the correct base path for deployment
    const basePath = process.env.PUBLIC_URL || '';
    const response = await fetch(`${basePath}/${filename}?t=${Date.now()}`);
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
      'info_broadcast',
      'player_setup', // This is usually just character assignment
      'phase_change',  // Remove phase_change events as they're redundant with phase headers
      'voting_round',  // Remove voting_round events as they're now integrated into nomination results
      'voting',        // Remove individual voting events as they're now integrated into nomination results
      'storyteller_info' // Remove storyteller info events
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

  // Group notes_update events by phase and combine nomination/nomination_result events
  const processedEvents: GameEvent[] = [];
  const notesEventsByPhase = new Map<string, GameEvent[]>();
  const processedNotesPhases = new Set<string>();

  // First pass: collect all notes events by phase
  for (const event of filteredEvents) {
    if (event.event_type === 'notes_update') {
      const phaseKey = `${event.round_number}-${event.phase}`;
      if (!notesEventsByPhase.has(phaseKey)) {
        notesEventsByPhase.set(phaseKey, []);
      }
      notesEventsByPhase.get(phaseKey)!.push(event);
    }
  }

  // Second pass: process events and combine notes, nominations, and consecutive pass events
  for (let i = 0; i < filteredEvents.length; i++) {
    const event = filteredEvents[i];
    
    if (event.event_type === 'notes_update') {
      const phaseKey = `${event.round_number}-${event.phase}`;
      
      // Only process the first notes event in each phase
      if (!processedNotesPhases.has(phaseKey)) {
        processedNotesPhases.add(phaseKey);
        const notesEvents = notesEventsByPhase.get(phaseKey)!;
        
        // Create a combined notes event
        const combinedNotesEvent: GameEvent = {
          ...event,
          event_type: 'notes_update_combined',
          description: `${notesEvents.length} players updated their notes`,
          participants: notesEvents.map(e => e.metadata.player_name),
          metadata: {
            notes_updates: notesEvents.map(e => ({
              player_name: e.metadata.player_name,
              character: e.metadata.character,
              notes: e.metadata.notes,
              timestamp: e.timestamp
            })),
            count: notesEvents.length
          },
          // Ensure we have the public_game_state for character lookup
          public_game_state: event.public_game_state
        };

        processedEvents.push(combinedNotesEvent);
      }
      // Skip subsequent notes events in the same phase
    } else if (event.event_type === 'player_pass') {
      // Look for consecutive pass events
      const passEvents = [event];
      let j = i + 1;
      
      // Collect all consecutive pass events
      while (j < filteredEvents.length && filteredEvents[j].event_type === 'player_pass') {
        passEvents.push(filteredEvents[j]);
        j++;
      }
      
      if (passEvents.length > 1) {
        // Create a combined pass event
        const combinedPassEvent: GameEvent = {
          ...event,
          event_type: 'player_pass_combined',
          description: `${passEvents.length} players passed their turn`,
          participants: passEvents.map(e => e.metadata.player_name),
          metadata: {
            pass_events: passEvents.map(e => ({
              player_name: e.metadata.player_name,
              private_reasoning: e.metadata.private_reasoning,
              timestamp: e.timestamp
            })),
            count: passEvents.length
          },
          // Ensure we have the public_game_state for character lookup
          public_game_state: event.public_game_state
        };
        
        processedEvents.push(combinedPassEvent);
        
        // Skip the processed pass events
        i = j - 1;
      } else {
        // Single pass event, keep as is
        processedEvents.push(event);
      }
    } else if (event.event_type === 'nomination') {
      // Look for the immediately following nomination_result event
      const nextEvent = filteredEvents[i + 1];
      
      if (nextEvent && 
          nextEvent.event_type === 'nomination_result' && 
          nextEvent.metadata.nominator === event.metadata.nominator &&
          nextEvent.metadata.nominee === event.metadata.nominee) {
        
        // Create a combined nomination event
        const combinedNominationEvent: GameEvent = {
          ...event,
          event_type: 'nomination_complete',
          description: `${event.metadata.nominator} nominated ${event.metadata.nominee} for execution`,
          metadata: {
            ...event.metadata,
            ...nextEvent.metadata,
            // Preserve both public and private reasoning from nomination event
            public_reasoning: event.metadata.public_reasoning,
            private_reasoning: event.metadata.private_reasoning,
            // Add result information from nomination_result event
            result: nextEvent.metadata.result,
            votes: nextEvent.metadata.votes,
            vote_details: nextEvent.metadata.vote_details,
            required_to_nominate: nextEvent.metadata.required_to_nominate,
            required_to_tie: nextEvent.metadata.required_to_tie
          }
        };
        
        processedEvents.push(combinedNominationEvent);
      } else {
        // If no matching result found immediately after, keep the original nomination event
        processedEvents.push(event);
      }
    } else if (event.event_type === 'nomination_result') {
      // Check if this result was already combined with the previous nomination
      const prevEvent = filteredEvents[i - 1];
      
      if (!(prevEvent && 
            prevEvent.event_type === 'nomination' && 
            prevEvent.metadata.nominator === event.metadata.nominator &&
            prevEvent.metadata.nominee === event.metadata.nominee)) {
        // Keep standalone nomination_result events if no corresponding nomination found immediately before
        processedEvents.push(event);
      }
      // Otherwise skip this event as it was already combined
    } else {
      // Add all other events without combining
      processedEvents.push(event);
    }
  }

  console.log('Final processed events:', processedEvents.length);
  console.log('Final event types:', Array.from(new Set(processedEvents.map(e => e.event_type))).sort());
  
  // Debug: Check for any voting_round events in final output
  const votingRoundEvents = processedEvents.filter(e => e.event_type === 'voting_round');
  if (votingRoundEvents.length > 0) {
    console.error('ERROR: Found voting_round events in final output:', votingRoundEvents);
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
    'Scarlet_Woman': '#AD1457', // Dark Pink (underscore version)
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
    'Poisoner', 'Spy', 'Baron', 'Scarlet Woman', 'Scarlet_Woman'
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
    'notes_update': '#FF9800',
    'notes_update_combined': '#9C27B0',
    'death_announcement': '#F44336',
    'minion_info': '#F44336',
    'demon_info': '#B71C1C',
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