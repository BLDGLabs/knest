import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const TAG_COLORS = {
  bug: 'bg-red-500/20 text-red-400 border-red-500/30',
  feature: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  improvement: 'bg-green-500/20 text-green-400 border-green-500/30',
  urgent: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  documentation: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const ASSIGNEE_COLORS = {
  'Miti': 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  'Jason': 'bg-blue-500/20 text-blue-400 border-blue-500/40',
};

const ASSIGNEE_INITIALS = {
  'Miti': 'M',
  'Jason': 'J',
};

const TaskCard = ({ task, onEdit, onDelete, onComplete, isDragging, epic, isBlocked, blockingTasks }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-dark-hover/80 backdrop-blur-sm border rounded-xl p-5 cursor-grab active:cursor-grabbing hover:border-gray-500/50 transition-all duration-200 group shadow-xl hover:shadow-2xl hover:shadow-black/50 shadow-black/40 hover:-translate-y-0.5 ${
        isBlocked 
          ? 'border-orange-500/40 bg-dark-hover/60' 
          : 'border-dark-border/40'
      }`}
    >
      {/* Blocked indicator */}
      {isBlocked && blockingTasks && blockingTasks.length > 0 && (
        <div 
          className="mb-3 flex items-center gap-2 px-2 py-1.5 bg-orange-600/10 border border-orange-500/30 rounded-lg"
          title={`Blocked by: ${blockingTasks.map(t => t.title).join(', ')}`}
        >
          <span className="text-orange-400 text-sm">🔒</span>
          <span className="text-xs text-orange-300 font-medium">
            Blocked by {blockingTasks.length} {blockingTasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white leading-snug">{task.title}</h3>
            {task.assignedTo && (
              <div 
                className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold border ${ASSIGNEE_COLORS[task.assignedTo]}`}
                title={`Assigned to ${task.assignedTo}`}
              >
                {ASSIGNEE_INITIALS[task.assignedTo]}
              </div>
            )}
          </div>
          {epic && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: epic.color }}
              />
              <span className="text-xs text-gray-400 truncate">{epic.name}</span>
            </div>
          )}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 ml-2 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="text-gray-400 hover:text-blue-400 text-sm"
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onComplete(task.id);
            }}
            className="text-gray-400 hover:text-green-400 text-sm"
          >
            ✓
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="text-gray-400 hover:text-red-400 text-sm"
          >
            🗑️
          </button>
        </div>
      </div>
      
      {task.description && (
        <p className="text-sm text-gray-400 mb-3 line-clamp-2 leading-relaxed">{task.description}</p>
      )}
      
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-dark-border/30">
        <div className="flex gap-2 flex-wrap">
          {task.tags?.map((tag, index) => (
            <span
              key={index}
              className={`text-xs px-2.5 py-1 rounded-md border ${TAG_COLORS[tag] || TAG_COLORS.feature} font-medium shadow-sm`}
            >
              {tag}
            </span>
          ))}
        </div>
        <span className="text-xs text-gray-500 font-medium">
          {formatDate(task.updatedAt || task.createdAt)}
        </span>
      </div>
    </div>
  );
};

export default TaskCard;
