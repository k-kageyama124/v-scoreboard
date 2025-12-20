
import React from 'react';
import { Match } from '../types';
import { Calendar, Trophy, Users } from 'lucide-react';

interface MatchListProps {
  matches: Match[];
  onSelect: (id: string) => void;
}

const MatchList: React.FC<MatchListProps> = ({ matches, onSelect }) => {
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
          className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-300 transition-all cursor-pointer active:scale-[0.98]"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2 text-indigo-600 font-bold">
              <Trophy size={18} />
              <span>{match.tournament}</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
              match.result === 'win' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {match.result === 'win' ? 'Win' : 'Loss'}
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
                {match.sets[0]?.myScore || 0} - {match.sets[0]?.opponentScore || 0}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MatchList;
