export interface PlayerState {
  name: string;
  alive: boolean;
  used_dead_vote: boolean;
  character: string;
  drunk?: boolean;
  poisoned?: boolean;
  drunk_character?: string;
}

export interface PublicGameState {
  player_state: PlayerState[];
  current_phase: string;
  round_number: number;
  chopping_block: {
    nominee: string;
    votes: number;
  } | null;
  nominatable_players: string[];
  nominations_open?: boolean;
}

export interface GameEvent {
  timestamp: string;
  round_number: number;
  phase: string;
  event_type: string;
  description: string;
  participants: string[];
  metadata: Record<string, any>;
  public_game_state?: PublicGameState;
  game_state?: PublicGameState;
}

export interface VotingDetails {
  voter: string;
  nominee: string;
  vote: string;
  voter_character: string;
  nominee_character: string;
  public_reasoning?: string;
  private_reasoning?: string;
}

export interface NominationDetails {
  nominee: string;
  player: string;
  public_reasoning: string;
  private_reasoning: string;
} 