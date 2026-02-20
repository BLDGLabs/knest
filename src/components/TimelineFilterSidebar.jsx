import React, { useMemo } from 'react';
import SourceIcon, { SOURCE_CONFIG } from './SourceIcon';

const ASSIGNEE_AVATARS = {
  'Miti': '/avatars/miti.png',
  'miti': '/avatars/miti.png',
  'Jason': '/avatars/jason.png',
  'jason': '/avatars/jason.png',
};

const ASSIGNEE_INITIALS = {
  'Miti': 'M',
  'miti': 'M',
  'Jason': 'J',
  'jason': 'J',
};

const ASSIGNEE_COLORS = {
  'Miti': 'bg-purple-500/20 border-purple-500/40',
  'miti': 'bg-purple-500/20 border-purple-500/40',
  'Jason': 'bg-blue-500/20 border-blue-500/40',
  'jason': 'bg-blue-500/20 border-blue-500/40',
};

const TimelineFilterSidebar = ({ 
  tasks, 
  selectedAssignee, 
  onSelectAssignee,
  selectedSource,
  onSelectSource,
  showDone,
  onToggleShowDone
}) => {
  // Get unique assignees (optionally excluding Done tasks)
  const assignees = useMemo(() => {
    const activeTasks = showDone ? tasks : tasks.filter(t => t.column !== 'Done');
    const uniqueAssignees = [...new Set(activeTasks.map(t => t.assignedTo).filter(Boolean))];
    return uniqueAssignees.sort();
  }, [tasks, showDone]);

  // Get unique sources
  const sources = useMemo(() => {
    const activeTasks = showDone ? tasks : tasks.filter(t => t.column !== 'Done');
    const uniqueSources = [...new Set(activeTasks.map(t => t.source).filter(Boolean))];
    return uniqueSources.sort();
  }, [tasks, showDone]);

  // Get assignee initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return '?';
    if (ASSIGNEE_INITIALS[name]) return ASSIGNEE_INITIALS[name];
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Get assignee color (consistent hash-based color)
  const getAssigneeColor = (name) => {
    if (!name) return '#6B7280'; // gray for unassigned
    
    const colors = [
      '#3B82F6', // blue
      '#8B5CF6', // purple
      '#EC4899', // pink
      '#F59E0B', // amber
      '#10B981', // green
      '#6366F1', // indigo
      '#EF4444', // red
      '#14B8A6', // teal
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const allTasksCount = (showDone ? tasks : tasks.filter(t => t.column !== 'Done')).length;
  const unassignedCount = (showDone ? tasks : tasks.filter(t => t.column !== 'Done')).filter(t => !t.assignedTo || t.assignedTo === 'Unassigned').length;

  return (
    <div className="w-64 bg-dark-card border-r border-dark-border flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-dark-border">
        <h2 className="text-lg font-semibold text-white mb-1">Filters</h2>
        <p className="text-xs text-gray-400">Filter your timeline view</p>
      </div>

      {/* Filters */}
      <div className="flex-1 overflow-y-auto">
        {/* Show Done Toggle */}
        <div className="p-4 border-b border-dark-border">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={showDone}
              onChange={(e) => onToggleShowDone(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-dark-hover text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
            />
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
              Show completed tasks
            </span>
          </label>
        </div>

        {/* Assignee Filter */}
        <div className="p-4 border-b border-dark-border">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Assigned To
          </h3>
          <div className="space-y-1">
            <button
              onClick={() => onSelectAssignee('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedAssignee === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-dark-hover'
              }`}
            >
              <span>All Tasks</span>
              <span className={`text-xs ${selectedAssignee === 'all' ? 'text-blue-200' : 'text-gray-500'}`}>
                {allTasksCount}
              </span>
            </button>

            <button
              onClick={() => onSelectAssignee('unassigned')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedAssignee === 'unassigned'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-dark-hover'
              }`}
            >
              <span>Unassigned</span>
              <span className={`text-xs ${selectedAssignee === 'unassigned' ? 'text-blue-200' : 'text-gray-500'}`}>
                {unassignedCount}
              </span>
            </button>

            {assignees.map(assignee => {
              const count = (showDone ? tasks : tasks.filter(t => t.column !== 'Done')).filter(t => t.assignedTo === assignee).length;
              const color = getAssigneeColor(assignee);

              return (
                <button
                  key={assignee}
                  onClick={() => onSelectAssignee(assignee)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedAssignee === assignee
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-dark-hover'
                  }`}
                >
                  <div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold border overflow-hidden flex-shrink-0 ${
                      ASSIGNEE_COLORS[assignee] || 'bg-gray-500/20 border-gray-500/40'
                    }`}
                    style={{ backgroundColor: assignee && !ASSIGNEE_COLORS[assignee] ? color : undefined }}
                  >
                    {ASSIGNEE_AVATARS[assignee] ? (
                      <img 
                        src={ASSIGNEE_AVATARS[assignee]} 
                        alt={assignee}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <span 
                      className={`${ASSIGNEE_AVATARS[assignee] ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}
                    >
                      {getInitials(assignee)}
                    </span>
                  </div>
                  <span className="flex-1 text-left truncate">{assignee}</span>
                  <span className={`text-xs ${selectedAssignee === assignee ? 'text-blue-200' : 'text-gray-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Source Filter */}
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Source
          </h3>
          <div className="space-y-1">
            <button
              onClick={() => onSelectSource('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedSource === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-dark-hover'
              }`}
            >
              <span>All Sources</span>
            </button>

            {sources.map(source => {
              const count = (showDone ? tasks : tasks.filter(t => t.column !== 'Done')).filter(t => t.source === source).length;

              return (
                <button
                  key={source}
                  onClick={() => onSelectSource(source)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedSource === source
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-dark-hover'
                  }`}
                >
                  <SourceIcon source={source} size="md" />
                  <span className="flex-1 text-left capitalize">{source}</span>
                  <span className={`text-xs ${selectedSource === source ? 'text-blue-200' : 'text-gray-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineFilterSidebar;
