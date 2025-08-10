'use client';

import { Home, Search, TrendingUp, ChevronLeft, Bug, Heart, Hash, MessageSquare, Plus, Palette } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  requireAuth?: boolean;
  adminOnly?: boolean;
}

const menuItems: MenuItem[] = [
  {
    id: 'home',
    label: 'ホーム',
    icon: <Home size={24} />,
    href: '/home'
  },
  {
    id: 'chat',
    label: 'AIチャット',
    icon: <MessageSquare size={24} />,
    href: '/chat'
  },
  {
    id: 'illustrations',
    label: 'イラスト一覧',
    icon: <Palette size={24} />,
    href: '/illustrations'
  },
  {
    id: 'create-content',
    label: 'コンテンツ投稿',
    icon: <Plus size={24} />,
    href: '/content/create',
    requireAuth: true
  },
  {
    id: 'search',
    label: '検索(開発中)',
    icon: <Search size={24} />,
    href: '/search',
    adminOnly: true
  },
  {
    id: 'tags',
    label: 'タグ(開発中)',
    icon: <Hash size={24} />,
    href: '/tags',
    adminOnly: true
  },
  {
    id: 'likes',
    label: 'いいね一覧',
    icon: <Heart size={24} />,
    href: '/likes',
    requireAuth: true
  },
  {
    id: 'ranking',
    label: 'ランキング(開発中)',
    icon: <TrendingUp size={24} />,
    href: '/ranking',
    adminOnly: true
  },
  {
    id: 'debug',
    label: 'デバッグ(管理者)',
    icon: <Bug size={24} />,
    href: '/debug',
    adminOnly: true
  }
];

export function Sidebar({ isOpen, onClose, onToggle }: SidebarProps) {
  const router = useRouter();
  const { user, isAnonymous, isAdmin } = useAuth();
  
  console.log('Sidebar render, isOpen:', isOpen);

  const handleItemClick = (href: string) => {
    router.push(href);
    // デスクトップではサイドバーを閉じない、モバイルでは閉じる
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* オーバーレイ（モバイル時のみ） */}
      <div
        className={`
          fixed inset-0 bg-black z-40 md:hidden
          transition-opacity duration-300 ease-in-out
          ${isOpen ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* サイドバー */}
      <aside
        className={`
          fixed left-0 top-0 h-full bg-white shadow-lg z-50 
          transition-all duration-300 ease-in-out
          w-[266px]
          ${isOpen 
            ? 'transform translate-x-0 opacity-100' 
            : 'transform -translate-x-full opacity-0'
          }
        `}
        role="navigation"
        aria-label="メインナビゲーション"
      >
        {/* ヘッダー部分 */}
        <div className="border-b border-gray-200">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
            aria-label="サイドバーを閉じる"
          >
            <h2 className="text-lg font-semibold text-gray-900">VOICARISME(β)</h2>
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* メニュー項目 */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems
              .filter(item => {
                // 認証が必要な項目の判定
                if (item.requireAuth && (!user || isAnonymous)) {
                  return false;
                }
                // 管理者専用項目の判定
                if (item.adminOnly && !isAdmin) {
                  return false;
                }
                return true;
              })
              .map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleItemClick(item.href)}
                  className="cursor-pointer w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-left"
                  aria-label={`${item.label}に移動`}
                >
                  <span className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                    {item.icon}
                  </span>
                  <span className="text-gray-900 font-medium">
                    {item.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}