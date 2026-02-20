import React, { useState, useEffect } from 'react';
import * as db from '../services/dynamodb';

const TrashView = ({ onClose, onTaskRestored }) => {
  const [deletedTasks, setDeletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeletedTasks();
  }, []);

  const loadDeletedTasks = async () => {
    setLoading(true);
    try {
      const tasks = await db.getDeletedTasks();
      setDeletedTasks(tasks);
    } catch (error) {
      console.error('Error loading deleted tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (taskId) => {
    try {
      await db.undeleteTask(taskId);
      setDeletedTasks(prev => prev.filter(t => t.id !== taskId));
      onTaskRestored();
    } catch (error) {
      console.error('Error restoring task:', error);
      alert('Failed to restore task');
    }
  };

  const handlePermanentDelete = async (taskId) => {
    if (!window.confirm('Permanently delete this task? This cannot be undone.')) {
      return;
    }

    try {
      await db.hardDeleteTask(taskId);
      setDeletedTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error permanently deleting task:', error);
      alert('Failed to delete task');
    }
  };

  const handleCleanupOld = async () => {
    if (!window.confirm('Permanently delete all tasks in trash for 7+ days? This cannot be undone.')) {
      return;
    }

    try {
      const count = await db.cleanupOldDeletedTasks(7);
      alert(`Permanently deleted ${count} old tasks`);
      await loadDeletedTasks();
    } catch (error) {
      console.error('Error cleaning up old tasks:', error);
      alert('Failed to cleanup old tasks');
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

  const getDaysInTrash = (deletedAt) => {
    if (!deletedAt) return null;
    const now = new Date();
    const deleted = new Date(deletedAt);
    const days = Math.floor((now - deleted) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-dark-card border border-dark-border/60 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="border-b border-dark-border/50 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
              🗑️ Trash
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Deleted tasks are kept for 7 days
            </p>
          </div>
          <div className="flex items-center gap-3">
            {deletedTasks.length > 0 && (
              <button
                onClick={handleCleanupOld}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium rounded-lg transition-colors border border-red-600/30"
              >
                Cleanup Old (7+ days)
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="text-center py-12 text-gray-400">
              Loading trash...
            </div>
          ) : deletedTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-lg">Trash is empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deletedTasks.map(task => {
                const daysInTrash = getDaysInTrash(task.deletedAt);
                const isOld = daysInTrash !== null && daysInTrash >= 7;
                
                return (
                  <div
                    key={task.id}
                    className={`bg-dark-hover border rounded-lg p-4 ${
                      isOld ? 'border-red-600/40' : 'border-dark-border/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium mb-1">
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Deleted {formatDate(task.deletedAt)}</span>
                          {daysInTrash !== null && (
                            <span className={isOld ? 'text-red-400 font-medium' : ''}>
                              {daysInTrash} {daysInTrash === 1 ? 'day' : 'days'} in trash
                              {isOld && ' (will be auto-deleted)'}
                            </span>
                          )}
                          {task.assignedTo && (
                            <span>Assigned to: {task.assignedTo}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleRestore(task.id)}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(task.id)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
                        >
                          Delete Forever
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrashView;
