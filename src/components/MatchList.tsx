import React from 'react';
import { Match } from '../types';
import { Calendar, Users, Trash2 } from 'lucide-react';

interface MatchListProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  onDeleteMatch: (matchId: string) => void;
}

export default function MatchList({ matches, onSelectMatch, onDeleteMatch }: MatchListProps) {
  if (matches.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-gray-100">
        <p className="text-gray-500 text-lg">試合データがありません</p>
        <p className="text-gray-400 mt-2">「新規試合」ボタンから試合を追加してください</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {matches.map((match) => {
        // 安全に最初のセットのスコアを取得
        const firstSet = match.sets && match.sets.length > 0 ? match.sets[0] : null;
        const ourScore = firstSet?.ourScore ?? 0;
        const opponentScore = firstSet?.opponentScore ?? 0;

        return (
          <div
            key={match.id}
            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 border-2 border-gray-100 cursor-pointer group"
            onClick={() => onSelectMatch(match)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
                  {match.tournamentName || '大会名未設定'}
                </h3>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Users size={16} />
                  <span className="text-sm">vs {match.opponent || '対戦相手未設定'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar size={16} />
                  <span className="text-sm">{match.date || '日付未設定'}</span>
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteMatch(match.id);
                }}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="削除"
              >
                <Trash2 size={20} />
              </button>
            </div>

            {/* スコア表示 */}
            <div className="flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">自チーム</div>
                <div className="text-3xl font-bold text-blue-600">{ourScore}</div>
              </div>
              <div className="text-2xl font-bold text-gray-400">-</div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">相手</div>
                <div className="text-3xl font-bold text-red-600">{opponentScore}</div>
              </div>
            </div>

            {/* 結果バッジ（オプション） */}
            {match.result && (
              <div className="mt-4 text-center">
                <span
                  className={`inline-block px-4 py-1 rounded-full text-sm font-bold ${
                    match.result === 'win'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {match.result === 'win' ? '勝利' : '敗北'}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
