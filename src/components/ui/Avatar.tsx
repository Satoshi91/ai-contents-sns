import React from 'react';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, alt = 'Avatar', size = 'md', className = '' }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const placeholderSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-xl',
  };

  if (src) {
    return (
      <div className={`relative ${sizes[size]} ${className}`}>
        <Image
          src={src}
          alt={alt}
          fill
          className="rounded-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`
        ${sizes[size]} 
        rounded-full bg-gray-300 flex items-center justify-center
        ${className}
      `}
    >
      <span className={`text-gray-600 font-semibold ${placeholderSizes[size]}`}>
        {alt.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}