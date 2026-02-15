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
  ourScore?: number;
  opponentScore?: number;
}

/**
 * v6: 入力表（サ/サM/サP/ブ/ア/アM/アP）専用の操作ログ
 * - 「一つ戻る」はこのログの最後の1件だけ戻す
 * - 連動（サP→サ、アP/アM→ア）も同一操作としてまとめる
 */
export type StatKey = 'S' | 'SM' | 'SP' | 'B' | 'A' | 'AM' | 'AP';

export interface StatAction {
  playerId: string;
  /**
   * primary: ユーザーが押したセル（例: SP）
   * deltas: 実際に増えた項目（連動分込み）
   * 例）SPタップ → deltas: { SP: 1, S: 1 }
   */
  primary: StatKey;
  deltas: Partial<Record<StatKey, number>>;
  timestamp: number;
}

export interface MatchSet {
  ourScore: number;
  opponentScore: number;
  players: Player[];

  // 既存（過去データ互換のため残す）
  serves: ServeRecord[];
  receives: ReceiveRecord[];

  substitutions: SubstitutionRecord[];

  // v6追加：入力表用ログ（セットごと）
  statActions?: StatAction[];
  // v7相当：コート内（最大6）を保持。空席は null
  courtPlayerIds?: Array<string | null>;
}

export interface Match {
  id: string;
  date: string;
  tournamentName: string;
  opponent: string;
  sets: MatchSet[];
  result?: string;
}
