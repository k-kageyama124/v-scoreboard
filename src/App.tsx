import React, { useState, useEffect } from 'react';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { database } from './firebase';
import { Match } from './types';
import HomePage from './components/HomePage';
import MatchList from './components/MatchList';
import MatchForm from './components/MatchForm';
import MatchDetail from './components/MatchDetail';
import PlayerStats from './components/PlayerStats';
import PlayerDetail from './components/PlayerDetail';

type View = 'home' | 'matches' | 'form' | 'detail' | 'players' | 'player-detail';

function App() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');

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
      setCurrentView('matches');
    } catch (error) {
      console.error('❌ 試合追加エラー:', error);
      alert(`試合の追加に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const updateMatch = async (updatedMatch: Match) => {
    try {
      const matchRef = ref(database, `matches/${updatedMatch.id}`);
      
      const { id, ...matchData } = updatedMatch;
      
      await update(matchRef, matchData);
      
      console.log('✅ 試合更新成功:', updatedMatch.id);
      
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

  const handleSelectPlayer = (playerName: string) => {
    setSelectedPlayer(playerName);
    setCurrentView('player-detail');
  };

  return (
    <div className="min-h-screen">
      {currentView === 'home' && (
        <HomePage
          onNavigateToMatches={() => setCurrentView('matches')}
          onNavigateToPlayers={() => setCurrentView('players')}
        />
      )}

      {currentView === 'matches' && (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
          <div className="container mx-auto p-4">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => setCurrentView('home')}
                className="px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                ← ホームに戻る
              </button>
              <h1 className="text-4xl font-bold text-gray-800">試合一覧</h1>
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
        </div>
      )}

      {currentView === 'form' && (
        <MatchForm
          onSubmit={addMatch}
          onCancel={() => setCurrentView('matches')}
        />
      )}

      {currentView === 'detail' && selectedMatch && (
        <MatchDetail
          match={selectedMatch}
          onBack={() => setCurrentView('matches')}
          onUpdate={updateMatch}
        />
      )}

      {currentView === 'players' && (
        <PlayerStats
          matches={matches}
          onBack={() => setCurrentView('home')}
          onSelectPlayer={handleSelectPlayer}
        />
      )}

      {currentView === 'player-detail' && (
        <PlayerDetail
          playerName={selectedPlayer}
          matches={matches}
          onBack={() => setCurrentView('players')}
        />
      )}
    </div>
  );
}

export default App;
