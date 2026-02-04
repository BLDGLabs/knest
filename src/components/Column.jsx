import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';

const Column = ({ id, title, tasks, onEditTask, onDeleteTask, onCompleteTask, epics, allTasks, isTaskBlocked, getBlockingTasks }) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex flex-col h-full">
      <div className="bg-dark-card border border-dark-border/50 rounded-t-xl p-4 shadow-md">
        <h2 className="font-semibold text-lg text-white">{title}</h2>
        <span className="text-sm text-gray-400">{tasks.length} tasks</span>
      </div>
      
      <div
        ref={setNodeRef}
        className="flex-1 bg-dark-card/50 border-x border-b border-dark-border/50 rounded-b-xl p-4 min-h-[600px]"
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onComplete={onCompleteTask}
                epic={epics?.find(e => e.id === task.epicId)}
                isBlocked={isTaskBlocked?.(task)}
                blockingTasks={getBlockingTasks?.(task)}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

export default Column;
