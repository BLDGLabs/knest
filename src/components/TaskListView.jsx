import { useState } from 'react';
import { Calendar, User, Tag, Flag, CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';

const PRIORITY_LEVELS = {
  urgent: { label: 'Urgent', color: 'bg-red-500', textColor: 'text-red-600', bgLight: 'bg-red-50', order: 1 },
  high: { label: 'High', color: 'bg-orange-500', textColor: 'text-orange-600', bgLight: 'bg-orange-50', order: 2 },
  medium: { label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-600', bgLight: 'bg-yellow-50', order: 3 },
  low: { label: 'Low', color: 'bg-blue-500', textColor: 'text-blue-600', bgLight: 'bg-blue-50', order: 4 },
  none: { label: 'None', color: 'bg-gray-300', textColor: 'text-gray-600', bgLight: 'bg-gray-50', order: 5 },
};

const TaskListView = ({ tasks, epics, onTaskClick, onTaskUpdate }) => {
  const [filter, setFilter] = useState('all'); // all, today, upcoming, overdue
  const [sortBy, setSortBy] = useState('priority'); // priority, dueDate, createdAt

  const getEpicById = (epicId) => epics.find(e => e.id === epicId);

  const getTaskPriority = (task) => {
    // Calculate priority based on due date, tags, and explicit priority
    if (task.priority) return task.priority;
    if (task.tags?.includes('urgent')) return 'urgent';
    if (task.tags?.includes('high')) return 'high';
    
    // Auto-prioritize based on due date
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue < 0) return 'urgent'; // Overdue
      if (daysUntilDue <= 1) return 'urgent'; // Due today or tomorrow
      if (daysUntilDue <= 3) return 'high';
      if (daysUntilDue <= 7) return 'medium';
    }
    
    return 'none';
  };

  const isOverdue = (task) => {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date() && task.column !== 'Done';
  };

  const isDueToday = (task) => {
    if (!task.dueDate) return false;
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    return today.toDateString() === dueDate.toDateString();
  };

  const isDueSoon = (task) => {
    if (!task.dueDate) return false;
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilDue > 0 && daysUntilDue <= 7;
  };

  const filterTasks = (tasks) => {
    let filtered = tasks.filter(task => task.column !== 'Done'); // Hide completed by default

    switch (filter) {
      case 'today':
        filtered = filtered.filter(task => isDueToday(task));
        break;
      case 'upcoming':
        filtered = filtered.filter(task => isDueSoon(task));
        break;
      case 'overdue':
        filtered = filtered.filter(task => isOverdue(task));
        break;
      default:
        // 'all' shows everything
        break;
    }

    return filtered;
  };

  const sortTasks = (tasks) => {
    const sorted = [...tasks];

    switch (sortBy) {
      case 'priority':
        sorted.sort((a, b) => {
          const priorityA = getTaskPriority(a);
          const priorityB = getTaskPriority(b);
          const orderDiff = PRIORITY_LEVELS[priorityA].order - PRIORITY_LEVELS[priorityB].order;
          
          // If same priority, sort by due date
          if (orderDiff === 0 && a.dueDate && b.dueDate) {
            return new Date(a.dueDate) - new Date(b.dueDate);
          }
          
          return orderDiff;
        });
        break;
      case 'dueDate':
        sorted.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
        break;
      case 'createdAt':
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        break;
    }

    return sorted;
  };

  const formatDueDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    const daysUntilDue = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    if (daysUntilDue < 0) return `${Math.abs(daysUntilDue)}d overdue`;
    if (daysUntilDue <= 7) return `${daysUntilDue}d`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const toggleComplete = (task) => {
    const newColumn = task.column === 'Done' ? 'Backlog' : 'Done';
    onTaskUpdate(task.id, { 
      column: newColumn,
      completedAt: newColumn === 'Done' ? new Date().toISOString() : null,
    });
  };

  const filteredAndSorted = sortTasks(filterTasks(tasks));

  return (
    <div className="h-full flex flex-col bg-dark-bg">
      {/* Header with filters and sort */}
      <div className="bg-dark-card border-b border-dark-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Tasks</h2>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-dark-hover border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="priority">Sort by Priority</option>
              <option value="dueDate">Sort by Due Date</option>
              <option value="createdAt">Sort by Created</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-dark-hover text-gray-400 hover:bg-dark-border'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('today')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-dark-hover text-gray-400 hover:bg-dark-border'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'bg-dark-hover text-gray-400 hover:bg-dark-border'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'overdue'
                ? 'bg-red-600 text-white'
                : 'bg-dark-hover text-gray-400 hover:bg-dark-border'
            }`}
          >
            Overdue
          </button>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredAndSorted.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No tasks to show</p>
              <p className="text-sm">Try changing your filters</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredAndSorted.map(task => {
              const priority = getTaskPriority(task);
              const priorityConfig = PRIORITY_LEVELS[priority];
              const epic = task.epicId ? getEpicById(task.epicId) : null;
              const overdue = isOverdue(task);

              return (
                <div
                  key={task.id}
                  className={`bg-dark-card rounded border-l-4 ${priorityConfig.color} hover:bg-dark-hover transition-colors cursor-pointer`}
                  onClick={() => onTaskClick(task)}
                >
                  <div className="px-3 py-2 flex items-center gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleComplete(task);
                      }}
                      className="flex-shrink-0"
                    >
                      {task.column === 'Done' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400 hover:text-gray-300" />
                      )}
                    </button>

                    {/* Priority dot */}
                    <div className={`w-2 h-2 rounded-full ${priorityConfig.color} flex-shrink-0`} title={priorityConfig.label} />

                    {/* Task title */}
                    <div className="flex-1 min-w-0">
                      <span className={`text-base font-medium ${task.column === 'Done' ? 'line-through text-gray-500' : 'text-white'} truncate block`}>
                        {task.title}
                      </span>
                    </div>

                    {/* Compact metadata */}
                    <div className="flex items-center gap-3 flex-shrink-0 text-sm text-white/70">
                      {/* Due date */}
                      {task.dueDate && (
                        <div className={`flex items-center gap-1 ${overdue ? 'text-red-500 font-medium' : ''}`}>
                          {overdue && <AlertCircle className="w-3 h-3" />}
                          <span>{formatDueDate(task.dueDate)}</span>
                        </div>
                      )}

                      {/* Assignee initial */}
                      {task.assignedTo && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium" title={task.assignedTo}>
                          {task.assignedTo.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Epic dot */}
                      {epic && (
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: epic.color }}
                          title={epic.name}
                        />
                      )}
                    </div>
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

export default TaskListView;
