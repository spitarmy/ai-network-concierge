import React from 'react';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  className = '',
}) => {
  const getInitials = (n: string) => {
    if (!n) return '人';
    const clean = n.replace(/\s+/g, '');
    return clean.slice(0, 2);
  };

  const getGradient = (n: string) => {
    const gradients = [
      'from-emerald-500 to-teal-700',
      'from-indigo-500 to-blue-700',
      'from-purple-500 to-pink-600',
      'from-amber-500 to-orange-600',
      'from-sky-500 to-indigo-600',
      'from-rose-500 to-pink-700',
      'from-cyan-500 to-teal-600',
    ];
    let hash = 0;
    for (let i = 0; i < (n || '').length; i++) {
      hash = n.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs rounded-xl',
    md: 'w-10 h-10 text-xs rounded-xl',
    lg: 'w-14 h-14 text-sm rounded-2xl',
    xl: 'w-16 h-16 text-base rounded-2xl',
  };

  const isCustomPhoto = avatarUrl && avatarUrl.trim().length > 0 && !avatarUrl.includes('photo-1534528741775');

  if (isCustomPhoto) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClasses[size]} object-cover shadow-xs border border-apple-border dark:border-apple-darkBorder ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} bg-gradient-to-br ${getGradient(name)} text-white font-bold flex items-center justify-center shadow-xs select-none tracking-tight ${className}`}
      title={name}
    >
      <span>{getInitials(name)}</span>
    </div>
  );
};
