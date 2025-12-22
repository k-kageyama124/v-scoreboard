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
      position,
      serveRound: 1, // 初期値は1巡目
      initialServeTurn: null // 初期サーブ権
    };
    
    const newPlayers = [...currentSet.players, newPlayer];
    updateSet({ players: newPlayers });
    
    if (position === 'bench') {
      setBenchPlayerName('');
    }
    setAddingPlayer(null);
  };

  const updatePlayerServeRound = (playerId: string, round: number) => {
    const newPlayers = currentSet.players.map(p => 
      p.id === playerId ? { ...p, serveRound: round } : p
    );
    updateSet({ players: newPlayers });
  };

  const updatePlayerInitialServeTurn = (playerId: string, serveTurn: 'S' | 'R' | null) => {
    const newPlayers = currentSet.players.map(p => 
      p.id === playerId ? { ...p, initialServeTurn: serveTurn } : p
    );
    updateSet({ players: newPlayers });
  };

  const handleSubstitution = () => {
    if (!benchPlayerName.trim() || !inPlayerName.trim()) return;

    const newPlayers = currentSet.players.map(p => 
      p.name === inPlayerName ? { ...p, position: 'bench' as const } : p
    );

    const benchPlayer = currentSet.players.find(p => p.name === benchPlayerName);
    if (benchPlayer) {
      const newInPlayer: Player = {
        id: Date.now().toString(),
        name: benchPlayerName,
        position: 'starting' as const,
        serveRound: 1,
        initialServeTurn: null
      };
      newPlayers.push(newInPlayer);
    } else {
      const newInPlayer: Player = {
        id: Date.now().toString(),
        name: benchPlayerName,
        position: 'starting' as const,
        serveRound: 1,
        initialServeTurn: null
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
    const newServeRecord: ServeRecord = {
      id: Date.now().toString(),
      playerId,
      quality,
      round: 1
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

  const getServeSymbol = (quality: ServeQuality) => {
    switch (quality) {
      case 'ace':
        return { symbol: '★', color: 'text-red-600' };
      case 'good':
        return { symbol: '◎', color: 'text-black' };
      case 'normal':
        return { symbol: '○', color: 'text-black' };
      case 'follow':
        return { symbol: '△', color: 'text-black' };
      case 'caught':
        return { symbol: '★', color: 'text-black' };
      case 'miss':
        return { symbol: '―', color: 'text-black' };
      default:
        return { symbol: '×', color: 'text-black' };
    }
  };

  const startingPlayers = currentSet.players.filter(p => p.position === 'starting');
  const benchPlayers = currentSet.players.filter(p => p.position === 'bench');
  const needsMorePlayers = startingPlayers.length < 6;
  const allPlayers = currentSet.players;

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div className="flex items-center gap-6 no-print">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-white rounded-lg border-2 border-gray-300 hover:bg-gray-50"
          >
            <ArrowLeft size={20} />
            戻る
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">{match.tournamentName}</h2>
              <span>vs</span>
              <h3 className="text-xl font-bold">{match.opponent}</h3>
              <span className="ml-auto">{match.date}</span>
            </div>
          </div>

          <button
            onClick={captureImage}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Camera size={20} />
            画像保存
          </button>

          <button
            onClick={toggleResult}
            className={`px-8 py-3 rounded-lg font-bold ${
              match.result === 'win' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {match.result === 'win' ? 'WIN' : 'LOSE'}
          </button>
        </div>

        <div id="match-detail-capture">
          <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-6">
            <div className="flex gap-4 mb-4">
              {match.sets.map((set, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSetIndex(index)}
                  className={`px-6 py-2 rounded border-2 font-bold ${
                    currentSetIndex === index
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  第{index + 1}セット
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="text-center border-2 border-gray-300 p-4 rounded">
                <div className="text-sm font-bold mb-2">自チーム</div>
                <div className="text-5xl font-bold mb-4">{currentSet.ourScore}</div>
                <div className="flex gap-2 justify-center no-print">
                  <button onClick={() => adjustScore('our', 1)} className="px-4 py-2 bg-blue-500 text-white rounded">+1</button>
                  <button onClick={() => adjustScore('our', -1)} className="px-4 py-2 bg-gray-400 text-white rounded">-1</button>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <button
                  onClick={toggleServeTurn}
                  className="px-6 py-3 bg-amber-500 text-white rounded font-bold no-print"
                >
                  切替
                </button>
              </div>

              <div className="text-center border-2 border-gray-300 p-4 rounded">
                <div className="text-sm font-bold mb-2">相手チーム</div>
                <div className="text-5xl font-bold mb-4">{currentSet.opponentScore}</div>
                <div className="flex gap-2 justify-center no-print">
                  <button onClick={() => adjustScore('opponent', 1)} className="px-4 py-2 bg-red-500 text-white rounded">+1</button>
                  <button onClick={() => adjustScore('opponent', -1)} className="px-4 py-2 bg-gray-400 text-white rounded">-1</button>
                </div>
              </div>
            </div>
          </div>

          {needsMorePlayers && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-6 no-print">
              <p className="font-bold mb-4">⚠️ スターティングメンバーが6人未満です</p>
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 6 - startingPlayers.length }).map((_, i) => (
                  <div key={i}>
                    {addingPlayer === `starting-${i}` ? (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          placeholder="選手名"
                          className="flex-1 px-2 py-1 border rounded"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                              addPlayer('starting', e.currentTarget.value.trim());
                            }
                          }}
                          autoFocus
                        />
                        <button onClick={() => setAddingPlayer(null)} className="px-2 bg-gray-300 rounded">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingPlayer(`starting-${i}`)}
                        className="w-full px-2 py-1 bg-indigo-500 text-white rounded text-sm"
                      >
                        + 追加
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="border-r-2 border-gray-300 p-3 text-left font-bold">選手名</th>
                  <th className="border-r-2 border-gray-300 p-3 text-center font-bold">巡目</th>
                  <th className="border-r-2 border-gray-300 p-3 text-center font-bold">S/R</th>
                  <th className="border-r-2 border-gray-300 p-3 text-center font-bold">サーブ</th>
                  <th className="p-3 text-center font-bold">レシーブ</th>
                </tr>
              </thead>
              <tbody>
                {allPlayers.map((player, index) => {
                  const serves = (currentSet.serves || []).filter(s => s.playerId === player.id);
                  const receives = (currentSet.receives || []).filter(r => r.playerId === player.id);
                  const isStarting = player.position === 'starting';
                  
                  return (
                    <tr key={player.id} className={`border-b border-gray-300 ${isStarting ? '' : 'bg-gray-50'}`}>
                      <td className="border-r-2 border-gray-300 p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{index + 1}.</span>
                          <span className="font-bold">{player.name}</span>
                          {!isStarting && <span className="text-xs text-gray-500">(交代済)</span>}
                        </div>
                      </td>

                      <td className="border-r-2 border-gray-300 p-3">
                        {isStarting ? (
                          <div className="flex gap-1 justify-center no-print">
                            <button
                              onClick={() => updatePlayerServeRound(player.id, 1)}
                              className={`px-3 py-1 border-2 rounded ${player.serveRound === 1 ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300'}`}
                            >
                              1
                            </button>
                            <button
                              onClick={() => updatePlayerServeRound(player.id, 2)}
                              className={`px-3 py-1 border-2 rounded ${player.serveRound === 2 ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300'}`}
                            >
                              2
                            </button>
                            <button
                              onClick={() => updatePlayerServeRound(player.id, 3)}
                              className={`px-3 py-1 border-2 rounded ${player.serveRound === 3 ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300'}`}
                            >
                              3
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">{player.serveRound || 1}</div>
                        )}
                      </td>

                      <td className="border-r-2 border-gray-300 p-3">
                        {isStarting ? (
                          <div className="flex gap-1 justify-center no-print">
                            <button
                              onClick={() => updatePlayerInitialServeTurn(player.id, 'S')}
                              className={`px-3 py-1 border-2 rounded font-bold ${player.initialServeTurn === 'S' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300'}`}
                            >
                              S
                            </button>
                            <button
                              onClick={() => updatePlayerInitialServeTurn(player.id, 'R')}
                              className={`px-3 py-1 border-2 rounded font-bold ${player.initialServeTurn === 'R' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300'}`}
                            >
                              R
                            </button>
                          </div>
                        ) : (
                          <div className="text-center font-bold">{player.initialServeTurn || ''}</div>
                        )}
                      </td>

                      <td className="border-r-2 border-gray-300 p-3">
                        <div className="flex flex-wrap gap-2 mb-2 justify-center min-h-[30px]">
                          {serves.map((serve) => {
                            const { symbol, color } = getServeSymbol(serve.quality);
                            return (
                              <span key={serve.id} className={`text-xl font-bold ${color}`}>
                                {symbol}
                              </span>
                            );
                          })}
                        </div>
                        {isStarting && (
                          <div className="flex gap-1 justify-center no-print">
                            <button onClick={() => addServe(player.id, 'ace')} className="px-2 py-1 border rounded text-xs">赤★</button>
                            <button onClick={() => addServe(player.id, 'good')} className="px-2 py-1 border rounded text-xs">◎</button>
                            <button onClick={() => addServe(player.id, 'normal')} className="px-2 py-1 border rounded text-xs">○</button>
                            <button onClick={() => addServe(player.id, 'follow')} className="px-2 py-1 border rounded text-xs">△</button>
                            <button onClick={() => addServe(player.id, 'caught')} className="px-2 py-1 border rounded text-xs">黒★</button>
                            <button onClick={() => addServe(player.id, 'miss')} className="px-2 py-1 border rounded text-xs">―</button>
                            <button onClick={() => undoLastServe(player.id)} className="px-2 py-1 bg-gray-200 rounded text-xs">
                              <Undo size={12} />
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-2 mb-2 justify-center min-h-[30px]">
                          {receives.map((receive) => (
                            <span key={receive.id} className="text-xl font-bold">
                              {receive.quality === 'perfect' ? '◎' : receive.quality === 'good' ? '○' : receive.quality === 'follow' ? '△' : '×'}
                            </span>
                          ))}
                        </div>
                        {isStarting && (
                          <div className="flex gap-1 justify-center no-print">
                            <button onClick={() => addReceive(player.id, 'perfect')} className="px-2 py-1 border rounded text-xs">◎</button>
                            <button onClick={() => addReceive(player.id, 'good')} className="px-2 py-1 border rounded text-xs">○</button>
                            <button onClick={() => addReceive(player.id, 'follow')} className="px-2 py-1 border rounded text-xs">△</button>
                            <button onClick={() => addReceive(player.id, 'miss')} className="px-2 py-1 border rounded text-xs">×</button>
                            <button onClick={() => undoLastReceive(player.id)} className="px-2 py-1 bg-gray-200 rounded text-xs">
                              <Undo size={12} />
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

        <div className="border-2 border-gray-300 rounded-lg p-6 no-print">
          <h3 className="text-xl font-bold mb-4">選手交代</h3>
          <div className="grid grid-cols-7 gap-4">
            <div className="col-span-3">
              <label className="block text-sm font-bold mb-2">OUT</label>
              <select
                value={inPlayerName}
                onChange={(e) => setInPlayerName(e.target.value)}
                className="w-full px-3 py-2 border-2 rounded"
              >
                <option value="">選択</option>
                {startingPlayers.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end justify-center">
              <div className="text-2xl font-bold">→</div>
            </div>
            <div className="col-span-3">
              <label className="block text-sm font-bold mb-2">IN</label>
              <input
                type="text"
                value={benchPlayerName}
                onChange={(e) => setBenchPlayerName(e.target.value)}
                placeholder="選手名"
                className="w-full px-3 py-2 border-2 rounded"
              />
            </div>
            <button
              onClick={handleSubstitution}
              disabled={!benchPlayerName.trim() || !inPlayerName.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded disabled:bg-gray-300"
            >
              交代
            </button>
          </div>
        </div>

        {currentSet.substitutions && currentSet.substitutions.length > 0 && (
          <div className="border-2 border-gray-300 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">交代履歴</h3>
            <div className="space-y-2">
              {currentSet.substitutions.map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{sub.outPlayerName}</span>
                    <span>→</span>
                    <span className="font-bold">{sub.inPlayerName}</span>
                    <span className="text-sm text-gray-600">({sub.score})</span>
                  </div>
                  <button
                    onClick={() => removeSubstitution(sub.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm no-print"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchDetail;
