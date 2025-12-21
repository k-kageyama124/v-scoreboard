import React, { useState, useEffect } from 'react';
import { Match, MatchSet, Player, SubstitutionRecord, ServeQuality, ServeRecord, ReceiveQuality, ReceiveRecord } from '../types';
import { ArrowLeft, RotateCw, X, Trash2, Undo } from 'lucide-react';

interface MatchDetailProps {
  match: Match;
  onUpdate: (match: Match) => void;
  onBack: () => void;
}

const MatchDetail: React.FC<MatchDetailProps> = ({ match, onUpdate, onBack }) => {
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [benchPlayerName, setBenchPlayerName] = useState('');
  const [inPlayerName, setInPlayerName] = useState('');
  const [addingPlayer, setAddingPlayer] = useState<string | null>(null);
  const currentSet = match.sets[currentSetIndex];

  const updateSet = (updates: Partial<MatchSet>) => {
    const newSets = [...match.sets];
    newSets[currentSetIndex] = { ...currentSet, ...updates };
    onUpdate({ ...match, sets: newSets });
  };

  const toggleResult = () => {
    onUpdate({ ...match, result: match.result === 'win' ? 'lose' : 'win' });
  };

  const adjustScore = (team: 'our' | 'opponent', delta: number) => {
    const newScore = team === 'our' 
      ? Math.max(0, currentSet.ourScore + delta)
      : Math.max(0, currentSet.opponentScore + delta);
    
    updateSet(team === 'our' ? { ourScore: newScore } : { opponentScore: newScore });
  };

  const toggleServeTurn = () => {
    updateSet({ serveTurn: currentSet.serveTurn === 'our' ? 'opponent' : 'our' });
  };

  const addPlayer = (position: 'starting' | 'bench', playerName: string) => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: playerName,
      position
    };
    
    const newPlayers = [...currentSet.players, newPlayer];
    updateSet({ players: newPlayers });
    
    if (position === 'bench') {
      setBenchPlayerName('');
    }
    setAddingPlayer(null);
  };

  const handleSubstitution = () => {
    if (!benchPlayerName.trim() || !inPlayerName.trim()) return;

    const newPlayers = currentSet.players.map(p => 
      p.name === inPlayerName ? { ...p, position: 'bench' as const } : p
    );

    const benchPlayer = currentSet.players.find(p => p.name === benchPlayerName);
    if (benchPlayer) {
      newPlayers.push({ ...benchPlayer, position: 'starting' as const });
    } else {
      addPlayer('starting', benchPlayerName);
    }

    const newSubstitution: SubstitutionRecord = {
      id: Date.now().toString(),
      outPlayerName: inPlayerName,
      inPlayerName: benchPlayerName,
      score: `${currentSet.ourScore}-${currentSet.opponentScore}`
    };

    updateSet({
      players: newPlayers,
      substitutions: [...(currentSet.substitutions || []), newSubstitution]
    });

    setBenchPlayerName('');
    setInPlayerName('');
  };

  const removeSubstitution = (subId: string) => {
    if (!window.confirm('この交代記録を削除しますか?\n※選手の配置は元に戻りません。記録のみ削除されます。')) {
      return;
    }
    
    const newSubstitutions = (currentSet.substitutions || []).filter(s => s.id !== subId);
    updateSet({ substitutions: newSubstitutions });
  };

  const addServe = (playerId: string, quality: ServeQuality) => {
    const newServeRecord: ServeRecord = {
      id: Date.now().toString(),
      playerId,
      quality,
      round: currentSet.currentRound || 1
    };
    
    updateSet({
      serves: [...(currentSet.serves || []), newServeRecord]
    });
  };

  const addReceive = (playerId: string, quality: ReceiveQuality) => {
    const newReceiveRecord: ReceiveRecord = {
      id: Date.now().toString(),
      playerId,
      quality,
      round: currentSet.currentRound || 1
    };
    
    updateSet({
      receives: [...(currentSet.receives || []), newReceiveRecord]
    });
  };

  const undoLastServe = (playerId: string) => {
    const serves = currentSet.serves || [];
    const playerServes = serves.filter(s => s.playerId === playerId);
    
    if (playerServes.length === 0) return;
    
    const lastServe = playerServes[playerServes.length - 1];
    updateSet({
      serves: serves.filter(s => s.id !== lastServe.id)
    });
  };

  const undoLastReceive = (playerId: string) => {
    const receives = currentSet.receives || [];
    const playerReceives = receives.filter(r => r.playerId === playerId);
    
    if (playerReceives.length === 0) return;
    
    const lastReceive = playerReceives[playerReceives.length - 1];
    updateSet({
      receives: receives.filter(r => r.id !== lastReceive.id)
    });
  };

  const advanceRound = () => {
    updateSet({ currentRound: (currentSet.currentRound || 1) + 1 });
  };

  const startingPlayers = currentSet.players.filter(p => p.position === 'starting');
  const benchPlayers = currentSet.players.filter(p => p.position === 'bench');
  const needsMorePlayers = startingPlayers.length < 6;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* ヘッダー */}
        <div className="flex items-center gap-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 font-bold text-gray-700 border-2 border-gray-100 hover:border-indigo-200 active:scale-95"
          >
            <ArrowLeft size={20} />
            戻る
          </button>

          <div className="flex-1 bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
            <div className="flex flex-wrap items-center gap-4">
              <h2 className="text-2xl font-black text-gray-800">{match.tournamentName}</h2>
              <span className="text-lg text-gray-500">vs</span>
              <h3 className="text-xl font-bold text-indigo-600">{match.opponent}</h3>
              <span className="ml-auto text-sm text-gray-500 font-mono">{match.date}</span>
            </div>
          </div>

          <button
            onClick={toggleResult}
            className={`px-8 py-4 rounded-2xl shadow-lg font-black text-lg transition-all duration-300 border-4 active:scale-95 no-print ${
              match.result === 'win'
                ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white border-green-600 hover:from-green-500 hover:to-emerald-600'
                : 'bg-gradient-to-r from-red-400 to-rose-500 text-white border-red-600 hover:from-red-500 hover:to-rose-600'
            }`}
          >
            {match.result === 'win' ? 'WIN' : 'LOSE'}
          </button>
        </div>

        {/* セット切り替え */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
          <div className="flex gap-4">
            {match.sets.map((set, index) => (
              <button
                key={index}
                onClick={() => setCurrentSetIndex(index)}
                className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                  currentSetIndex === index
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                第{index + 1}セット
              </button>
            ))}
          </div>
        </div>

        {/* スコア表示 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-4 border-blue-200">
            <div className="text-sm text-gray-500 font-bold mb-2">自チーム</div>
            <div className="text-6xl font-black text-blue-600 font-mono mb-4">{currentSet.ourScore}</div>
            <div className="flex gap-3 justify-center no-print">
              <button onClick={() => adjustScore('our', 1)} className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 active:scale-95 transition-all">+1</button>
              <button onClick={() => adjustScore('our', -1)} className="px-6 py-3 bg-gray-400 text-white rounded-xl font-bold hover:bg-gray-500 active:scale-95 transition-all">-1</button>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <button
              onClick={toggleServeTurn}
              className="px-8 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl shadow-lg font-black text-xl border-4 border-amber-600 hover:from-amber-500 hover:to-orange-600 active:scale-95 transition-all no-print"
            >
              サーブ権: {currentSet.serveTurn === 'our' ? '自チーム (S)' : '相手 (R)'}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-4 border-red-200">
            <div className="text-sm text-gray-500 font-bold mb-2">相手チーム</div>
            <div className="text-6xl font-black text-red-600 font-mono mb-4">{currentSet.opponentScore}</div>
            <div className="flex gap-3 justify-center no-print">
              <button onClick={() => adjustScore('opponent', 1)} className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 active:scale-95 transition-all">+1</button>
              <button onClick={() => adjustScore('opponent', -1)} className="px-6 py-3 bg-gray-400 text-white rounded-xl font-bold hover:bg-gray-500 active:scale-95 transition-all">-1</button>
            </div>
          </div>
        </div>
           {/* ラウンド管理 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-gray-700">現在のラウンド:</span>
              <span className="text-4xl font-black text-indigo-600 font-mono">{currentSet.currentRound || 1}</span>
            </div>
            <button
              onClick={advanceRound}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition-all no-print"
            >
              <RotateCw size={20} className="inline mr-2" />
              次のラウンドへ
            </button>
          </div>
        </div>

        {/* 選手追加 */}
        {needsMorePlayers && (
          <div className="bg-amber-50 border-4 border-amber-200 rounded-2xl p-6 shadow-xl">
            <p className="text-amber-800 font-bold text-lg mb-4">⚠️ スターティングメンバーが6人未満です。選手を追加してください。</p>
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 no-print">
              {Array.from({ length: 6 - startingPlayers.length }).map((_, i) => (
                <div key={i}>
                  {addingPlayer === `starting-${i}` ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="選手名"
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none font-bold"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            addPlayer('starting', e.currentTarget.value.trim());
                          }
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => setAddingPlayer(null)}
                        className="px-3 py-3 bg-gray-300 rounded-xl hover:bg-gray-400 active:scale-95 transition-all"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingPlayer(`starting-${i}`)}
                      className="w-full px-4 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 active:scale-95 transition-all"
                    >
                      + 選手追加
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 成績テーブル - PC版 (3列) */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {/* 列1: 選手名 */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-100">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
              <h3 className="text-xl font-black text-center">選手名</h3>
            </div>
            <div className="divide-y-2 divide-gray-100">
              {startingPlayers.map((player, index) => (
                <div key={player.id} className="p-6 hover:bg-indigo-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-black text-xl shadow-lg">
                      {index + 1}
                    </div>
                    <span className="text-xl font-bold text-gray-800 flex-1">{player.name}</span>
                    {currentSet.serveTurn === 'our' && index === 0 && (
                      <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full font-black text-sm border-2 border-amber-300">
                        S
                      </span>
                    )}
                    {currentSet.serveTurn === 'opponent' && index === 0 && (
                      <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-black text-sm border-2 border-blue-300">
                        R
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 列2: サーブ */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-100 border-r-4 border-r-indigo-300">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
              <h3 className="text-xl font-black text-center">サーブ</h3>
            </div>
            <div className="divide-y-2 divide-gray-100">
              {startingPlayers.map((player) => {
                const serves = (currentSet.serves || []).filter(s => s.playerId === player.id);
                return (
                  <div key={player.id} className="p-6 hover:bg-green-50 transition-colors">
                    <div className="flex flex-wrap gap-2 mb-3 min-h-[48px]">
                      {serves.map((serve) => (
                        <span
                          key={serve.id}
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shadow-md border-2 ${
                            serve.quality === 'ace' ? 'bg-yellow-400 text-yellow-900 border-yellow-600' :
                            serve.quality === 'good' ? 'bg-green-400 text-green-900 border-green-600' :
                            serve.quality === 'normal' ? 'bg-blue-400 text-blue-900 border-blue-600' :
                            'bg-red-400 text-red-900 border-red-600'
                          }`}
                          title={`Round ${serve.round}`}
                        >
                          {serve.quality === 'ace' ? '★' : serve.quality === 'good' ? '◎' : serve.quality === 'normal' ? '○' : '×'}
                          <span className="absolute text-[10px] font-mono -mt-8">{serve.round}</span>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 no-print">
                      <button onClick={() => addServe(player.id, 'ace')} className="flex-1 px-3 py-2 bg-yellow-400 text-yellow-900 rounded-lg font-bold hover:bg-yellow-500 active:scale-95 transition-all text-sm">★</button>
                      <button onClick={() => addServe(player.id, 'good')} className="flex-1 px-3 py-2 bg-green-400 text-green-900 rounded-lg font-bold hover:bg-green-500 active:scale-95 transition-all text-sm">◎</button>
                      <button onClick={() => addServe(player.id, 'normal')} className="flex-1 px-3 py-2 bg-blue-400 text-blue-900 rounded-lg font-bold hover:bg-blue-500 active:scale-95 transition-all text-sm">○</button>
                      <button onClick={() => addServe(player.id, 'miss')} className="flex-1 px-3 py-2 bg-red-400 text-red-900 rounded-lg font-bold hover:bg-red-500 active:scale-95 transition-all text-sm">×</button>
                      <button onClick={() => undoLastServe(player.id)} className="px-3 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 active:scale-95 transition-all" title="直前のサーブを取消">
                        <Undo size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 列3: サーブレシーブ */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-100">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white p-6">
              <h3 className="text-xl font-black text-center">サーブレシーブ</h3>
            </div>
            <div className="divide-y-2 divide-gray-100">
              {startingPlayers.map((player) => {
                const receives = (currentSet.receives || []).filter(r => r.playerId === player.id);
                return (
                  <div key={player.id} className="p-6 hover:bg-blue-50 transition-colors">
                    <div className="flex flex-wrap gap-2 mb-3 min-h-[48px]">
                      {receives.map((receive) => (
                        <span
                          key={receive.id}
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shadow-md border-2 ${
                            receive.quality === 'perfect' ? 'bg-yellow-400 text-yellow-900 border-yellow-600' :
                            receive.quality === 'good' ? 'bg-green-400 text-green-900 border-green-600' :
                            receive.quality === 'follow' ? 'bg-blue-400 text-blue-900 border-blue-600' :
                            'bg-red-400 text-red-900 border-red-600'
                          }`}
                          title={`Round ${receive.round}`}
                        >
                          {receive.quality === 'perfect' ? '◎' : receive.quality === 'good' ? '○' : receive.quality === 'follow' ? '△' : '×'}
                          <span className="absolute text-[10px] font-mono -mt-8">{receive.round}</span>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 no-print">
                      <button onClick={() => addReceive(player.id, 'perfect')} className="flex-1 px-3 py-2 bg-yellow-400 text-yellow-900 rounded-lg font-bold hover:bg-yellow-500 active:scale-95 transition-all text-sm">◎</button>
                      <button onClick={() => addReceive(player.id, 'good')} className="flex-1 px-3 py-2 bg-green-400 text-green-900 rounded-lg font-bold hover:bg-green-500 active:scale-95 transition-all text-sm">○</button>
                      <button onClick={() => addReceive(player.id, 'follow')} className="flex-1 px-3 py-2 bg-blue-400 text-blue-900 rounded-lg font-bold hover:bg-blue-500 active:scale-95 transition-all text-sm">△</button>
                      <button onClick={() => addReceive(player.id, 'miss')} className="flex-1 px-3 py-2 bg-red-400 text-red-900 rounded-lg font-bold hover:bg-red-500 active:scale-95 transition-all text-sm">×</button>
                      <button onClick={() => undoLastReceive(player.id)} className="px-3 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 active:scale-95 transition-all" title="直前のレシーブを取消">
                        <Undo size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 成績テーブル - モバイル版 (縦積み) */}
        <div className="md:hidden space-y-4">
          {startingPlayers.map((player, index) => (
            <div key={player.id} className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-100">
              {/* 選手名ヘッダー */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-black text-lg">
                    {index + 1}
                  </div>
                  <span className="text-xl font-black flex-1">{player.name}</span>
                  {currentSet.serveTurn === 'our' && index === 0 && (
                    <span className="px-3 py-1 bg-amber-400 text-amber-900 rounded-full font-black text-sm">S</span>
                  )}
                  {currentSet.serveTurn === 'opponent' && index === 0 && (
                    <span className="px-3 py-1 bg-blue-400 text-blue-900 rounded-full font-black text-sm">R</span>
                  )}
                </div>
              </div>

              {/* サーブセクション */}
              <div className="p-4 border-b-2 border-gray-100">
                <h4 className="text-sm font-black text-green-600 mb-3">サーブ</h4>
                <div className="flex flex-wrap gap-2 mb-3 min-h-[56px]">
                  {(currentSet.serves || [])
                    .filter(s => s.playerId === player.id)
                    .map((serve) => (
                      <span
                        key={serve.id}
                        className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-xl shadow-md border-2 ${
                          serve.quality === 'ace' ? 'bg-yellow-400 text-yellow-900 border-yellow-600' :
                          serve.quality === 'good' ? 'bg-green-400 text-green-900 border-green-600' :
                          serve.quality === 'normal' ? 'bg-blue-400 text-blue-900 border-blue-600' :
                          'bg-red-400 text-red-900 border-red-600'
                        }`}
                      >
                        {serve.quality === 'ace' ? '★' : serve.quality === 'good' ? '◎' : serve.quality === 'normal' ? '○' : '×'}
                        <span className="absolute text-xs font-mono -mt-10">{serve.round}</span>
                      </span>
                    ))}
                </div>
                <div className="grid grid-cols-5 gap-2 no-print">
                  <button onClick={() => addServe(player.id, 'ace')} className="h-14 bg-yellow-400 text-yellow-900 rounded-lg font-black text-lg hover:bg-yellow-500 active:scale-95 transition-all">★</button>
                  <button onClick={() => addServe(player.id, 'good')} className="h-14 bg-green-400 text-green-900 rounded-lg font-black text-lg hover:bg-green-500 active:scale-95 transition-all">◎</button>
                  <button onClick={() => addServe(player.id, 'normal')} className="h-14 bg-blue-400 text-blue-900 rounded-lg font-black text-lg hover:bg-blue-500 active:scale-95 transition-all">○</button>
                  <button onClick={() => addServe(player.id, 'miss')} className="h-14 bg-red-400 text-red-900 rounded-lg font-black text-lg hover:bg-red-500 active:scale-95 transition-all">×</button>
                  <button onClick={() => undoLastServe(player.id)} className="h-14 bg-gray-300 rounded-lg hover:bg-gray-400 active:scale-95 transition-all flex items-center justify-center">
                    <Undo size={20} />
                  </button>
                </div>
              </div>

              {/* サーブレシーブセクション */}
              <div className="p-4">
                <h4 className="text-sm font-black text-blue-600 mb-3">サーブレシーブ</h4>
                <div className="flex flex-wrap gap-2 mb-3 min-h-[56px]">
                  {(currentSet.receives || [])
                    .filter(r => r.playerId === player.id)
                    .map((receive) => (
                      <span
                        key={receive.id}
                        className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-xl shadow-md border-2 ${
                          receive.quality === 'perfect' ? 'bg-yellow-400 text-yellow-900 border-yellow-600' :
                          receive.quality === 'good' ? 'bg-green-400 text-green-900 border-green-600' :
                          receive.quality === 'follow' ? 'bg-blue-400 text-blue-900 border-blue-600' :
                          'bg-red-400 text-red-900 border-red-600'
                        }`}
                      >
                        {receive.quality === 'perfect' ? '◎' : receive.quality === 'good' ? '○' : receive.quality === 'follow' ? '△' : '×'}
                        <span className="absolute text-xs font-mono -mt-10">{receive.round}</span>
                      </span>
                    ))}
                </div>
                <div className="grid grid-cols-5 gap-2 no-print">
                  <button onClick={() => addReceive(player.id, 'perfect')} className="h-14 bg-yellow-400 text-yellow-900 rounded-lg font-black text-lg hover:bg-yellow-500 active:scale-95 transition-all">◎</button>
                  <button onClick={() => addReceive(player.id, 'good')} className="h-14 bg-green-400 text-green-900 rounded-lg font-black text-lg hover:bg-green-500 active:scale-95 transition-all">○</button>
                  <button onClick={() => addReceive(player.id, 'follow')} className="h-14 bg-blue-400 text-blue-900 rounded-lg font-black text-lg hover:bg-blue-500 active:scale-95 transition-all">△</button>
                  <button onClick={() => addReceive(player.id, 'miss')} className="h-14 bg-red-400 text-red-900 rounded-lg font-black text-lg hover:bg-red-500 active:scale-95 transition-all">×</button>
                  <button onClick={() => undoLastReceive(player.id)} className="h-14 bg-gray-300 rounded-lg hover:bg-gray-400 active:scale-95 transition-all flex items-center justify-center">
                    <Undo size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
           {/* 選手交代 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-100">
          <h3 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
            <RotateCw size={28} className="text-indigo-600" />
            選手交代
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 no-print">
            <div className="md:col-span-3">
              <label className="block text-sm font-bold text-gray-700 mb-2">OUT (ベンチへ)</label>
              <select
                value={inPlayerName}
                onChange={(e) => setInPlayerName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none font-bold text-lg"
              >
                <option value="">コート内の選手を選択</option>
                {startingPlayers.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end justify-center">
              <div className="text-4xl font-black text-indigo-600">→</div>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-bold text-gray-700 mb-2">IN (コートへ)</label>
              <input
                type="text"
                value={benchPlayerName}
                onChange={(e) => setBenchPlayerName(e.target.value)}
                placeholder="ベンチの選手名を入力"
                list="bench-players"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none font-bold text-lg"
              />
              <datalist id="bench-players">
                {benchPlayers.map(p => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
            </div>
            <button
              onClick={handleSubstitution}
              disabled={!benchPlayerName.trim() || !inPlayerName.trim()}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed active:scale-95 transition-all"
            >
              交代実行
            </button>
          </div>
        </div>

        {/* ベンチ・控え選手 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-100">
          <h3 className="text-2xl font-black text-gray-800 mb-6">ベンチ・控え選手</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {benchPlayers.map(player => (
              <div key={player.id} className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200 font-bold text-gray-700 text-center">
                {player.name}
              </div>
            ))}
            {addingPlayer === 'bench' ? (
              <div className="flex gap-2 no-print">
                <input
                  type="text"
                  placeholder="選手名"
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none font-bold"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      addPlayer('bench', e.currentTarget.value.trim());
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={() => setAddingPlayer(null)}
                  className="px-3 py-3 bg-gray-300 rounded-xl hover:bg-gray-400 active:scale-95 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAddingPlayer('bench')}
                className="p-4 bg-indigo-100 text-indigo-600 rounded-xl font-bold hover:bg-indigo-200 active:scale-95 transition-all border-2 border-indigo-300 no-print"
              >
                + ベンチ選手追加
              </button>
            )}
          </div>
        </div>

        {/* 交代履歴 */}
        {currentSet.substitutions && currentSet.substitutions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-100">
            <h3 className="text-2xl font-black text-gray-800 mb-6">交代履歴</h3>
            <div className="space-y-3">
              {currentSet.substitutions.map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200 group hover:border-indigo-300 transition-all">
                  <div className="flex items-center gap-4 flex-1">
                    <span className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-bold border-2 border-red-300">{sub.outPlayerName}</span>
                    <span className="text-2xl text-gray-400">→</span>
                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-bold border-2 border-green-300">{sub.inPlayerName}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-gray-500 font-bold">得点時</div>
                      <div className="text-lg font-black text-indigo-600 font-mono">{sub.score}</div>
                    </div>
                    <button
                      onClick={() => removeSubstitution(sub.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 active:scale-90 no-print"
                      title="この交代記録を削除"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
           )}
          {/* 凡例 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-100">
          <h3 className="text-2xl font-black text-gray-800 mb-6">記号の意味</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* サーブ凡例 */}
            <div>
              <h4 className="text-lg font-black text-green-600 mb-4">サーブ</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <span className="w-12 h-12 rounded-full bg-yellow-400 text-yellow-900 border-2 border-yellow-600 flex items-center justify-center font-black text-xl shadow-md">★</span>
                  <span className="font-bold text-gray-700">サービスエース</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="w-12 h-12 rounded-full bg-green-400 text-green-900 border-2 border-green-600 flex items-center justify-center font-black text-xl shadow-md">◎</span>
                  <span className="font-bold text-gray-700">サーブ成功（相手崩す）</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="w-12 h-12 rounded-full bg-blue-400 text-blue-900 border-2 border-blue-600 flex items-center justify-center font-black text-xl shadow-md">○</span>
                  <span className="font-bold text-gray-700">サーブ成功（普通）</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="w-12 h-12 rounded-full bg-red-400 text-red-900 border-2 border-red-600 flex items-center justify-center font-black text-xl shadow-md">×</span>
                  <span className="font-bold text-gray-700">サーブミス</span>
                </div>
              </div>
            </div>

            {/* サーブレシーブ凡例 */}
            <div>
              <h4 className="text-lg font-black text-blue-600 mb-4">サーブレシーブ</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <span className="w-12 h-12 rounded-full bg-yellow-400 text-yellow-900 border-2 border-yellow-600 flex items-center justify-center font-black text-xl shadow-md">◎</span>
                  <span className="font-bold text-gray-700">レシーブ成功（セッターへ）</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="w-12 h-12 rounded-full bg-green-400 text-green-900 border-2 border-green-600 flex items-center justify-center font-black text-xl shadow-md">○</span>
                  <span className="font-bold text-gray-700">レシーブ成功（セッター以外へ）</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="w-12 h-12 rounded-full bg-blue-400 text-blue-900 border-2 border-blue-600 flex items-center justify-center font-black text-xl shadow-md">△</span>
                  <span className="font-bold text-gray-700">レシーブ成功（フォローでつながる）</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="w-12 h-12 rounded-full bg-red-400 text-red-900 border-2 border-red-600 flex items-center justify-center font-black text-xl shadow-md">×</span>
                  <span className="font-bold text-gray-700">レシーブ失敗</span>
                </div>
              </div>
            </div>

            {/* その他の記号 */}
            <div className="md:col-span-2">
              <h4 className="text-lg font-black text-indigo-600 mb-4">その他</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4">
                  <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full font-black border-2 border-amber-300">S</span>
                  <span className="font-bold text-gray-700">サーブ権あり（自チームのサーブ）</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-black border-2 border-blue-300">R</span>
                  <span className="font-bold text-gray-700">レシーブ側（相手チームのサーブ）</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded border">数字</span>
                  <span className="font-bold text-gray-700">記号上の小さい数字はラウンド番号</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchDetail;
