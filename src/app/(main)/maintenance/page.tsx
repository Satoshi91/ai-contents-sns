'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Database, Users, FileText, AlertTriangle, Settings, Activity } from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  totalWorks: number;
  totalChats: number;
  storageUsed: string;
}

export default function MaintenancePage() {
  const { user, isAdmin } = useAuth();
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    totalWorks: 0,
    totalChats: 0,
    storageUsed: '0 MB'
  });
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    // 管理者権限チェック
    if (!isAdmin) {
      return;
    }

    // 仮のデータを設定（実際の実装では Firebase から取得）
    setSystemStats({
      totalUsers: 1250,
      totalWorks: 3480,
      totalChats: 15620,
      storageUsed: '2.3 GB'
    });
  }, [isAdmin]);

  // 管理者権限がない場合のアクセス拒否
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">アクセス拒否</h1>
            <p className="text-gray-600">
              このページは管理者専用です。適切な権限を持つアカウントでログインしてください。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Settings className="mr-3 h-8 w-8 text-blue-600" />
            サイトメンテナンス
          </h1>
          <p className="mt-2 text-gray-600">
            システムの運営管理とメンテナンス操作を実行できます。
          </p>
        </div>

        {/* システム統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">総ユーザー数</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">投稿作品数</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.totalWorks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">AIチャット数</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.totalChats}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ストレージ使用量</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.storageUsed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* メンテナンス設定 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* システム設定 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Settings className="mr-2 h-5 w-5 text-gray-600" />
                システム設定
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">メンテナンスモード</p>
                  <p className="text-sm text-gray-600">サイトを一時的にメンテナンス状態にします</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                  設定を保存
                </button>
              </div>
            </div>
          </div>

          {/* 緊急通知設定 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-gray-600" />
                緊急通知設定
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="notification-message" className="block text-sm font-medium text-gray-700 mb-2">
                  通知メッセージ
                </label>
                <textarea
                  id="notification-message"
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="緊急時にユーザーに表示するメッセージを入力してください"
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <button className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors duration-200">
                  緊急通知を送信
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* データベース管理 */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Database className="mr-2 h-5 w-5 text-gray-600" />
                データベース管理
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200">
                  バックアップ実行
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                  データ最適化
                </button>
                <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200">
                  キャッシュクリア
                </button>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>注意:</strong> データベース操作は慎重に実行してください。
                  バックアップ処理は通常1-5分程度かかります。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}