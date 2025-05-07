import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export default function Loader({ 
  size = 'md', 
  color = 'indigo', 
  className = '' 
}: LoaderProps) {
  const sizeMap = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-3',
    lg: 'h-12 w-12 border-4'
  };

  const colorMap = {
    indigo: 'border-indigo-600 border-t-transparent',
    gray: 'border-gray-600 border-t-transparent',
    white: 'border-white border-t-transparent'
  };

  const sizeClass = sizeMap[size];
  const colorClass = colorMap[color as keyof typeof colorMap] || colorMap.indigo;

  return (
    <div 
      className={`animate-spin rounded-full ${sizeClass} ${colorClass} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
} 