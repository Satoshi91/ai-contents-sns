import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({ children, className = '', onClick, hoverable = false }: CardProps) {
  const hoverClass = hoverable ? 'hover:bg-gray-50 cursor-pointer transition-colors duration-200' : '';
  
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${hoverClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}