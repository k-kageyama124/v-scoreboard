
import React, { useState, useEffect } from 'react';
import { Match, MatchSet, Player } from './types';
import MatchList from './components/MatchList';
import MatchDetail from './components/MatchDetail';
import MatchForm from './components/MatchForm';
import { Plus, ChevronLeft, Download, Upload } from 'lucide-react';

const App: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('vb_matches');
    if (saved) {
      try {
        setMatches(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved matches", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('vb_matches', JSON.stringify(matches));
  }, [matches]);

  const handleAddMatch = (data: Partial<Match>) => {
    const newMatch: Match = {
      id: crypto.randomUUID(),
      date: data.date || new Date().toISOString().split('T')[0],
      tournament: data.tournament || '',
      opponent: data.opponent || '',
      result: 'win',
      sets: [createEmptySet(1)],
      ...data
    } as Match;
    setMatches([newMatch, ...matches]);
    setShowForm(false);
    setActiveMatchId(newMatch.id);
  };

  const createEmptySet = (num: number): MatchSet => ({
    id: crypto.randomUUID(),
    setNumber: num,
    myScore: 0,
    opponentScore: 0,
    serveTurn: 'S',
    lineup: Array.from({ length: 6 }, (_, i) => ({
      id: crypto.randomUUID(),
      name: `選手 ${i + 1}`,
      isSubstituted: false
    })),
    bench: [],
    services: [],
    substitutions: []
  });

  const updateMatch = (updatedMatch: Match) => {
    setMatches(matches.map(m => m.id === updatedMatch.id ? updatedMatch : m));
  };

  const deleteMatch = (id: string) => {
    if (window.confirm('この試合データを削除してもよろしいですか？')) {
      setMatches(matches.filter(m => m.id !== id));
      setActiveMatchId(null);
    }
  };

  // データをファイルとして保存
  const exportAllData = () => {
    const dataStr = JSON.stringify(matches);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `v_score_data_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // データをファイルから読み込み
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported) && window.confirm('現在のデータにインポートしたデータを追加しますか？')) {
          setMatches([...imported, ...matches]);
        }
      } catch (err) {
        alert('ファイルの形式が正しくありません。');
      }
    };
    reader.readAsText(file);
  };

  const activeMatch = matches.find(m => m.id === activeMatchId);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-indigo-700 text-white p-4 shadow-lg sticky top-0 z-50 no-print">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeMatchId && (
              <button onClick={() => { setActiveMatchId(null); }} className="p-1 hover:bg-indigo-600 rounded">
                <ChevronLeft size={24} />
              </button>
            )}
            <h1 className="text-xl font-bold tracking-tight">V-Scoreboard</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {!activeMatchId && (
              <>
                <label className="p-2 bg-indigo-600 rounded-full cursor-pointer hover:bg-indigo-500 transition-colors">
                  <Upload size={20} />
                  <input type="file" className="hidden" accept=".json" onChange={importData} />
                </label>
                <button onClick={exportAllData} className="p-2 bg-indigo-600 rounded-full hover:bg-indigo-500 transition-colors">
                  <Download size={20} />
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-white text-indigo-700 px-4 py-2 rounded-full font-bold flex items-center gap-1 shadow-md active:scale-95 transition-all ml-2"
                >
                  <Plus size={20} /> 新規試合
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4">
        {activeMatchId && activeMatch ? (
          <MatchDetail 
            match={activeMatch} 
            onUpdate={updateMatch} 
            onDelete={() => deleteMatch(activeMatch.id)}
          />
        ) : (
          <MatchList 
            matches={matches} 
            onSelect={setActiveMatchId} 
          />
        )}
      </main>

      {showForm && (
        <MatchForm 
          onSubmit={handleAddMatch} 
          onClose={() => setShowForm(false)} 
        />
      )}
    </div>
  );
};

export default App;
