'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { User, Shield, Bell, Eye, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

interface SettingSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

const settingSections: SettingSection[] = [
  {
    id: 'account',
    title: 'アカウント',
    icon: <User size={20} />,
    description: 'プロフィール情報とアカウント設定'
  },
  {
    id: 'privacy',
    title: 'プライバシーとセキュリティ',
    icon: <Shield size={20} />,
    description: 'アカウントの公開設定とセキュリティ'
  },
  {
    id: 'notifications',
    title: '通知',
    icon: <Bell size={20} />,
    description: '通知の受信設定'
  },
  {
    id: 'display',
    title: '表示設定',
    icon: <Eye size={20} />,
    description: 'テーマや表示に関する設定'
  },
  {
    id: 'data',
    title: 'データ管理',
    icon: <Download size={20} />,
    description: 'データのエクスポートとインポート'
  }
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [activeSection, setActiveSection] = useState('account');
  const [isLoading, setIsLoading] = useState(false);
  
  // フォーム状態
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    bio: ''
  });

  // userDataが変更されたときにフォームデータを更新
  React.useEffect(() => {
    if (userData) {
      setFormData({
        displayName: userData.displayName || '',
        username: userData.username || '',
        bio: userData.bio || ''
      });
    }
  }, [userData]);

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900">ログインが必要です</h2>
          <p className="text-gray-600 mt-2">設定を変更するにはログインしてください。</p>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // 実際の保存処理をここに実装
      toast.success('設定を保存しました');
    } catch (error) {
      toast.error('設定の保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const renderAccountSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">基本情報</h3>
        <div className="space-y-4">
          <Input
            label="表示名"
            value={formData.displayName}
            onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
            placeholder="表示名を入力"
            fullWidth
          />
          <Input
            label="ユーザー名"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            placeholder="ユーザー名を入力"
            fullWidth
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              自己紹介
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="自己紹介を入力"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">メール設定</h3>
        <Input
          label="メールアドレス"
          type="email"
          value={user?.email || ''}
          placeholder="メールアドレス"
          fullWidth
          disabled
        />
        <p className="text-sm text-gray-500 mt-1">
          メールアドレスの変更は現在サポートされていません
        </p>
      </div>
    </div>
  );

  const renderPrivacySection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">プライバシー設定</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">プロフィール公開</h4>
              <p className="text-sm text-gray-500">プロフィールを一般公開する</p>
            </div>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer transition-colors duration-200">
              公開
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">投稿の公開範囲</h4>
              <p className="text-sm text-gray-500">投稿を見ることができる人を設定</p>
            </div>
            <select className="border border-gray-300 rounded-md px-3 py-2">
              <option>全員</option>
              <option>フォロワーのみ</option>
              <option>非公開</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">セキュリティ</h3>
        <div className="space-y-4">
          <Button variant="secondary" className="cursor-pointer">
            パスワードを変更
          </Button>
          <Button variant="secondary" className="cursor-pointer">
            二段階認証を設定
          </Button>
        </div>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">通知設定</h3>
      <div className="space-y-4">
        {[
          { title: 'いいねの通知', desc: '投稿にいいねがついた時' },
          { title: 'コメントの通知', desc: '投稿にコメントがついた時' },
          { title: 'フォローの通知', desc: '新しいフォロワーがついた時' },
          { title: 'メンションの通知', desc: '投稿でメンションされた時' }
        ].map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{item.title}</h4>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              defaultChecked
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderDisplaySection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">表示設定</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">テーマ</h4>
            <p className="text-sm text-gray-500">アプリのテーマを選択</p>
          </div>
          <select className="border border-gray-300 rounded-md px-3 py-2">
            <option>ライト</option>
            <option>ダーク</option>
            <option>システム設定に従う</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">フォントサイズ</h4>
            <p className="text-sm text-gray-500">表示するフォントのサイズ</p>
          </div>
          <select className="border border-gray-300 rounded-md px-3 py-2">
            <option>小</option>
            <option>標準</option>
            <option>大</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderDataSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">データ管理</h3>
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">データをエクスポート</h4>
              <p className="text-sm text-gray-500">あなたのデータをダウンロード</p>
            </div>
            <Button variant="secondary" className="cursor-pointer">
              <Download size={16} className="mr-2" />
              エクスポート
            </Button>
          </div>
        </div>

        <div className="border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-red-900">アカウントを削除</h4>
              <p className="text-sm text-red-600">この操作は取り消せません</p>
            </div>
            <Button variant="danger" className="cursor-pointer">
              <Trash2 size={16} className="mr-2" />
              削除
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'account':
        return renderAccountSection();
      case 'privacy':
        return renderPrivacySection();
      case 'notifications':
        return renderNotificationsSection();
      case 'display':
        return renderDisplaySection();
      case 'data':
        return renderDataSection();
      default:
        return renderAccountSection();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">設定</h1>
          <Button
            onClick={handleSave}
            isLoading={isLoading}
            className="cursor-pointer"
          >
            設定を保存
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* サイドバー */}
        <div className="md:w-1/3 lg:w-1/4">
          <div className="bg-white rounded-lg shadow">
            <nav className="p-2">
              {settingSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition-colors cursor-pointer ${
                    activeSection === section.id
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {section.icon}
                    <div>
                      <div className="font-medium">{section.title}</div>
                      <div className="text-sm opacity-75">{section.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="md:w-2/3 lg:w-3/4">
          <div className="bg-white rounded-lg shadow p-6">
            {renderSectionContent()}
          </div>
        </div>
      </div>
    </div>
  );
}