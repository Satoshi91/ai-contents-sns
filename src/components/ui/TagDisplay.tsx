'use client';

import { WorkTag } from '@/types/tag';

interface TagDisplayProps {
  tags: WorkTag[];
  maxTags?: number;
  size?: 'sm' | 'md';
  onTagClick?: (tag: WorkTag) => void;
  className?: string;
}

export function TagDisplay({
  tags,
  maxTags = 10,
  size = 'sm',
  onTagClick,
  className = ''
}: TagDisplayProps) {
  const displayTags = maxTags ? tags.slice(0, maxTags) : tags;
  const remainingCount = tags.length - displayTags.length;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  };

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {displayTags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() => onTagClick?.(tag)}
          className={`
            ${sizeClasses[size]}
            inline-flex items-center rounded-full
            bg-blue-50 text-blue-700 border border-blue-200
            ${onTagClick ? 'cursor-pointer hover:bg-blue-100 hover:border-blue-300 transition-colors duration-200' : 'cursor-default'}
            font-medium
          `}
          style={{ backgroundColor: `${tag.color}20`, borderColor: `${tag.color}40`, color: tag.color }}
          disabled={!onTagClick}
        >
          #{tag.name}
        </button>
      ))}
      
      {remainingCount > 0 && (
        <span className={`
          ${sizeClasses[size]}
          inline-flex items-center rounded-full
          bg-gray-100 text-gray-600 border border-gray-200
          font-medium
        `}>
          +{remainingCount}
        </span>
      )}
    </div>
  );
}

interface SimpleTagDisplayProps {
  tags: string[];
  maxTags?: number;
  size?: 'sm' | 'md';
  onTagClick?: (tagName: string) => void;
  className?: string;
}

export function SimpleTagDisplay({
  tags,
  maxTags = 10,
  size = 'sm',
  onTagClick,
  className = ''
}: SimpleTagDisplayProps) {
  const displayTags = maxTags ? tags.slice(0, maxTags) : tags;
  const remainingCount = tags.length - displayTags.length;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  };

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {displayTags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onTagClick?.(tag)}
          className={`
            ${sizeClasses[size]}
            inline-flex items-center rounded-full
            bg-blue-50 text-blue-700 border border-blue-200
            ${onTagClick ? 'cursor-pointer hover:bg-blue-100 hover:border-blue-300 transition-colors duration-200' : 'cursor-default'}
            font-medium
          `}
          disabled={!onTagClick}
        >
          #{tag}
        </button>
      ))}
      
      {remainingCount > 0 && (
        <span className={`
          ${sizeClasses[size]}
          inline-flex items-center rounded-full
          bg-gray-100 text-gray-600 border border-gray-200
          font-medium
        `}>
          +{remainingCount}
        </span>
      )}
    </div>
  );
}