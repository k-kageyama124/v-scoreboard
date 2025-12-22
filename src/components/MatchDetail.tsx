import React, { useState } from 'react';
import { Match, MatchSet, Player, SubstitutionRecord, ServeQuality, ServeRecord, ReceiveQuality, ReceiveRecord } from '../types';
import { ArrowLeft, X, Trash2, Undo, Camera } from 'lucide-react';
import html2canvas from 'html2canvas';

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

    // 交代前の選手をベンチに移動（削除しない）
    const newPlayers = currentSet.players.map(p => 
      p.name === inPlayerName ? { ...p, position: 'bench' as const } : p
    );

    // 交代で入る選手を追加
    const benchPlayer = currentSet.players.find(p => p.name === benchPlayerName);
    if (benchPlayer) {
      // 既にベンチにいる選手の場合、新しいIDで追加（成績を分離）
      const newInPlayer: Player = {
        id: Date.now().toString(),
        name: benchPlayerName,
        position: 'starting' as const
      };
      newPlayers.push(newInPlayer);
    } else {
      // 新規選手の場合
      const newInPlayer: Player = {
        id: Date.now().toString(),
        name: benchPlayerName,
        position: 'starting' as const
      };
      newPlayers.push(newInPlayer);
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
    const currentRound = Math.ceil((currentSet.serves || []).filter(s => s.playerId === playerId).length / 6) + 1;
    
    const newServeRecord: ServeRecord = {
      id: Date.now().toString(),
      playerId,
      quality,
      round: currentRound
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
      round: 1
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

  // 画像保存機能
  const captureImage = async () => {
    const element = document.getElementById('match-detail-capture');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `${match.tournamentName}_vs_${match.opponent}_${match.date}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('画像の保存に失敗しました:', error);
      alert('画像の保存に失敗しました');
    }
  };

  // サーブ記号を表示
  const getServeSymbol = (quality: ServeQuality, round: number) => {
    let symbol = '';
    switch (quality) {
      case 'ace':
        return { symbol: '★', color: 'bg-red-500 text-white border-red-700' }; // 赤星
      case 'good':
        return { symbol: '◎', color: 'bg-yellow-400 text-yellow-900 border-yellow-600' };
      case 'normal':
        return { symbol: '○', color: 'bg-green-400 text-green-900 border-green-600' };
      case 'follow':
        return { symbol: '△', color: 'bg-blue-400 text-blue-900 border-blue-600' };
      case 'caught':
        return { symbol: '★', color: 'bg-gray-800 text-white border-black' }; // 黒星
      case 'miss':
        return { symbol: '―', color: 'bg-gray-400 text-gray-900 border-gray-600' }; // 横棒
      default:
        return { symbol: '×', color: 'bg-red-400 text-red-900 border-red-600' };
    }
  };

  // レ点を表示
  const getCheckMarks = (round: number) => {
    return '✓'.repeat(Math.min(round, 3)); // 最大3つまで
  };

  const startingPlayers = currentSet.players.filter(p => p.position === 'starting');
  const benchPlayers = currentSet.players.filter(p => p.position === 'bench');
  const needsMorePlayers = startingPlayers.length < 6;

  // 全選手（交代前も含む）のリストを取得
  const allPlayers = currentSet.players;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* ヘッダー */}
        <div className="flex items-center gap-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 font-bold text-gray-700 border-2 border-gray-100 hover:border-indigo-200 active:scale-95 no-print"
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

          {/* 画像保存ボタン */}
          <button
            onClick={captureImage}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-2xl shadow-lg hover:bg-green-600 active:scale-95 transition-all font-bold no-print"
          >
            <Camera size={20} />
            画像保存
          </button>

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

        {/* キャプチャ対象エリア */}
        <div id="match-detail-capture">
          {/* セット切り替え */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
            <div className="flex gap-4">
              {match.sets.map((set, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSetIndex(index)}
                  className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 no-print ${
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
                サーブ権: {currentSet.serveTurn === 'our' ? '自チーム' : '相手'}
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

          {/* 選手追加 */}
          {needsMorePlayers && (
            <div className="bg-amber-50 border-4 border-amber-200 rounded-2xl p-6 shadow-xl no-print">
              <p className="text-amber-800 font-bold text-lg mb-4">⚠️ スターティングメンバーが6人未満です。選手を追加してください。</p>
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
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

          {/* 成績テーブル - 全選手表示（交代前も含む） */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
            <h3 className="text-2xl font-black text-gray-800 mb-6">選手成績</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-indigo-600 text-white">
                  <tr>
                    <th className="p-4 text-left font-bold">選手名</th>
                    <th className="p-4 text-center font-bold">サーブ</th>
                    <th className="p-4 text-center font-bold">レシーブ</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-100">
                  {allPlayers.map((player, index) => {
                    const serves = (currentSet.serves || []).filter(s => s.playerId === player.id);
                    const receives = (currentSet.receives || []).filter(r => r.playerId === player.id);
                    const isStarting = player.position === 'starting';
                    
                    return (
                      <tr key={player.id} className={`${isStarting ? 'bg-white' : 'bg-gray-50'}`}>
                        {/* 選手名 */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black ${isStarting ? 'bg-indigo-500' : 'bg-gray-400'}`}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-bold text-gray-800">{player.name}</div>
                              {!isStarting && <div className="text-xs text-gray-500">(交代済)</div>}
                            </div>
                          </div>
                        </td>

                        {/* サーブ */}
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2 mb-2 justify-center min-h-[48px]">
                            {serves.map((serve) => {
                              const { symbol, color } = getServeSymbol(serve.quality, serve.round);
                              return (
                                <div key={serve.id} className="relative">
                                  <span className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shadow-md border-2 ${color}`}>
                                    {symbol}
                                  </span>
                                  <span className="absolute -top-3 left-0 right-0 text-center text-xs font-mono text-gray-600">
                                    {getCheckMarks(serve.round)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          {isStarting && (
                            <div className="flex gap-1 justify-center no-print">
                              <button onClick={() => addServe(player.id, 'ace')} className="px-2 py-1 bg-red-500 text-white rounded text-xs font-bold hover:bg-red-600">赤★</button>
                              <button onClick={() => addServe(player.id, 'good')} className="px-2 py-1 bg-yellow-400 text-yellow-900 rounded text-xs font-bold hover:bg-yellow-500">◎</button>
                              <button onClick={() => addServe(player.id, 'normal')} className="px-2 py-1 bg-green-400 text-green-900 rounded text-xs font-bold hover:bg-green-500">○</button>
                              <button onClick={() => addServe(player.id, 'follow')} className="px-2 py-1 bg-blue-400 text-blue-900 rounded text-xs font-bold hover:bg-blue-500">△</button>
                              <button onClick={() => addServe(player.id, 'caught')} className="px-2 py-1 bg-gray-800 text-white rounded text-xs font-bold hover:bg-gray-900">黒★</button>
                              <button onClick={() => addServe(player.id, 'miss')} className="px-2 py-1 bg-gray-400 text-gray-900 rounded text-xs font-bold hover:bg-gray-500">―</button>
                              <button onClick={() => undoLastServe(player.id)} className="px-2 py-1 bg-gray-300 rounded text-xs hover:bg-gray-400">
                                <Undo size={14} />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* レシーブ */}
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2 mb-2 justify-center min-h-[48px]">
                            {receives.map((receive) => (
                              <span
                                key={receive.id}
                                className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shadow-md border-2 ${
                                  receive.quality === 'perfect' ? 'bg-yellow-400 text-yellow-900 border-yellow-600' :
                                  receive.quality === 'good' ? 'bg-green-400 text-green-900 border-green-600' :
                                  receive.quality === 'follow' ? 'bg-blue-400 text-blue-900 border-blue-600' :
                                  'bg-red-400 text-red-900 border-red-600'
                                }`}
                              >
                                {receive.quality === 'perfect' ? '◎' : receive.quality === 'good' ? '○' : receive.quality === 'follow' ? '△' : '×'}
                              </span>
                            ))}
                          </div>
                          {isStarting && (
                            <div className="flex gap-1 justify-center no-print">
                              <button onClick={() => addReceive(player.id, 'perfect')} className="px-2 py-1 bg-yellow-400 text-yellow-900 rounded text-xs font-bold hover:bg-yellow-500">◎</button>
                              <button onClick={() => addReceive(player.id, 'good')} className="px-2 py-1 bg-green-400 text-green-900 rounded text-xs font-bold hover:bg-green-500">○</button>
                              <button onClick={() => addReceive(player.id, 'follow')} className="px-2 py-1 bg-blue-400 text-blue-900 rounded text-xs font-bold hover:bg-blue-500">△</button>
                              <button onClick={() => addReceive(player.id, 'miss')} className="px-2 py-1 bg-red-400 text-red-900 rounded text-xs font-bold hover:bg-red-500">×</button>
                              <button onClick={() => undoLastReceive(player.id)} className="px-2 py-1 bg-gray-300 rounded text-xs hover:bg-gray-400">
                                <Undo size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 選手交代 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-100 no-print">
          <h3 className="text-2xl font-black text-gray-800 mb-6">選手交代</h3>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
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
                placeholder="選手名を入力"
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
            <div>
              <h4 className="text-lg font-black text-green-600 mb-4">サーブ側</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-red-500 text-white border-2 border-red-700 flex items-center justify-center font-black shadow-md">★</span>
                  <span className="font-bold">赤星 = ノータッチエースor相手が弾いた</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-yellow-400 text-yellow-900 border-2 border-yellow-600 flex items-center justify-center font-black shadow-md">◎</span>
                  <span className="font-bold">◎ = セッターピンポイント</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-green-400 text-green-900 border-2 border-green-600 flex items-center justify-center font-black shadow-md">○</span>
                  <span className="font-bold">○ = セッターが動く</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-blue-400 text-blue-900 border-2 border-blue-600 flex items-center justify-center font-black shadow-md">△</span>
                  <span className="font-bold">△ = セッター以外</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-gray-800 text-white border-2 border-black flex items-center justify-center font-black shadow-md">★</span>
                  <span className="font-bold">黒星 = 取られたけど繋がらなかった</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-gray-400 text-gray-900 border-2 border-gray-600 flex items-center justify-center font-black text-xl shadow-md">―</span>
                  <span className="font-bold">― = サーブミス</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-mono">✓✓</span>
                  <span className="font-bold">レ点の数 = サーブの巡目</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-black text-blue-600 mb-4">レシーブ側</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-yellow-400 text-yellow-900 border-2 border-yellow-600 flex items-center justify-center font-black shadow-md">◎</span>
                  <span className="font-bold">◎ = セッターに返した</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-green-400 text-green-900 border-2 border-green-600 flex items-center justify-center font-black shadow-md">○</span>
                  <span className="font-bold">○ = レシーブできた</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-blue-400 text-blue-900 border-2 border-blue-600 flex items-center justify-center font-black shadow-md">△</span>
                  <span className="font-bold">△ = 味方のフォローが必要だった</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-red-400 text-red-900 border-2 border-red-600 flex items-center justify-center font-black shadow-md">×</span>
                  <span className="font-bold">× = レシーブ失敗</span>
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
