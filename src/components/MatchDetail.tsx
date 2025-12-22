import React, { useState } from 'react';
import { Match, Player, ServeQuality, ReceiveQuality } from '../types';
import { ArrowLeft, Save, UserPlus, Users } from 'lucide-react';
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
  'check1': number;
  'check2': number;
};

type ReceiveDetailsType = {
  'setter-return': number;
  'no-return': number;
  'setter-pinpoint': number;
  'other-than-setter': number;
};

export default function MatchDetail({ match, onBack, onUpdate }: MatchDetailProps) {
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const currentSet = match.sets[currentSetIndex];

  const [benchPlayerName, setBenchPlayerName] = useState('');
  const [inPlayerName, setInPlayerName] = useState('');
  const [serveTurn, setServeTurn] = useState<'S' | 'R'>('S');

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

  const addRecord = (playerId: string, type: 'serve' | 'receive', quality: ServeQuality | ReceiveQuality) => {
    const updatedMatch = { ...match };
    const set = updatedMatch.sets[currentSetIndex];

    if (type === 'serve') {
      set.serves = set.serves || [];
      set.serves.push({
        id: Date.now().toString(),
        playerId: playerId,
        quality: quality as ServeQuality,
        round: 1
      });
    } else {
      set.receives = set.receives || [];
      set.receives.push({
        id: Date.now().toString(),
        playerId: playerId,
        quality: quality as ReceiveQuality,
        round: 1
      });
    }

    onUpdate(updatedMatch);
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
    const serveDetails: ServeDetailsType = {
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
    const receiveDetails: ReceiveDetailsType = {
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

          {/* 選手ごとの記録欄 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-indigo-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4">選手記録</h3>
            
            {allPlayers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>選手交代で選手を追加してください</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allPlayers.map((player) => (
                  <div key={player.id} className="border-2 border-gray-200 rounded-xl p-4">
                    <h4 className="text-lg font-bold text-gray-800 mb-3">{player.name}</h4>
                    
                    {/* サーブ記録ボタン */}
                    <div className="mb-3">
                      <div className="text-sm font-semibold text-blue-600 mb-2">サーブ</div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => addRecord(player.id, 'serve', 'serve-miss')}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                        >
                          ×
                        </button>
                        <button
                          onClick={() => addRecord(player.id, 'serve', 'setter-move')}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                        >
                          ○
                        </button>
                        <button
                          onClick={() => addRecord(player.id, 'serve', 'setter-pinpoint')}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                        >
                          ◎
                        </button>
                        <button
                          onClick={() => addRecord(player.id, 'serve', 'other-than-setter')}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                        >
                          △
                        </button>
                        <button
                          onClick={() => addRecord(player.id, 'serve', 'red-star')}
                          className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors text-red-600"
                        >
                          ★
                        </button>
                        <button
                          onClick={() => addRecord(player.id, 'serve', 'black-star')}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                        >
                          ★
                        </button>
                        <button
                          onClick={() => addRecord(player.id, 'serve', 'dash')}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                        >
                          ━
                        </button>
                        <button
                          onClick={() => addRecord(player.id, 'serve', 'check1')}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => addRecord(player.id, 'serve', 'check2')}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                        >
                          ✓✓
                        </button>
                      </div>
                    </div>

                    {/* レシーブ記録ボタン */}
                    <div>
                      <div className="text-sm font-semibold text-green-600 mb-2">レシーブ</div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => addRecord(player.id, 'receive', 'setter-return')}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                        >
                          ◎
                        </button>
                        <button
                          onClick={() => addRecord(player.id, 'receive', 'no-return')}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                        >
                          ×
                        </button>
                        <button
                          onClick={() => addRecord(player.id, 'receive', 'setter-pinpoint')}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                        >
                          ○
                        </button>
                        <button
                          onClick={() => addRecord(player.id, 'receive', 'other-than-setter')}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                        >
                          △
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
