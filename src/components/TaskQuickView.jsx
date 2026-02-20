import React, { useEffect } from 'react';
import SourceIcon from './SourceIcon';

const TAG_COLORS = {
  bug: 'bg-red-500/20 text-red-400 border-red-500/30',
  feature: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  improvement: 'bg-green-500/20 text-green-400 border-green-500/30',
  urgent: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  documentation: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const ASSIGNEE_COLORS = {
  'Miti': 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  'miti': 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  'Jason': 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  'jason': 'bg-blue-500/20 text-blue-400 border-blue-500/40',
};

const ASSIGNEE_AVATARS = {
  'Miti': '/avatars/miti.png',
  'miti': '/avatars/miti.png',
  'Jason': '/avatars/jason.png',
  'jason': '/avatars/jason.png',
};

const SOURCE_LABELS = {
  'manual': 'Manual',
  'slack': 'Slack',
  'jira': 'Jira',
  'github': 'GitHub',
  'email': 'Email',
};

const TaskQuickView = ({ task, epic, allTasks, onClose, onEdit, onDelete }) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on click outside
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get dependency tasks
  const getDependencyTasks = () => {
    if (!task.dependsOn || task.dependsOn.length === 0 || !allTasks) return [];
    return task.dependsOn
      .map(depId => allTasks.find(t => t.id === depId))
      .filter(Boolean);
  };

  const dependencyTasks = getDependencyTasks();

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-dark-card border border-dark-border/60 rounded-t-2xl md:rounded-xl w-full md:max-w-lg max-h-[85vh] overflow-hidden shadow-2xl shadow-black/50 animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-200">
        {/* Header */}
        <div className="border-b border-dark-border/50 p-4 md:p-5 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-xl font-semibold text-white leading-tight">
              {task.title}
            </h2>
            {epic && (
              <div className="flex items-center gap-2 mt-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: epic.color }}
                />
                <span className="text-sm text-gray-400">{epic.name}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => {
                if (window.confirm('Delete this task?')) {
                  onDelete(task.id);
                  onClose();
                }
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-5 space-y-5 overflow-y-auto max-h-[calc(85vh-80px)]">
          {/* Description */}
          {task.description && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Description
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {/* Assigned To */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Assigned To
            </h3>
            {task.assignedTo ? (
              <div className="flex items-center gap-3">
                <div 
                  className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold border-2 overflow-hidden ${ASSIGNEE_COLORS[task.assignedTo] || 'bg-gray-500/20 text-gray-400 border-gray-500/40'}`}
                >
                  {ASSIGNEE_AVATARS[task.assignedTo] ? (
                    <img 
                      src={ASSIGNEE_AVATARS[task.assignedTo]} 
                      alt={task.assignedTo}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span 
                    className={`${ASSIGNEE_AVATARS[task.assignedTo] ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}
                  >
                    {task.assignedTo?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-white font-medium">{task.assignedTo}</span>
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">Unassigned</p>
            )}
          </div>

          {/* Source */}
          {task.source && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Source
              </h3>
              <div className="flex items-center gap-2">
                <SourceIcon source={task.source} size="lg" />
                <span className="text-white font-medium">{SOURCE_LABELS[task.source]}</span>
              </div>
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`text-xs px-3 py-1.5 rounded-md border ${TAG_COLORS[tag] || TAG_COLORS.feature} font-medium`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dependencies */}
          {dependencyTasks.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Dependencies
              </h3>
              <div className="space-y-2">
                {dependencyTasks.map(depTask => (
                  <div 
                    key={depTask.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 bg-dark-hover/50 border border-dark-border/30 rounded-lg"
                  >
                    <span className="text-sm text-gray-300 truncate">{depTask.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${
                      depTask.column === 'Review' 
                        ? 'bg-green-600/20 text-green-400' 
                        : 'bg-orange-600/20 text-orange-400'
                    }`}>
                      {depTask.column === 'Review' ? '✓ Done' : depTask.column}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meta info */}
          <div className="pt-3 border-t border-dark-border/30">
            <div className="flex flex-col gap-1 text-xs text-gray-500">
              <div className="flex items-center justify-between">
                <span>Created</span>
                <span className="text-gray-400">{formatDate(task.createdAt)}</span>
              </div>
              {task.updatedAt && task.updatedAt !== task.createdAt && (
                <div className="flex items-center justify-between">
                  <span>Updated</span>
                  <span className="text-gray-400">{formatDate(task.updatedAt)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span>Column</span>
                <span className="text-gray-400">{task.column}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskQuickView;
