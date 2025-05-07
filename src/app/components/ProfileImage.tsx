'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ProfileImageProps {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
}

export default function ProfileImage({ 
  src, 
  alt, 
  size = 32, 
  className = ''
}: ProfileImageProps) {
  const [error, setError] = useState(false);
  const displayName = alt.trim() || 'User';
  const initial = displayName.charAt(0).toUpperCase();
  
  // Reset error when src changes
  useEffect(() => {
    setError(false);
  }, [src]);

  if (!src || error) {
    // Fallback to initials avatar
    return (
      <div 
        className={`h-${size/4} w-${size/4} rounded-full bg-indigo-500 flex items-center justify-center text-white ${className}`}
        style={{ width: size, height: size }}
      >
        {initial || 'U'}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      onError={() => setError(true)}
    />
  );
} 