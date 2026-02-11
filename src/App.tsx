import React, { useEffect, useMemo, useState } from 'react';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { database } from './firebase';
import { Match } from './types';
import HomePage from './components/HomePage';
import MatchList from './components/MatchList';
import MatchForm from './components/MatchForm';
import MatchDetail from './components/MatchDetail';
import PlayerStats from './components/PlayerStats';
import PlayerDetail from './components/PlayerDetail';
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';

function App() {
  const [matches, setMatches] = useState<Match[]>([]);

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
    const matchesRef = ref(database, 'matches');
    const newMatchRef = push(matchesRef);

    const newMatch: Match = {
      ...matchData,
      id: newMatchRef.key || '',
    };

    await update(newMatchRef, newMatch);
    console.log('✅ 試合追加成功:', newMatch);
  };

  const updateMatch = async (updatedMatch: Match) => {
    const matchRef = ref(database, `matches/${updatedMatch.id}`);
    const { id, ...matchData } = updatedMatch;

    await update(matchRef, matchData);

    console.log('✅ 試合更新成功:', updatedMatch.id);

    // ローカル表示を即時更新（Firebase購読で上書きされてもOK）
    setMatches((prev) => prev.map((m) => (m.id === updatedMatch.id ? updatedMatch : m)));
  };

  const deleteMatch = async (id: string) => {
    if (!window.confirm('この試合を削除しますか?')) return;

    const matchRef = ref(database, `matches/${id}`);
    await remove(matchRef);

    console.log('✅ 試合削除成功:', id);
  };

  return (
    <Routes>
      <Route
        path="/"
        element={<HomeRoute />}
      />

      <Route
        path="/matches"
        element={<MatchesRoute matches={matches} onDeleteMatch={deleteMatch} />}
      />

      <Route
        path="/matches/new"
        element={<NewMatchRoute onSubmit={addMatch} />}
      />

      <Route
        path="/matches/:matchId"
        element={<MatchDetailRoute matches={matches} onUpdate={updateMatch} />}
      />

      <Route
        path="/players"
        element={<PlayersRoute matches={matches} />}
      />

      <Route
        path="/players/:playerName"
        element={<PlayerDetailRoute matches={matches} />}
      />

      {/* Not found */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

function HomeRoute() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <HomePage
        onNavigateToMatches={() => navigate('/matches')}
        onNavigateToPlayers={() => navigate('/players')}
      />
    </div>
  );
}

function MatchesRoute({
  matches,
  onDeleteMatch,
}: {
  matches: Match[];
  onDeleteMatch: (id: string) => Promise<void>;
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            ← ホームに戻る
          </button>
          <h1 className="text-4xl font-bold text-gray-800">試合一覧</h1>
          <button
            onClick={() => navigate('/matches/new')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-shadow font-bold"
          >
            新規試合登録
          </button>
        </div>

        <MatchList
          matches={matches}
          onSelectMatch={(m) => navigate(`/matches/${m.id}`)}
          onDeleteMatch={onDeleteMatch}
        />
      </div>
    </div>
  );
}

function NewMatchRoute({
  onSubmit,
}: {
  onSubmit: (match: Omit<Match, 'id'>) => Promise<void>;
}) {
  const navigate = useNavigate();

  return (
    <MatchForm
      onSubmit={async (m) => {
        try {
          await onSubmit(m);
          navigate('/matches');
        } catch (e) {
          console.error('❌ 試合追加エラー:', e);
          alert(`試合の追加に失敗しました: ${e instanceof Error ? e.message : String(e)}`);
        }
      }}
      onCancel={() => navigate('/matches')}
    />
  );
}

function MatchDetailRoute({
  matches,
  onUpdate,
}: {
  matches: Match[];
  onUpdate: (m: Match) => Promise<void>;
}) {
  const navigate = useNavigate();
  const { matchId } = useParams();

  const match = useMemo(() => matches.find((m) => m.id === matchId) || null, [matches, matchId]);

  if (!matchId) return <Navigate to="/matches" replace />;

  if (!match) {
    // Firebase購読の初回待ち
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">データ読み込み中...</h2>
          <p className="text-base text-gray-600">試合データを準備しています。しばらくお待ちください。</p>
          <button
            onClick={() => navigate('/matches')}
            className="mt-4 w-full px-6 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            ← 試合一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <MatchDetail
      match={match}
      onBack={() => navigate('/matches')}
      onUpdate={onUpdate}
    />
  );
}

function PlayersRoute({ matches }: { matches: Match[] }) {
  const navigate = useNavigate();

  return (
    <PlayerStats
      matches={matches}
      onBack={() => navigate('/')}
      onSelectPlayer={(name) => navigate(`/players/${encodeURIComponent(name)}`)}
    />
  );
}

function PlayerDetailRoute({ matches }: { matches: Match[] }) {
  const navigate = useNavigate();
  const { playerName } = useParams();

  const decodedName = useMemo(() => {
    if (!playerName) return '';
    try {
      return decodeURIComponent(playerName);
    } catch {
      return playerName;
    }
  }, [playerName]);

  if (!decodedName) return <Navigate to="/players" replace />;

  return (
    <PlayerDetail
      playerName={decodedName}
      matches={matches}
      onBack={() => navigate('/players')}
    />
  );
}
