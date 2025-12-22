import React, { useState } from 'react';
import { Match } from '../types';
import { ArrowLeft, Save } from 'lucide-react';

interface MatchFormProps {
  onSubmit: (match: Omit<Match, 'id'>) => void;
  onCancel: () => void;
}

export default function MatchForm({ onSubmit, onCancel }: MatchFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [tournamentName, setTournamentName] = useState('');
  const [opponent, setOpponent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!tournamentName.trim() || !opponent.trim()) {
      alert('大会名と対戦相手を入力してください');
      return;
    }

    onSubmit({
      date,
      tournamentName: tournamentName.trim(),
      opponent: opponent.trim(),
      sets: [{
        ourScore: 0,
        opponentScore: 0,
        players: [],
        serves: [],
        receives: [],
        substitutions: []
      }]
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-100">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-2xl font-bold text-gray-800">新規試合登録</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                試合日
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                大会名
              </label>
              <input
                type="text"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                placeholder="例: 春季大会"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                対戦相手
              </label>
              <input
                type="text"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="例: ○○クラブ"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                required
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-bold"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all font-bold"
              >
                <Save size={20} />
                <span>登録</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
