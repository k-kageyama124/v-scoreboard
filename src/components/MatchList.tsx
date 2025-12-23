import React, { useState } from 'react';
import { Match } from '../types';
import { Calendar, Users, Trash2, Search } from 'lucide-react';

interface MatchListProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  onDeleteMatch: (matchId: string) => void;
}

export default function MatchList({ matches, onSelectMatch, onDeleteMatch }: MatchListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // 検索フィルタリング
  const filteredMatches = matches.filter((match) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const tournamentName = (match.tournamentName || '').toLowerCase();
    const opponent = (match.opponent || '').toLowerCase();
    
    return tournamentName.includes(query) || opponent.includes(query);
  });

  if (matches.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-gray-100">
        <p className="text-gray-500 text-lg">試合データがありません</p>
        <p className="text-gray-400 mt-2">「新規試合登録」ボタンから試合を追加してください</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 検索ボックス */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
        <div className="flex items-center gap-3">
          <Search size={24} className="text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="大会名または対戦相手で検索..."
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-lg"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              クリア
            </button>
          )}
        </div>
        <div className="mt-3 text-sm text-gray-600">
          {filteredMatches.length}件の試合が見つかりました
        </div>
      </div>

      {/* 試合一覧 */}
      {filteredMatches.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-gray-100">
          <p className="text-gray-500 text-lg">「{searchQuery}」に一致する試合が見つかりません</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            検索をクリア
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((match) => {
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
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors">
                        {match.tournamentName || '大会名未設定'}
                      </h3>
                      {match.result && (
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold ${
                            match.result === 'win'
                              ? 'bg-green-600 text-white'
                              : 'bg-red-600 text-white'
                          }`}
                        >
                          {match.result === 'win' ? 'WIN' : 'LOSE'}
                        </span>
                      )}
                    </div>
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
