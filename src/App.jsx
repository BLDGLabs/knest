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
import * as db from './services/dynamodb';
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
    dependsOn: [],
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
    dependsOn: [],
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
    dependsOn: [],
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
    dependsOn: [],
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
    dependsOn: [6],
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
    dependsOn: [],
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
    dependsOn: [4],
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Load data from DynamoDB
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load epics and tasks from DynamoDB
      const [loadedEpics, loadedTasks] = await Promise.all([
        db.getAllEpics(),
        db.getAllTasks(),
      ]);

      // Check if this is first load (no data in DynamoDB)
      if (loadedEpics.length === 0 && loadedTasks.length === 0) {
        // Check localStorage for migration
        const savedTasks = localStorage.getItem('kanban-tasks');
        const savedEpics = localStorage.getItem('kanban-epics');
        
        if (savedTasks || savedEpics) {
          // Migrate from localStorage
          console.log('Migrating data from localStorage to DynamoDB...');
          const tasksToMigrate = savedTasks ? JSON.parse(savedTasks) : SAMPLE_TASKS;
          const epicsToMigrate = savedEpics ? JSON.parse(savedEpics) : SAMPLE_EPICS;
          
          await db.migrateData(epicsToMigrate, tasksToMigrate);
          
          // Reload data
          const [migratedEpics, migratedTasks] = await Promise.all([
            db.getAllEpics(),
            db.getAllTasks(),
          ]);
          
          setEpics(migratedEpics);
          setTasks(migratedTasks);
          
          // Clear localStorage after successful migration
          localStorage.removeItem('kanban-tasks');
          localStorage.removeItem('kanban-epics');
          
          console.log('✅ Migration complete!');
        } else {
          // First time setup - load sample data
          console.log('First time setup - loading sample data...');
          await db.migrateData(SAMPLE_EPICS, SAMPLE_TASKS);
          
          const [initialEpics, initialTasks] = await Promise.all([
            db.getAllEpics(),
            db.getAllTasks(),
          ]);
          
          setEpics(initialEpics);
          setTasks(initialTasks);
          
          const welcomeActivity = {
            id: Date.now(),
            type: 'created',
            taskTitle: 'Welcome to Mission Control! 🚀',
            timestamp: new Date().toISOString(),
          };
          setActivities([welcomeActivity]);
        }
      } else {
        setEpics(loadedEpics);
        setTasks(loadedTasks);
      }

      // Activities still stored in localStorage
      const savedActivities = localStorage.getItem('kanban-activities');
      if (savedActivities) {
        setActivities(JSON.parse(savedActivities));
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data from DynamoDB. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  // Save activities to localStorage
  useEffect(() => {
    if (activities.length > 0) {
      localStorage.setItem('kanban-activities', JSON.stringify(activities));
    }
  }, [activities]);

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

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    const overColumn = over.id;

    if (activeTask && COLUMNS.includes(overColumn) && activeTask.column !== overColumn) {
      try {
        // Optimistic update
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === active.id 
              ? { ...task, column: overColumn, updatedAt: new Date().toISOString() }
              : task
          )
        );
        
        // Update in DynamoDB
        await db.updateTask(active.id, { column: overColumn });
        addActivity('moved', activeTask.title, activeTask.column, overColumn);
      } catch (err) {
        console.error('Error updating task:', err);
        // Revert on error
        await loadData();
      }
    }
  };

  const handleAddTask = async (taskData) => {
    try {
      if (editingTask) {
        // Update existing task
        const updatedTask = await db.updateTask(editingTask.id, taskData);
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === editingTask.id ? updatedTask : task
          )
        );
        addActivity('edited', taskData.title);
      } else {
        // Create new task
        const newTask = {
          id: Date.now(),
          ...taskData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await db.createTask(newTask);
        setTasks(prevTasks => [...prevTasks, newTask]);
        addActivity('created', taskData.title);
      }
      setIsModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      console.error('Error saving task:', err);
      alert('Failed to save task. Please try again.');
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      await db.deleteTask(taskId);
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
      if (task) {
        addActivity('deleted', task.title);
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Failed to delete task. Please try again.');
    }
  };

  const handleCompleteTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      addActivity('completed', task.title);
      await handleDeleteTask(taskId);
    }
  };

  // Epic handlers
  const handleCreateEpic = async (epicData) => {
    try {
      const newEpic = {
        id: `epic-${Date.now()}`,
        ...epicData,
        createdAt: new Date().toISOString(),
      };
      await db.createEpic(newEpic);
      setEpics(prevEpics => [...prevEpics, newEpic]);
      addActivity('created', `Epic: ${epicData.name}`);
      setIsEpicModalOpen(false);
    } catch (err) {
      console.error('Error creating epic:', err);
      alert('Failed to create epic. Please try again.');
    }
  };

  const handleEditEpic = (epic) => {
    setEditingEpic(epic);
    setIsEpicModalOpen(true);
  };

  const handleSaveEpic = async (epicData) => {
    try {
      if (editingEpic) {
        await db.updateEpic(editingEpic.id, epicData);
        setEpics(prevEpics =>
          prevEpics.map(epic =>
            epic.id === editingEpic.id ? { ...epic, ...epicData } : epic
          )
        );
        addActivity('edited', `Epic: ${epicData.name}`);
      } else {
        await handleCreateEpic(epicData);
      }
      setIsEpicModalOpen(false);
      setEditingEpic(null);
    } catch (err) {
      console.error('Error saving epic:', err);
      alert('Failed to save epic. Please try again.');
    }
  };

  const handleDeleteEpic = async (epicId) => {
    try {
      const epic = epics.find(e => e.id === epicId);
      await db.deleteEpic(epicId);
      
      // Update local state
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
    } catch (err) {
      console.error('Error deleting epic:', err);
      alert('Failed to delete epic. Please try again.');
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

  // Dependency helper functions
  const isTaskBlocked = (task) => {
    if (!task.dependsOn || task.dependsOn.length === 0) return false;
    
    return task.dependsOn.some(depId => {
      const depTask = tasks.find(t => t.id === depId);
      // Task is blocked if dependency doesn't exist or isn't in Review column
      return !depTask || depTask.column !== 'Review';
    });
  };

  const getBlockingTasks = (task) => {
    if (!task.dependsOn || task.dependsOn.length === 0) return [];
    
    return task.dependsOn
      .map(depId => tasks.find(t => t.id === depId))
      .filter(t => t && t.column !== 'Review');
  };

  const checkCircularDependency = (taskId, dependencyId, visited = new Set()) => {
    if (taskId === dependencyId) return true;
    if (visited.has(dependencyId)) return false;
    
    visited.add(dependencyId);
    
    const depTask = tasks.find(t => t.id === dependencyId);
    if (!depTask || !depTask.dependsOn) return false;
    
    return depTask.dependsOn.some(id => checkCircularDependency(taskId, id, visited));
  };

  const activeTask = tasks.find(t => t.id === activeId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Mission Control...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Error Loading Data</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
                      allTasks={tasks}
                      isTaskBlocked={isTaskBlocked}
                      getBlockingTasks={getBlockingTasks}
                    />
                  ))}
                </div>
                <DragOverlay>
                  {activeTask ? (
                    <TaskCard 
                      task={activeTask} 
                      isDragging 
                      epic={epics.find(e => e.id === activeTask.epicId)}
                      isBlocked={isTaskBlocked(activeTask)}
                      blockingTasks={getBlockingTasks(activeTask)}
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
          allTasks={tasks}
          onSave={handleAddTask}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTask(null);
          }}
          checkCircularDependency={checkCircularDependency}
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
