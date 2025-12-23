import React, { useState, useEffect } from 'react';
import { Match, Player, ServeQuality, ReceiveQuality } from '../types';
import { ArrowLeft, Save, UserPlus, Users, Edit2 } from 'lucide-react';
import html2canvas from 'html2canvas';

interface MatchDetailProps {
  match: Match;
  onBack: () => void;
  onUpdate: (match: Match) => void;
}

type ServeDetailsType = {
  'serve-miss': number;
  'setter-move': number;
  'setter-pinpoint': number;
  'other-than-setter': number;
  'red-star': number;
  'black-star': number;
  'dash': number;
};

type ReceiveDetailsType = {
  'setter-return': number;
  'no-return': number;
  'setter-pinpoint': number;
  'other-than-setter': number;
};

export default function MatchDetail({ match, onBack, onUpdate }: MatchDetailProps) {
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // 選手が存在しない場合、自動的に6人分作成
  useEffect(() => {
    if (isInitialized) return;

    const currentSet = match.sets[currentSetIndex];
    if (!currentSet.players || currentSet.players.length === 0) {
      console.log('⚠️ 選手が存在しないため、6人分の選手を自動作成します');
      
      const updatedMatch = { ...match };
      const initialPlayers = Array.from({ length: 6 }, (_, index) => ({
        id: `player-${Date.now()}-${index}`,
        name: '',
        number: index + 1
      }));

      updatedMatch.sets = updatedMatch.sets.map(set => ({
        ...set,
        players: set.players && set.players.length > 0 ? set.players : initialPlayers
      }));

      onUpdate(updatedMatch);
    }
    
    setIsInitialized(true);
  }, [match.id]);

  const currentSet = match.sets[currentSetIndex];

  // 選手交代用のstate (IDで管理)
  const [benchPlayerId, setBenchPlayerId] = useState('');
  const [inPlayerName, setInPlayerName] = useState('');
  
  // 選手名編集用のstate
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState('');

  const handleSetChange = (index: number) => {
    setCurrentSetIndex(index);
    
    const updatedMatch = { ...match };
    while (updatedMatch.sets.length <= index) {
      const previousPlayers = currentSet.players && currentSet.players.length > 0 
        ? currentSet.players 
        : Array.from({ length: 6 }, (_, i) => ({
            id: `player-${Date.now()}-${i}`,
            name: '',
            number: i + 1
          }));

      updatedMatch.sets.push({
        ourScore: 0,
        opponentScore: 0,
        players: previousPlayers,
        serves: [],
        receives: [],
        substitutions: []
      });
    }
    onUpdate(updatedMatch);
  };

  const updateScore = (field: 'ourScore' | 'opponentScore', value: number) => {
    const updatedMatch = { ...match };
    updatedMatch.sets[currentSetIndex][field] = Math.max(0, value);
    onUpdate(updatedMatch);
  };

  const updateResult = (result: 'win' | 'lose') => {
    const updatedMatch = { ...match };
    updatedMatch.result = result;
    onUpdate(updatedMatch);
    console.log('✅ 勝敗更新:', result === 'win' ? 'WIN' : 'LOSE');
  };

  const addRecord = (playerId: string, type: 'serve' | 'receive', quality: ServeQuality | ReceiveQuality) => {
    console.log('🔵 addRecord called:', { playerId, type, quality });
    
    const updatedMatch = { ...match };
    const currentSetData = updatedMatch.sets[currentSetIndex];

    // 配列が存在しない場合は初期化
    if (!currentSetData.serves) {
      currentSetData.serves = [];
    }
    if (!currentSetData.receives) {
      currentSetData.receives = [];
    }
    if (!currentSetData.substitutions) {
      currentSetData.substitutions = [];
    }

    if (type === 'serve') {
      currentSetData.serves.push({
        playerId,
        quality: quality as ServeQuality,
        timestamp: Date.now()
      });
      console.log('✅ Serve added:', currentSetData.serves.length);
    } else {
      currentSetData.receives.push({
        playerId,
        quality: quality as ReceiveQuality,
        timestamp: Date.now()
      });
      console.log('✅ Receive added:', currentSetData.receives.length);
    }

    console.log('🔄 Calling onUpdate...');
    onUpdate(updatedMatch);
  };

  const handleSubstitution = () => {
    if (!benchPlayerId || !inPlayerName.trim()) {
      alert('交代する選手と入る選手を入力してください');
      return;
    }

    const updatedMatch = { ...match };
    const currentSetData = updatedMatch.sets[currentSetIndex];

    // 配列が存在しない場合は初期化
    if (!currentSetData.substitutions) {
      currentSetData.substitutions = [];
    }

    // IDで選手を検索
    const benchPlayer = currentSetData.players.find(
      (p) => p.id === benchPlayerId
    );

    if (benchPlayer) {
      const outPlayerName = benchPlayer.name || '(未入力)';
      
      // 新しい選手を追加（既存の選手は残す）
      const newPlayer: Player = {
        id: `player-${Date.now()}`,
        name: inPlayerName.trim(),
        number: currentSetData.players.length + 1
      };
      
      currentSetData.players.push(newPlayer);
      
      // 交代記録を追加
      currentSetData.substitutions.push({
        outPlayer: outPlayerName,
        inPlayer: inPlayerName.trim(),
        timestamp: Date.now()
      });

      onUpdate(updatedMatch);
      setBenchPlayerId('');
      setInPlayerName('');
      
      console.log('✅ 選手交代成功:', outPlayerName, 'OUT →', inPlayerName.trim(), 'IN（選手追加）');
    } else {
      alert('交代する選手が見つかりません');
      console.error('❌ 選手が見つかりません。ID:', benchPlayerId);
    }
  };

  const startEditingPlayer = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditingPlayerName(player.name);
  };

  const savePlayerName = (playerId: string) => {
    const trimmedName = editingPlayerName.trim();
    
    if (trimmedName === '') {
      alert('選手名を入力してください');
      return;
    }

    const updatedMatch = { ...match };
    
    updatedMatch.sets.forEach(set => {
      const playerIndex = set.players.findIndex(p => p.id === playerId);
      if (playerIndex !== -1) {
        set.players[playerIndex].name = trimmedName;
      }
    });

    onUpdate(updatedMatch);
    setEditingPlayerId(null);
    setEditingPlayerName('');
  };

  const cancelEditingPlayer = () => {
    setEditingPlayerId(null);
    setEditingPlayerName('');
  };

  const getAggregatedPlayerData = () => {
    const playerMap = new Map<string, {
      id: string;
      name: string;
      rotation: number;
      totalServes: number;
      totalReceives: number;
      serveDetails: ServeDetailsType;
      receiveDetails: ReceiveDetailsType;
    }>();

    match.sets.forEach((set) => {
      if (!set.players) return;
      
      set.players.forEach((player) => {
        if (!playerMap.has(player.id)) {
          playerMap.set(player.id, {
            id: player.id,
            name: player.name,
            rotation: 1,
            totalServes: 0,
            totalReceives: 0,
            serveDetails: {
              'serve-miss': 0,
              'setter-move': 0,
              'setter-pinpoint': 0,
              'other-than-setter': 0,
              'red-star': 0,
              'black-star': 0,
              'dash': 0
            },
            receiveDetails: {
              'setter-return': 0,
              'no-return': 0,
              'setter-pinpoint': 0,
              'other-than-setter': 0
            }
          });
        }
      });

      if (set.serves) {
        set.serves.forEach((serve) => {
          const playerData = playerMap.get(serve.playerId);
          if (playerData) {
            playerData.totalServes++;
            playerData.serveDetails[serve.quality]++;
          }
        });
      }

      if (set.receives) {
        set.receives.forEach((receive) => {
          const playerData = playerMap.get(receive.playerId);
          if (playerData) {
            playerData.totalReceives++;
            playerData.receiveDetails[receive.quality]++;
          }
        });
      }
    });

    return Array.from(playerMap.values());
  };

  const saveAsImage = async () => {
    const element = document.getElementById('match-detail-capture');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `試合記録_${match.date}_${match.opponent}.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error('画像保存エラー:', error);
      alert('画像の保存に失敗しました');
    }
  };

  const aggregatedData = getAggregatedPlayerData();

  const serveButtons: Array<{ quality: ServeQuality; symbol: string; color: string }> = [
    { quality: 'serve-miss', symbol: '×', color: 'bg-gray-600' },
    { quality: 'setter-move', symbol: '○', color: 'bg-gray-600' },
    { quality: 'setter-pinpoint', symbol: '◎', color: 'bg-gray-600' },
    { quality: 'other-than-setter', symbol: '△', color: 'bg-gray-600' },
    { quality: 'red-star', symbol: '★', color: 'bg-red-600' },
    { quality: 'black-star', symbol: '★', color: 'bg-gray-600' },
    { quality: 'dash', symbol: '━', color: 'bg-gray-600' }
  ];

  const receiveButtons: Array<{ quality: ReceiveQuality; symbol: string; color: string }> = [
    { quality: 'setter-return', symbol: '×', color: 'bg-gray-600' },
    { quality: 'no-return', symbol: '○', color: 'bg-gray-600' },
    { quality: 'setter-pinpoint', symbol: '◎', color: 'bg-gray-600' },
    { quality: 'other-than-setter', symbol: '△', color: 'bg-gray-600' }
  ];

  const getPlayerServeRecords = (playerId: string) => {
    if (!currentSet.serves) return [];
    return currentSet.serves
      .filter(s => s.playerId === playerId)
      .map(s => serveButtons.find(btn => btn.quality === s.quality)?.symbol || '?');
  };

  const getPlayerReceiveRecords = (playerId: string) => {
    if (!currentSet.receives) return [];
    return currentSet.receives
      .filter(r => r.playerId === playerId)
      .map(r => receiveButtons.find(btn => btn.quality === r.quality)?.symbol || '?');
  };

  if (!currentSet || !currentSet.players || currentSet.players.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">データ読み込み中...</h2>
          <p className="text-gray-600">選手データを準備しています。しばらくお待ちください。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <ArrowLeft size={20} />
            <span>試合一覧に戻る</span>
          </button>
          <button
            onClick={saveAsImage}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-shadow"
          >
            <Save size={20} />
            <span>画像として保存</span>
          </button>
        </div>

        <div id="match-detail-capture" className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          <div className="border-4 border-purple-600 rounded-xl p-6 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="space-y-4">
              <div className="text-center space-y-2 pb-4 border-b-2 border-purple-300">
                <h2 className="text-3xl font-bold text-purple-800">{match.tournamentName}</h2>
                <p className="text-xl text-gray-700">vs {match.opponent}</p>
                <p className="text-sm text-gray-600">{match.date}</p>
              </div>

              <div className="flex justify-center items-center gap-8">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">自チーム</p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => updateScore('ourScore', currentSet.ourScore - 1)}
                      className="w-10 h-10 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold text-xl"
                    >
                      -1
                    </button>
                    <div className="w-24 h-16 bg-white border-4 border-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-4xl font-bold text-purple-700">{currentSet.ourScore}</span>
                    </div>
                    <button
                      onClick={() => updateScore('ourScore', currentSet.ourScore + 1)}
                      className="w-10 h-10 bg-green-500 text-white rounded-lg hover:bg-green-600 font-bold text-xl"
                    >
                      +1
                    </button>
                  </div>
                </div>

                <div className="text-4xl font-bold text-gray-400">-</div>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">相手</p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => updateScore('opponentScore', currentSet.opponentScore - 1)}
                      className="w-10 h-10 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold text-xl"
                    >
                      -1
                    </button>
                    <div className="w-24 h-16 bg-white border-4 border-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-4xl font-bold text-blue-700">{currentSet.opponentScore}</span>
                    </div>
                    <button
                      onClick={() => updateScore('opponentScore', currentSet.opponentScore + 1)}
                      className="w-10 h-10 bg-green-500 text-white rounded-lg hover:bg-green-600 font-bold text-xl"
                    >
                      +1
                    </button>
                  </div>
                </div>
              </div>

              {/* 勝敗選択 */}
              <div className="flex justify-center items-center gap-4 pt-4 border-t-2 border-purple-300">
                <span className="text-lg font-semibold text-gray-700">勝敗:</span>
                <button
                  onClick={() => updateResult('win')}
                  className={`px-8 py-3 rounded-lg font-bold text-lg transition-all ${
                    match.result === 'win'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  WIN
                </button>
                <button
                  onClick={() => updateResult('lose')}
                  className={`px-8 py-3 rounded-lg font-bold text-lg transition-all ${
                    match.result === 'lose'
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  LOSE
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-center">
            {[0, 1, 2, 3, 4].map((index) => (
              <button
                key={index}
                onClick={() => handleSetChange(index)}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${
                  currentSetIndex === index
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                第{index + 1}セット
              </button>
            ))}
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Users size={24} />
              選手記録
            </h3>

            {currentSet.players.map((player) => {
              const serveRecords = getPlayerServeRecords(player.id);
              const receiveRecords = getPlayerReceiveRecords(player.id);
              const isEditing = editingPlayerId === player.id;

              return (
                <div key={player.id} className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="mb-4 pb-3 border-b-2 border-gray-300">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingPlayerName}
                          onChange={(e) => setEditingPlayerName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              savePlayerName(player.id);
                            } else if (e.key === 'Escape') {
                              cancelEditingPlayer();
                            }
                          }}
                          className="flex-1 px-3 py-2 border-2 border-purple-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                          placeholder="選手名を入力"
                          autoFocus
                        />
                        <button
                          onClick={() => savePlayerName(player.id)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-bold"
                        >
                          保存
                        </button>
                        <button
                          onClick={cancelEditingPlayer}
                          className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-bold"
                        >
                          キャンセル
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <span className="text-xl font-bold text-gray-800">
                            選手: {player.name || '(未入力)'}
                          </span>
                        </div>
                        <button
                          onClick={() => startEditingPlayer(player)}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                        >
                          <Edit2 size={14} />
                          編集
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-[1fr_2fr] gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-700 w-8">S:</span>
                        <div className="flex-1 min-h-[2rem] p-2 bg-white rounded border border-gray-300">
                          {serveRecords.join(' ')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-700 w-8">R:</span>
                        <div className="flex-1 min-h-[2rem] p-2 bg-white rounded border border-gray-300">
                          {receiveRecords.join(' ')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-600 mb-2">サーブ:</p>
                    <div className="flex flex-wrap gap-2">
                      {serveButtons.map((btn) => (
                        <button
                          key={btn.quality}
                          onClick={() => addRecord(player.id, 'serve', btn.quality)}
                          className={`${btn.color} text-white px-4 py-2 rounded-lg hover:opacity-80 transition-opacity font-bold`}
                        >
                          {btn.symbol}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-2">レシーブ:</p>
                    <div className="flex flex-wrap gap-2">
                      {receiveButtons.map((btn) => (
                        <button
                          key={btn.quality}
                          onClick={() => addRecord(player.id, 'receive', btn.quality)}
                          className={`${btn.color} text-white px-4 py-2 rounded-lg hover:opacity-80 transition-opacity font-bold`}
                        >
                          {btn.symbol}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {currentSet.substitutions && currentSet.substitutions.length > 0 && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">交代履歴</h3>
              <div className="space-y-2">
                {currentSet.substitutions.map((sub, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-gray-700">
                    <span className="font-semibold">{sub.outPlayer}</span>
                    <span className="text-gray-500">→</span>
                    <span className="font-semibold text-green-600">{sub.inPlayer}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <UserPlus size={24} />
              選手交代
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  交代する選手
                </label>
                <select
                  value={benchPlayerId}
                  onChange={(e) => setBenchPlayerId(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">選手を選択してください</option>
                  {currentSet.players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name || '(未入力)'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  入る選手
                </label>
                <input
                  type="text"
                  value={inPlayerName}
                  onChange={(e) => setInPlayerName(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="選手名を入力"
                />
              </div>
            </div>
            <button
              onClick={handleSubstitution}
              className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow font-bold"
            >
              交代を記録
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-800">選手統計（全セット）</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                    <th className="border-2 border-purple-700 px-4 py-3 text-left">選手名</th>
                    <th className="border-2 border-purple-700 px-4 py-3 text-center">S合計</th>
                    <th className="border-2 border-purple-700 px-4 py-3 text-center">R合計</th>
                    <th className="border-2 border-purple-700 px-4 py-3 text-center">S×</th>
                    <th className="border-2 border-purple-700 px-4 py-3 text-center">S○</th>
                    <th className="border-2 border-purple-700 px-4 py-3 text-center">S◎</th>
                    <th className="border-2 border-purple-700 px-4 py-3 text-center">S△</th>
                    <th className="border-2 border-purple-700 px-4 py-3 text-center">S★(赤)</th>
                    <th className="border-2 border-purple-700 px-4 py-3 text-center">S★(黒)</th>
                    <th className="border-2 border-purple-700 px-4 py-3 text-center">S━</th>
                    <th className="border-2 border-purple-700 px-4 py-3 text-center">R×</th>
                    <th className="border-2 border-purple-700 px-4 py-3 text-center">R○</th>
                    <th className="border-2 border-purple-700 px-4 py-3 text-center">R◎</th>
                    <th className="border-2 border-purple-700 px-4 py-3 text-center">R△</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregatedData.map((player, idx) => (
                    <tr key={player.id} className={idx % 2 === 0 ? 'bg-purple-50' : 'bg-white'}>
                      <td className="border-2 border-gray-300 px-4 py-2 font-semibold">
                        {player.name || '(未入力)'}
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-2 text-center font-bold text-blue-600">
                        {player.totalServes}
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-2 text-center font-bold text-green-600">
                        {player.totalReceives}
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-2 text-center">{player.serveDetails['serve-miss']}</td>
                      <td className="border-2 border-gray-300 px-4 py-2 text-center">{player.serveDetails['setter-move']}</td>
                      <td className="border-2 border-gray-300 px-4 py-2 text-center">{player.serveDetails['setter-pinpoint']}</td>
                      <td className="border-2 border-gray-300 px-4 py-2 text-center">{player.serveDetails['other-than-setter']}</td>
                      <td className="border-2 border-gray-300 px-4 py-2 text-center">{player.serveDetails['red-star']}</td>
                      <td className="border-2 border-gray-300 px-4 py-2 text-center">{player.serveDetails['black-star']}</td>
                      <td className="border-2 border-gray-300 px-4 py-2 text-center">{player.serveDetails['dash']}</td>
                      <td className="border-2 border-gray-300 px-4 py-2 text-center">{player.receiveDetails['setter-return']}</td>
                      <td className="border-2 border-gray-300 px-4 py-2 text-center">{player.receiveDetails['no-return']}</td>
                      <td className="border-2 border-gray-300 px-4 py-2 text-center">{player.receiveDetails['setter-pinpoint']}</td>
                      <td className="border-2 border-gray-300 px-4 py-2 text-center">{player.receiveDetails['other-than-setter']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">記号の意味</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-gray-700 mb-2">サーブ:</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>× = ミス</li>
                  <li>○ = セッターが動いた</li>
                  <li>◎ = セッターにピンポイント</li>
                  <li>△ = セッター以外が返した</li>
                  <li>★(赤) = 赤い星</li>
                  <li>★(黒) = 黒い星</li>
                  <li>━ = ダッシュ</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-2">レシーブ:</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>× = セッターに返らなかった</li>
                  <li>○ = セッターに返った(動いた)</li>
                  <li>◎ = セッターにピンポイント</li>
                  <li>△ = セッター以外が返した</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
