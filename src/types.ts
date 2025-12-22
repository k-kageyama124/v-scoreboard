export type ServeQuality = 
  | 'serve-miss'
  | 'setter-move'
  | 'setter-pinpoint'
  | 'other-than-setter'
  | 'red-star'
  | 'black-star'
  | 'dash'
  | 'check1'
  | 'check2';

export type ReceiveQuality = 
  | 'setter-return'
  | 'no-return'
  | 'setter-pinpoint'
  | 'other-than-setter';

export interface ServeRecord {
  id: string;
  playerId: string;
  quality: ServeQuality;
  round: 1 | 2 | 3;
}

export interface ReceiveRecord {
  id: string;
  playerId: string;
  quality: ReceiveQuality;
  round: number;
}

export interface Player {
  id: string;
  name: string;
  position: string;
}

export interface SubstitutionRecord {
  id: string;
  outPlayerName: string;
  inPlayerName: string;
  score: string;
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
  result?: 'win' | 'lose';
  sets: MatchSet[];
}
