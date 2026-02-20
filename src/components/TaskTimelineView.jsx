import { useMemo } from 'react';

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

const TaskTimelineView = ({ tasks, onTaskClick, selectedAssignee, selectedSource, showDone }) => {
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

    // Filter by source
    if (selectedSource !== 'all') {
      filtered = filtered.filter(task => task.source === selectedSource);
    }

    // Sort by createdAt descending (newest first)
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [tasks, selectedAssignee, selectedSource, showDone]);

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
      {/* Simple Header */}
      <div className="bg-dark-card border-b border-dark-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Timeline</h2>
            <p className="text-sm text-gray-400 mt-1">Tasks by creation date</p>
          </div>
          <div className="text-sm text-gray-400">
            {displayedTasks.length} {displayedTasks.length === 1 ? 'task' : 'tasks'}
          </div>
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
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className={`text-base font-medium truncate group-hover:text-blue-400 transition-colors ${
                      task.column === 'Done' ? 'line-through text-gray-500' : 'text-white'
                    }`}>
                      {task.title}
                    </span>
                  </div>

                  {/* Source column */}
                  <span className="text-sm text-gray-400 w-24 text-center flex-shrink-0">
                    {task.source ? task.source.charAt(0).toUpperCase() + task.source.slice(1) : 'Manual'}
                  </span>

                  {/* Status and date columns - fixed widths */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Status badge */}
                    <span className={`w-28 px-2 py-1 rounded text-xs font-medium text-center ${
                      task.column === 'Done' 
                        ? 'bg-green-500/20 text-green-400'
                        : task.column === 'In Progress'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {task.column}
                    </span>

                    {/* Created date */}
                    <span className="text-sm text-gray-400 tabular-nums w-20 text-right">
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
