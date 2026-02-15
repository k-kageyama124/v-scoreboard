import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Save, UserPlus, Users } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Match, Player, StatAction, StatKey } from '../types';

interface MatchDetailProps {
  match: Match;
  onBack: () => void;
  onUpdate: (match: Match) => void;
}

type StatTotals = {
  S: number;  // サ
  SM: number; // サM
  SP: number; // サP
  B: number;  // ブ
  A: number;  // ア
  AM: number; // アM
  AP: number; // アP
};

const STAT_KEYS: StatKey[] = ['S', 'SM', 'SP', 'B', 'A', 'AM', 'AP'];

const STAT_LABEL: Record<StatKey, string> = {
  S: 'サ',
  SM: 'サM',
  SP: 'サP',
  B: 'ブ',
  A: 'ア',
  AM: 'アM',
  AP: 'アP',
};

function emptyTotals(): StatTotals {
  return { S: 0, SM: 0, SP: 0, B: 0, A: 0, AM: 0, AP: 0 };
}

function getOrInitStatActions(set: any): StatAction[] {
  if (!set.statActions) return [];
  return Array.isArray(set.statActions) ? set.statActions : [];
}

function normalizeCourtIds(set: any): Array<string | null> {
  const raw = Array.isArray(set.courtPlayerIds) ? set.courtPlayerIds : [];
  const arr: Array<string | null> = raw.slice(0, 6).map((x: any) => (typeof x === 'string' ? x : null));
  while (arr.length < 6) arr.push(null);
  return arr;
}

/**
 * 連動ルール:
 * - SP を押したら S も +1
 * - AP / AM を押したら A も +1
 */
function buildAction(playerId: string, primary: StatKey): StatAction {
  const deltas: Partial<Record<StatKey, number>> = { [primary]: 1 };
  if (primary === 'SP') deltas.S = (deltas.S || 0) + 1;
  if (primary === 'AP' || primary === 'AM') deltas.A = (deltas.A || 0) + 1;

  return {
    playerId,
    primary,
    deltas,
    timestamp: Date.now(),
  };
}

function applyDeltas(totals: StatTotals, deltas: Partial<Record<StatKey, number>>, sign: 1 | -1) {
  (Object.keys(deltas) as StatKey[]).forEach((k) => {
    const v = deltas[k] || 0;
    totals[k] += sign * v;
    if (totals[k] < 0) totals[k] = 0;
  });
}

function totalsFromActions(actions: StatAction[]): Record<string, StatTotals> {
  const map: Record<string, StatTotals> = {};
  actions.forEach((a) => {
    if (!map[a.playerId]) map[a.playerId] = emptyTotals();
    applyDeltas(map[a.playerId], a.deltas, 1);
  });
  return map;
}

export default function MatchDetail({ match, onBack, onUpdate }: MatchDetailProps) {
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [initialized, setInitialized] = useState(false);

  // 交代（OUT選手ID / IN選手名）
  const [benchPlayerId, setBenchPlayerId] = useState<string>('');
  const [inPlayerName, setInPlayerName] = useState<string>('');

  // 選手名編集
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState<string>('');

  // 削除ボタン誤タップ防止（2段階）
  const [confirmDeletePlayerId, setConfirmDeletePlayerId] = useState<string | null>(null);

  // 初期化
  useEffect(() => {
    if (initialized) return;

    const updatedMatch: Match = { ...match };
    if (!updatedMatch.sets || updatedMatch.sets.length === 0) {
      updatedMatch.sets = [
        {
          ourScore: 0,
          opponentScore: 0,
          players: [],
          serves: [],
          receives: [],
          substitutions: [],
          statActions: [],
          courtPlayerIds: [null, null, null, null, null, null],
        },
      ] as any;
    }

    const firstSet: any = updatedMatch.sets[0];

    if (!firstSet.players || firstSet.players.length === 0) {
      const players: Player[] = Array.from({ length: 6 }).map((_, idx) => ({
        id: `player-${Date.now()}-${idx}`,
        name: '',
        number: idx + 1,
      }));
      firstSet.players = players;
    }

    // courtPlayerIds が無ければ「先頭6人」を初期コートにする（空名でもOK）
    if (!Array.isArray(firstSet.courtPlayerIds) || firstSet.courtPlayerIds.length === 0) {
      const ids = (firstSet.players || []).slice(0, 6).map((p: Player) => p.id);
      firstSet.courtPlayerIds = [...ids];
      while (firstSet.courtPlayerIds.length < 6) firstSet.courtPlayerIds.push(null);
    }

    updatedMatch.sets = updatedMatch.sets.map((s: any) => ({
      ...s,
      statActions: getOrInitStatActions(s),
      substitutions: Array.isArray(s.substitutions) ? s.substitutions : [],
      serves: Array.isArray(s.serves) ? s.serves : [],
      receives: Array.isArray(s.receives) ? s.receives : [],
      players: Array.isArray(s.players) ? s.players : [],
      courtPlayerIds: normalizeCourtIds(s),
    }));

    setInitialized(true);
    onUpdate(updatedMatch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  const currentSetData: any = match.sets?.[currentSetIndex];

  const courtIds = useMemo(() => normalizeCourtIds(currentSetData || {}), [currentSetData]);
  const isOnCourt = (playerId: string) => courtIds.includes(playerId);

  const handleSetChange = (index: number) => {
    if (!match.sets) return;

    if (index < match.sets.length) {
      setCurrentSetIndex(index);
      return;
    }

    const prevSet: any = match.sets[match.sets.length - 1];
    const newSet: any = {
      ourScore: 0,
      opponentScore: 0,
      players: (prevSet?.players || []).map((p: Player) => ({ ...p })),
      serves: [],
      receives: [],
      substitutions: [],
      statActions: [],
      // 新セットは「前セットのコート」を引き継ぐ（空席含む）
      courtPlayerIds: normalizeCourtIds(prevSet || {}),
    };

    const updatedMatch: Match = { ...match, sets: [...match.sets, newSet] };
    onUpdate(updatedMatch);
    setCurrentSetIndex(index);
  };

  const updateScore = (team: 'our' | 'opponent', delta: 1 | -1) => {
    if (!currentSetData) return;
    const updatedSets = match.sets.map((set: any, idx: number) => {
      if (idx !== currentSetIndex) return set;
      const next = { ...set };
      if (team === 'our') next.ourScore = Math.max(0, (next.ourScore || 0) + delta);
      else next.opponentScore = Math.max(0, (next.opponentScore || 0) + delta);
      return next;
    });
    onUpdate({ ...match, sets: updatedSets });
  };

  const updateResult = (result: 'win' | 'lose') => {
    onUpdate({ ...match, result });
  };

  // 入力表：セルタップ
  const tapCell = (playerId: string, key: StatKey) => {
    if (!currentSetData) return;
    const action = buildAction(playerId, key);

    const updatedSets = match.sets.map((set: any, idx: number) => {
      if (idx !== currentSetIndex) return set;
      const statActions = getOrInitStatActions(set);
      return { ...set, statActions: [...statActions, action] };
    });

    onUpdate({ ...match, sets: updatedSets });
  };

  // 入力表：1つ戻る（セット単位 / 入力表だけ）
  const undoLastStatAction = () => {
    if (!currentSetData) return;

    const updatedSets = match.sets.map((set: any, idx: number) => {
      if (idx !== currentSetIndex) return set;
      const statActions = [...getOrInitStatActions(set)];
      statActions.pop();
      return { ...set, statActions };
    });

    onUpdate({ ...match, sets: updatedSets });
  };

  // 交代：OUT はコート内のみ、IN は名簿末尾に追加。コートは入れ替え（空席方式）
  const handleSubstitution = () => {
    if (!currentSetData) return;

    const outId = benchPlayerId;
    if (!outId) {
      alert('交代する選手（OUT）を選択してください（コート内のみ）');
      return;
    }

    const trimmedInName = inPlayerName.trim();
    if (!trimmedInName) {
      alert('入る選手（IN）の名前を入力してください');
      return;
    }

    const updatedSets = match.sets.map((set: any, idx: number) => {
      if (idx !== currentSetIndex) return set;

      const players: Player[] = Array.isArray(set.players) ? [...set.players] : [];
      const courtPlayerIds: Array<string | null> = normalizeCourtIds(set);

      // OUT は必ずコート内から選ぶ（念のためチェック）
      if (!courtPlayerIds.includes(outId)) {
        alert('OUT はコート内の選手から選択してください');
        return set;
      }

      // IN は「同名が既にいるならそれ」を優先して使う（名簿重複回避）
      let inPlayer: Player | null =
        players.find((p: Player) => (p.name || '').trim() === trimmedInName) || null;

      if (!inPlayer) {
        inPlayer = {
          id: `player-${Date.now()}`,
          name: trimmedInName,
          number: (players.length || 0) + 1,
        };
        // 名簿末尾に追加
        players.push(inPlayer);
      } else {
        // 既存選手でも「名簿の末尾に追加」はしない（同一IDを重複させない）
        // コートには入れるだけ
      }

      // substitutions に記録
      const substitutions = Array.isArray(set.substitutions) ? [...set.substitutions] : [];
      substitutions.push({
        outPlayer: outId,
        inPlayer: inPlayer.id,
        timestamp: Date.now(),
        ourScore: set.ourScore,
        opponentScore: set.opponentScore,
      });

      // コート入れ替え：OUT の位置を IN に置換（空席方式なので OUT は名簿に残るだけ）
      const nextCourt = [...courtPlayerIds];
      const outIndex = nextCourt.findIndex((id) => id === outId);
      if (outIndex >= 0) {
        nextCourt[outIndex] = inPlayer.id;
      }

      return {
        ...set,
        players,
        substitutions,
        courtPlayerIds: nextCourt,
      };
    });

    onUpdate({ ...match, sets: updatedSets });

    // UIリセット
    setBenchPlayerId('');
    setInPlayerName('');
  };

  // 交代履歴：最後の1件だけ削除（このセットのみ）＋コートも戻す
  const deleteLastSubstitution = () => {
    if (!currentSetData) return;

    const subs = Array.isArray(currentSetData.substitutions) ? currentSetData.substitutions : [];
    if (subs.length === 0) {
      alert('削除できる交代履歴がありません');
      return;
    }

    if (!confirm('最後の交代を削除して、コート内も1つ前に戻します。よろしいですか？（このセットのみ）')) return;

    const updatedSets = match.sets.map((set: any, idx: number) => {
      if (idx !== currentSetIndex) return set;

      const substitutions = Array.isArray(set.substitutions) ? [...set.substitutions] : [];
      const popped = substitutions.pop();
      if (!popped) return set;

      const courtPlayerIds: Array<string | null> = normalizeCourtIds(set);
      const nextCourt = [...courtPlayerIds];

      // popped: outPlayer -> inPlayer を戻す（コート内で inPlayer を探して outPlayer に戻す）
      const inId = popped.inPlayer;
      const outId = popped.outPlayer;

      const idxInCourt = nextCourt.findIndex((id) => id === inId);
      if (idxInCourt >= 0) nextCourt[idxInCourt] = outId;

      return { ...set, substitutions, courtPlayerIds: nextCourt };
    });

    onUpdate({ ...match, sets: updatedSets });
  };

  // 同名重複を修正（このセットのみ）：古い方を残す。コートIDも寄せる
  const fixDuplicatePlayersInCurrentSet = () => {
    if (!currentSetData) return;
    if (!confirm('同名の重複選手を統合します（このセットのみ）。よろしいですか？')) return;

    const updatedSets = match.sets.map((set: any, idx: number) => {
      if (idx !== currentSetIndex) return set;

      const players: Player[] = Array.isArray(set.players) ? [...set.players] : [];
      const statActions: StatAction[] = Array.isArray(set.statActions) ? [...set.statActions] : [];
      const substitutions = Array.isArray(set.substitutions) ? [...set.substitutions] : [];
      const courtPlayerIds: Array<string | null> = normalizeCourtIds(set);

      const keepIdByName = new Map<string, string>();
      const redirect = new Map<string, string>();

      players.forEach((p) => {
        const key = (p.name || '').trim();
        if (!key) return;
        if (!keepIdByName.has(key)) keepIdByName.set(key, p.id);
        else redirect.set(p.id, keepIdByName.get(key)!);
      });

      if (redirect.size === 0) return set;

      const nextPlayers = players.filter((p) => !redirect.has(p.id));

      const nextStatActions = statActions.map((a) => {
        const to = redirect.get(a.playerId);
        return to ? { ...a, playerId: to } : a;
      });

      const nextSubstitutions = substitutions.map((s: any) => ({
        ...s,
        outPlayer: redirect.get(s.outPlayer) || s.outPlayer,
        inPlayer: redirect.get(s.inPlayer) || s.inPlayer,
      }));

      const nextCourt = courtPlayerIds.map((id) => (id ? (redirect.get(id) || id) : null));

      return {
        ...set,
        players: nextPlayers,
        statActions: nextStatActions,
        substitutions: nextSubstitutions,
        courtPlayerIds: nextCourt,
      };
    });

    onUpdate({ ...match, sets: updatedSets });
  };

  // 選手を削除（方式Hだが行は残す）：このセットのみ
  // - 名簿行は残す（player.name を空にする）
  // - statActions/substitutions からは削除
  // - コート内にいる場合は「空席」にする（あなたのA方式）
  const deletePlayerHard = (playerId: string) => {
    if (!currentSetData) return;

    setConfirmDeletePlayerId(null);

    const player = (currentSetData.players || []).find((p: Player) => p.id === playerId);
    const name = (player?.name || '').trim() || '(未入力)';

    if (
      !confirm(
        `「${name}」を削除します。\nこのセットの記録・交代履歴から削除し、名簿の行は残して空に戻します。\n（コート内なら空席になります）\nよろしいですか？`
      )
    ) {
      return;
    }

    const updatedSets = match.sets.map((set: any, idx: number) => {
      if (idx !== currentSetIndex) return set;

      const players: Player[] = Array.isArray(set.players) ? [...set.players] : [];
      const statActions: StatAction[] = Array.isArray(set.statActions) ? [...set.statActions] : [];
      const substitutions = Array.isArray(set.substitutions) ? [...set.substitutions] : [];
      const courtPlayerIds: Array<string | null> = normalizeCourtIds(set);

      const nextPlayers = players.map((p) => (p.id === playerId ? { ...p, name: '' } : p));
      const nextStatActions = statActions.filter((a) => a.playerId !== playerId);
      const nextSubstitutions = substitutions.filter((s: any) => s.outPlayer !== playerId && s.inPlayer !== playerId);
      const nextCourt = courtPlayerIds.map((id) => (id === playerId ? null : id));

      return {
        ...set,
        players: nextPlayers,
        statActions: nextStatActions,
        substitutions: nextSubstitutions,
        courtPlayerIds: nextCourt,
      };
    });

    onUpdate({ ...match, sets: updatedSets });
  };

  const startEditingPlayer = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditingPlayerName(player.name || '');
  };

  const savePlayerName = () => {
    if (!editingPlayerId) return;

    const updatedSets = match.sets.map((set: any) => {
      const players: Player[] = Array.isArray(set.players) ? set.players : [];
      const nextPlayers = players.map((p) => (p.id === editingPlayerId ? { ...p, name: editingPlayerName } : p));
      return { ...set, players: nextPlayers };
    });

    onUpdate({ ...match, sets: updatedSets });
    setEditingPlayerId(null);
    setEditingPlayerName('');
  };

  const cancelEditing = () => {
    setEditingPlayerId(null);
    setEditingPlayerName('');
  };

  // 現在セットの表示用合計
  const currentTotalsByPlayer = useMemo(() => {
    const actions = getOrInitStatActions(currentSetData || {});
    return totalsFromActions(actions);
  }, [currentSetData]);

  // 全セット合算
  const aggregatedTotalsByPlayer = useMemo(() => {
    const map: Record<string, StatTotals> = {};
    (match.sets || []).forEach((set: any) => {
      const actions = getOrInitStatActions(set);
      const perSet = totalsFromActions(actions);
      Object.keys(perSet).forEach((playerId) => {
        if (!map[playerId]) map[playerId] = emptyTotals();
        applyDeltas(map[playerId], perSet[playerId], 1);
      });
    });
    return map;
  }, [match.sets]);

  const allPlayers = useMemo(() => {
    const seen = new Map<string, Player>();
    (match.sets || []).forEach((set: any) => {
      (set.players || []).forEach((p: Player) => {
        if (!seen.has(p.id)) seen.set(p.id, p);
      });
    });
    return Array.from(seen.values());
  }, [match.sets]);

  const saveAsImage = async () => {
    const el = document.getElementById('match-detail-capture');
    if (!el) return;

    const canvas = await html2canvas(el as HTMLElement, {
      scale: 2,
      backgroundColor: null,
    });

    const link = document.createElement('a');
    link.download = `match_${match.id}_set${currentSetIndex + 1}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!currentSetData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <ArrowLeft size={20} />
            <span>戻る</span>
          </button>

          <p className="mt-6 text-gray-600">セットデータがありません。</p>
        </div>
      </div>
    );
  }

  // OUT候補：コート内のみ（空席除外）
  const outCandidates: Player[] = (currentSetData.players || []).filter((p: Player) => isOnCourt(p.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto" id="match-detail-capture">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <ArrowLeft size={20} />
            <span>試合一覧に戻る</span>
          </button>

          <button
            onClick={saveAsImage}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <Save size={20} />
            <span>画像保存</span>
          </button>
        </div>

        {/* 試合情報 */}
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <div className="text-lg md:text-xl font-bold text-gray-800">
                {match.tournamentName || '大会名未入力'} / vs {match.opponent || '対戦相手未入力'}
              </div>
              <div className="text-sm text-gray-500">{match.date}</div>
            </div>
          </div>
        </div>

        {/* セット切替 */}
        <div className="bg-white rounded-2xl shadow-xl p-4 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {Array.from({ length: Math.max(match.sets.length, 1) }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleSetChange(idx)}
                className={`px-3 py-2 rounded-lg text-sm font-bold ${
                  idx === currentSetIndex ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {idx + 1}セット
              </button>
            ))}
            {match.sets.length < 5 && (
              <button
                onClick={() => handleSetChange(match.sets.length)}
                className="px-3 py-2 rounded-lg text-sm font-bold bg-blue-100 text-blue-700 hover:bg-blue-200"
              >
                + セット追加
              </button>
            )}
          </div>
        </div>

        {/* スコア */}
        <div className="bg-white rounded-2xl shadow-xl p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border-2 border-purple-200 p-4">
              <div className="text-sm text-gray-600 mb-1">自チーム</div>
              <div className="text-4xl font-bold text-purple-700 mb-3">{currentSetData.ourScore || 0}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateScore('our', 1)}
                  className="flex-1 py-2 rounded-lg bg-purple-600 text-white font-bold"
                >
                  +
                </button>
                <button
                  onClick={() => updateScore('our', -1)}
                  className="flex-1 py-2 rounded-lg bg-gray-200 text-gray-800 font-bold"
                >
                  -
                </button>
              </div>
            </div>

            <div className="rounded-xl border-2 border-blue-200 p-4">
              <div className="text-sm text-gray-600 mb-1">相手</div>
              <div className="text-4xl font-bold text-blue-700 mb-3">{currentSetData.opponentScore || 0}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateScore('opponent', 1)}
                  className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold"
                >
                  +
                </button>
                <button
                  onClick={() => updateScore('opponent', -1)}
                  className="flex-1 py-2 rounded-lg bg-gray-200 text-gray-800 font-bold"
                >
                  -
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => updateResult('win')}
              className={`px-4 py-2 rounded-lg font-bold ${
                match.result === 'win' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              WIN
            </button>
            <button
              onClick={() => updateResult('lose')}
              className={`px-4 py-2 rounded-lg font-bold ${
                match.result === 'lose' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              LOSE
            </button>
          </div>
        </div>

        {/* 入力表（マス目） */}
        <div className="bg-white rounded-2xl shadow-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800">選手記録（入力表）</h2>
            <button
              onClick={undoLastStatAction}
              className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-bold"
            >
              一つ戻る
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border-2 border-gray-300 px-2 py-2 text-left text-sm sticky left-0 bg-gray-50 z-10 w-[10rem] min-w-[10rem] max-w-[10rem]">
                    選手
                  </th>
                  {STAT_KEYS.map((k) => (
                    <th key={k} className="border-2 border-gray-300 px-2 py-2 text-center text-sm min-w-[3.25rem]">
                      {STAT_LABEL[k]}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {(currentSetData.players || []).map((player: Player) => {
                  const totals = currentTotalsByPlayer[player.id] || emptyTotals();
                  const onCourt = isOnCourt(player.id);

                  return (
                    <tr key={player.id} className={onCourt ? 'bg-white' : 'bg-gray-50'}>
                      {/* コート内は水色 */}
                      <td
                        className={`border-2 border-gray-300 px-2 py-2 align-top sticky left-0 z-10 w-[10rem] min-w-[10rem] max-w-[10rem] ${
                          onCourt ? 'bg-sky-100' : 'bg-inherit'
                        }`}
                      >
                        {editingPlayerId === player.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              value={editingPlayerName}
                              onChange={(e) => setEditingPlayerName(e.target.value)}
                              className="w-[5rem] px-2 py-1 border rounded text-sm"
                              placeholder="選手名"
                            />
                            <button
                              onClick={savePlayerName}
                              className="px-2 py-1 rounded bg-green-600 text-white text-xs font-bold"
                            >
                              保存
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="px-2 py-1 rounded bg-gray-200 text-gray-800 text-xs font-bold"
                            >
                              戻す
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-[4.5rem]">
                              <div className="text-sm md:text-base font-bold text-gray-800 truncate">
                                {player.name || '(未入力)'}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => startEditingPlayer(player)}
                                className="shrink-0 w-8 h-8 grid place-items-center bg-blue-500 text-white rounded-md text-xs font-bold active:scale-95"
                                title="選手名編集"
                              >
                                編
                              </button>

                              {/* 誤タップ防止：削→確 の2段階 */}
                              {confirmDeletePlayerId === player.id ? (
                                <button
                                  onClick={() => deletePlayerHard(player.id)}
                                  className="shrink-0 w-8 h-8 grid place-items-center bg-red-700 text-white rounded-md text-xs font-bold hover:bg-red-800 active:scale-95"
                                  title="もう一度押すと削除確定"
                                >
                                  確
                                </button>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeletePlayerId(player.id)}
                                  className="shrink-0 w-8 h-8 grid place-items-center bg-red-200 text-red-800 rounded-md text-xs font-bold hover:bg-red-300 active:scale-95"
                                  title="押し間違い防止：次で確定"
                                >
                                  削
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {STAT_KEYS.map((k) => {
                        const v = totals[k];
                        return (
                          <td
                            key={k}
                            onClick={() => tapCell(player.id, k)}
                            className="border-2 border-gray-300 px-2 py-2 text-center select-none cursor-pointer active:bg-yellow-100"
                          >
                            <span className="text-lg font-bold">{v === 0 ? '' : v}</span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-gray-700 bg-gray-50 rounded-xl p-3">
            <div className="font-bold mb-1">記号の意味</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              <div>サ＝サーブ打数</div>
              <div>サM＝サーブミス</div>
              <div>サP＝サーブポイント（エース）</div>
              <div>ブ＝ブロックポイント</div>
              <div>ア＝アタック打数</div>
              <div>アM＝アタックミス</div>
              <div>アP＝アタックポイント</div>
            </div>
          </div>
        </div>

        {/* 交代 */}
        <div className="bg-white rounded-2xl shadow-xl p-4 mb-4">
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <UserPlus size={18} />
            選手交代
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">交代する選手（OUT）※コート内のみ</label>
              <select
                value={benchPlayerId}
                onChange={(e) => setBenchPlayerId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">選択してください</option>
                {outCandidates.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || '(未入力)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">入る選手（IN）</label>
              <input
                value={inPlayerName}
                onChange={(e) => setInPlayerName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="例：こうすけ"
              />
            </div>

            <button
              onClick={handleSubstitution}
              className="px-4 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700"
            >
              記録
            </button>
          </div>

          {/* 交代履歴 */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-gray-800">交代履歴</div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fixDuplicatePlayersInCurrentSet}
                  className="px-3 py-2 rounded-lg bg-gray-700 text-white text-xs font-bold hover:bg-gray-800"
                >
                  重複を修正
                </button>

                <button
                  onClick={deleteLastSubstitution}
                  className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700"
                >
                  最後の交代を削除
                </button>
              </div>
            </div>

            {(currentSetData.substitutions || []).length === 0 ? (
              <div className="text-sm text-gray-500">まだ交代はありません</div>
            ) : (
              <div className="space-y-2">
                {(currentSetData.substitutions || [])
                  .slice()
                  .reverse()
                  .map((s: any, i: number) => {
                    const outP = (currentSetData.players || []).find((p: Player) => p.id === s.outPlayer);
                    const inP = (currentSetData.players || []).find((p: Player) => p.id === s.inPlayer);
                    return (
                      <div key={`${s.timestamp}-${i}`} className="text-sm bg-gray-50 rounded-lg p-2">
                        <span className="font-bold">{outP?.name || '(OUT未入力)'}</span>
                        <span className="mx-2">→</span>
                        <span className="font-bold">{inP?.name || '(IN未入力)'}</span>
                        <span className="ml-3 text-gray-500">
                          ({s.ourScore ?? currentSetData.ourScore}-{s.opponentScore ?? currentSetData.opponentScore})
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* 選手統計（全セット） */}
        <div className="bg-white rounded-2xl shadow-xl p-4 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-3">選手統計（全セット）</h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border-2 border-gray-300 px-2 py-2 text-left text-sm sticky left-0 bg-gray-50 z-10 w-[10rem] min-w-[10rem] max-w-[10rem]">
                    選手
                  </th>
                  {STAT_KEYS.map((k) => (
                    <th key={k} className="border-2 border-gray-300 px-2 py-2 text-center text-sm min-w-[3.25rem]">
                      {STAT_LABEL[k]}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {allPlayers.map((player) => {
                  const totals = aggregatedTotalsByPlayer[player.id] || emptyTotals();
                  return (
                    <tr key={player.id}>
                      <td className="border-2 border-gray-300 px-2 py-2 font-semibold text-sm sticky left-0 bg-white z-10 w-[10rem] min-w-[10rem] max-w-[10rem]">
                        <div className="truncate">{player.name || '(未入力)'}</div>
                      </td>
                      {STAT_KEYS.map((k) => (
                        <td key={k} className="border-2 border-gray-300 px-2 py-2 text-center text-sm">
                          {totals[k] === 0 ? '' : totals[k]}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-xs text-gray-500">※ 全セットの入力表（statActions）を合算しています</div>
        </div>
      </div>
    </div>
  );
}
