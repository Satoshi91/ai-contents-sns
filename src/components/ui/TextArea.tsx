import React, { forwardRef } from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  characterCount?: number;
  maxCharacters?: number;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, fullWidth = false, characterCount, maxCharacters, className = '', ...props }, ref) => {
    const widthClass = fullWidth ? 'w-full' : '';
    
    return (
      <div className={`${widthClass}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            block px-3 py-2 border border-gray-300 rounded-md shadow-sm 
            placeholder-gray-400 focus:outline-none focus:ring-blue-500 
            focus:border-blue-500 sm:text-sm resize-none
            ${error ? 'border-red-500' : ''}
            ${widthClass}
            ${className}
          `}
          {...props}
        />
        <div className="flex justify-between mt-1">
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          {characterCount !== undefined && maxCharacters && (
            <span className={`text-sm ${characterCount > maxCharacters ? 'text-red-600' : 'text-gray-500'}`}>
              {characterCount}/{maxCharacters}
            </span>
          )}
        </div>
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';