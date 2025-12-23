import React from 'react';
import { Volleyball, ClipboardList, Users } from 'lucide-react';

interface HomePageProps {
  onNavigateToMatches: () => void;
  onNavigateToPlayers: () => void;
}

export default function HomePage({ onNavigateToMatches, onNavigateToPlayers }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Volleyball size={60} className="text-purple-600" />
            <h1 className="text-5xl font-bold text-gray-800">バレーボール記録</h1>
          </div>
          <p className="text-xl text-gray-600">試合記録と選手統計を管理</p>
        </div>

        {/* メニューボタン */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 試合一覧ボタン */}
          <button
            onClick={onNavigateToMatches}
            className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all p-8 border-2 border-purple-200 group"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <ClipboardList size={40} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors">
                試合一覧
              </h2>
              <p className="text-gray-600 text-center">
                試合の記録・編集・閲覧
              </p>
            </div>
          </button>

          {/* 選手記録ボタン */}
          <button
            onClick={onNavigateToPlayers}
            className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all p-8 border-2 border-blue-200 group"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users size={40} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                選手記録
              </h2>
              <p className="text-gray-600 text-center">
                選手ごとの統計データ
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
