'use client';

import { Home, Search, TrendingUp, ChevronLeft, Bug } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
}

const menuItems: MenuItem[] = [
  {
    id: 'home',
    label: 'ホーム',
    icon: <Home size={24} />,
    href: '/home'
  },
  {
    id: 'search',
    label: '検索',
    icon: <Search size={24} />,
    href: '/search'
  },
  {
    id: 'ranking',
    label: 'ランキング',
    icon: <TrendingUp size={24} />,
    href: '/ranking'
  },
  {
    id: 'debug',
    label: 'デバッグ',
    icon: <Bug size={24} />,
    href: '/debug'
  }
];

export function Sidebar({ isOpen, onClose, onToggle }: SidebarProps) {
  const router = useRouter();

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
          w-64
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
            <h2 className="text-lg font-semibold text-gray-900">Twitter Clone</h2>
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* メニュー項目 */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
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