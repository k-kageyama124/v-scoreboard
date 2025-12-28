import React, { useMemo } from 'react';
import { Match, ServeQuality, ReceiveQuality } from '../types';
import { ArrowLeft, User, Calendar } from 'lucide-react';

interface PlayerDetailProps {
  playerName: string;
  matches: Match[];
  onBack: () => void;
}

interface MatchPerformance {
  matchId: string;
  date: string;
  opponent: string;
  tournamentName: string;
  serves: {
    'serve-miss': number;
    'setter-move': number;
    'setter-pinpoint': number;
    'other-than-setter': number;
    'red-star': number;
    'black-star': number;
    'dash': number;
  };
  receives: {
    'setter-return': number;
    'no-return': number;
    'setter-pinpoint': number;
    'other-than-setter': number;
  };
}

export default function PlayerDetail({ playerName, matches, onBack }: PlayerDetailProps) {
  const playerData = useMemo(() => {
    const performances: MatchPerformance[] = [];

    matches.forEach((match) => {
      let hasPlayed = false;
      const perf: MatchPerformance = {
        matchId: match.id,
        date: match.date,
        opponent: match.opponent,
        tournamentName: match.tournamentName,
        serves: {
          'serve-miss': 0,
          'setter-move': 0,
          'setter-pinpoint': 0,
          'other-than-setter': 0,
          'red-star': 0,
          'black-star': 0,
          'dash': 0
        },
        receives: {
          'setter-return': 0,
          'no-return': 0,
          'setter-pinpoint': 0,
          'other-than-setter': 0
        }
      };

      match.sets.forEach((set) => {
        if (!set.players) return;

        const player = set.players.find(p => p.name === playerName);
        if (player) {
          hasPlayed = true;

          // サーブ記録
          if (set.serves) {
            set.serves.forEach((serve) => {
              if (serve.playerId === player.id) {
                perf.serves[serve.quality]++;
              }
            });
          }

          // レシーブ記録
          if (set.receives) {
            set.receives.forEach((receive) => {
              if (receive.playerId === player.id) {
                perf.receives[receive.quality]++;
              }
            });
          }
        }
      });

      if (hasPlayed) {
        performances.push(perf);
      }
    });

    return performances.sort((a, b) => b.date.localeCompare(a.date));
  }, [playerName, matches]);

  // 合計統計
  const totalStats = useMemo(() => {
    const stats = {
      totalMatches: playerData.length,
      serves: {
        'serve-miss': 0,
        'setter-move': 0,
        'setter-pinpoint': 0,
        'other-than-setter': 0,
        'red-star': 0,
        'black-star': 0,
        'dash': 0
      },
      receives: {
        'setter-return': 0,
        'no-return': 0,
        'setter-pinpoint': 0,
        'other-than-setter': 0
      }
    };

    playerData.forEach((perf) => {
      Object.keys(perf.serves).forEach((key) => {
        stats.serves[key as ServeQuality] += perf.serves[key as ServeQuality];
      });
      Object.keys(perf.receives).forEach((key) => {
        stats.receives[key as ReceiveQuality] += perf.receives[key as ReceiveQuality];
      });
    });

    return stats;
  }, [playerData]);

  const totalServes = Object.values(totalStats.serves).reduce((sum, val) => sum + val, 0);
  const totalReceives = Object.values(totalStats.receives).reduce((sum, val) => sum + val, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow mb-6"
        >
          <ArrowLeft size={20} />
          <span>選手一覧に戻る</span>
        </button>

        {/* 選手名ヘッダー */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <User size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800">{playerName}</h1>
              <p className="text-gray-600 mt-1">出場試合数: {totalStats.totalMatches}試合</p>
            </div>
          </div>
        </div>

        {/* 合計統計 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">通算成績</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* サーブ統計 */}
            <div>
              <h3 className="text-xl font-semibold text-purple-700 mb-4">サーブ統計</h3>
              <div className="bg-purple-50 rounded-xl p-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">合計</p>
                  <p className="text-3xl font-bold text-purple-600">{totalServes}</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">━ (サーブミス)</span>
                    <span className="font-semibold">{totalStats.serves['serve-miss'] + totalStats.serves['dash']}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">○ (セッター動いた)</span>
                    <span className="font-semibold">{totalStats.serves['setter-move']}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">◎ (ピンポイント)</span>
                    <span className="font-semibold">{totalStats.serves['setter-pinpoint']}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">△ (セッター以外)</span>
                    <span className="font-semibold">{totalStats.serves['other-than-setter']}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">★ (赤) = ノータッチエース&相手が弾いた</span>
                    <span className="font-semibold text-red-600">{totalStats.serves['red-star']}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">★ (黒) = 取られたけど繋がらない</span>
                    <span className="font-semibold">{totalStats.serves['black-star']}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* レシーブ統計 */}
            <div>
              <h3 className="text-xl font-semibold text-blue-700 mb-4">レシーブ統計</h3>
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">合計</p>
                  <p className="text-3xl font-bold text-blue-600">{totalReceives}</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">× (返らなかった)</span>
                    <span className="font-semibold">{totalStats.receives['setter-return']}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">○ (セッター返った)</span>
                    <span className="font-semibold">{totalStats.receives['no-return']}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">◎ (ピンポイント)</span>
                    <span className="font-semibold">{totalStats.receives['setter-pinpoint']}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">△ (セッター以外)</span>
                    <span className="font-semibold">{totalStats.receives['other-than-setter']}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 試合ごとの成績 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">試合ごとの成績</h2>
          
          {playerData.length === 0 ? (
            <p className="text-gray-500 text-center py-8">試合データがありません</p>
          ) : (
            <div className="space-y-4">
              {playerData.map((perf) => {
                const matchServes = Object.values(perf.serves).reduce((sum, val) => sum + val, 0);
                const matchReceives = Object.values(perf.receives).reduce((sum, val) => sum + val, 0);

                return (
                  <div key={perf.matchId} className="border-2 border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar size={16} className="text-gray-600" />
                      <span className="font-semibold text-gray-800">{perf.date}</span>
                      <span className="text-gray-600">|</span>
                      <span className="text-purple-700 font-semibold">{perf.tournamentName}</span>
                      <span className="text-gray-600">vs</span>
                      <span className="text-blue-700 font-semibold">{perf.opponent}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-purple-50 rounded-lg p-3">
                        <p className="font-semibold text-purple-700 mb-2">サーブ: {matchServes}回</p>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div>━ {perf.serves['serve-miss'] + perf.serves['dash']}</div>
                          <div>○ {perf.serves['setter-move']}</div>
                          <div>◎ {perf.serves['setter-pinpoint']}</div>
                          <div>△ {perf.serves['other-than-setter']}</div>
                          <div className="text-red-600">★赤 {perf.serves['red-star']}</div>
                          <div>★黒 {perf.serves['black-star']}</div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="font-semibold text-blue-700 mb-2">レシーブ: {matchReceives}回</p>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div>× {perf.receives['setter-return']}</div>
                          <div>○ {perf.receives['no-return']}</div>
                          <div>◎ {perf.receives['setter-pinpoint']}</div>
                          <div>△ {perf.receives['other-than-setter']}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
