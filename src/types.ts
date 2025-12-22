export interface Player {
  id: string;
  name: string;
  number: number;
}

export type ServeQuality =
  | 'serve-miss'
  | 'setter-move'
  | 'setter-pinpoint'
  | 'other-than-setter'
  | 'red-star'
  | 'black-star'
  | 'dash';

export type ReceiveQuality =
  | 'setter-return'
  | 'no-return'
  | 'setter-pinpoint'
  | 'other-than-setter';

export interface ServeRecord {
  playerId: string;
  quality: ServeQuality;
  timestamp: number;
}

export interface ReceiveRecord {
  playerId: string;
  quality: ReceiveQuality;
  timestamp: number;
}

export interface SubstitutionRecord {
  outPlayer: string;
  inPlayer: string;
  timestamp: number;
}

export interface MatchSet {
  ourScore: number;
  opponentScore: number;
  players: Player[];
  serves: ServeRecord[];
  receives: ReceiveRecord[];
  substitutions: SubstitutionRecord[];
}

export interface Match {
  id: string;
  date: string;
  tournamentName: string;
  opponent: string;
  sets: MatchSet[];
  result?: string;
}
