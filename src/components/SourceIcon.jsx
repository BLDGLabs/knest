// Source icon component with logo support
import React from 'react';

const SOURCE_CONFIG = {
  'manual': {
    emoji: '✏️',
    logo: null,
    color: '#6B7280',
    name: 'Manual',
  },
  'slack': {
    emoji: '💬',
    logo: 'https://cdn.simpleicons.org/slack/4A154B',
    color: '#4A154B',
    name: 'Slack',
  },
  'jira': {
    emoji: '📋',
    logo: 'https://cdn.simpleicons.org/jira/0052CC',
    color: '#0052CC',
    name: 'Jira',
  },
  'github': {
    emoji: '🐙',
    logo: 'https://cdn.simpleicons.org/github/181717',
    color: '#181717',
    name: 'GitHub',
  },
  'email': {
    emoji: '📧',
    logo: 'https://cdn.simpleicons.org/gmail/EA4335',
    color: '#EA4335',
    name: 'Email',
  },
};

const SourceIcon = ({ source, size = 'md', showLabel = false }) => {
  const config = SOURCE_CONFIG[source] || {
    emoji: '📄',
    logo: null,
    color: '#6B7280',
    name: source || 'Unknown',
  };

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="flex items-center gap-2">
      {config.logo ? (
        <img
          src={config.logo}
          alt={config.name}
          className={`${sizeClass} object-contain`}
          style={{
            filter: 'brightness(0) saturate(100%) invert(1)', // Make logos white for dark theme
          }}
          onError={(e) => {
            // Fallback to emoji if image fails to load
            e.target.style.display = 'none';
            if (e.target.nextSibling) {
              e.target.nextSibling.style.display = 'inline';
            }
          }}
        />
      ) : null}
      <span
        className={`${config.logo ? 'hidden' : 'inline'} text-${size === 'sm' ? 'base' : size === 'lg' ? 'xl' : size === 'xl' ? '2xl' : 'lg'}`}
      >
        {config.emoji}
      </span>
      {showLabel && (
        <span className="text-sm">{config.name}</span>
      )}
    </div>
  );
};

export default SourceIcon;
export { SOURCE_CONFIG };
