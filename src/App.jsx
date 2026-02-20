import { useState, useEffect } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import StatsBar from './components/StatsBar';
import Column from './components/Column';
import TaskCard from './components/TaskCard';
import TaskModal from './components/TaskModal';
import TaskQuickView from './components/TaskQuickView';
import EpicSidebar from './components/EpicSidebar';
import EpicModal from './components/EpicModal';
import TaskTimelineView from './components/TaskTimelineView';
import TimelineFilterSidebar from './components/TimelineFilterSidebar';
import TrashView from './components/TrashView';
import * as db from './services/dynamodb';
import './App.css';

const COLUMNS = ['Backlog', 'In Progress', 'Done'];

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
    source: 'manual',
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
    source: 'github',
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
    source: 'jira',
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
    source: 'slack',
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
    source: 'manual',
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
    source: 'jira',
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
    source: 'slack',
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
  const [quickViewTask, setQuickViewTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileColumnIndex, setMobileColumnIndex] = useState(0); // Start on Backlog
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showAllDone, setShowAllDone] = useState(false); // Toggle for Done column filter
  const [viewMode, setViewMode] = useState('timeline'); // 'board' or 'timeline'
  const [showTrash, setShowTrash] = useState(false); // Trash view
  
  // Timeline view filters
  const [timelineSelectedAssignee, setTimelineSelectedAssignee] = useState('all');
  const [timelineSelectedSource, setTimelineSelectedSource] = useState('all');
  const [timelineShowDone, setTimelineShowDone] = useState(false);
  
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

  // Poll for updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [loadedEpics, loadedTasks] = await Promise.all([
          db.getAllEpics(),
          db.getAllTasks(),
        ]);
        // Only update if we got valid data (prevent clearing on network hiccups)
        if (loadedEpics.length > 0 || loadedTasks.length > 0) {
          setEpics(loadedEpics);
          setTasks(loadedTasks);
        } else {
          console.warn('Polling returned empty data, skipping update');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 10000);

    return () => clearInterval(interval);
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
            taskTitle: 'Welcome to Knest! 🦉',
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
        const now = new Date().toISOString();
        const updates = { 
          column: overColumn, 
          updatedAt: now,
          // Set completedAt when moving to Done, clear it when moving out
          ...(overColumn === 'Done' ? { completedAt: now } : { completedAt: null })
        };
        
        // Optimistic update
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === active.id 
              ? { ...task, ...updates }
              : task
          )
        );
        
        // Update in DynamoDB
        await db.updateTask(active.id, updates);
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
    setQuickViewTask(null); // Close quick view if open
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleQuickViewTask = (task) => {
    setQuickViewTask(task);
  };

  const handleQuickViewEdit = () => {
    if (quickViewTask) {
      setEditingTask(quickViewTask);
      setQuickViewTask(null);
      setIsModalOpen(true);
    }
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
        filteredTasks = filteredTasks.filter(task => !task.assignedTo || task.assignedTo === 'Unassigned');
      } else {
        filteredTasks = filteredTasks.filter(task => task.assignedTo === selectedAssignee);
      }
    }
    
    // Filter Done column to only show tasks completed within last 24 hours (unless showAllDone)
    if (column === 'Done' && !showAllDone) {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      filteredTasks = filteredTasks.filter(task => {
        const completedAt = new Date(task.completedAt || task.updatedAt || task.createdAt).getTime();
        return completedAt > oneDayAgo;
      });
    }
    
    // Sort by createdAt descending (newest first)
    filteredTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
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
        filteredTasks = filteredTasks.filter(task => !task.assignedTo || task.assignedTo === 'Unassigned');
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
      // Task is blocked if dependency doesn't exist or isn't in Done column
      return !depTask || depTask.column !== 'Done';
    });
  };

  const getBlockingTasks = (task) => {
    if (!task.dependsOn || task.dependsOn.length === 0) return [];
    
    return task.dependsOn
      .map(depId => tasks.find(t => t.id === depId))
      .filter(t => t && t.column !== 'Done');
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
          <p className="text-gray-400">Loading Knest...</p>
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
      {/* Mobile Sidebar Overlay - only in board view */}
      {viewMode === 'board' && isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Epic Sidebar - Hidden on mobile unless open, and hidden in timeline view */}
      {viewMode === 'board' && (
        <div className={`${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-50 md:z-auto transition-transform duration-300`}>
          <EpicSidebar
            epics={epics}
            selectedEpicId={selectedEpicId}
            onSelectEpic={(id) => {
              setSelectedEpicId(id);
              setIsMobileSidebarOpen(false);
            }}
            selectedAssignee={selectedAssignee}
            onSelectAssignee={(assignee) => {
              setSelectedAssignee(assignee);
              setIsMobileSidebarOpen(false);
            }}
            onCreateEpic={handleCreateEpic}
            onEditEpic={handleEditEpic}
            onDeleteEpic={handleDeleteEpic}
            tasks={tasks}
          />
        </div>
      )}

      {/* Timeline Filter Sidebar - only in timeline view */}
      {viewMode === 'timeline' && (
        <TimelineFilterSidebar
          tasks={tasks}
          selectedAssignee={timelineSelectedAssignee}
          onSelectAssignee={setTimelineSelectedAssignee}
          selectedSource={timelineSelectedSource}
          onSelectSource={setTimelineSelectedSource}
          showDone={timelineShowDone}
          onToggleShowDone={setTimelineShowDone}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="container mx-auto px-3 md:px-4 py-4 md:py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-3">
              {/* Mobile menu button - only in board view */}
              {viewMode === 'board' && (
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="md:hidden p-2 hover:bg-dark-hover rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              <div>
                <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
                  <span className="text-2xl md:text-3xl">🦉</span>
                  Knest
                </h1>
                <p className="text-gray-400 text-xs md:text-sm mt-0.5 md:mt-1 hidden sm:block">
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
            </div>
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex bg-dark-card rounded-lg p-1 gap-1">
                <button
                  onClick={() => setViewMode('board')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    viewMode === 'board'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Board view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    viewMode === 'timeline'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Timeline view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
              
              <button
                onClick={() => setShowTrash(true)}
                className="px-3 py-2 bg-dark-card hover:bg-dark-hover text-gray-400 hover:text-white rounded-lg font-medium transition-colors border border-dark-border text-sm"
                title="View trash"
              >
                🗑️
              </button>
              
              <button
                onClick={() => {
                  setEditingTask(null);
                  setIsModalOpen(true);
                }}
                className="px-3 py-2 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20 text-sm md:text-base"
              >
                <span className="hidden sm:inline">+ New Task</span>
                <span className="sm:hidden">+ New</span>
              </button>
            </div>
          </div>

          {/* Stats Bar - only show in board view */}
          {viewMode === 'board' && <StatsBar tasks={getFilteredTasks()} />}

          {/* Mobile Column Selector */}
          <div className="flex md:hidden gap-1 mt-4 mb-3 overflow-x-auto pb-2 -mx-3 px-3">
            {COLUMNS.map((column, index) => (
              <button
                key={column}
                onClick={() => setMobileColumnIndex(index)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  mobileColumnIndex === index
                    ? 'bg-blue-600 text-white'
                    : 'bg-dark-card text-gray-400 hover:bg-dark-hover'
                }`}
              >
                {column} ({getTasksByColumn(column).length})
              </button>
            ))}
          </div>

          <div className="flex-1 mt-4 md:mt-6">
            {/* Conditional View Rendering */}
            {viewMode === 'timeline' ? (
              <TaskTimelineView
                tasks={tasks}
                onTaskClick={handleQuickViewTask}
                selectedAssignee={timelineSelectedAssignee}
                selectedSource={timelineSelectedSource}
                showDone={timelineShowDone}
              />
            ) : (
              /* Main Board */
              <div className="w-full">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                {/* Desktop: 3 columns */}
                <div className="hidden md:grid md:grid-cols-3 gap-6">
                  {COLUMNS.map(column => (
                    <Column
                      key={column}
                      id={column}
                      title={column}
                      tasks={getTasksByColumn(column)}
                      onEditTask={handleEditTask}
                      onDeleteTask={handleDeleteTask}
                      onCompleteTask={handleCompleteTask}
                      onQuickViewTask={handleQuickViewTask}
                      epics={epics}
                      allTasks={tasks}
                      isTaskBlocked={isTaskBlocked}
                      getBlockingTasks={getBlockingTasks}
                      showAllDone={showAllDone}
                      onToggleShowAllDone={column === 'Done' ? () => setShowAllDone(!showAllDone) : undefined}
                      totalDoneCount={column === 'Done' ? tasks.filter(t => t.column === 'Done').length : undefined}
                    />
                  ))}
                </div>
                
                {/* Mobile: Single column with swipe */}
                <div className="md:hidden">
                  <Column
                    key={COLUMNS[mobileColumnIndex]}
                    id={COLUMNS[mobileColumnIndex]}
                    title={COLUMNS[mobileColumnIndex]}
                    tasks={getTasksByColumn(COLUMNS[mobileColumnIndex])}
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteTask}
                    onCompleteTask={handleCompleteTask}
                    onQuickViewTask={handleQuickViewTask}
                    epics={epics}
                    allTasks={tasks}
                    isTaskBlocked={isTaskBlocked}
                    getBlockingTasks={getBlockingTasks}
                    showAllDone={showAllDone}
                    onToggleShowAllDone={COLUMNS[mobileColumnIndex] === 'Done' ? () => setShowAllDone(!showAllDone) : undefined}
                    totalDoneCount={COLUMNS[mobileColumnIndex] === 'Done' ? tasks.filter(t => t.column === 'Done').length : undefined}
                  />
                  
                  {/* Mobile swipe hint / navigation */}
                  <div className="flex justify-between items-center mt-4 px-2">
                    <button
                      onClick={() => setMobileColumnIndex(prev => Math.max(0, prev - 1))}
                      disabled={mobileColumnIndex === 0}
                      className={`p-2 rounded-lg transition-colors ${
                        mobileColumnIndex === 0 
                          ? 'text-gray-600' 
                          : 'text-gray-400 hover:bg-dark-hover hover:text-white'
                      }`}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-gray-500 text-sm">
                      {mobileColumnIndex + 1} / {COLUMNS.length}
                    </span>
                    <button
                      onClick={() => setMobileColumnIndex(prev => Math.min(COLUMNS.length - 1, prev + 1))}
                      disabled={mobileColumnIndex === COLUMNS.length - 1}
                      className={`p-2 rounded-lg transition-colors ${
                        mobileColumnIndex === COLUMNS.length - 1 
                          ? 'text-gray-600' 
                          : 'text-gray-400 hover:bg-dark-hover hover:text-white'
                      }`}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
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
            )}
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

      {/* Task Quick View */}
      {quickViewTask && (
        <TaskQuickView
          task={quickViewTask}
          epic={epics.find(e => e.id === quickViewTask.epicId)}
          allTasks={tasks}
          onClose={() => setQuickViewTask(null)}
          onEdit={handleQuickViewEdit}
          onDelete={handleDeleteTask}
        />
      )}

      {/* Trash View */}
      {showTrash && (
        <TrashView
          onClose={() => setShowTrash(false)}
          onTaskRestored={loadData}
        />
      )}
    </div>
  );
}

export default App;
