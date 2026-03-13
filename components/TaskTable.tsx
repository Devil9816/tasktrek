"use client";

import { useState } from "react";
import { Task, isOverdue } from "@/utils/api";

interface Column {
  key: string;
  label: string;
}

interface TaskTableProps {
  tasks: Task[];
  columns: Column[];
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onBumpEta?: (task: Task, newEta: string) => Promise<void>;
  showActions?: boolean;
}

export const STATUS_STYLES: Record<string, string> = {
  "Not Started": "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 shadow-sm",
  "In Progress": "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800 shadow-sm animate-pulse-subtle",
  "Complete": "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 shadow-sm",
  "In Review": "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800 shadow-sm",
  "On Hold": "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 shadow-sm",
};

export const PRIORITY_STYLES: Record<string, string> = {
  High: "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 font-bold",
  Medium: "bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 font-bold",
  Low: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold",
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function TaskTable({ tasks, columns, onEdit, onDelete, onBumpEta, showActions = true }: TaskTableProps) {
  const [bumpingId, setBumpingId] = useState<string | null>(null);

  const handleBump = async (task: Task) => {
    if (!onBumpEta || bumpingId) return;
    setBumpingId(task.taskId);
    try {
      const current = task.eta ? new Date(task.eta + "T00:00:00") : new Date();
      current.setDate(current.getDate() + 1);
      // Use local date parts to avoid UTC timezone shift flipping the date back
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, "0");
      const d = String(current.getDate()).padStart(2, "0");
      const newEta = `${y}-${m}-${d}`;
      await onBumpEta(task, newEta);
    } finally {
      setBumpingId(null);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm font-medium">No tasks found</p>
      </div>
    );
  }

  const renderCell = (task: Task, key: string) => {
    switch (key) {
      case "id":
        return <span className="font-mono text-xs text-slate-500">{task.taskId}</span>;
      case "description":
        return <span className="font-medium text-slate-800 dark:text-slate-100">{task.description}</span>;
      case "project":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm uppercase tracking-tight transition-colors">
            {task.project}
          </span>
        );
      case "assignedTo": {
        const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : task.assignedTo ? [task.assignedTo] : [];
        return (
          <div className="flex flex-wrap items-center gap-2">
            {assignees.map((name) => (
              <div key={name} className="flex items-center gap-1.5 bg-white/50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm transition-all duration-300">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                  {name.split(" ").map(n => n.charAt(0)).join("").toUpperCase().substring(0, 2)}
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{name}</span>
              </div>
            ))}
            {assignees.length === 0 && <span className="text-sm text-slate-400 dark:text-slate-500">—</span>}
          </div>
        );
      }
      case "eta": {
        const overdue = isOverdue(task);
        const isBumping = bumpingId === task.taskId;
        return (
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-bold ${overdue ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-slate-300"}`}>
              {formatDate(task.eta)}
              {overdue && (
                <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-red-600 text-white font-black border border-red-700 shadow-sm animate-bounce-subtle">
                  OVERDUE
                </span>
              )}
            </span>
            {onBumpEta && showActions && (
              <button
                onClick={() => handleBump(task)}
                disabled={!!bumpingId}
                title="Push deadline by 1 day"
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-black border transition-all
                  ${isBumping
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-wait"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-red-600 hover:text-white dark:hover:bg-red-700 hover:border-red-700 cursor-pointer shadow-sm active:scale-95 transition-colors"
                  }`}
              >
                {isBumping ? (
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                    1D
                  </>
                )}
              </button>
            )}
          </div>
        );
      }
      case "status":
        return (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${STATUS_STYLES[task.status] || ""}`}>
            {task.status}
          </span>
        );
      case "priority":
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter ${PRIORITY_STYLES[task.priority] || ""}`}>
            {task.priority}
          </span>
        );
      default:
        return null;
    }
  };

  const getRowStyles = (task: Task) => {
    const overdue = isOverdue(task);
    if (overdue) return "bg-red-50/80 dark:bg-red-950/20 border-l-4 border-l-red-600 hover:bg-red-100 dark:hover:bg-red-900/30";
    if (task.status === "Complete") return "bg-emerald-50/50 dark:bg-emerald-950/10 border-l-4 border-l-emerald-500 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20 grayscale-[0.2]";
    if (task.status === "In Progress") return "bg-red-50/30 dark:bg-red-900/10 border-l-4 border-l-red-400 hover:bg-red-50 dark:hover:bg-red-900/20";
    if (task.status === "On Hold") return "bg-amber-50/50 dark:bg-amber-950/10 border-l-4 border-l-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20";
    return "bg-white dark:bg-slate-900 border-l-4 border-l-slate-200 dark:border-l-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors";
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-900 dark:bg-slate-950 border-b border-slate-700 dark:border-slate-800">
            {columns.map((col) => (
              <th key={col.key} className="px-5 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">
                {col.label}
              </th>
            ))}
            {showActions && (
              <th className="px-5 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 transition-colors">
          {tasks.map((task) => {
            return (
              <tr
                key={task._id}
                className={`transition-all duration-200 ${getRowStyles(task)}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                    {renderCell(task, col.key)}
                  </td>
                ))}
                {showActions && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEdit?.(task)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg border border-red-200 dark:border-red-800 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete?.(task.taskId)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg border border-red-200 dark:border-red-800 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
