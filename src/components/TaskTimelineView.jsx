import { useState, useMemo } from 'react';

// Avatar images - stored in public/avatars/
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

const TaskTimelineView = ({ tasks, onTaskClick }) => {
  const [selectedAssignee, setSelectedAssignee] = useState('all');
  const [showDone, setShowDone] = useState(false);

  // Get unique assignees (optionally excluding Done tasks)
  const assignees = useMemo(() => {
    const activeTasks = showDone ? tasks : tasks.filter(t => t.column !== 'Done');
    const uniqueAssignees = [...new Set(activeTasks.map(t => t.assignedTo).filter(Boolean))];
    return uniqueAssignees.sort();
  }, [tasks, showDone]);

  // Filter and sort tasks
  const displayedTasks = useMemo(() => {
    // Optionally filter out Done tasks
    let filtered = showDone ? tasks : tasks.filter(task => task.column !== 'Done');

    // Filter by assignee
    if (selectedAssignee !== 'all') {
      if (selectedAssignee === 'unassigned') {
        filtered = filtered.filter(task => !task.assignedTo || task.assignedTo === 'Unassigned');
      } else {
        filtered = filtered.filter(task => task.assignedTo === selectedAssignee);
      }
    }

    // Sort by createdAt descending (newest first)
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [tasks, selectedAssignee, showDone]);

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

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
    });
  };

  return (
    <div className="h-full flex flex-col bg-dark-bg">
      {/* Header with assignee filter */}
      <div className="bg-dark-card border-b border-dark-border p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Timeline</h2>
            <p className="text-sm text-gray-400 mt-1">Tasks by creation date</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Show Done toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDone}
                onChange={(e) => setShowDone(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-dark-hover text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
              />
              <span className="text-sm text-gray-400">Show Done</span>
            </label>
            <div className="text-sm text-gray-400">
              {displayedTasks.length} {displayedTasks.length === 1 ? 'task' : 'tasks'}
            </div>
          </div>
        </div>

        {/* Assignee filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mb-2">
          <button
            onClick={() => setSelectedAssignee('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              selectedAssignee === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-dark-hover text-gray-400 hover:bg-dark-border'
            }`}
          >
            All ({(showDone ? tasks : tasks.filter(t => t.column !== 'Done')).length})
          </button>
          <button
            onClick={() => setSelectedAssignee('unassigned')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              selectedAssignee === 'unassigned'
                ? 'bg-blue-600 text-white'
                : 'bg-dark-hover text-gray-400 hover:bg-dark-border'
            }`}
          >
            Unassigned ({(showDone ? tasks : tasks.filter(t => t.column !== 'Done')).filter(t => !t.assignedTo || t.assignedTo === 'Unassigned').length})
          </button>
          {assignees.map(assignee => (
            <button
              key={assignee}
              onClick={() => setSelectedAssignee(assignee)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                selectedAssignee === assignee
                  ? 'bg-blue-600 text-white'
                  : 'bg-dark-hover text-gray-400 hover:bg-dark-border'
              }`}
            >
              <div 
                className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold border overflow-hidden ${
                  ASSIGNEE_COLORS[assignee] || 'bg-gray-500/20 border-gray-500/40'
                }`}
                style={{ 
                  backgroundColor: assignee && !ASSIGNEE_COLORS[assignee] ? getAssigneeColor(assignee) : undefined 
                }}
              >
                {ASSIGNEE_AVATARS[assignee] ? (
                  <img 
                    src={ASSIGNEE_AVATARS[assignee]} 
                    alt={assignee}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span 
                  className={`${ASSIGNEE_AVATARS[assignee] ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}
                >
                  {getInitials(assignee)}
                </span>
              </div>
              {assignee} ({(showDone ? tasks : tasks.filter(t => t.column !== 'Done')).filter(t => t.assignedTo === assignee).length})
            </button>
          ))}
        </div>
      </div>

      {/* Timeline list */}
      <div className="flex-1 overflow-y-auto">
        {displayedTasks.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg">No tasks found</p>
              <p className="text-sm">Try changing your filter</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-dark-border">
            {displayedTasks.map(task => {
              const assignee = task.assignedTo || 'Unassigned';
              const color = getAssigneeColor(task.assignedTo);

              return (
                <div
                  key={task.id}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-dark-card/50 transition-colors cursor-pointer group"
                  onClick={() => onTaskClick(task)}
                >
                  {/* Assignee avatar */}
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-lg border-2 overflow-hidden ${
                      ASSIGNEE_COLORS[task.assignedTo] || 'bg-gray-500/20 border-gray-500/40'
                    }`}
                    style={{ backgroundColor: task.assignedTo && !ASSIGNEE_COLORS[task.assignedTo] ? color : undefined }}
                    title={assignee}
                  >
                    {ASSIGNEE_AVATARS[task.assignedTo] ? (
                      <img 
                        src={ASSIGNEE_AVATARS[task.assignedTo]} 
                        alt={task.assignedTo}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <span 
                      className={`${ASSIGNEE_AVATARS[task.assignedTo] ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}
                    >
                      {getInitials(task.assignedTo)}
                    </span>
                  </div>

                  {/* Task title */}
                  <div className="flex-1 min-w-0">
                    <span className={`text-base font-medium block truncate group-hover:text-blue-400 transition-colors ${
                      task.column === 'Done' ? 'line-through text-gray-500' : 'text-white'
                    }`}>
                      {task.title}
                    </span>
                  </div>

                  {/* Date + status badge */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Status badge */}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      task.column === 'Done' 
                        ? 'bg-green-500/20 text-green-400'
                        : task.column === 'In Progress'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {task.column}
                    </span>

                    {/* Created date */}
                    <span className="text-sm text-gray-400 tabular-nums min-w-[80px] text-right">
                      {formatDate(task.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskTimelineView;
