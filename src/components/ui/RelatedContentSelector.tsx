'use client';

import { useState, useEffect } from 'react';
import { Content } from '@/types/content';
import { getUserContents } from '@/lib/firebase/contents';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Mic, FileText, Image, Play, Trash2, Plus } from 'lucide-react';

interface RelatedContentSelectorProps {
  selectedContentIds: string[];
  onSelectionChange: (contentIds: string[]) => void;
  userId?: string;
  disabled?: boolean;
}

const ContentTypeIcon = ({ type }: { type: Content['type'] }) => {
  const iconProps = { size: 16, className: 'text-gray-500' };
  
  switch (type) {
    case 'voice':
      return <Mic {...iconProps} />;
    case 'script':
      return <FileText {...iconProps} />;
    case 'image':
      return <Image {...iconProps} />;
    case 'work':
      return <Play {...iconProps} />;
    default:
      return null;
  }
};

const getContentTypeLabel = (type: Content['type']) => {
  switch (type) {
    case 'voice':
      return 'ボイス';
    case 'script':
      return 'スクリプト';
    case 'image':
      return 'イラスト';
    case 'work':
      return '作品';
    default:
      return type;
  }
};

export function RelatedContentSelector({
  selectedContentIds,
  onSelectionChange,
  userId,
  disabled = false
}: RelatedContentSelectorProps) {
  const [availableContents, setAvailableContents] = useState<Content[]>([]);
  const [selectedContents, setSelectedContents] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  // Load user's available contents
  useEffect(() => {
    const loadContents = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Get all user's contents except work type (to avoid recursive selection)
        const [voices, scripts, images] = await Promise.all([
          getUserContents(userId, 'voice', 50),
          getUserContents(userId, 'script', 50), 
          getUserContents(userId, 'image', 50),
        ]);
        
        const allContents = [...voices, ...scripts, ...images]
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        setAvailableContents(allContents);
        
        // Update selected contents based on selectedContentIds
        const selected = allContents.filter(content => 
          selectedContentIds.includes(content.id)
        );
        setSelectedContents(selected);
        
      } catch (error) {
        console.error('コンテンツ読み込みエラー:', error);
        setError('コンテンツの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    loadContents();
  }, [userId, selectedContentIds]);

  const handleContentToggle = (content: Content) => {
    const isSelected = selectedContentIds.includes(content.id);
    
    if (isSelected) {
      // Remove from selection
      const newSelectedIds = selectedContentIds.filter(id => id !== content.id);
      const newSelectedContents = selectedContents.filter(c => c.id !== content.id);
      
      onSelectionChange(newSelectedIds);
      setSelectedContents(newSelectedContents);
    } else {
      // Add to selection
      const newSelectedIds = [...selectedContentIds, content.id];
      const newSelectedContents = [...selectedContents, content];
      
      onSelectionChange(newSelectedIds);
      setSelectedContents(newSelectedContents);
    }
  };

  const handleRemoveSelected = (contentId: string) => {
    const newSelectedIds = selectedContentIds.filter(id => id !== contentId);
    const newSelectedContents = selectedContents.filter(c => c.id !== contentId);
    
    onSelectionChange(newSelectedIds);
    setSelectedContents(newSelectedContents);
  };

  if (!userId) {
    return (
      <div className="text-center py-6 text-gray-500">
        <p>ログインが必要です</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selected contents display */}
      {selectedContents.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            選択中のコンテンツ ({selectedContents.length})
          </h4>
          <div className="space-y-2">
            {selectedContents.map((content) => (
              <div key={content.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <ContentTypeIcon type={content.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {content.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getContentTypeLabel(content.type)}
                    </p>
                  </div>
                </div>
                {!disabled && (
                  <button
                    onClick={() => handleRemoveSelected(content.id)}
                    className="ml-2 p-1 text-red-500 hover:text-red-700 cursor-pointer transition-colors duration-200"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add content button */}
      {!disabled && (
        <Button
          onClick={() => setShowSelector(!showSelector)}
          variant="outline"
          className="w-full cursor-pointer hover:bg-gray-50 transition-colors duration-200"
        >
          <Plus size={16} className="mr-2" />
          コンテンツを追加
        </Button>
      )}

      {/* Content selector modal/dropdown */}
      {showSelector && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">
              コンテンツを選択
            </h4>
            <button
              onClick={() => setShowSelector(false)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200"
            >
              ×
            </button>
          </div>
          
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="flex items-center space-x-3 p-3">
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-4 text-red-600">
              <p>{error}</p>
            </div>
          ) : availableContents.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>コンテンツがありません</p>
              <p className="text-xs mt-1">
                まずはボイス、スクリプト、イラストを投稿してください
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {availableContents.map((content) => {
                const isSelected = selectedContentIds.includes(content.id);
                
                return (
                  <button
                    key={content.id}
                    onClick={() => handleContentToggle(content)}
                    className={`
                      w-full flex items-center space-x-3 p-3 rounded-lg text-left
                      transition-colors duration-200 cursor-pointer
                      ${isSelected 
                        ? 'bg-blue-100 border border-blue-300' 
                        : 'hover:bg-gray-50 border border-transparent'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by button onClick
                      className="text-blue-600"
                    />
                    <ContentTypeIcon type={content.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {content.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getContentTypeLabel(content.type)} • {content.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedContents.length === 0 && (
        <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-500">
          <Plus size={24} className="mx-auto mb-2" />
          <p className="text-sm">関連コンテンツを選択してください</p>
          <p className="text-xs mt-1">
            ボイス、スクリプト、イラストから組み合わせて作品を作成
          </p>
        </div>
      )}
    </div>
  );
}