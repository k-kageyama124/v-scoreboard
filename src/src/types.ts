export type ServiceQuality = 'pinpoint' | 'setter_move' | 'other' | 'miss';

export type PointType = 'none' | 'red_star' | 'black_star';

export interface ServiceRecord {
  id: string;
  playerId: string;
  playerName: string;
  round: 1 | 2;
  quality: ServiceQuality;
  pointType: PointType;
  timestamp: number;
}

export interface Substitution {
  id: string;
  outPlayerId: string;
  outPlayerName: string;
  inPlayerId: string;
  inPlayerName: string;
  score: string;
  timestamp: number;
}

export interface Player {
  id: string;
  name: string;
  isSubstituted: boolean;
}

export interface MatchSet {
  id: string;
  setNumber: number;
  myScore: number;
  opponentScore: number;
  serveTurn: 'S' | 'R';
  lineup: Player[];
  bench: Player[]; // 控え選手リスト
  services: ServiceRecord[];
  substitutions: Substitution[];
}

export interface Match {
  id: string;
  date: string;
  tournament: string;
  opponent: string;
  sets: MatchSet[];
  result: 'win' | 'loss';
}
