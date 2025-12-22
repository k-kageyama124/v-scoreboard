import React, { useState } from 'react';
import { Match, Player, ServeQuality, ReceiveQuality } from '../types';
import { ArrowLeft, Save, UserPlus, Users, Target, Activity } from 'lucide-react';
import html2canvas from 'html2canvas';

interface MatchDetailProps {
  match: Match;
  onBack: () => void;
  onUpdate: (match: Match) => void;
}

export default function MatchDetail({ match, onBack, onUpdate }: MatchDetailProps) {
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const currentSet = match.sets[currentSetIndex];

  const [benchPlayerName, setBenchPlayerName] = useState('');
  const [inPlayerName, setInPlayerName] = useState('');

  const [servePlayerId, setServePlayerId] = useState('');
  const [serveQuality, setServeQuality] = useState<ServeQuality>('setter-pinpoint');
  const [serveRound, setServeRound] = useState<1 | 2 | 3>(1);
  const [serveTurn, setServeTurn] = useState<'S' | 'R'>('S');

  const [receivePlayerId, setReceivePlayerId] = useState('');
  const [receiveQuality, setReceiveQuality] = useState<ReceiveQuality>('setter-return');

  const handleSetChange = (index: number) => {
    setCurrentSetIndex(index);
    
    const updatedMatch = { ...match };
    while (updatedMatch.sets.length <= index) {
      updatedMatch.sets.push({
        ourScore: 0,
        opponentScore: 0,
        players: [],
        serves: [],
        receives: [],
        substitutions: []
      });
    }
    
    onUpdate(updatedMatch);
  };

  const handleScoreChange = (team: 'our' | 'opponent', delta: number) => {
    const updatedMatch = { ...match };
    const set = updatedMatch.sets[currentSetIndex];
    
    if (team === 'our') {
      set.ourScore = Math.max(0, set.ourScore + delta);
    } else {
      set.opponentScore = Math.max(0, set.opponentScore + delta);
    }
    
    onUpdate(updatedMatch);
  };

  const handleSubstitution = () => {
    if (!benchPlayerName.trim() || !inPlayerName.trim()) {
      alert('ベンチ選手名と入る選手名を入力してください');
      return;
    }

    const updatedMatch = { ...match };
    const set = updatedMatch.sets[currentSetIndex];

    set.substitutions = set.substitutions || [];
    set.substitutions.push({
      id: Date.now().toString(),
      outPlayerName: benchPlayerName.trim(),
      inPlayerName: inPlayerName.trim(),
      score: `${set.ourScore}-${set.opponentScore}`
    });

    const existingPlayer = set.players.find(p => p.name === inPlayerName.trim());
    if (!existingPlayer) {
      set.players.push({
        id: Date.now().toString(),
        name: inPlayerName.trim(),
        position: 'unknown'
      });
    }

    onUpdate(updatedMatch);
    setBenchPlayerName('');
    setInPlayerName('');
  };

  const addServeRecord = () => {
    if (!servePlayerId) {
      alert('サーブ選手を選択してください');
      return;
    }

    const updatedMatch = { ...match };
    const set = updatedMatch.sets[currentSetIndex];

    set.serves = set.serves || [];
    set.serves.push({
      id: Date.now().toString(),
      playerId: servePlayerId,
      quality: serveQuality,
      round: serveRound
    });

    onUpdate(updatedMatch);
  };

  const undoLastServe = () => {
    const updatedMatch = { ...match };
    const set = updatedMatch.sets[currentSetIndex];
    
    if (set.serves && set.serves.length > 0) {
      set.serves = set.serves.slice(0, -1);
      onUpdate(updatedMatch);
    }
  };

  const addReceiveRecord = () => {
    if (!receivePlayerId) {
      alert('レシーブ選手を選択してください');
      return;
    }

    const updatedMatch = { ...match };
    const set = updatedMatch.sets[currentSetIndex];

    set.receives = set.receives || [];
    set.receives.push({
      id: Date.now().toString(),
      playerId: receivePlayerId,
      quality: receiveQuality,
      round: 1
    });

    onUpdate(updatedMatch);
  };

  const undoLastReceive = () => {
    const updatedMatch = { ...match };
    const set = updatedMatch.sets[currentSetIndex];
    
    if (set.receives && set.receives.length > 0) {
      set.receives = set.receives.slice(0, -1);
      onUpdate(updatedMatch);
    }
  };

  const allPlayers: Player[] = [];
  const seenNames = new Set<string>();

  match.sets.forEach(set => {
    set.players.forEach(p => {
      if (!seenNames.has(p.name)) {
        seenNames.add(p.name);
        allPlayers.push(p);
      }
    });
  });

  const calculatePlayerStats = (playerId: string) => {
    const player = allPlayers.find(p => p.id === playerId);
    if (!player) return null;

    let totalServes = 0;
    let totalReceives = 0;
    let serveDetails: Record<ServeQuality, number> = {
      'serve-miss': 0,
      'setter-move': 0,
      'setter-pinpoint': 0,
      'other-than-setter': 0,
      'red-star': 0,
      'black-star': 0,
      'dash': 0,
      'check1': 0,
      'check2': 0
    };
    let receiveDetails: Record<ReceiveQuality, number> = {
      'setter-return': 0,
      'no-return': 0,
      'setter-pinpoint': 0,
      'other-than-setter': 0
    };

    match.sets.forEach(set => {
      if (set.serves) {
        set.serves
          .filter(s => s.playerId === playerId)
          .forEach(s => {
            totalServes++;
            serveDetails[s.quality]++;
          });
      }
      if (set.receives) {
        set.receives
          .filter(r => r.playerId === playerId)
          .forEach(r => {
            totalReceives++;
            receiveDetails[r.quality]++;
          });
      }
    });

    return { player, totalServes, totalReceives, serveDetails, receiveDetails };
  };

  const saveAsImage = async () => {
    const element = document.getElementById('match-detail-capture');
    if (!element) {
      alert('キャプチャ対象が見つかりませんでした');
      return;
    }

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#f3f4f6',
        scale: 2,
        logging: false
      });

      const link = document.createElement('a');
      link.download = `${match.tournamentName || '試合'}_${match.opponent || '対戦相手'}_第${currentSetIndex + 1}セット.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('画像保存エラー:', error);
      alert('画像の保存に失敗しました');
    }
  };

  const toggleServeTurn = () => {
    setServeTurn(prev => prev === 'S' ? 'R' : 'S');
  };

  const getServeSymbol = (quality: ServeQuality): string => {
    const symbols: Record<ServeQuality, string> = {
      'serve-miss': '×',
      'setter-move': '○',
      'setter-pinpoint': '◎',
      'other-than-setter': '△',
      'red-star': '★',
      'black-star': '★',
      'dash': '━',
      'check1': '✓',
      'check2': '✓✓'
    };
    return symbols[quality] || '';
  };

  const getReceiveSymbol = (quality: ReceiveQuality): string => {
    const symbols: Record<ReceiveQuality, string> = {
      'setter-return': '◎',
      'no-return': '×',
      'setter-pinpoint': '○',
      'other-than-setter': '△'
    };
    return symbols[quality] || '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー（画像保存対象外） */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <ArrowLeft size={20} />
            <span>戻る</span>
          </button>

          <button
            onClick={saveAsImage}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            <Save size={20} />
            <span className="font-bold">画像保存</span>
          </button>
        </div>

        {/* 画像保存対象エリア */}
        <div id="match-detail-capture" className="space-y-6 p-6 bg-gray-100 rounded-2xl">
          {/* スコア表示エリア（大会名・対戦相手名含む） */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
            {/* 大会名・対戦相手名 */}
            <div className="mb-6 text-center space-y-2">
              <h1 className="text-3xl font-bold text-purple-600">
                {match.tournamentName || '大会名未設定'}
              </h1>
              <p className="text-xl text-gray-700">
                vs {match.opponent || '対戦相手未設定'}
              </p>
            </div>

            {/* セット選択 */}
            <div className="flex gap-2 mb-6 justify-center flex-wrap">
              {[0, 1, 2, 3, 4].map(index => (
                <button
                  key={index}
                  onClick={() => handleSetChange(index)}
                  className={`px-6 py-3 rounded-lg font-bold transition-all ${
                    currentSetIndex === index
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  第{index + 1}セット
                </button>
              ))}
            </div>

            {/* 得点表示 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 自チーム */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center">
                <div className="text-sm text-blue-600 font-semibold mb-2">自チーム</div>
                <div className="text-6xl font-bold text-blue-600 mb-4">{currentSet.ourScore}</div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => handleScoreChange('our', 1)}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-bold"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => handleScoreChange('our', -1)}
                    className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-bold"
                  >
                    -1
                  </button>
                </div>
              </div>

              {/* 切替ボタン */}
              <div className="flex items-center justify-center">
                <button
                  onClick={toggleServeTurn}
                  className={`px-8 py-4 rounded-xl font-bold text-2xl transition-all shadow-lg ${
                    serveTurn === 'S'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                      : 'bg-gradient-to-r from-orange-500 to-red-600 text-white'
                  }`}
                >
                  {serveTurn}
                </button>
              </div>

              {/* 相手チーム */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 text-center">
                <div className="text-sm text-red-600 font-semibold mb-2">相手チーム</div>
                <div className="text-6xl font-bold text-red-600 mb-4">{currentSet.opponentScore}</div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => handleScoreChange('opponent', 1)}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => handleScoreChange('opponent', -1)}
                    className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-bold"
                  >
                    -1
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* サーブ記録入力 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <Target className="text-blue-600" size={24} />
              <h3 className="text-xl font-bold text-gray-800">サーブ記録</h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={servePlayerId}
                  onChange={(e) => setServePlayerId(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">選手を選択</option>
                  {allPlayers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <select
                  value={serveQuality}
                  onChange={(e) => setServeQuality(e.target.value as ServeQuality)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="serve-miss">× ミス</option>
                  <option value="setter-move">○ セッター移動</option>
                  <option value="setter-pinpoint">◎ セッターピンポイント</option>
                  <option value="other-than-setter">△ セッター以外</option>
                  <option value="red-star">★(赤) ノータッチエース</option>
                  <option value="black-star">★(黒) 相手つなげず</option>
                  <option value="dash">━ サーブミス</option>
                  <option value="check1">✓ 1巡目</option>
                  <option value="check2">✓✓ 2巡目</option>
                </select>

                <select
                  value={serveRound}
                  onChange={(e) => setServeRound(Number(e.target.value) as 1 | 2 | 3)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value={1}>1巡目</option>
                  <option value={2}>2巡目</option>
                  <option value={3}>3巡目</option>
                </select>

                <button
                  onClick={addServeRecord}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all font-bold"
                >
                  記録
                </button>
              </div>
              
              <button
                onClick={undoLastServe}
                className="w-full md:w-auto px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all"
              >
                直前を取消
              </button>
            </div>
          </div>

          {/* レシーブ記録入力 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-green-100">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="text-green-600" size={24} />
              <h3 className="text-xl font-bold text-gray-800">レシーブ記録</h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={receivePlayerId}
                  onChange={(e) => setReceivePlayerId(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
                >
                  <option value="">選手を選択</option>
                  {allPlayers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <select
                  value={receiveQuality}
                  onChange={(e) => setReceiveQuality(e.target.value as ReceiveQuality)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
                >
                  <option value="setter-return">◎ セッターに返球</option>
                  <option value="no-return">× 返球できず</option>
                  <option value="setter-pinpoint">○ セッター○</option>
                  <option value="other-than-setter">△ セッター以外</option>
                </select>

                <button
                  onClick={addReceiveRecord}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all font-bold"
                >
                  記録
                </button>
              </div>
              
              <button
                onClick={undoLastReceive}
                className="w-full md:w-auto px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all"
              >
                直前を取消
              </button>
            </div>
          </div>

          {/* 交代履歴（上に配置） */}
          {currentSet.substitutions && currentSet.substitutions.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-purple-100">
              <div className="flex items-center gap-3 mb-4">
                <Users className="text-purple-600" size={24} />
                <h3 className="text-xl font-bold text-gray-800">交代履歴</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-purple-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-purple-700">OUT</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-purple-700">→</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-purple-700">IN</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-purple-700">スコア</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSet.substitutions.map((sub, idx) => (
                      <tr key={sub.id} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-4 py-3 text-sm">{sub.outPlayerName}</td>
                        <td className="px-4 py-3 text-center text-purple-500 font-bold">→</td>
                        <td className="px-4 py-3 text-sm">{sub.inPlayerName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{sub.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 選手交代入力（下に配置） */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-orange-100">
            <div className="flex items-center gap-3 mb-4">
              <UserPlus className="text-orange-600" size={24} />
              <h3 className="text-xl font-bold text-gray-800">選手交代</h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  value={benchPlayerName}
                  onChange={(e) => setBenchPlayerName(e.target.value)}
                  placeholder="OUT選手名"
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
                
                <input
                  type="text"
                  value={inPlayerName}
                  onChange={(e) => setInPlayerName(e.target.value)}
                  placeholder="IN選手名"
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
                
                <button
                  onClick={handleSubstitution}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all font-bold"
                >
                  交代登録
                </button>
              </div>
            </div>
          </div>

          {/* 選手成績一覧 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-indigo-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4">選手成績</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-indigo-50">
                    <th className="px-4 py-3 text-left font-semibold text-indigo-700">選手名</th>
                    <th className="px-2 py-3 text-center font-semibold text-indigo-700">サーブ合計</th>
                    <th className="px-2 py-3 text-center font-semibold text-indigo-700">×</th>
                    <th className="px-2 py-3 text-center font-semibold text-indigo-700">○</th>
                    <th className="px-2 py-3 text-center font-semibold text-indigo-700">◎</th>
                    <th className="px-2 py-3 text-center font-semibold text-indigo-700">△</th>
                    <th className="px-2 py-3 text-center font-semibold text-indigo-700 text-red-600">★</th>
                    <th className="px-2 py-3 text-center font-semibold text-indigo-700">★</th>
                    <th className="px-2 py-3 text-center font-semibold text-indigo-700">━</th>
                    <th className="px-2 py-3 text-center font-semibold text-indigo-700">✓</th>
                    <th className="px-2 py-3 text-center font-semibold text-indigo-700">✓✓</th>
                    <th className="px-2 py-3 text-center font-semibold text-indigo-700">レシーブ合計</th>
                    <th className="px-2 py-3 text-center font-semibold text-indigo-700">◎</th>
                    <th className="px-2 py-3 text-center font-semibold text-indigo-700">×</th>
                    <th className="px-2 py-3 text-center font-semibold text-indigo-700">○</th>
                    <th className="px-2 py-3 text-center font-semibold text-indigo-700">△</th>
                  </tr>
                </thead>
                <tbody>
                  {allPlayers.map((player, idx) => {
                    const stats = calculatePlayerStats(player.id);
                    if (!stats) return null;

                    return (
                      <tr key={player.id} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-4 py-3 font-medium">{stats.player.name}</td>
                        <td className="px-2 py-3 text-center font-bold">{stats.totalServes}</td>
                        <td className="px-2 py-3 text-center">{stats.serveDetails['serve-miss']}</td>
                        <td className="px-2 py-3 text-center">{stats.serveDetails['setter-move']}</td>
                        <td className="px-2 py-3 text-center">{stats.serveDetails['setter-pinpoint']}</td>
                        <td className="px-2 py-3 text-center">{stats.serveDetails['other-than-setter']}</td>
                        <td className="px-2 py-3 text-center text-red-600 font-bold">{stats.serveDetails['red-star']}</td>
                        <td className="px-2 py-3 text-center font-bold">{stats.serveDetails['black-star']}</td>
                        <td className="px-2 py-3 text-center">{stats.serveDetails['dash']}</td>
                        <td className="px-2 py-3 text-center">{stats.serveDetails['check1']}</td>
                        <td className="px-2 py-3 text-center">{stats.serveDetails['check2']}</td>
                        <td className="px-2 py-3 text-center font-bold">{stats.totalReceives}</td>
                        <td className="px-2 py-3 text-center">{stats.receiveDetails['setter-return']}</td>
                        <td className="px-2 py-3 text-center">{stats.receiveDetails['no-return']}</td>
                        <td className="px-2 py-3 text-center">{stats.receiveDetails['setter-pinpoint']}</td>
                        <td className="px-2 py-3 text-center">{stats.receiveDetails['other-than-setter']}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 記号説明 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-3">記号説明</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">サーブ</h4>
                <ul className="space-y-1 text-gray-700">
                  <li>× = ミス</li>
                  <li>○ = セッター移動</li>
                  <li>◎ = セッターピンポイント</li>
                  <li>△ = セッター以外</li>
                  <li><span className="text-red-600 font-bold">★</span> = ノータッチエース・相手はじく</li>
                  <li>★ = 相手受けたがつなげず</li>
                  <li>━ = サーブミス</li>
                  <li>✓ = 1巡目サーブ</li>
                  <li>✓✓ = 2巡目サーブ</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-green-600 mb-2">レシーブ</h4>
                <ul className="space-y-1 text-gray-700">
                  <li>◎ = セッターに返球</li>
                  <li>× = 返球できず</li>
                  <li>○ = セッター○</li>
                  <li>△ = セッター以外</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
