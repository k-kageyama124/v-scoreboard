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
  const [isEditingSubstitution, setIsEditingSubstitution] = useState(false);
  const [inPlayerName, setInPlayerName] = useState('');
  
  // 選手名編集用のstate
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState('');

  // サーブ巡目管理用のstate (選手IDをキーに、巡目を保持)
  const [serveRotations, setServeRotations] = useState<Record<string, number>>({});

  // サーブ巡目を切り替える関数
  const toggleServeRotation = (playerId: string) => {
    setServeRotations(prev => {
      const current = prev[playerId] || 1;
      const next = current === 3 ? 1 : current + 1;
      return { ...prev, [playerId]: next };
    });
  };

  // 選手のサーブ巡目を取得（デフォルト: 1）
  const getServeRotation = (playerId: string) => {
    return serveRotations[playerId] || 1;
  };

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
    if (!match.sets[currentSetIndex].substitutions) {
      match.sets[currentSetIndex].substitutions = [];
    }

    if (type === 'serve') {
      currentSetData.serves.push({
        playerId,
        quality: quality as ServeQuality,
        timestamp: Date.now()
      });
      console.log('✅ Serve added:', match.sets[currentSetIndex].serves.length);
    } else {
      currentSetData.receives.push({
        playerId,
        quality: quality as ReceiveQuality,
        timestamp: Date.now()
      });
      console.log('✅ Receive added:', match.sets[currentSetIndex].receives.length);
    }

    console.log('🔄 Calling onUpdate...');
    onUpdate(updatedMatch);
  };

  const undoLastRecord = (playerId: string, type: 'serve' | 'receive') => {
    const updatedMatch = { ...match };
    const currentSetData = updatedMatch.sets[currentSetIndex];

    if (type === 'serve') {
      if (!currentSetData.serves) return;
      
      // 指定した選手のサーブ記録を取得
      const playerServeIndices = currentSetData.serves
        .map((s, idx) => s.playerId === playerId ? idx : -1)
        .filter(idx => idx !== -1);
      
      if (playerServeIndices.length > 0) {
        // 最後の記録を削除
        const lastIndex = playerServeIndices[playerServeIndices.length - 1];
        match.sets[currentSetIndex].serves.splice(lastIndex, 1);
        console.log('✅ Serve undone for player:', playerId);
        onUpdate(updatedMatch);
      } else {
        alert('削除するサーブ記録がありません');
      }
    } else {
      if (!currentSetData.receives) return;
      
      // 指定した選手のレシーブ記録を取得
      const playerReceiveIndices = currentSetData.receives
        .map((r, idx) => r.playerId === playerId ? idx : -1)
        .filter(idx => idx !== -1);
      
      if (playerReceiveIndices.length > 0) {
        // 最後の記録を削除
        const lastIndex = playerReceiveIndices[playerReceiveIndices.length - 1];
        match.sets[currentSetIndex].receives.splice(lastIndex, 1);
        console.log('✅ Receive undone for player:', playerId);
        onUpdate(updatedMatch);
      } else {
        alert('削除するレシーブ記録がありません');
      }
    }
  };

  const handleSubstitution = () => {
    if (!benchPlayerId && !inPlayerName.trim()) {
      alert('ベンチの選手を選択するか、新しい選手名を入力してください');
      return;
    }

    const currentSetData = match.sets[currentSetIndex];
    if (!currentSetData) return;

    // OUT は履歴用（players配列の並びは変更しない）
    const outPlayer: Player | null = benchPlayerId
      ? currentSetData.players.find((p: Player) => p.id === benchPlayerId) || null
      : null;

    // IN を決定（既存選手 or 新規）
    let inPlayer: Player | null = null;
    if (benchPlayerId) {
      inPlayer = currentSetData.players.find((p: Player) => p.id === benchPlayerId) || null;
    }

    if (!inPlayer && inPlayerName.trim()) {
      inPlayer = {
        id: `player-${Date.now()}`,
        name: inPlayerName.trim(),
        number: currentSetData.players.length + 1,
      };
    }

    if (!inPlayer) {
      alert('INする選手が見つかりません');
      return;
    }

    const updatedSets = [...match.sets];

    // players は追加のみ（既に存在するなら追加しない）
    const exists = currentSetData.players.some((p: Player) => p.id === inPlayer!.id);
    const updatedPlayers = exists ? currentSetData.players : [...currentSetData.players, inPlayer];

    const updatedSubstitutions = [
      ...(currentSetData.substitutions || []),
      {
        outPlayer: outPlayer || { id: '', name: '', number: 0 },
        inPlayer,
        timestamp: Date.now(),
        ourScore: currentSetData.ourScore,
        opponentScore: currentSetData.opponentScore,
      },
    ];

    updatedSets[currentSetIndex] = {
      ...currentSetData,
      players: updatedPlayers,
      substitutions: updatedSubstitutions,
    };

    onUpdate({ ...match, sets: updatedSets });

    setBenchPlayerId('');
    setInPlayerName('');
    setIsEditingSubstitution(false);
  };
    }

    if (!inPlayer) {
      alert('INする選手が見つかりません');
      return;
    }

    const updatedSets = [...match.sets];

    // players は「登場した選手の名簿」として追加のみ
    const exists = match.sets[currentSetIndex].players.some((p: Player) => p.id === inPlayer.id);
    const updatedPlayers = exists ? match.sets[currentSetIndex].players : [...match.sets[currentSetIndex].players, inPlayer];

    const updatedSubstitutions = [
      ...(match.sets[currentSetIndex].substitutions || []),
      {
        outPlayer: outPlayer || { id: '', name: '', number: 0 },
        inPlayer,
        timestamp: Date.now(),
        ourScore: match.sets[currentSetIndex].ourScore,
        opponentScore: match.sets[currentSetIndex].opponentScore,
      },
    ];

    updatedSets[currentSetIndex] = {
      ...match.sets[currentSetIndex],
      players: updatedPlayers,
      substitutions: updatedSubstitutions,
    };

    onUpdate({ ...match, sets: updatedSets });

    setBenchPlayerId('');
    setInPlayerName('');
    setIsEditingSubstitution(false);
  };

  const startEditingPlayer = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditingPlayerName(player.name);
  };

  const savePlayerName = () => {
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

  const cancelEditing = () => {
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
    try {
      // スコア表示、選手統計、交代履歴を含むコンテナを作成
      const scoreElement = document.getElementById('score-display');
      const statsElement = document.getElementById('player-stats');
      const substitutionElement = document.getElementById('substitution-history');
      
      if (!scoreElement || !statsElement) {
        alert('保存する要素が見つかりません');
        return;
      }

      // 一時的なコンテナを作成
      const tempContainer = document.createElement('div');
      tempContainer.style.padding = '20px';
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.width = '1200px';
      
      // 要素をクローンして追加
      tempContainer.appendChild(scoreElement.cloneNode(true));
      tempContainer.appendChild(document.createElement('div')).style.height = '20px'; // スペーサー
      tempContainer.appendChild(statsElement.cloneNode(true));
      
      if (substitutionElement) {
        tempContainer.appendChild(document.createElement('div')).style.height = '20px';
        tempContainer.appendChild(substitutionElement.cloneNode(true));
      }
      
      // 一時的にドキュメントに追加
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      document.body.appendChild(tempContainer);

      const canvas = await html2canvas(tempContainer, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      });

      // 一時コンテナを削除
      document.body.removeChild(tempContainer);

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
    { quality: 'red-star', symbol: '★', color: 'bg-red-600' },
    { quality: 'black-star', symbol: '★', color: 'bg-gray-700' }
  ];

  const receiveButtons: Array<{ quality: ReceiveQuality; symbol: string; color: string }> = [
    { quality: 'setter-pinpoint', symbol: '◎', color: 'bg-gray-600' },
    { quality: 'no-return', symbol: '○', color: 'bg-gray-600' },
    { quality: 'other-than-setter', symbol: '△', color: 'bg-gray-600' },
    { quality: 'setter-return', symbol: '×', color: 'bg-gray-600' },
  ];

  const getPlayerServeRecords = (playerId: string) => {
    if (!currentSet.serves) return [];
    return currentSet.serves
      .filter(s => s.playerId === playerId);
  };

  const getPlayerReceiveRecords = (playerId: string) => {
    if (!currentSet.receives) return [];
    return currentSet.receives
      .filter(r => r.playerId === playerId);
  };

  if (!currentSet || !currentSet.players || currentSet.players.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">データ読み込み中...</h2>
          <p className="text-base text-gray-600">選手データを準備しています。しばらくお待ちください。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-3 md:p-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダーボタン */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 md:mb-6">
          <button
            onClick={onBack}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-base font-semibold"
          >
            <ArrowLeft size={20} />
            <span>試合一覧に戻る</span>
          </button>
          <button
            onClick={saveAsImage}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-shadow text-base font-semibold"
          >
            <Save size={20} />
            <span>画像として保存</span>
          </button>
        </div>

        <div id="match-detail-capture" className="bg-white rounded-2xl shadow-xl p-4 md:p-8 space-y-6 md:space-y-8">
          {/* スコア表示エリア */}
          <div id="score-display" className="border-4 border-purple-600 rounded-xl p-4 md:p-6 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="space-y-4">
              <div className="text-center space-y-2 pb-4 border-b-2 border-purple-300">
                <h2 className="text-2xl md:text-3xl font-bold text-purple-800">{match.tournamentName}</h2>
                <p className="text-lg md:text-xl text-gray-700">vs {match.opponent}</p>
                <p className="text-sm text-gray-600">{match.date}</p>
              </div>

              {/* スコア入力（モバイル最適化） */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8">
                <div className="text-center w-full sm:w-auto">
                  <p className="text-sm md:text-base text-gray-600 mb-2">自チーム</p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => updateScore('ourScore', currentSet.ourScore - 1)}
                      className="w-14 h-14 md:w-12 md:h-12 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold text-xl active:scale-95 transition-transform"
                    >
                      -1
                    </button>
                    <div className="w-28 h-20 md:w-24 md:h-16 bg-white border-4 border-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-5xl md:text-4xl font-bold text-purple-700">{currentSet.ourScore}</span>
                    </div>
                    <button
                      onClick={() => updateScore('ourScore', currentSet.ourScore + 1)}
                      className="w-14 h-14 md:w-12 md:h-12 bg-green-500 text-white rounded-lg hover:bg-green-600 font-bold text-xl active:scale-95 transition-transform"
                    >
                      +1
                    </button>
                  </div>
                </div>

                <div className="text-3xl md:text-4xl font-bold text-gray-400">-</div>

                <div className="text-center w-full sm:w-auto">
                  <p className="text-sm md:text-base text-gray-600 mb-2">相手</p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => updateScore('opponentScore', currentSet.opponentScore - 1)}
                      className="w-14 h-14 md:w-12 md:h-12 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold text-xl active:scale-95 transition-transform"
                    >
                      -1
                    </button>
                    <div className="w-28 h-20 md:w-24 md:h-16 bg-white border-4 border-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-5xl md:text-4xl font-bold text-blue-700">{currentSet.opponentScore}</span>
                    </div>
                    <button
                      onClick={() => updateScore('opponentScore', currentSet.opponentScore + 1)}
                      className="w-14 h-14 md:w-12 md:h-12 bg-green-500 text-white rounded-lg hover:bg-green-600 font-bold text-xl active:scale-95 transition-transform"
                    >
                      +1
                    </button>
                  </div>
                </div>
              </div>

              {/* 勝敗選択（モバイル最適化） */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-4 border-t-2 border-purple-300">
                <span className="text-base md:text-lg font-semibold text-gray-700">勝敗:</span>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => updateResult('win')}
                    className={`flex-1 sm:flex-none px-10 py-4 rounded-lg font-bold text-lg transition-all active:scale-95 ${
                      match.result === 'win'
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    WIN
                  </button>
                  <button
                    onClick={() => updateResult('lose')}
                    className={`flex-1 sm:flex-none px-10 py-4 rounded-lg font-bold text-lg transition-all active:scale-95 ${
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
          </div>

          {/* セット切替ボタン（モバイル最適化） */}
          <div className="flex flex-wrap gap-2 justify-center">
            {[0, 1, 2, 3, 4].map((index) => (
              <button
                key={index}
                onClick={() => handleSetChange(index)}
                className={`px-5 py-3 md:px-6 md:py-3 rounded-lg font-bold transition-all active:scale-95 text-base ${
                  currentSetIndex === index
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                第{index + 1}セット
              </button>
            ))}
          </div>

{/* 選手記録（スマホ：表UIのみ / PC：従来カード） */}
<div className="space-y-4 md:space-y-6">
  <h3 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
    <Users size={24} />
    選手記録
  </h3>

  {/* スマホ（md未満）：6人固定の入力パネル（表UI） */}
  <div className="md:hidden">
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full border-collapse min-w-[640px]">
        <thead>
          <tr className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <th className="border-2 border-purple-700 px-2 py-2 text-left text-sm sticky left-0 bg-purple-600">選手</th>
            <th className="border-2 border-purple-700 px-2 py-2 text-center text-sm">S</th>
            <th className="border-2 border-purple-700 px-2 py-2 text-center text-sm">R</th>
            <th className="border-2 border-purple-700 px-2 py-2 text-center text-sm">Undo</th>
            <th className="border-2 border-purple-700 px-2 py-2 text-left text-sm">履歴</th>
          </tr>
        </thead>
        <tbody>
          {currentSet.players.map((player, idx) => {
            const serveRecords = getPlayerServeRecords(player.id);
            const receiveRecords = getPlayerReceiveRecords(player.id);
            const isEditing = editingPlayerId === player.id;

            const renderServeSymbol = (q: any) => {
              const b = serveButtons.find(x => x.quality === q);
              if (!b) return '?';
              if (b.quality === 'red-star') return <span className="text-red-600 font-bold">★</span>;
              if (b.quality === 'black-star') return <span className="text-gray-800 font-bold">★</span>;
              return b.symbol;
            };
            const renderReceiveSymbol = (q: any) => {
              const b = receiveButtons.find(x => x.quality === q);
              if (!b) return '?';
              return b.symbol;
            };

            return (
              <tr key={player.id} className={idx % 2 === 0 ? 'bg-purple-50' : 'bg-white'}>
                {/* 選手名（固定列） */}
                <td className="border-2 border-gray-300 px-2 py-2 align-top sticky left-0 bg-inherit">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editingPlayerName}
                        onChange={(e) => setEditingPlayerName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') savePlayerName(player.id);
                          if (e.key === 'Escape') cancelEditingPlayer();
                        }}
                        className="w-full px-2 py-2 border-2 border-purple-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm"
                        placeholder="選手名"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => savePlayerName(player.id)}
                          className="flex-1 px-2 py-2 bg-green-500 text-white rounded-lg font-bold text-sm active:scale-95"
                        >
                          保存
                        </button>
                        <button
                          onClick={cancelEditingPlayer}
                          className="flex-1 px-2 py-2 bg-gray-400 text-white rounded-lg font-bold text-sm active:scale-95"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-gray-800 truncate">{player.name || '(未入力)'}</div>
                      </div>
                      <button
                        onClick={() => startEditingPlayer(player)}
                        className="shrink-0 px-2 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold active:scale-95"
                      >
                        編集
                      </button>
                    </div>
                  )}
                </td>

                {/* サーブ（2ボタンのみ） */}
                <td className="border-2 border-gray-300 px-2 py-2 align-top">
                  <div className="flex gap-2">
                    {serveButtons.map((btn) => (
                      <button
                        key={btn.quality}
                        onClick={() => addRecord(player.id, 'serve', btn.quality)}
                        className={`${btn.color} text-white w-12 h-12 rounded-lg font-bold text-lg active:scale-95`}
                        title={btn.quality}
                      >
                        {btn.symbol}
                      </button>
                    ))}
                  </div>
                </td>

                {/* レシーブ（4ボタン） */}
                <td className="border-2 border-gray-300 px-2 py-2 align-top">
                  <div className="grid grid-cols-2 gap-2">
                    {receiveButtons.map((btn) => (
                      <button
                        key={btn.quality}
                        onClick={() => addRecord(player.id, 'receive', btn.quality)}
                        className={`${btn.color} text-white w-12 h-12 rounded-lg font-bold text-lg active:scale-95`}
                        title={btn.quality}
                      >
                        {btn.symbol}
                      </button>
                    ))}
                  </div>
                </td>

                {/* Undo */}
                <td className="border-2 border-gray-300 px-2 py-2 align-top">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => undoLastRecord(player.id, 'serve')}
                      className="px-2 py-2 bg-orange-500 text-white rounded-lg font-bold text-xs active:scale-95"
                    >
                      S戻す
                    </button>
                    <button
                      onClick={() => undoLastRecord(player.id, 'receive')}
                      className="px-2 py-2 bg-orange-500 text-white rounded-lg font-bold text-xs active:scale-95"
                    >
                      R戻す
                    </button>
                  </div>
                </td>

                {/* 履歴（直近だけ表示） */}
                <td className="border-2 border-gray-300 px-2 py-2 align-top">
                  <div className="text-xs text-gray-700 space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="font-bold">S:</span>
                      <span className="break-words">{serveRecords.slice(-10).map((r, i) => (
                        <span key={i} className="mr-1">{renderServeSymbol(r.quality)}</span>
                      ))}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">R:</span>
                      <span className="break-words">{receiveRecords.slice(-10).map((r, i) => (
                        <span key={i} className="mr-1">{renderReceiveSymbol(r.quality)}</span>
                      ))}</span>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    <div className="mt-3 text-xs text-gray-600">
      スマホは表入力のみ（先頭6=コート、7人目以降=ベンチ / サーブは × / ★(赤) / ★(黒)）
    </div>
  </div>

  {/* PC（md以上）：従来のカードUI */}
  <div className="hidden md:block">
    {currentSet.players.map((player) => {
      const serveRecords = getPlayerServeRecords(player.id);
      const receiveRecords = getPlayerReceiveRecords(player.id);
      const isEditing = editingPlayerId === player.id;
      const currentRotation = getServeRotation(player.id);

      return (
        <div key={player.id} className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
          {/* 選手名エリア */}
          <div className="mb-4 pb-3 border-b-2 border-gray-300">
            {isEditing ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={editingPlayerName}
                  onChange={(e) => setEditingPlayerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      savePlayerName(player.id);
                    } else if (e.key === 'Escape') {
                      cancelEditingPlayer();
                  }}
                  className="flex-1 px-4 py-3 border-2 border-purple-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 text-base"
                  placeholder="選手名を入力"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => savePlayerName(player.id)}
                    className="flex-1 sm:flex-none px-5 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-bold active:scale-95 transition-transform"
                  >
                    保存
                  </button>
                  <button
                    onClick={cancelEditingPlayer}
                    className="flex-1 sm:flex-none px-5 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-bold active:scale-95 transition-transform"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex-1">
                  <span className="text-lg md:text-xl font-bold text-gray-800">
                    選手: {player.name || '(未入力)'}
                  </span>
                </div>
                <button
                  onClick={() => startEditingPlayer(player)}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm active:scale-95 transition-transform"
                >
                  <Edit2 size={14} />
                  編集
                </button>
              </div>
            )}
          </div>

          {/* 記録表示エリア */}
          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-2">
              <span className="font-bold text-gray-700 text-base mt-2">S:</span>
              <div className="flex-1 min-h-[3rem] p-3 bg-white rounded border border-gray-300 flex flex-wrap gap-1 text-lg">
                {serveRecords.map((record, idx) => {
                  const btn = serveButtons.find(b => b.quality === record.quality);
                  const isRedStar = record.quality === 'red-star';
                  return (
                    <span
                      key={idx}
                      className={isRedStar ? 'text-red-600 font-bold' : ''}
                    >
                      {btn?.symbol || '?'}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-gray-700 text-base mt-2">R:</span>
              <div className="flex-1 min-h-[3rem] p-3 bg-white rounded border border-gray-300 flex flex-wrap gap-1 text-lg">
                {receiveRecords.map((record, idx) => {
                  const btn = receiveButtons.find(b => b.quality === record.quality);
                  return (
                    <span key={idx}>
                      {btn?.symbol || '?'}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* サーブボタンエリア（巡目ボタン） */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-gray-600">サーブ:</p>
                <button
                  onClick={() => toggleServeRotation(player.id)}
                  className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-bold active:scale-95"
                >
                  {currentRotation}巡目
                </button>
              </div>
              <button
                onClick={() => undoLastRecord(player.id, 'serve')}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-bold active:scale-95"
              >
                ← 1つ戻る
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {serveButtons.map((btn) => (
                <button
                  key={btn.quality}
                  onClick={() => addRecord(player.id, 'serve', btn.quality)}
                  className={`${btn.color} text-white px-6 py-3 rounded-lg hover:opacity-80 transition-opacity font-bold text-lg active:scale-95 min-w-[3.5rem]`}
                >
                  {btn.symbol}
                </button>
              ))}
            </div>
          </div>

          {/* レシーブボタンエリア */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-base font-semibold text-gray-600">レシーブ:</p>
              <button
                onClick={() => undoLastRecord(player.id, 'receive')}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-bold active:scale-95"
              >
                ← 1つ戻る
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {receiveButtons.map((btn) => (
                <button
                  key={btn.quality}
                  onClick={() => addRecord(player.id, 'receive', btn.quality)}
                  className={`${btn.color} text-white px-6 py-3 rounded-lg hover:opacity-80 transition-opacity font-bold text-lg active:scale-95 min-w-[3.5rem]`}
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
</div>

          {/* 交代履歴 */}
          {currentSet.substitutions && currentSet.substitutions.length > 0 && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 md:p-6" id="substitution-history">
              <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">交代履歴</h3>
              <div className="space-y-2">
                {currentSet.substitutions.map((sub, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-2 text-gray-700 text-base">
                    <span className="font-semibold">{sub.outPlayer}</span>
                    <span className="text-gray-500">→</span>
                    <span className="font-semibold text-green-600">{sub.inPlayer}</span>
                    {(sub.ourScore !== undefined && sub.opponentScore !== undefined) && (
                      <span className="text-sm text-gray-600">
                        (スコア: {sub.ourScore}-{sub.opponentScore})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 選手交代エリア（モバイル最適化） */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <UserPlus size={24} />
              選手交代
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">
                  交代する選手
                </label>
                <select
                  value={benchPlayerId}
                  onChange={(e) => setBenchPlayerId(e.target.value)}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
                <label className="block text-base font-semibold text-gray-700 mb-2">
                  入る選手
                </label>
                <input
                  type="text"
                  value={inPlayerName}
                  onChange={(e) => setInPlayerName(e.target.value)}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="選手名を入力"
                />
              </div>
            </div>
            <button
              onClick={handleSubstitution}
              className="mt-4 w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow font-bold text-base active:scale-[0.98]"
            >
              交代を記録
            </button>
          </div>

          {/* 選手統計テーブル（スクロール対応） */}
          <div id="player-stats" className="space-y-4">
            <h3 className="text-xl md:text-2xl font-bold text-gray-800">選手統計（全セット）</h3>
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                    <th className="border-2 border-purple-700 px-3 py-3 text-left text-sm md:text-base sticky left-0 bg-purple-600">選手名</th>
                    <th className="border-2 border-purple-700 px-3 py-3 text-center text-sm md:text-base">S合計</th>
                    <th className="border-2 border-purple-700 px-3 py-3 text-center text-sm md:text-base">R合計</th>
                    <th className="border-2 border-purple-700 px-3 py-3 text-center text-sm md:text-base">S×</th>
                    <th className="border-2 border-purple-700 px-3 py-3 text-center text-sm md:text-base"></th>
                    <th className="border-2 border-purple-700 px-3 py-3 text-center text-sm md:text-base"></th>
                    <th className="border-2 border-purple-700 px-3 py-3 text-center text-sm md:text-base"></th>
                    <th className="border-2 border-purple-700 px-3 py-3 text-center text-sm md:text-base">S★(赤)</th>
                    <th className="border-2 border-purple-700 px-3 py-3 text-center text-sm md:text-base">S★(黒)</th>
                    <th className="border-2 border-purple-700 px-3 py-3 text-center text-sm md:text-base">R×</th>
                    <th className="border-2 border-purple-700 px-3 py-3 text-center text-sm md:text-base">R○</th>
                    <th className="border-2 border-purple-700 px-3 py-3 text-center text-sm md:text-base">R◎</th>
                    <th className="border-2 border-purple-700 px-3 py-3 text-center text-sm md:text-base">R△</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregatedData.map((player, idx) => (
                    <tr key={player.id} className={idx % 2 === 0 ? 'bg-purple-50' : 'bg-white'}>
                      <td className="border-2 border-gray-300 px-3 py-2 font-semibold text-sm md:text-base sticky left-0 bg-inherit">
                        {player.name || '(未入力)'}
                      </td>
                      <td className="border-2 border-gray-300 px-3 py-2 text-center font-bold text-blue-600 text-sm md:text-base">
                        {player.totalServes}
                      </td>
                      <td className="border-2 border-gray-300 px-3 py-2 text-center font-bold text-green-600 text-sm md:text-base">
                        {player.totalReceives}
                      </td>
                      <td className="border-2 border-gray-300 px-3 py-2 text-center text-sm md:text-base">{player.serveDetails['serve-miss'] + player.serveDetails['dash']}</td>
                      <td className="border-2 border-gray-300 px-3 py-2 text-center text-sm md:text-base">{player.serveDetails['red-star']}</td>
                      <td className="border-2 border-gray-300 px-3 py-2 text-center text-sm md:text-base">{player.serveDetails['black-star']}</td>
                      <td className="border-2 border-gray-300 px-3 py-2 text-center text-sm md:text-base">{player.receiveDetails['setter-return']}</td>
                      <td className="border-2 border-gray-300 px-3 py-2 text-center text-sm md:text-base">{player.receiveDetails['no-return']}</td>
                      <td className="border-2 border-gray-300 px-3 py-2 text-center text-sm md:text-base">{player.receiveDetails['setter-pinpoint']}</td>
                      <td className="border-2 border-gray-300 px-3 py-2 text-center text-sm md:text-base">{player.receiveDetails['other-than-setter']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 記号の意味 */}
          <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">記号の意味</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-gray-700 mb-2 text-base">サーブ:</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>× = サーブミス</li>
                  <li>★(赤) = ノータッチエース&相手が弾いた</li>
                  <li>★(黒) = 取られたけど繋がらない</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-2 text-base">レシーブ:</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>× = 返らず</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
