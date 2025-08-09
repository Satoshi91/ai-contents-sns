import React from 'react';
import { User } from '@/types/user';
import { Work } from '@/types/work';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Calendar, Edit2, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { getImageURL } from '@/lib/cloudflare/images';

interface ProfileDisplayProps {
  user: User;
  works: Work[];
  isOwnProfile: boolean;
  onEditClick: () => void;
}

export function ProfileDisplay({ user, works, isOwnProfile, onEditClick }: ProfileDisplayProps) {
  const profileImageUrl = user.photoURL?.includes('profile-') 
    ? getImageURL(user.photoURL, 'profile')
    : user.photoURL;

  return (
    <div>
      <div className="h-32 bg-gradient-to-r from-blue-400 to-blue-600"></div>
      
      <div className="px-6 pb-6">
        <div className="flex justify-between items-start -mt-16 mb-4">
          <Avatar
            src={profileImageUrl}
            alt={user.displayName}
            size="xl"
            className="border-4 border-white"
          />
          
          {isOwnProfile && (
            <Button
              onClick={onEditClick}
              variant="secondary"
              size="sm"
              className="mt-20"
            >
              <Edit2 size={16} className="mr-1" />
              プロフィール編集
            </Button>
          )}
        </div>

        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{user.displayName}</h2>
          <p className="text-gray-500">@{user.username}</p>
        </div>

        {user.bio && (
          <p className="text-gray-700 mb-4 whitespace-pre-wrap">{user.bio}</p>
        )}

        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
          <div className="flex items-center">
            <Calendar size={16} className="mr-1" />
            <span>
              {format(user.createdAt, 'yyyy年M月', { locale: ja })}から利用
            </span>
          </div>
        </div>

        <div className="flex space-x-6 border-t pt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{works.length}</div>
            <div className="text-sm text-gray-500">作品</div>
          </div>
        </div>
      </div>

      {works.length > 0 && (
        <div className="border-t">
          <div className="px-6 py-3">
            <h3 className="text-lg font-semibold text-gray-900">作品</h3>
          </div>
          <div className="divide-y">
            {works.map((work) => (
              <div key={work.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex space-x-3">
                  <Avatar
                    src={work.userPhotoURL}
                    alt={work.displayName}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1 mb-1">
                      <span className="font-semibold text-gray-900 truncate">
                        {work.displayName}
                      </span>
                      <span className="text-gray-500">@{work.username}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-500 text-sm">
                        {format(work.createdAt, 'M月d日', { locale: ja })}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{work.title}</h4>
                    <p className="text-gray-700 whitespace-pre-wrap break-words">
                      {work.caption}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {works.length === 0 && (
        <div className="border-t px-6 py-12 text-center">
          <p className="text-gray-500">まだ作品がありません</p>
        </div>
      )}
    </div>
  );
}