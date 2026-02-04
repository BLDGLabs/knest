import { useState, useEffect } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import StatsBar from './components/StatsBar';
import Column from './components/Column';
import TaskCard from './components/TaskCard';
import ActivityFeed from './components/ActivityFeed';
import TaskModal from './components/TaskModal';
import EpicSidebar from './components/EpicSidebar';
import EpicModal from './components/EpicModal';
import './App.css';

const COLUMNS = ['Recurring', 'Backlog', 'In Progress', 'Review'];

const SAMPLE_EPICS = [
  {
    id: 'epic-1',
    name: 'Q1 Platform Improvements',
    description: 'Major platform enhancements for Q1 2026',
    color: '#3b82f6',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'epic-2',
    name: 'Mobile App Launch',
    description: 'iOS and Android app development',
    color: '#8b5cf6',
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: 'epic-3',
    name: 'Security Hardening',
    description: 'Security improvements and compliance',
    color: '#ef4444',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

const SAMPLE_TASKS = [
  {
    id: 1,
    title: 'Daily standup meeting',
    description: 'Team sync at 10 AM',
    column: 'Recurring',
    tags: ['feature'],
    epicId: null,
    assignedTo: null,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 2,
    title: 'Review pull requests',
    description: 'Check team PRs and provide feedback',
    column: 'Recurring',
    tags: ['improvement'],
    epicId: null,
    assignedTo: 'Miti',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 3,
    title: 'Fix authentication bug',
    description: 'Users reporting login issues on mobile',
    column: 'In Progress',
    tags: ['bug', 'urgent'],
    epicId: 'epic-3',
    assignedTo: 'Miti',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 4,
    title: 'Design new dashboard layout',
    description: 'Create mockups for the analytics dashboard',
    column: 'Backlog',
    tags: ['feature'],
    epicId: 'epic-1',
    assignedTo: 'Jason',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 5,
    title: 'Update API documentation',
    description: 'Add examples for new endpoints',
    column: 'Review',
    tags: ['documentation'],
    epicId: 'epic-1',
    assignedTo: 'Jason',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 6,
    title: 'Optimize database queries',
    description: 'Improve performance on user dashboard',
    column: 'Backlog',
    tags: ['improvement'],
    epicId: 'epic-1',
    assignedTo: 'Miti',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 7,
    title: 'Implement dark mode toggle',
    description: 'Add user preference for theme switching',
    column: 'In Progress',
    tags: ['feature'],
    epicId: 'epic-2',
    assignedTo: 'Jason',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 900000).toISOString(),
  },
];

function App() {
  const [tasks, setTasks] = useState([]);
  const [epics, setEpics] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedEpicId, setSelectedEpicId] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [isEpicModalOpen, setIsEpicModalOpen] = useState(false);
  const [editingEpic, setEditingEpic] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Load data from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('kanban-tasks');
    const savedEpics = localStorage.getItem('kanban-epics');
    const savedActivities = localStorage.getItem('kanban-activities');
    
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      // Initialize with sample data on first load
      setTasks(SAMPLE_TASKS);
      const welcomeActivity = {
        id: Date.now(),
        type: 'created',
        taskTitle: 'Welcome to Mission Control! 🚀',
        timestamp: new Date().toISOString(),
      };
      setActivities([welcomeActivity]);
    }

    if (savedEpics) {
      setEpics(JSON.parse(savedEpics));
    } else {
      // Initialize with sample epics on first load
      setEpics(SAMPLE_EPICS);
    }
    
    if (savedActivities) {
      setActivities(JSON.parse(savedActivities));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('kanban-tasks', JSON.stringify(tasks));
    }
    if (epics.length > 0) {
      localStorage.setItem('kanban-epics', JSON.stringify(epics));
    }
    if (activities.length > 0) {
      localStorage.setItem('kanban-activities', JSON.stringify(activities));
    }
  }, [tasks, epics, activities]);

  const addActivity = (type, taskTitle, fromColumn = null, toColumn = null) => {
    const activity = {
      id: Date.now(),
      type,
      taskTitle,
      fromColumn,
      toColumn,
      timestamp: new Date().toISOString(),
    };
    setActivities(prev => [activity, ...prev].slice(0, 50)); // Keep last 50 activities
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    const overColumn = over.id;

    if (activeTask && COLUMNS.includes(overColumn) && activeTask.column !== overColumn) {
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === active.id 
            ? { ...task, column: overColumn, updatedAt: new Date().toISOString() }
            : task
        )
      );
      addActivity('moved', activeTask.title, activeTask.column, overColumn);
    }
  };

  const handleAddTask = (taskData) => {
    if (editingTask) {
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === editingTask.id
            ? { ...task, ...taskData, updatedAt: new Date().toISOString() }
            : task
        )
      );
      addActivity('edited', taskData.title);
    } else {
      const newTask = {
        id: Date.now(),
        ...taskData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTasks(prevTasks => [...prevTasks, newTask]);
      addActivity('created', taskData.title);
    }
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
    if (task) {
      addActivity('deleted', task.title);
    }
  };

  const handleCompleteTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      addActivity('completed', task.title);
      handleDeleteTask(taskId);
    }
  };

  // Epic handlers
  const handleCreateEpic = (epicData) => {
    const newEpic = {
      id: `epic-${Date.now()}`,
      ...epicData,
      createdAt: new Date().toISOString(),
    };
    setEpics(prevEpics => [...prevEpics, newEpic]);
    addActivity('created', `Epic: ${epicData.name}`);
    setIsEpicModalOpen(false);
  };

  const handleEditEpic = (epic) => {
    setEditingEpic(epic);
    setIsEpicModalOpen(true);
  };

  const handleSaveEpic = (epicData) => {
    if (editingEpic) {
      setEpics(prevEpics =>
        prevEpics.map(epic =>
          epic.id === editingEpic.id ? { ...epic, ...epicData } : epic
        )
      );
      addActivity('edited', `Epic: ${epicData.name}`);
    } else {
      handleCreateEpic(epicData);
    }
    setIsEpicModalOpen(false);
    setEditingEpic(null);
  };

  const handleDeleteEpic = (epicId) => {
    const epic = epics.find(e => e.id === epicId);
    // Remove epicId from all tasks linked to this epic
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.epicId === epicId ? { ...task, epicId: null } : task
      )
    );
    setEpics(prevEpics => prevEpics.filter(e => e.id !== epicId));
    if (epic) {
      addActivity('deleted', `Epic: ${epic.name}`);
    }
    if (selectedEpicId === epicId) {
      setSelectedEpicId(null);
    }
  };

  const getTasksByColumn = (column) => {
    let filteredTasks = tasks.filter(task => task.column === column);
    
    // Apply epic filter if selected
    if (selectedEpicId !== null) {
      filteredTasks = filteredTasks.filter(task => task.epicId === selectedEpicId);
    }
    
    // Apply assignee filter if selected
    if (selectedAssignee !== null) {
      if (selectedAssignee === 'unassigned') {
        filteredTasks = filteredTasks.filter(task => !task.assignedTo);
      } else {
        filteredTasks = filteredTasks.filter(task => task.assignedTo === selectedAssignee);
      }
    }
    
    return filteredTasks;
  };

  // Get filtered tasks for stats
  const getFilteredTasks = () => {
    let filteredTasks = tasks;
    
    if (selectedEpicId !== null) {
      filteredTasks = filteredTasks.filter(task => task.epicId === selectedEpicId);
    }
    
    if (selectedAssignee !== null) {
      if (selectedAssignee === 'unassigned') {
        filteredTasks = filteredTasks.filter(task => !task.assignedTo);
      } else {
        filteredTasks = filteredTasks.filter(task => task.assignedTo === selectedAssignee);
      }
    }
    
    return filteredTasks;
  };

  const activeTask = tasks.find(t => t.id === activeId);

  return (
    <div className="min-h-screen bg-dark-bg text-white flex">
      {/* Epic Sidebar */}
      <EpicSidebar
        epics={epics}
        selectedEpicId={selectedEpicId}
        onSelectEpic={setSelectedEpicId}
        selectedAssignee={selectedAssignee}
        onSelectAssignee={setSelectedAssignee}
        onCreateEpic={handleCreateEpic}
        onEditEpic={handleEditEpic}
        onDeleteEpic={handleDeleteEpic}
        tasks={tasks}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Mission Control
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {selectedEpicId || selectedAssignee ? (
                  <>
                    {selectedEpicId && (
                      <>
                        Epic: <span className="text-white font-medium">{epics.find(e => e.id === selectedEpicId)?.name}</span>
                      </>
                    )}
                    {selectedEpicId && selectedAssignee && <span className="mx-1">•</span>}
                    {selectedAssignee && (
                      <>
                        Assignee: <span className="text-white font-medium">
                          {selectedAssignee === 'unassigned' ? 'Unassigned' : selectedAssignee}
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  'Your tasks, organized and tracked'
                )}
              </p>
            </div>
            <button
              onClick={() => {
                setEditingTask(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20"
            >
              + New Task
            </button>
          </div>

          {/* Stats Bar */}
          <StatsBar tasks={getFilteredTasks()} />

          <div className="flex gap-6 mt-6">
            {/* Main Board */}
            <div className="flex-1">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="grid grid-cols-4 gap-4">
                  {COLUMNS.map(column => (
                    <Column
                      key={column}
                      id={column}
                      title={column}
                      tasks={getTasksByColumn(column)}
                      onEditTask={handleEditTask}
                      onDeleteTask={handleDeleteTask}
                      onCompleteTask={handleCompleteTask}
                      epics={epics}
                    />
                  ))}
                </div>
                <DragOverlay>
                  {activeTask ? (
                    <TaskCard 
                      task={activeTask} 
                      isDragging 
                      epic={epics.find(e => e.id === activeTask.epicId)}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>

            {/* Activity Feed */}
            <ActivityFeed activities={activities} />
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {isModalOpen && (
        <TaskModal
          task={editingTask}
          epics={epics}
          onSave={handleAddTask}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTask(null);
          }}
        />
      )}

      {/* Epic Modal */}
      {isEpicModalOpen && (
        <EpicModal
          epic={editingEpic}
          onSave={handleSaveEpic}
          onClose={() => {
            setIsEpicModalOpen(false);
            setEditingEpic(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
