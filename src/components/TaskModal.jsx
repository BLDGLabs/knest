import React, { useState, useEffect } from 'react';

const COLUMNS = ['Backlog', 'In Progress', 'Done'];
const AVAILABLE_TAGS = ['bug', 'feature', 'improvement', 'urgent', 'documentation'];
const ASSIGNEES = ['Jason', 'Miti'];

const TaskModal = ({ task, epics, allTasks, onSave, onClose, checkCircularDependency }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    column: 'Backlog',
    tags: [],
    epicId: null,
    assignedTo: null,
    dependsOn: [],
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        column: task.column || 'Backlog',
        tags: task.tags || [],
        epicId: task.epicId || null,
        assignedTo: task.assignedTo || null,
        dependsOn: task.dependsOn || [],
      });
    }
  }, [task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSave(formData);
  };

  const toggleTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const toggleDependency = (taskId) => {
    // Check for circular dependency
    if (task && checkCircularDependency && checkCircularDependency(task.id, taskId)) {
      alert('Cannot add this dependency: it would create a circular dependency!');
      return;
    }

    setFormData(prev => ({
      ...prev,
      dependsOn: prev.dependsOn.includes(taskId)
        ? prev.dependsOn.filter(id => id !== taskId)
        : [...prev.dependsOn, taskId],
    }));
  };

  // Get available tasks for dependencies (exclude self)
  const getAvailableDependencies = () => {
    if (!allTasks) return [];
    return allTasks.filter(t => !task || t.id !== task.id);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 md:p-4">
      <div className="bg-dark-card border border-dark-border rounded-t-2xl md:rounded-lg w-full md:max-w-lg max-h-[90vh] md:max-h-[85vh] overflow-hidden flex flex-col">
        <div className="border-b border-dark-border p-4 md:p-6 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl md:text-2xl font-bold">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-hover rounded-lg text-gray-400 hover:text-white md:hidden"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-dark-hover border border-dark-border rounded-lg px-4 py-3 md:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              placeholder="Enter task title..."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-dark-hover border border-dark-border rounded-lg px-4 py-3 md:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] md:min-h-[100px] text-base"
              placeholder="Enter task description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Column</label>
              <select
                value={formData.column}
                onChange={(e) => setFormData(prev => ({ ...prev, column: e.target.value }))}
                className="w-full bg-dark-hover border border-dark-border rounded-lg px-3 py-3 md:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              >
                {COLUMNS.map(column => (
                  <option key={column} value={column}>{column}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Epic</label>
              <select
                value={formData.epicId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, epicId: e.target.value || null }))}
                className="w-full bg-dark-hover border border-dark-border rounded-lg px-3 py-3 md:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              >
                <option value="">No Epic</option>
                {epics?.map(epic => (
                  <option key={epic.id} value={epic.id}>
                    {epic.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Assigned To</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, assignedTo: null }))}
                className={`flex-1 px-3 py-2.5 md:py-2 rounded-lg text-sm border transition-colors ${
                  formData.assignedTo === null
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-dark-hover border-dark-border text-gray-400 hover:border-gray-600'
                }`}
              >
                None
              </button>
              {ASSIGNEES.map(assignee => (
                <button
                  key={assignee}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, assignedTo: assignee }))}
                  className={`flex-1 px-3 py-2.5 md:py-2 rounded-lg text-sm border transition-colors ${
                    formData.assignedTo === assignee
                      ? assignee === 'Miti' 
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-dark-hover border-dark-border text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {assignee}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 md:py-1 rounded-lg text-sm border transition-colors ${
                    formData.tags.includes(tag)
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-dark-hover border-dark-border text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Dependencies
              <span className="text-xs text-gray-500 ml-2">
                (Depends on...)
              </span>
            </label>
            {getAvailableDependencies().length === 0 ? (
              <p className="text-sm text-gray-500 italic">No other tasks available</p>
            ) : (
              <div className="max-h-32 md:max-h-40 overflow-y-auto border border-dark-border rounded-lg">
                {getAvailableDependencies().map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleDependency(t.id)}
                    className={`w-full text-left px-3 py-2.5 md:py-2 text-sm border-b border-dark-border/30 last:border-b-0 transition-colors ${
                      formData.dependsOn.includes(t.id)
                        ? 'bg-orange-600/20 text-orange-300'
                        : 'hover:bg-dark-hover/50 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={formData.dependsOn.includes(t.id)}
                          onChange={() => {}}
                          className="w-4 h-4 rounded border-gray-600 text-orange-500 focus:ring-orange-500 flex-shrink-0"
                        />
                        <span className="truncate">{t.title}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${
                        t.column === 'Done' 
                          ? 'bg-green-600/20 text-green-400' 
                          : 'bg-gray-600/20 text-gray-400'
                      }`}>
                        {t.column}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 pb-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 md:py-2 px-4 rounded-lg transition-colors text-base"
            >
              {task ? 'Save Changes' : 'Create Task'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-dark-hover hover:bg-dark-border text-gray-300 font-medium py-3 md:py-2 px-4 rounded-lg transition-colors text-base hidden md:block"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
