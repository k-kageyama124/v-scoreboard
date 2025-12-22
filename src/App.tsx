import React, { useState, useEffect } from 'react';
import { Match, MatchSet } from './types';
import { database } from './firebase';
import { ref, onValue, set, remove } from 'firebase/database';
import MatchList from './components/MatchList';
import MatchDetail from './components/MatchDetail';
import MatchForm from './components/MatchForm';
import { Plus, Trophy } from 'lucide-react';

const createEmptySet = (): MatchSet => ({
  ourScore: 0,
  opponentScore: 0,
  players: [],
  serves: [],
  receives: [],
  substitutions: []
});

function App() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const matchesRef = ref(database, 'matches');
    
    const unsubscribe = onValue(
      matchesRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          
          if (data) {
            const matchesArray = Object.keys(data).map(key => {
              const match = data[key];
              
              // データ正規化: sets が配列でない場合や空の場合の処理
              let normalizedSets: MatchSet[] = [];
              
              if (match.sets && Array.isArray(match.sets)) {
                normalizedSets = match.sets.map((set: any) => ({
                  ourScore: set.ourScore || set.myScore || 0,
                  opponentScore: set.opponentScore || 0,
                  players: Array.isArray(set.players) ? set.players : (Array.isArray(set.lineup) ? set.lineup : []),
                  serves: Array.isArray(set.serves) ? set.serves : (Array.isArray(set.services) ? set.services : []),
                  receives: Array.isArray(set.receives) ? set.receives : [],
                  substitutions: Array.isArray(set.substitutions) ? set.substitutions : []
                }));
              }
              
              // sets が空の場合、デフォルトで1セット作成
              if (normalizedSets.length === 0) {
                normalizedSets = [createEmptySet()];
              }
              
              return {
                id: key,
                date: match.date || '',
                tournamentName: match.tournamentName || match.tournament || '',
                opponent: match.opponent || '',
                result: match.result,
                sets: normalizedSets
              };
            });
            
            // 日付順にソート（新しい順）
            matchesArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            setMatches(matchesArray);
          } else {
            setMatches([]);
          }
          
          setError(null);
        } catch (err) {
          console.error('データ取得エラー:', err);
          setError('データの読み込みに失敗しました');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Firebase エラー:', err);
        setError('データベース接続エラー');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleAddMatch = async (matchData: Omit<Match, 'id'>) => {
    try {
      const newMatchId = Date.now().toString();
      const matchRef = ref(database, `matches/${newMatchId}`);
      
      // 初期セットを1つ作成
      const initialMatch: Match = {
        ...matchData,
        id: newMatchId,
        sets: matchData.sets && matchData.sets.length > 0 ? matchData.sets : [createEmptySet()]
      };
      
      await set(matchRef, initialMatch);
      setShowForm(false);
    } catch (err) {
      console.error('試合追加エラー:', err);
      alert('試合の追加に失敗しました');
    }
  };

  const updateMatch = async (updatedMatch: Match) => {
    try {
      const matchRef = ref(database, `matches/${updatedMatch.id}`);
      await set(matchRef, updatedMatch);
    } catch (err) {
      console.error('試合更新エラー:', err);
      alert('試合の更新に失敗しました');
    }
  };

  const deleteMatch = async (matchId: string) => {
    if (!window.confirm('この試合データを削除しますか？')) {
      return;
    }
    
    try {
      const matchRef = ref(database, `matches/${matchId}`);
      await remove(matchRef);
    } catch (err) {
      console.error('試合削除エラー:', err);
      alert('試合の削除に失敗しました');
    }
  };

  const filteredMatches = matches.filter(match => {
    const query = searchQuery.toLowerCase();
    return (
      match.tournamentName.toLowerCase().includes(query) ||
      match.opponent.toLowerCase().includes(query) ||
      match.date.includes(query)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">データを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <p className="text-red-600 font-bold mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  if (selectedMatch) {
    return (
      <MatchDetail
        match={selectedMatch}
        onBack={() => setSelectedMatch(null)}
        onUpdate={updateMatch}
      />
    );
  }

  if (showForm) {
    return (
      <MatchForm
        onSubmit={handleAddMatch}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Trophy className="text-purple-600" size={32} />
              <h1 className="text-3xl font-bold text-gray-800">
                バレーボール試合記録システム
              </h1>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all font-bold"
            >
              <Plus size={20} />
              <span>新規試合</span>
            </button>
          </div>
          
          {/* 検索バー */}
          <input
            type="text"
            placeholder="大会名・対戦相手・日付で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
          />
        </div>

        {/* 試合リスト */}
        <MatchList
          matches={filteredMatches}
          onSelectMatch={setSelectedMatch}
          onDeleteMatch={deleteMatch}
        />
      </div>
    </div>
  );
}

export default App;
