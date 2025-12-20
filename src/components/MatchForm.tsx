import React, { useState } from 'react';
import { Match } from '../types';
import { X } from 'lucide-react';

interface MatchFormProps {
  onSubmit: (data: Partial<Match>) => void;
  onClose: () => void;
}

const MatchForm: React.FC<MatchFormProps> = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    tournament: '',
    opponent: '',
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-bold text-lg">新規試合の追加</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
            <X size={20} />
          </button>
        </div>
        
        <form className="p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">試合日</label>
            <input 
              type="date" 
              required
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">大会・練習試合名</label>
            <input 
              type="text" 
              placeholder="例: 発芽杯"
              required
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formData.tournament}
              onChange={e => setFormData({...formData, tournament: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">対戦相手</label>
            <input 
              type="text" 
              placeholder="例: 桶川西"
              required
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formData.opponent}
              onChange={e => setFormData({...formData, opponent: e.target.value})}
            />
          </div>
          
          <button 
            type="submit"
            className="w-full bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-indigo-800 transition-colors active:scale-95 mt-4"
          >
            試合を開始する
          </button>
        </form>
      </div>
    </div>
  );
};

export default MatchForm;
