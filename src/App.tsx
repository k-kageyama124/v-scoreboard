import React, { useState, useEffect } from 'react';
import { Match, MatchSet } from './types';
import MatchList from './components/MatchList';
import MatchDetail from './components/MatchDetail';
import MatchForm from './components/MatchForm';
import { Plus, ChevronLeft, Search } from 'lucide-react';
import { database } from './firebase';
import { ref, onValue, set, remove } from 'firebase/database';

const App: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Firebaseからデータをリアルタイムで取得
  useEffect(() => {
    const matchesRef = ref(database, 'matches');
    
    const unsubscribe = onValue(matchesRef, (snapshot) => {
      const data = snapshot.val();
      console.log('Firebase raw data:', data);
      
      if (data) {
        const matchesArray = Object.keys(data).map(key => {
          const match = data[key];
          
          // マッチデータの正規化
          const normalizedMatch: any = {
            ...match,
            id: key,
            // tournament → tournamentName
            tournamentName: match.tournamentName || match.tournament || '',
          };
          
          // setsの正規化
          let rawSets = match.sets;
          
          // オブジェクトを配列に変換
          if (rawSets && !Array.isArray(rawSets)) {
            rawSets = Object.values(rawSets);
          }
          
          // 各setのフィールド名を変換
          if (Array.isArray(rawSets) && rawSets.length > 0) {
            normalizedMatch.sets = rawSets.map((set: any) => ({
              // myScore → ourScore
              ourScore: set.ourScore ?? set.myScore ?? 0,
              opponentScore: set.opponentScore ?? 0,
              // serveTurn: "S" → "our", "R" → "opponent"
              serveTurn: set.serveTurn === 'S' ? 'our' : 
                        set.serveTurn === 'R' ? 'opponent' : 
                        set.serveTurn || 'our',
              // lineup → players
              players: set.players || set.lineup || [],
              // services → serves
              serves: set.serves || set.services || [],
              receives: set.receives || [],
              substitutions: set.substitutions || [],
              // setNumber → currentRound
              currentRound: set.currentRound ?? set.setNumber ?? 1
            }));
          } else {
            // setsが存在しないか空の場合
            normalizedMatch.sets = [createEmptySet()];
          }
          
          return normalizedMatch as Match;
        });
        
        console.log('Normalized matches:', matchesArray);
        setMatches(matchesArray);
      } else {
        setMatches([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAddMatch = (data: Partial<Match>) => {
    const newMatchId = crypto.randomUUID();
    const newMatch: Match = {
      id: newMatchId,
      date: data.date || new Date().toISOString().split('T')[0],
      tournamentName: data.tournamentName || '',
      opponent: data.opponent || '',
      result: 'win',
      sets: [createEmptySet()],
      ...data
    } as Match;

    // Firebaseに保存
    const matchRef = ref(database, `matches/${newMatchId}`);
    set(matchRef, newMatch);

    setShowForm(false);
    setActiveMatchId(newMatchId);
  };

  const createEmptySet = (): MatchSet => ({
    ourScore: 0,
    opponentScore: 0,
    serveTurn: 'our',
    players: [],
    serves: [],
    receives: [],
    substitutions: [],
    currentRound: 1
  });

  const updateMatch = (updatedMatch: Match) => {
    // Firebaseに保存
    const matchRef = ref(database, `matches/${updatedMatch.id}`);
    set(matchRef, updatedMatch);
  };

  const deleteMatch = (id: string) => {
    if (window.confirm('この試合データを削除してもよろしいですか？')) {
      // Firebaseから削除
      const matchRef = ref(database, `matches/${id}`);
      remove(matchRef);
      setActiveMatchId(null);
    }
  };

  // 検索機能
  const filteredMatches = (matches || []).filter(match => {
    if (!match) return false;
    const query = searchQuery.toLowerCase();
    return (
      (match.tournamentName || '').toLowerCase().includes(query) ||
      (match.opponent || '').toLowerCase().includes(query)
    );
  });

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
              <button
                onClick={() => setShowForm(true)}
                className="bg-white text-indigo-700 px-4 py-2 rounded-full font-bold flex items-center gap-1 shadow-md active:scale-95 transition-all"
              >
                <Plus size={20} /> 新規試合
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4">
        {activeMatchId && activeMatch ? (
          <MatchDetail 
            match={activeMatch} 
            onUpdate={updateMatch} 
            onBack={() => setActiveMatchId(null)}
          />
        ) : (
          <>
            {matches.length > 0 && (
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="試合名または対戦相手で検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            )}
            <MatchList 
              matches={filteredMatches} 
              onSelect={setActiveMatchId}
              onDelete={deleteMatch}
            />
          </>
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
