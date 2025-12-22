import React, { useState, useEffect } from 'react';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { database } from './firebase';
import { Match, MatchSet } from './types';
import MatchList from './components/MatchList';
import MatchForm from './components/MatchForm';
import MatchDetail from './components/MatchDetail';
import { Volleyball } from 'lucide-react';

type View = 'list' | 'form' | 'detail';

function App() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useEffect(() => {
    const matchesRef = ref(database, 'matches');
    
    const unsubscribe = onValue(matchesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const matchesArray = Object.entries(data).map(([id, match]) => ({
          id,
          ...(match as Omit<Match, 'id'>),
        }));
        setMatches(matchesArray);
      } else {
        setMatches([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const addMatch = async (matchData: Omit<Match, 'id'>) => {
    try {
      const matchesRef = ref(database, 'matches');
      const newMatchRef = push(matchesRef);
      
      const newMatch = {
        ...matchData,
        id: newMatchRef.key,
      };

      await update(newMatchRef, newMatch);
      
      console.log('✅ 試合追加成功:', newMatch);
      setCurrentView('list');
    } catch (error) {
      console.error('❌ 試合追加エラー:', error);
      alert(`試合の追加に失敗しました: ${error instanceof Error ? error.message : String(error)}\n\nFirebaseのルールを確認してください。`);
    }
  };

  const updateMatch = async (updatedMatch: Match) => {
    try {
      const matchRef = ref(database, `matches/${updatedMatch.id}`);
      
      // idを除外してFirebaseに保存
      const { id, ...matchData } = updatedMatch;
      
      await update(matchRef, matchData);
      
      console.log('✅ 試合更新成功:', updatedMatch.id);
      
      // ローカルstateも更新
      setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
      setSelectedMatch(updatedMatch);
    } catch (error) {
      console.error('❌ 試合更新エラー:', error);
      alert(`試合の更新に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const deleteMatch = async (id: string) => {
    if (!window.confirm('この試合を削除しますか?')) return;

    try {
      const matchRef = ref(database, `matches/${id}`);
      await remove(matchRef);
      console.log('✅ 試合削除成功:', id);
    } catch (error) {
      console.error('❌ 試合削除エラー:', error);
      alert(`試合の削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleSelectMatch = (match: Match) => {
    setSelectedMatch(match);
    setCurrentView('detail');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {currentView === 'list' && (
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Volleyball size={40} className="text-purple-600" />
              <h1 className="text-4xl font-bold text-gray-800">バレーボール記録</h1>
            </div>
            <button
              onClick={() => setCurrentView('form')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-shadow font-bold"
            >
              新規試合登録
            </button>
          </div>
          <MatchList
            matches={matches}
            onSelectMatch={handleSelectMatch}
            onDeleteMatch={deleteMatch}
          />
        </div>
      )}

      {currentView === 'form' && (
        <MatchForm
          onSubmit={addMatch}
          onCancel={() => setCurrentView('list')}
        />
      )}

      {currentView === 'detail' && selectedMatch && (
        <MatchDetail
          match={selectedMatch}
          onBack={() => setCurrentView('list')}
          onUpdate={updateMatch}
        />
      )}
    </div>
  );
}

export default App;
