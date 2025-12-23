import React, { useMemo } from 'react';
import { Match } from '../types';
import { ArrowLeft, TrendingUp } from 'lucide-react';

interface PlayerStatsProps {
  matches: Match[];
  onBack: () => void;
  onSelectPlayer: (playerName: string) => void;
}

interface PlayerSummary {
  name: string;
  matchCount: number;
  totalServes: number;
  totalReceives: number;
  serveSuccess: number;
  receiveSuccess: number;
}

export default function PlayerStats({ matches, onBack, onSelectPlayer }: PlayerStatsProps) {
  // 全選手のデータを集計
  const playerSummaries = useMemo(() => {
    const playerMap = new Map<string, PlayerSummary>();

    matches.forEach((match) => {
      match.sets.forEach((set) => {
        if (!set.players) return;

        // 選手の出場記録
        set.players.forEach((player) => {
          if (!player.name || player.name.trim() === '') return;

          if (!playerMap.has(player.name)) {
            playerMap.set(player.name, {
              name: player.name,
              matchCount: 0,
              totalServes: 0,
              totalReceives: 0,
              serveSuccess: 0,
              receiveSuccess: 0
            });
          }
        });

        // サーブ記録
        if (set.serves) {
          set.serves.forEach((serve) => {
            const player = set.players.find(p => p.id === serve.playerId);
            if (!player || !player.name) return;

            const summary = playerMap.get(player.name);
            if (summary) {
              summary.totalServes++;
              // サーブ成功の定義: ミス以外
              if (serve.quality !== 'serve-miss') {
                summary.serveSuccess++;
              }
            }
          });
        }

        // レシーブ記録
        if (set.receives) {
          set.receives.forEach((receive) => {
            const player = set.players.find(p => p.id === receive.playerId);
            if (!player || !player.name) return;

            const summary = playerMap.get(player.name);
            if (summary) {
              summary.totalReceives++;
              // レシーブ成功の定義: セッターに返った、ピンポイント
              if (receive.quality === 'setter-return' || receive.quality === 'setter-pinpoint') {
                summary.receiveSuccess++;
              }
            }
          });
        }
      });
    });

    // 試合数をカウント
    playerMap.forEach((summary) => {
      let matchSet = new Set<string>();
      matches.forEach((match) => {
        match.sets.forEach((set) => {
          if (set.players && set.players.some(p => p.name === summary.name)) {
            matchSet.add(match.id);
          }
        });
      });
      summary.matchCount = matchSet.size;
    });

    return Array.from(playerMap.values()).sort((a, b) => {
      // 試合数が多い順、同じなら名前順
      if (b.matchCount !== a.matchCount) {
        return b.matchCount - a.matchCount;
      }
      return a.name.localeCompare(b.name);
    });
  }, [matches]);

  if (playerSummaries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow mb-6"
          >
            <ArrowLeft size={20} />
            <span>ホームに戻る</span>
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <p className="text-gray-500 text-lg">選手データがありません</p>
            <p className="text-gray-400 mt-2">試合を登録して選手名を入力してください</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <ArrowLeft size={20} />
            <span>ホームに戻る</span>
          </button>
          <div className="flex items-center gap-2">
            <TrendingUp size={24} className="text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-800">選手記録</h1>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  <th className="border-2 border-purple-700 px-4 py-3 text-left">選手名</th>
                  <th className="border-2 border-purple-700 px-4 py-3 text-center">出場試合数</th>
                  <th className="border-2 border-purple-700 px-4 py-3 text-center">サーブ回数</th>
                  <th className="border-2 border-purple-700 px-4 py-3 text-center">サーブ成功率</th>
                  <th className="border-2 border-purple-700 px-4 py-3 text-center">レシーブ回数</th>
                  <th className="border-2 border-purple-700 px-4 py-3 text-center">レシーブ成功率</th>
                </tr>
              </thead>
              <tbody>
                {playerSummaries.map((player, idx) => {
                  const serveRate = player.totalServes > 0
                    ? ((player.serveSuccess / player.totalServes) * 100).toFixed(1)
                    : '-';
                  const receiveRate = player.totalReceives > 0
                    ? ((player.receiveSuccess / player.totalReceives) * 100).toFixed(1)
                    : '-';

                  return (
                    <tr
                      key={player.name}
                      onClick={() => onSelectPlayer(player.name)}
                      className={`cursor-pointer hover:bg-purple-100 transition-colors ${
                        idx % 2 === 0 ? 'bg-purple-50' : 'bg-white'
                      }`}
                    >
                      <td className="border-2 border-gray-300 px-4 py-3 font-semibold text-purple-700">
                        {player.name}
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center font-bold">
                        {player.matchCount}
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center">
                        {player.totalServes}
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center font-semibold text-blue-600">
                        {serveRate !== '-' ? `${serveRate}%` : '-'}
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center">
                        {player.totalReceives}
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center font-semibold text-green-600">
                        {receiveRate !== '-' ? `${receiveRate}%` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 text-center text-gray-600">
            <p className="text-sm">選手名をクリックすると詳細が表示されます</p>
          </div>
        </div>
      </div>
    </div>
  );
}
