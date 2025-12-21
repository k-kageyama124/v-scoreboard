import React from 'react';
import { Match } from '../types';
import { Calendar, Trophy, Users, Trash2 } from 'lucide-react';

interface MatchListProps {
  matches: Match[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

const MatchList: React.FC<MatchListProps> = ({ matches, onSelect, onDelete }) => {
  const handleDelete = (e: React.MouseEvent, matchId: string, opponent: string) => {
    e.stopPropagation(); // 親要素のonClickイベントを防ぐ
    if (window.confirm(`${opponent}戦の試合データを削除しますか？\nこの操作は取り消せません。`)) {
      onDelete(matchId);
    }
  };

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Trophy size={48} className="mb-4 opacity-20" />
        <p>試合データがありません</p>
        <p className="text-sm">右上のボタンから追加してください</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {matches.map(match => (
        <div 
          key={match.id}
          onClick={() => onSelect(match.id)}
          className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-300 transition-all cursor-pointer active:scale-[0.98] relative group"
        >
          {/* 削除ボタン */}
          <button
            onClick={(e) => handleDelete(e, match.id, match.opponent)}
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 active:scale-90 shadow-lg z-10"
            title="この試合を削除"
          >
            <Trash2 size={16} />
          </button>

          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2 text-indigo-600 font-bold">
              <Trophy size={18} />
             <span>{match.tournamentName}</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
              match.result === 'win' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {match.result === 'win' ? 'WIN' : 'LOSE'}
            </div>
          </div>
          
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 text-gray-800 font-bold text-xl mb-1">
                <Users size={20} className="text-gray-400" />
                vs {match.opponent}
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Calendar size={14} />
                {match.date}
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-2xl font-black text-gray-900">
               {match.sets[0]?.ourScore || 0} - {match.sets[0]?.opponentScore || 0}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MatchList;
