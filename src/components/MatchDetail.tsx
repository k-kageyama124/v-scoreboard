import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Save, UserPlus, Users, Edit2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Match, Player, StatAction, StatKey } from '../types';

interface MatchDetailProps {
  match: Match;
  onBack: () => void;
  onUpdate: (match: Match) => void;
}

type StatTotals = {
  S: number; // サ
  SM: number; // サM
  SP: number; // サP
  B: number; // ブ
  A: number; // ア
  AM: number; // アM
  AP: number; // アP
};

const emptyTotals = (): StatTotals => ({
  S: 0,
  SM: 0,
  SP: 0,
  B: 0,
  A: 0,
  AM: 0,
  AP: 0,
});

const keysInOrder: Array<{ key: StatKey; label: string }> = [
  { key: 'S', label: 'サ' },
  { key: 'SM', label: 'サM' },
  { key: 'SP', label: 'サP' },
  { key: 'B', label: 'ブ' },
  { key: 'A', label: 'ア' },
  { key: 'AM', label: 'アM' },
  { key: 'AP', label: 'アP' },
];

const formatCell = (n: number) => (n <= 0 ? '' : String(n));

function sumDeltasInto(t: StatTotals, deltas: Partial<Record<StatKey, number>>) {
  (Object.keys(deltas) as StatKey[]).forEach((k) => {
    t[k] += deltas[k] ?? 0;
  });
}

function buildAction(playerId: string, primary: StatKey): StatAction {
  // 連動ルール：
  // - サP(SP) → サ(S)も+1
  // - アP(AP) or アM(AM) → ア(A)も+1
  const deltas: Partial<Record<StatKey, number>> = { [primary]: 1 };

  if (primary === 'SP') {
    deltas.S = (deltas.S ?? 0) + 1;
  }
  if (primary === 'AP' || primary === 'AM') {
    deltas.A = (deltas.A ?? 0) + 1;
  }

  return {
    playerId,
    primary,
    deltas,
    timestamp: Date.now(),
  };
}

export default function MatchDetail({ match, onBack, onUpdate }: MatchDetailProps) {
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // 交代入力 state
  const [benchPlayerId, setBenchPlayerId] = useState('');
  const [inPlayerName, setInPlayerName] = useState('');

  // 選手名編集
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState('');

  // 初期化：選手がいないとき6人生成 + statActions初期化
  useEffect(() => {
    if (isInitialized) return;

    const currentSet = match.sets[currentSetIndex];
    const updatedMatch = { ...match };

    const needsPlayers = !currentSet.players || currentSet.players.length === 0;
    if (needsPlayers) {
      const initialPlayers = Array.from({ length: 6 }, (_, index) => ({
        id: `player-${Date.now()}-${index}`,
        name: '',
        number: index + 1,
      }));

      updatedMatch.sets = updatedMatch.sets.map((set) => ({
        ...set,
        players: set.players && set.players.length > 0 ? set.players : initialPlayers,
        statActions: set.statActions ?? [],
      }));

      onUpdate(updatedMatch);
    } else {
      // playersはあるがstatActionsが未定義の可能性があるので補完
      updatedMatch.sets = updatedMatch.sets.map((set) => ({
        ...set,
        statActions: set.statActions ?? [],
      }));
      onUpdate(updatedMatch);
    }

    setIsInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.id]);

  const currentSet = match.sets[currentSetIndex];

  const handleSetChange = (index: number) => {
    setCurrentSetIndex(index);

    const updatedMatch = { ...match };
    while (updatedMatch.sets.length <= index) {
      const previousPlayers =
        currentSet.players && currentSet.players.length > 0
          ? currentSet.players
          : Array.from({ length: 6 }, (_, i) => ({
              id: `player-${Date.now()}-${i}`,
              name: '',
              number: i + 1,
            }));

      updatedMatch.sets.push({
        ourScore: 0,
        opponentScore: 0,
        players: previousPlayers,
        serves: [],
        receives: [],
        substitutions: [],
        statActions: [],
      });
    }

    // 既存セットにも statActions を補完
    updatedMatch.sets = updatedMatch.sets.map((s) => ({
      ...s,
      statActions: s.statActions ?? [],
    }));

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
  };

  // 入力表：セルタップ
  const tapCell = (playerId: string, key: StatKey) => {
    const updatedMatch = { ...match };
    const set = updatedMatch.sets[currentSetIndex];
    set.statActions = set.statActions ?? [];

    set.statActions.push(buildAction(playerId, key));
    onUpdate(updatedMatch);
  };

  // 入力表：一つ戻る（セットごと・入力表だけ）
  const undoLastStatAction = () => {
    const updatedMatch = { ...match };
    const set = updatedMatch.sets[currentSetIndex];
    const actions = set.statActions ?? [];

    if (actions.length === 0) {
      alert('戻す入力がありません');
      return;
    }

    actions.pop();
    set.statActions = actions;
    onUpdate(updatedMatch);
  };

  // 交代：append-only（INは末尾追加、OUTは履歴のみ）
  const handleSubstitution = () => {
    if (!benchPlayerId && !inPlayerName.trim()) {
      alert('ベンチの選手を選択するか、新しい選手名を入力してください');
      return;
    }

    const currentSetData = match.sets[currentSetIndex];
    if (!currentSetData) return;

    const outPlayer: Player | null = benchPlayerId
      ? currentSetData.players.find((p) => p.id === benchPlayerId) || null
      : null;

    let inPlayer: Player | null = null;

    // 既存ベンチ選択の場合（同じID）
    if (benchPlayerId) {
      inPlayer = currentSetData.players.find((p) => p.id === benchPlayerId) || null;
    }

    // 新規入力
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

    const exists = currentSetData.players.some((p) => p.id === inPlayer!.id);
    const updatedPlayers = exists ? currentSetData.players : [...currentSetData.players, inPlayer];

    const updatedSubstitutions = [
      ...(currentSetData.substitutions || []),
      {
        outPlayer: outPlayer?.name || '',
        inPlayer: inPlayer.name,
        timestamp: Date.now(),
        ourScore: currentSetData.ourScore,
        opponentScore: currentSetData.opponentScore,
      },
    ];

    updatedSets[currentSetIndex] = {
      ...currentSetData,
      players: updatedPlayers,
      substitutions: updatedSubstitutions,
      statActions: currentSetData.statActions ?? [],
    };

    onUpdate({ ...match, sets: updatedSets });

    setBenchPlayerId('');
    setInPlayerName('');
  };

  const startEditingPlayer = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditingPlayerName(player.name);
  };

  const savePlayerName = (playerId: string) => {
    const trimmed = editingPlayerName.trim();
    if (!trimmed) {
      alert('選手名を入力してください');
      return;
    }

    const updatedMatch = { ...match };
    updatedMatch.sets.forEach((s) => {
      const idx = s.players.findIndex((p) => p.id === playerId);
      if (idx !== -1) s.players[idx].name = trimmed;
    });

    onUpdate(updatedMatch);
    setEditingPlayerId(null);
    setEditingPlayerName('');
  };

  const cancelEditing = () => {
    setEditingPlayerId(null);
    setEditingPlayerName('');
  };

  // 現在セット：選手ごとの集計（表示用）
  const currentSetTotalsByPlayer = useMemo(() => {
    const map = new Map<string, StatTotals>();
    (currentSet.players || []).forEach((p) => map.set(p.id, emptyTotals()));

    (currentSet.statActions ?? []).forEach((a) => {
      if (!map.has(a.playerId)) map.set(a.playerId, emptyTotals());
      const t = map.get(a.playerId)!;
      sumDeltasInto(t, a.deltas);
    });

    return map;
  }, [currentSet.players, currentSet.statActions]);

  // 全セット：選手ごとの集計（下の「選手統計（全セット）」用）
  const allSetTotalsByPlayer = useMemo(() => {
    const map = new Map<string, { id: string; name: string; totals: StatTotals }>();

    match.sets.forEach((set) => {
      (set.players || []).forEach((p) => {
        if (!map.has(p.id)) {
          map.set(p.id, { id: p.id, name: p.name, totals: emptyTotals() });
        } else {
          // 名前更新（後勝ち）
          map.get(p.id)!.name = p.name;
        }
      });

      (set.statActions ?? []).forEach((a) => {
        if (!map.has(a.playerId)) {
          map.set(a.playerId, { id: a.playerId, name: '', totals: emptyTotals() });
        }
        const row = map.get(a.playerId)!;
        sumDeltasInto(row.totals, a.deltas);
      });
    });

    return Array.from(map.values());
  }, [match.sets]);

  const saveAsImage = async () => {
    try {
      const scoreElement = document.getElementById('score-display');
      const statsElement = document.getElementById('player-stats');
      const substitutionElement = document.getElementById('substitution-history');

      if (!scoreElement || !statsElement) {
        alert('保存する要素が見つかりません');
        return;
      }

      const tempContainer = document.createElement('div');
      tempContainer.style.padding = '20px';
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.width = '1200px';

      tempContainer.appendChild(scoreElement.cloneNode(true));
      tempContainer.appendChild(document.createElement('div')).style.height = '20px';
      tempContainer.appendChild(statsElement.cloneNode(true));

      if (substitutionElement) {
        tempContainer.appendChild(document.createElement('div')).style.height = '20px';
        tempContainer.appendChild(substitutionElement.cloneNode(true));
      }

      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      document.body.appendChild(tempContainer);

      const canvas = await html2canvas(tempContainer, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });

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
    } catch (e) {
      console.error('画像保存エラー:', e);
      alert('画像の保存に失敗しました');
    }
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
        {/* ヘッダー */}
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
          {/* セット切替 */}
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

          {/* スコア */}
          <div id="score-display" className="border-4 border-purple-600 rounded-xl p-4 md:p-6 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="space-y-4">
              <div className="text-center space-y-2 pb-4 border-b-2 border-purple-300">
                <h2 className="text-2xl md:text-3xl font-bold text-purple-800">{match.tournamentName}</h2>
                <p className="text-lg md:text-xl text-gray-700">vs {match.opponent}</p>
                <p className="text-sm text-gray-600">{match.date}</p>
              </div>

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

          {/* 選手記録（入力表） */}
          <div className="space-y-4 md:space-y-6">
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Users size={24} />
              選手記録
            </h3>

            {/* Undo（表の直上・セットごと・入力表のみ） */}
            <div className="flex justify-end">
              <button
                onClick={undoLastStatAction}
                className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-base font-bold active:scale-95"
              >
                ← 一つ戻る（この表だけ）
              </button>
            </div>

            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                    <th className="border-2 border-purple-700 px-2 py-2 text-left text-sm md:text-base sticky left-0 bg-purple-600">
                      選手
                    </th>
                    {keysInOrder.map((c) => (
                      <th key={c.key} className="border-2 border-purple-700 px-2 py-2 text-center text-sm md:text-base">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentSet.players.map((player, idx) => {
                    const isEditing = editingPlayerId === player.id;
                    const totals = currentSetTotalsByPlayer.get(player.id) ?? emptyTotals();

                    const cellBase =
                      'border-2 border-gray-300 px-2 py-2 text-center align-top select-none ' +
                      'active:scale-[0.98] transition-transform';

                    const cellBtn =
                      'w-full h-12 md:h-11 rounded-lg border-2 border-gray-200 bg-white hover:bg-purple-50 ' +
                      'font-bold text-base md:text-lg text-gray-800';

                    return (
                      <tr key={player.id} className={idx % 2 === 0 ? 'bg-purple-50' : 'bg-white'}>
                      <td className="border-2 border-gray-300 px-2 py-2 align-top sticky left-0 bg-inherit w-[10rem] min-w-[10rem] max-w-[10rem]">
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editingPlayerName}
                                onChange={(e) => setEditingPlayerName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') savePlayerName(player.id);
                                  if (e.key === 'Escape') cancelEditing();
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
                                  onClick={cancelEditing}
                                  className="flex-1 px-2 py-2 bg-gray-400 text-white rounded-lg font-bold text-sm active:scale-95"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-sm md:text-base font-bold text-gray-800 truncate">
                                  {player.name || '(未入力)'}
                                </div>
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

                        {keysInOrder.map((c) => {
                          const val = totals[c.key];

                          return (
                            <td key={c.key} className={cellBase}>
                              <button
                                className={cellBtn}
                                onClick={() => tapCell(player.id, c.key)}
                                title={`${player.name || '(未入力)'} / ${c.label}`}
                              >
                                {formatCell(val)}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="text-xs text-gray-600">
              0のときは空欄、タップで 1,2,3… と増えます（サP→サ、アP/アM→ア は連動）
            </div>
          </div>

          {/* 交代履歴 */}
          {currentSet.substitutions && currentSet.substitutions.length > 0 && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 md:p-6" id="substitution-history">
              <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">交代履歴</h3>
              <div className="columns-2 lg:columns-3 [column-fill:auto] gap-6">
                {currentSet.substitutions.map((sub, idx) => (
                  <div key={idx} className="break-inside-avoid mb-2 flex flex-wrap items-center gap-2 text-gray-700 text-base">
                    <span className="font-semibold">{sub.outPlayer}</span>
                    <span className="text-gray-500">→</span>
                    <span className="font-semibold text-green-600">{sub.inPlayer}</span>
                    {sub.ourScore !== undefined && sub.opponentScore !== undefined && (
                      <span className="text-sm text-gray-600">(スコア: {sub.ourScore}-{sub.opponentScore})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 選手交代 */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <UserPlus size={24} />
              選手交代
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">交代する選手</label>
                <select
                  value={benchPlayerId}
                  onChange={(e) => setBenchPlayerId(e.target.value)}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">選手を選択してください</option>
                  {currentSet.players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || '(未入力)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">入る選手</label>
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

          {/* 選手統計（全セット合算） */}
          <div id="player-stats" className="space-y-4">
            <h3 className="text-xl md:text-2xl font-bold text-gray-800">選手統計（全セット）</h3>
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                    <th className="border-2 border-purple-700 px-3 py-3 text-left text-sm md:text-base sticky left-0 bg-purple-600">
                      選手名
                    </th>
                    {keysInOrder.map((c) => (
                      <th key={c.key} className="border-2 border-purple-700 px-3 py-3 text-center text-sm md:text-base">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allSetTotalsByPlayer.map((row, idx) => (
                    <tr key={row.id} className={idx % 2 === 0 ? 'bg-purple-50' : 'bg-white'}>
                     <td className="border-2 border-gray-300 px-3 py-2 font-semibold text-sm md:text-base sticky left-0 bg-inherit w-[6.5rem] min-w-[6.5rem] max-w-[6.5rem]">
                        {row.name || '(未入力)'}
                      </td>
                      {keysInOrder.map((c) => (
                        <td key={c.key} className="border-2 border-gray-300 px-3 py-2 text-center text-sm md:text-base">
                          {formatCell(row.totals[c.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 凡例 */}
          <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">記号の意味</h3>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>サ＝サーブ打数</li>
              <li>サM＝サーブミス</li>
              <li>サP＝サーブポイント（エース）</li>
              <li>ブ＝ブロックポイント</li>
              <li>ア＝アタック打数</li>
              <li>アM＝アタックミス</li>
              <li>アP＝アタックポイント</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
