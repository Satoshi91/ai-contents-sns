'use client';

import { Home, Search, TrendingUp, ChevronLeft, Bug, Heart, Hash, MessageSquare, Plus, Palette, Settings, ChevronDown, ChevronRight, Wrench, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useState } from 'react';

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

interface ParentMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  children: MenuItem[];
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
    id: 'characters',
    label: 'キャラクター一覧',
    icon: <Users size={24} />,
    href: '/characters'
  },
  {
    id: 'create-content',
    label: 'コンテンツ投稿',
    icon: <Plus size={24} />,
    href: '/compose',
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
  }
];

const parentMenuItems: ParentMenuItem[] = [
  {
    id: 'admin',
    label: '管理者',
    icon: <Settings size={24} />,
    adminOnly: true,
    children: [
      {
        id: 'debug',
        label: 'デバッグ',
        icon: <Bug size={20} />,
        href: '/debug',
        adminOnly: true
      },
      {
        id: 'maintenance',
        label: 'メンテナンス',
        icon: <Wrench size={20} />,
        href: '/maintenance',
        adminOnly: true
      }
    ]
  }
];

export function Sidebar({ isOpen, onClose, onToggle }: SidebarProps) {
  const router = useRouter();
  const { user, isAnonymous, isAdmin } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  
  console.log('Sidebar render, isOpen:', isOpen);

  const handleItemClick = (href: string) => {
    router.push(href);
    // デスクトップではサイドバーを閉じない、モバイルでは閉じる
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const toggleParentItem = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
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
            {/* 通常のメニュー項目 */}
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
            
            {/* 階層構造メニュー項目 */}
            {parentMenuItems
              .filter(parentItem => {
                // 管理者専用項目の判定
                if (parentItem.adminOnly && !isAdmin) {
                  return false;
                }
                return true;
              })
              .map((parentItem) => (
              <li key={parentItem.id}>
                {/* 親項目 */}
                <button
                  onClick={() => toggleParentItem(parentItem.id)}
                  className="cursor-pointer w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-left"
                  aria-label={`${parentItem.label}を展開`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                      {parentItem.icon}
                    </span>
                    <span className="text-gray-900 font-medium">
                      {parentItem.label}
                    </span>
                  </div>
                  <span className="text-gray-400 transition-transform duration-300 ease-in-out">
                    {expandedItems.includes(parentItem.id) ? (
                      <ChevronDown size={16} className="transform rotate-0" />
                    ) : (
                      <ChevronRight size={16} className="transform rotate-0" />
                    )}
                  </span>
                </button>
                
                {/* 子項目 */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedItems.includes(parentItem.id)
                      ? 'max-h-96 opacity-100 mt-2'
                      : 'max-h-0 opacity-0 mt-0'
                  }`}
                >
                  <ul className="ml-4 space-y-1">
                    {parentItem.children
                      .filter(child => {
                        // 認証が必要な項目の判定
                        if (child.requireAuth && (!user || isAnonymous)) {
                          return false;
                        }
                        // 管理者専用項目の判定
                        if (child.adminOnly && !isAdmin) {
                          return false;
                        }
                        return true;
                      })
                      .map((child) => (
                      <li key={child.id}>
                        <button
                          onClick={() => handleItemClick(child.href)}
                          className="cursor-pointer w-full flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left"
                          aria-label={`${child.label}に移動`}
                        >
                          <span className="text-gray-500 hover:text-blue-600 transition-colors duration-200">
                            {child.icon}
                          </span>
                          <span className="text-gray-800 font-normal text-sm">
                            {child.label}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}