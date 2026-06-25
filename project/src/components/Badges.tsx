import React from 'react';
import { TaskPriority, TaskStatus, ProjectStatus } from '../types';

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const styles: Record<TaskPriority, string> = {
    urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
    high:   'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low:    'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  const labels: Record<TaskPriority, string> = { urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[priority]}`}>
      {labels[priority]}
    </span>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    todo:       'bg-gray-500/20 text-gray-400 border-gray-500/30',
    inprogress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    done:       'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };
  const labels: Record<TaskStatus, string> = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const styles: Record<ProjectStatus, string> = {
    active:    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    onhold:    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  const labels: Record<ProjectStatus, string> = { active: 'Active', onhold: 'On Hold', completed: 'Completed', cancelled: 'Cancelled' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function OverdueBadge() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse mb-1.5">
      Overdue
    </span>
  );
}
