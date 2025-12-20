import React, { useState, useRef, useEffect } from 'react';
import { Match, MatchSet, ServiceRecord, ServiceQuality, PointType, Substitution, Player } from '../types';
import { Trash2, Star, UserPlus, Download, Printer, Edit3, PlusCircle, Plus, Minus, RotateCcw, RefreshCw } from 'lucide-react';

interface MatchDetailProps {
  match: Match;
  onUpdate: (match: Match) => void;
  onDelete: () => void;
}

const MatchDetail: React.FC<MatchDetailProps> = ({ match, onUpdate, onDelete }) => {
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [playerRounds, setPlayerRounds] = useState<Record<string, 1 | 2>>({});
  
  const currentSet = match.sets[activeSetIndex];
  const recordRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentSet.bench || !currentSet.substitutions || !currentSet.services) {
      updateSet({
        bench: currentSet.bench || [],
        substitutions: currentSet.substitutions || [],
        services: currentSet.services || []
      });
    }
  }, [activeSetIndex]);

  const updateSet = (data: Partial<MatchSet>) => {
    const newSets = [...match.sets];
    newSets[activeSetIndex] = { ...currentSet, ...data };
    onUpdate({ ...match, sets: newSets });
  };

  const toggleResult = () => {
    onUpdate({ ...match, result: match.result === 'win' ? 'loss' : 'win' });
  };

  const adjustScore = (team: 'my' | 'opponent', delta: number) => {
    if (team === 'my') {
      updateSet({ myScore: Math.max(0, (currentSet.myScore || 0) + delta) });
    } else {
      updateSet({ opponentScore: Math.max(0, (currentSet.opponentScore || 0) + delta) });
    }
  };

  const toggleServeTurn = () => {
    updateSet({ serveTurn: currentSet.serveTurn === 'S' ? 'R' : 'S' });
  };

  const addBenchPlayer = () => {
    const name = window.prompt('控え選手の名前を入力してください');
    if (!name || name.trim() === '') return;
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: name.trim(),
      isSubstituted: false
    };
    const currentBench = currentSet.bench ? [...currentSet.bench] : [];
    updateSet({ bench: [...currentBench, newPlayer] });
  };

  const handlePlayerNameChange = (playerId: string, newName: string, isBench: boolean = false) => {
    if (isBench) {
      const newBench = (currentSet.bench || []).map(p => p.id === playerId ? { ...p, name: newName } : p);
      updateSet({ bench: newBench });
    } else {
      const newLineup = currentSet.lineup.map(p => p.id === playerId ? { ...p, name: newName } : p);
      updateSet({ lineup: newLineup });
    }
  };

  const addService = (playerId: string, quality: ServiceQuality, pointType: PointType) => {
    const player = currentSet.lineup.find(p => p.id === playerId);
    if (!player) return;

    const currentRound = playerRounds[playerId] || 1;
    const newService: ServiceRecord = {
      id: crypto.randomUUID(),
      playerId,
      playerName: player.name,
      quality,
      pointType,
      round: currentRound,
      timestamp: Date.now()
    };

    updateSet({
      services: [...(currentSet.services || []), newService]
    });
  };

  const handleSubstitution = (lineupPlayerId: string) => {
    const outPlayer = currentSet.lineup.find(p => p.id === lineupPlayerId);
    if (!outPlayer) return;

    let inPlayer: Player | undefined;
    const bench = currentSet.bench || [];
    
    const currentScore = `${currentSet.myScore || 0}-${currentSet.opponentScore || 0}`;

    if (bench.length > 0) {
      const benchNames = bench.map((p, i) => `${i + 1}: ${p.name}`).join('\n');
      const choice = window.prompt(`【選手交代】 スコア: ${currentScore}\n${outPlayer.name} 選手と交代する選手を選んでください。\n番号で選ぶか、新しい名前を入力してください:\n${benchNames}`);
      
      if (!choice) return;
      
      const index = parseInt(choice) - 1;
      if (!isNaN(index) && bench[index]) {
        inPlayer = bench[index];
      } else {
        inPlayer = { id: crypto.randomUUID(), name: choice, isSubstituted: true };
      }
    } else {
      const newName = window.prompt(`${outPlayer.name} 選手と代わる選手名を入力してください\n現在のスコア: ${currentScore}`);
      if (!newName) return;
      inPlayer = { id: crypto.randomUUID(), name: newName, isSubstituted: true };
    }

    const sub: Substitution = {
      id: crypto.randomUUID(),
      outPlayerId: outPlayer.id,
      outPlayerName: outPlayer.name,
      inPlayerId: inPlayer.id,
      inPlayerName: inPlayer.name,
      score: currentScore,
      timestamp: Date.now()
    };
    updateSet({
      lineup: newLineup,
      bench: newBench,
      substitutions: [...(currentSet.substitutions || []), sub]
    });
  };
  const removeSubstitution = (subId: string) => {
    if (!window.confirm('この交代記録を削除しますか？\n※選手の配置は元に戻りません。記録のみ削除されます。')) {
      return;
    }
    
    const newSubstitutions = (currentSet.substitutions || []).filter(s => s.id !== subId);
    updateSet({ substitutions: newSubstitutions });
  };
  const exportImage = async () => {
    if (!recordRef.current) return;
    try {
      // @ts-ignore
      const canvas = await window.html2canvas(recordRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `${match.date}_${match.opponent}_成果記録.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error(err);
      alert('画像の書き出しに失敗しました。');
    }
  };

  const getPlayerMarkers = (playerId: string) => {
    const playerServices = (currentSet.services || []).filter(s => s.playerId === playerId);
    const hasRound1 = playerServices.some(s => s.round === 1);
    const hasRound2 = playerServices.some(s => s.round === 2);
    
    const redStars = playerServices.filter(s => s.pointType === 'red_star').length;
    const blackStars = playerServices.filter(s => s.pointType === 'black_star').length;
    const misses = playerServices.filter(s => s.quality === 'miss').length;
    
    return { hasRound1, hasRound2, redStars, blackStars, misses };
  };

  const toggleRound = (playerId: string) => {
    setPlayerRounds(prev => ({
      ...prev,
      [playerId]: prev[playerId] === 2 ? 1 : 2
    }));
  };

  const undoLastService = () => {
    if (!currentSet.services || currentSet.services.length === 0) return;
    if(confirm('最後のサーブ記録を取り消しますか？')) {
      updateSet({ services: currentSet.services.slice(0, -1) });
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* 操作パネル */}
      <div className="flex gap-2 no-print">
        <button onClick={exportImage} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-indigo-700 active:scale-95 transition-all">
          <Download size={18} /> 成績を画像で保存
        </button>
        <button 
          onClick={toggleResult}
          className={`px-6 py-3 rounded-xl font-bold shadow-sm transition-all ${match.result === 'win' ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-red-500 text-white hover:bg-red-600'}`}
        >
          {match.result === 'win' ? 'WIN' : 'LOSE'}
        </button>
      </div>
           {/* スコア入力パネル */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 no-print">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1 text-center space-y-3">
            <p className="text-xs font-black text-indigo-600 tracking-widest uppercase">My Team</p>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => adjustScore('my', -1)} className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors shadow-sm"><Minus size={20}/></button>
              <span className="text-5xl font-black w-16 select-none tabular-nums">{currentSet.myScore || 0}</span>
              <button onClick={() => adjustScore('my', 1)} className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-md"><Plus size={20}/></button>
            </div>
          </div>
          <div className="text-2xl font-black text-gray-200 italic">VS</div>
          <div className="flex-1 text-center space-y-3">
            <p className="text-xs font-black text-red-600 tracking-widest uppercase">Opponent</p>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => adjustScore('opponent', -1)} className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors shadow-sm"><Minus size={20}/></button>
              <span className="text-5xl font-black w-16 select-none tabular-nums">{currentSet.opponentScore || 0}</span>
              <button onClick={() => adjustScore('opponent', 1)} className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-md"><Plus size={20}/></button>
            </div>
          </div>
        </div>
      </div>

      {/* 記録・出力エリア */}
      <div ref={recordRef} className="bg-white p-8 rounded-3xl shadow-xl space-y-8 border border-gray-100">
        <div className="border-b-2 border-gray-100 pb-6 flex justify-between items-end">
          <div>
            <div className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em] mb-1">{match.tournament}</div>
            <h2 className="text-3xl font-black text-gray-900 leading-none">{match.opponent} <span className="text-lg font-bold text-gray-300">戦</span></h2>
            <div className="text-gray-400 text-sm font-bold mt-2">{match.date}</div>
          </div>
          <div className="flex items-center gap-6 bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100 shadow-inner">
             <div className="text-center">
               <span className="text-[10px] block text-gray-400 font-black uppercase tracking-widest mb-1">SCORE</span>
               <span className="text-4xl font-black text-gray-800 tabular-nums">{currentSet.myScore || 0} - {currentSet.opponentScore || 0}</span>
             </div>
             <div className="h-12 w-px bg-gray-200"></div>
             <div className="text-center">
               <span className="text-[10px] block text-gray-400 font-black mb-1">SERVE</span>
               <button 
                 onClick={toggleServeTurn}
                 className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-lg font-black hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer no-print flex items-center gap-1"
               >
                 {currentSet.serveTurn}
                 <RefreshCw size={14} className="opacity-50" />
               </button>
               <div className="print-only px-3 py-1 bg-indigo-600 text-white rounded-lg text-lg font-black hidden">
                 {currentSet.serveTurn}
               </div>
             </div>
          </div>
        </div>

        {/* 成績テーブル */}
        <div className="border-2 border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-[180px_1fr] bg-gray-50 border-b-2 border-gray-100 text-[11px] font-black text-gray-400 uppercase tracking-widest">
            <div className="p-3 border-r-2 border-gray-100">選手 / 成果</div>
            <div className="p-3">サーブ詳細記録</div>
          </div>
          <div className="divide-y-2 divide-gray-100">
            {currentSet.lineup.map((player) => {
              const markers = getPlayerMarkers(player.id);
              const services = (currentSet.services || []).filter(s => s.playerId === player.id);
              const isEditing = editingPlayerId === player.id;
              const currentRound = playerRounds[player.id] || 1;
              
              return (
                <div key={player.id} className="grid grid-cols-[180px_1fr] min-h-[120px]">
                  <div className="p-4 border-r-2 border-gray-100 bg-white relative flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1 group mb-2">
                        {isEditing ? (
                          <input autoFocus className="font-bold border-b-2 border-indigo-500 outline-none w-full py-1 text-lg" value={player.name} onChange={(e) => handlePlayerNameChange(player.id, e.target.value)} onBlur={() => setEditingPlayerId(null)} />
                        ) : (
                          <span className="font-black text-gray-800 cursor-pointer hover:text-indigo-600 flex items-center gap-2 text-lg" onClick={() => setEditingPlayerId(player.id)}>
                            {player.name} <Edit3 size={12} className="text-gray-300 no-print" />
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 items-center">
                        <div className="flex items-center text-green-600 font-black text-lg min-w-[30px]">
                          {markers.hasRound2 ? '✓✓' : markers.hasRound1 ? '✓' : ''}
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: markers.redStars }).map((_, i) => <span key={i} className="text-red-500 text-xl leading-none">★</span>)}
                          {Array.from({ length: markers.blackStars }).map((_, i) => <span key={i} className="text-gray-900 text-xl leading-none">★</span>)}
                          {Array.from({ length: markers.misses }).map((_, i) => <span key={i} className="text-gray-300 font-black text-xl leading-none">―</span>)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between no-print mt-4">
                      <button 
                        onClick={() => toggleRound(player.id)}
                        className={`text-[10px] font-black px-3 py-1 rounded-full transition-all shadow-sm ${currentRound === 2 ? 'bg-indigo-600 text-white scale-105' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                      >
                        {currentRound}巡目
                      </button>
                      <button onClick={() => handleSubstitution(player.id)} className="text-gray-300 hover:text-indigo-600 p-1">
                        <UserPlus size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-white flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2 min-h-[44px]">
                      {services.map(s => (
                        <div key={s.id} className="w-11 h-11 flex flex-col items-center justify-center border-2 border-gray-100 rounded-xl bg-gray-50 text-base font-black shadow-sm">
                          <span className="leading-none">{s.quality === 'pinpoint' ? '◎' : s.quality === 'setter_move' ? '○' : s.quality === 'other' ? '△' : '×'}</span>
                          {s.pointType !== 'none' && <span className={`${s.pointType === 'red_star' ? 'text-red-500' : 'text-gray-900'} text-[9px] mt-0.5 leading-none`}>★</span>}
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2 no-print mt-auto">
                      <button onClick={() => addService(player.id, 'pinpoint', 'none')} className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 font-black border-2 border-indigo-100 hover:bg-indigo-100 active:scale-90 transition-all shadow-sm">◎</button>
                      <button onClick={() => addService(player.id, 'setter_move', 'none')} className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 font-black border-2 border-indigo-100 hover:bg-indigo-100 active:scale-90 transition-all shadow-sm">○</button>
                      <button onClick={() => addService(player.id, 'other', 'none')} className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 font-black border-2 border-indigo-100 hover:bg-indigo-100 active:scale-90 transition-all shadow-sm">△</button>
                      <button onClick={() => addService(player.id, 'miss', 'none')} className="w-11 h-11 rounded-xl bg-red-50 text-red-700 font-black border-2 border-red-100 hover:bg-red-100 active:scale-90 transition-all shadow-sm">×</button>
                      <div className="w-px h-11 bg-gray-200 mx-1"></div>
                      <button onClick={() => addService(player.id, 'pinpoint', 'red_star')} className="px-4 h-11 rounded-xl bg-red-600 text-white text-[11px] font-black shadow-md hover:bg-red-700 active:scale-90 transition-all">赤★</button>
                      <button onClick={() => addService(player.id, 'pinpoint', 'black_star')} className="px-4 h-11 rounded-xl bg-gray-800 text-white text-[11px] font-black shadow-md hover:bg-black active:scale-90 transition-all">黒★</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      {/* 控え・交代履歴 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200 shadow-inner">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">ベンチ / 控え選手</h4>
              <button onClick={addBenchPlayer} className="text-indigo-600 no-print flex items-center gap-1 text-[11px] font-black hover:text-indigo-800 transition-colors">
                <PlusCircle size={18} /> 追加
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(currentSet.bench || []).map(p => {
                const benchMarkers = getPlayerMarkers(p.id);
                return (
                  <span key={p.id} className="bg-white px-4 py-2 rounded-xl text-xs font-black border-2 border-gray-100 flex items-center gap-2 shadow-sm group">
                    {p.name}
                    {(benchMarkers.redStars > 0 || benchMarkers.blackStars > 0 || benchMarkers.hasRound1) && (
                      <span className="text-[10px] text-gray-400">
                        ({benchMarkers.hasRound2 ? '✓✓' : benchMarkers.hasRound1 ? '✓' : ''} 
                        {benchMarkers.redStars > 0 && `★${benchMarkers.redStars}`})
                      </span>
                    )}
                    <Edit3 size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 cursor-pointer no-print" onClick={() => {
                      const n = window.prompt('選手名を変更', p.name);
                      if(n && n.trim() !== '') handlePlayerNameChange(p.id, n.trim(), true);
                    }} />
                  </span>
                );
              })}
              {(currentSet.bench || []).length === 0 && <p className="text-xs text-gray-300 italic py-2">控え選手はいません</p>}
            </div>
          </div>
         <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-100 shadow-inner">
            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">交代履歴</h4>
            <div className="space-y-2">
              {(currentSet.substitutions || []).map(sub => (
                <div key={sub.id} className="text-xs flex items-center justify-between border-b-2 border-white pb-2 font-bold group">
                  <span className="flex items-center gap-2">
                    <span className="text-red-500 bg-red-50 px-2 py-1 rounded-lg">{sub.outPlayerName}</span>
                    <span className="text-gray-300">▶</span>
                    <span className="text-green-600 bg-green-50 px-2 py-1 rounded-lg">{sub.inPlayerName}</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-gray-400 text-[9px] block mb-0.5">SCORE</span>
                      <span className="text-indigo-700 font-black font-mono">{sub.score}</span>
                    </div>
                    <button
                      onClick={() => removeSubstitution(sub.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 active:scale-90 no-print"
                      title="この交代記録を削除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {(currentSet.substitutions || []).length === 0 && <p className="text-xs text-gray-300 italic py-2">交代履歴はありません</p>}
            </div>
          </div>
              {(currentSet.substitutions || []).length === 0 && <p className="text-xs text-gray-300 italic py-2">交代履歴はありません</p>}
            </div>
          </div>
        </div>

        {/* 記号凡例 */}
        <div className="bg-gray-900 text-white p-6 rounded-2xl grid grid-cols-2 gap-4 text-[11px] shadow-lg">
          <div className="space-y-2 border-r border-white/10 pr-4">
            <div className="flex gap-3 items-center"><span className="w-5 h-5 flex items-center justify-center bg-white/10 rounded font-black">◎</span><span className="opacity-70">セッターピンポイント</span></div>
            <div className="flex gap-3 items-center"><span className="w-5 h-5 flex items-center justify-center bg-white/10 rounded font-black">○</span><span className="opacity-70">セッターが動く</span></div>
            <div className="flex gap-3 items-center"><span className="w-5 h-5 flex items-center justify-center bg-white/10 rounded font-black">△</span><span className="opacity-70">セッター以外</span></div>
          </div>
          <div className="space-y-2 pl-2">
            <div className="flex gap-3 items-center"><span className="text-red-500 font-black text-lg leading-none">★</span><span className="opacity-70">ノータッチ / 相手弾く</span></div>
            <div className="flex gap-3 items-center"><span className="text-gray-100 font-black text-lg leading-none">★</span><span className="opacity-70">取られたが繋がらず</span></div>
            <div className="flex gap-3 items-center"><span className="text-green-400 font-black text-lg leading-none">✓</span><span className="opacity-70">1巡目 / 2巡目(✓✓)</span></div>
            <div className="flex gap-3 items-center"><span className="w-5 h-5 flex items-center justify-center bg-white/10 rounded font-black">S</span><span className="opacity-70">先行（サーブ権あり）</span></div>
            <div className="flex gap-3 items-center"><span className="w-5 h-5 flex items-center justify-center bg-white/10 rounded font-black">R</span><span className="opacity-70">後攻（レシーブから）</span></div>
          </div>
        </div>
      </div>

      {/* 取り消しボタン */}
      <div className="fixed bottom-8 right-8 no-print">
        <button onClick={undoLastService} 
          className="bg-red-500 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center font-black hover:bg-red-600 active:scale-95 transition-all group"
          title="一手戻す"
        >
          <RotateCcw className="group-hover:-rotate-45 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default MatchDetail;
        
