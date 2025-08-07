'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types/user';
import { User as UserIcon, Settings, LogOut, UserCircle } from 'lucide-react';
import { getImageURL } from '@/lib/cloudflare/images';

interface ProfileDropdownProps {
  user: User;
  profileImageUrl?: string | null;
  onLogout: () => void;
}

export function ProfileDropdown({ user, profileImageUrl, onLogout }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  const handleProfileClick = () => {
    setIsOpen(false);
    router.push(`/profile/${user.username}`);
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
    router.push(`/profile/${user.username}`);
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    onLogout();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        title={`${user.displayName}のプロフィール`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {profileImageUrl ? (
          <img
            src={profileImageUrl}
            alt={user.displayName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <UserCircle
            size={32}
            className="text-gray-600"
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 transform transition-all duration-200 ease-out scale-100 opacity-100 animate-in slide-in-from-top-2 fade-in-0">
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={user.displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <UserCircle
                  size={40}
                  className="text-gray-600"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.displayName}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  @{user.username}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={handleProfileClick}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <UserIcon size={16} className="mr-3" />
              マイページ
            </button>
            
            <button
              onClick={handleSettingsClick}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Settings size={16} className="mr-3" />
              設定
            </button>
          </div>

          {/* Logout Section */}
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={handleLogoutClick}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} className="mr-3" />
              ログアウト
            </button>
          </div>
        </div>
      )}
    </div>
  );
}