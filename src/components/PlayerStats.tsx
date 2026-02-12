import React, { useMemo } from 'react';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { Match } from '../types';

interface PlayerDetailStatsProps {
  playerName: string;
  matches: Match[];
  onBack: () => void;
}

type StatCounts = {
  matchCount: number;
  totalServes: number;
  serveMiss: number; // 
7
  redStar: number;
  blackStar: number;
  totalReceives: number;
  receiveMiss: number; // 
7 = setter-return
  receiveCircle: number; // 0 = no-return
  receiveDoubleCircle: number; // 0 = setter-pinpoint
  receiveTriangle: number; // 0 = other-than-setter
};

const percent = (numerator: number, denominator: number) => {
  if (denominator <= 0) return '-';
  return ((numerator / denominator) * 100).toFixed(1);
};

export default function PlayerDetailStats({ playerName, matches, onBack }: PlayerDetailStatsProps) {
  const stats = useMemo<StatCounts>(() => {
    const matchIds = new Set<string>();

    const acc: StatCounts = {
      matchCount: 0,
      totalServes: 0,
      serveMiss: 0,
      redStar: 0,
      blackStar: 0,
      totalReceives: 0,
      receiveMiss: 0,
      receiveCircle: 0,
      receiveDoubleCircle: 0,
      receiveTriangle: 0,
    };

    matches.forEach((match) => {
      match.sets.forEach((set) => {
        if (!set.players) return;

        const appeared = set.players.some((p) => (p.name || '').trim() === playerName);
        if (appeared) matchIds.add(match.id);

        // 
7/3f 3f3f3f3f3f
        set.serves?.forEach((serve) => {
          const p = set.players.find((x) => x.id === serve.playerId);
          if (!p) return;
          if ((p.name || '').trim() !== playerName) return;

          acc.totalServes++;
          if (serve.quality === 'serve-miss') acc.serveMiss++;
          if (serve.quality === 'red-star') acc.redStar++;
          if (serve.quality === 'black-star') acc.blackStar++;
        });

        // 0/1/2/3 3f 3f3f3f3f
        set.receives?.forEach((receive) => {
          const p = set.players.find((x) => x.id === receive.playerId);
          if (!p) return;
          if ((p.name || '').trim() !== playerName) return;

          acc.totalReceives++;
          if (receive.quality === 'setter-return') acc.receiveMiss++;
          if (receive.quality === 'no-return') acc.receiveCircle++;
          if (receive.quality === 'setter-pinpoint') acc.receiveDoubleCircle++;
          if (receive.quality === 'other-than-setter') acc.receiveTriangle++;
        });
      });
    });

    acc.matchCount = matchIds.size;
    return acc;
  }, [matches, playerName]);

  // 3f3f3f3f3f3f3f3f3f
  // 3f3f3f3f3f3f3f3f3f3f3f
  const serveSuccess = stats.totalServes - stats.serveMiss;
  const receiveSuccess = stats.totalReceives - stats.receiveMiss;

  const serveRate = percent(serveSuccess, stats.totalServes);
  const receiveRate = percent(receiveSuccess, stats.totalReceives);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <ArrowLeft size={20} />
            <span>3f3f3f3f3f</span>
          </button>

          <div className="flex items-center gap-2">
            <TrendingUp size={24} className="text-purple-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {playerName}3f 3f3f3f3f
            </h1>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
              <p className="text-sm text-gray-600">3f3f3f3f3f3f</p>
              <p className="text-2xl font-bold text-purple-700">{stats.matchCount}</p>
            </div>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-sm text-gray-600">3f3f3f3f3f3f</p>
              <p className="text-2xl font-bold text-blue-700">
                {stats.totalServes} <span className="text-sm font-semibold text-gray-600">(3f3f {serveRate}% )</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                
7: {stats.serveMiss} / 3f(3f): {stats.redStar} / 3f(3f): {stats.blackStar}
              </p>
            </div>
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
              <p className="text-sm text-gray-600">3f3f3f3f3f3f</p>
              <p className="text-2xl font-bold text-green-700">
                {stats.totalReceives} <span className="text-sm font-semibold text-gray-600">(3f3f {receiveRate}% )</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                
7: {stats.receiveMiss} / 0: {stats.receiveCircle} / 1: {stats.receiveDoubleCircle} / 3: {stats.receiveTriangle}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  <th className="border-2 border-purple-700 px-4 py-3 text-left">3f3f3f</th>
                  <th className="border-2 border-purple-700 px-4 py-3 text-center">3f3f</th>
                  <th className="border-2 border-purple-700 px-4 py-3 text-center">3f</th>
                  <th className="border-2 border-purple-700 px-4 py-3 text-center">3f(3f)</th>
                  <th className="border-2 border-purple-700 px-4 py-3 text-center">3f(3f)</th>
                  <th className="border-2 border-purple-700 px-4 py-3 text-center">3f3f</th>
                  <th className="border-2 border-purple-700 px-4 py-3 text-center">
7</th>
                  <th className="border-2 border-purple-700 px-4 py-3 text-center">0</th>
                  <th className="border-2 border-purple-700 px-4 py-3 text-center">1</th>
                  <th className="border-2 border-purple-700 px-4 py-3 text-center">3</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td className="border-2 border-gray-300 px-4 py-3 font-semibold text-purple-700">3f3f</td>
                  <td className="border-2 border-gray-300 px-4 py-3 text-center font-bold">{stats.totalServes}</td>
                  <td className="border-2 border-gray-300 px-4 py-3 text-center">{stats.serveMiss}</td>
                  <td className="border-2 border-gray-300 px-4 py-3 text-center">{stats.redStar}</td>
                  <td className="border-2 border-gray-300 px-4 py-3 text-center">{stats.blackStar}</td>
                  <td className="border-2 border-gray-300 px-4 py-3 text-center font-bold">{stats.totalReceives}</td>
                  <td className="border-2 border-gray-300 px-4 py-3 text-center">{stats.receiveMiss}</td>
                  <td className="border-2 border-gray-300 px-4 py-3 text-center">{stats.receiveCircle}</td>
                  <td className="border-2 border-gray-300 px-4 py-3 text-center">{stats.receiveDoubleCircle}</td>
                  <td className="border-2 border-gray-300 px-4 py-3 text-center">{stats.receiveTriangle}</td>
                </tr>
                <tr className="bg-purple-50">
                  <td className="border-2 border-gray-300 px-4 py-3 font-semibold text-purple-700">3f3f3f3f3f</td>
                  <td className="border-2 border-gray-300 px-4 py-3 text-center font-bold text-blue-700" colSpan={4}>
                    ({stats.totalServes} - {stats.serveMiss}) / {stats.totalServes} = {serveRate !== '-' ? `${serveRate}%` : '-'}
                  </td>
                  <td className="border-2 border-gray-300 px-4 py-3 text-center font-bold text-green-700" colSpan={5}>
                    ({stats.totalReceives} - {stats.receiveMiss}) / {stats.totalReceives} = {receiveRate !== '-' ? `${receiveRate}%` : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
            <h3 className="text-base font-bold text-gray-800 mb-2">3f3f3f3f3f</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
              <div>
                <p className="font-semibold mb-1">3f3f:</p>
                <ul className="space-y-1">
                  <li>
7 = 3f3f3f3f</li>
                  <li>3f(3f) = 3f3f3f3f3f3f3f&3f3f3f3f3f3f</li>
                  <li>3f(3f) = 3f3f3f3f3f3f3f3f3f</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-1">3f3f3f:</p>
                <ul className="space-y-1">
                  <li>
7 = 3f3f3f3f</li>
                  <li>0 = 3f3f3f3f3f3f3f3f3f3f3f</li>
                  <li>1 = 3f3f3f3f3f3f3f3f3f</li>
                  <li>3 = 3f3f3f3f3f3f3f3f</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
