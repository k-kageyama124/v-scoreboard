export type ServeQuality = 'ace' | 'good' | 'normal' | 'miss';
export type ReceiveQuality = 'perfect' | 'good' | 'follow' | 'miss';

export interface ServeRecord {
  id: string;
  playerId: string;
  quality: ServeQuality;
  round: number;
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
  position: 'starting' | 'bench';
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
  serveTurn: 'our' | 'opponent';
  players: Player[];
  serves: ServeRecord[];
  receives: ReceiveRecord[];
  substitutions: SubstitutionRecord[];
  currentRound: number;
}

export interface Match {
  id: string;
  date: string;
  tournamentName: string;
  opponent: string;
  result: 'win' | 'lose';
  sets: MatchSet[];
}
