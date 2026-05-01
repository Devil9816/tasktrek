"use client";

import { useState, useEffect, useRef } from "react";
import { Task, TaskStatus, TaskPriority, isOverdue, getTaskDisplayName } from "@/utils/api";

const STATUS_OPTIONS: TaskStatus[] = ["Not Started", "In Progress", "Complete", "Future To-do's", "On Hold", "Blocker"];
const PRIORITY_OPTIONS: TaskPriority[] = ["High", "Medium", "Low"];

export type TaskInlineUpdates = Partial<Pick<Task, "status" | "priority" | "name">>;

function InlineNameCell({
  task,
  disabled,
  onSave,
}: {
  task: Task;
  disabled: boolean;
  onSave: (name: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(() => getTaskDisplayName(task));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) setValue(getTaskDisplayName(task));
  }, [task.taskId, task.name, task.description, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const closeEdit = () => setIsEditing(false);

  const commitEdit = async () => {
    const v = value.trim();
    if (!v) {
      setValue(getTaskDisplayName(task));
      closeEdit();
      return;
    }
    if (v !== getTaskDisplayName(task)) {
      await onSave(v);
    }
    closeEdit();
  };

  const handleBlur = () => {
    void commitEdit();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setValue(getTaskDisplayName(task));
      closeEdit();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      void commitEdit();
    }
  };

  const display = getTaskDisplayName(task);

  if (!isEditing) {
    return (
      <div className="flex items-center gap-1.5 min-w-[10rem] max-w-md">
        <button
          type="button"
          onClick={() => !disabled && setIsEditing(true)}
          disabled={disabled}
          title="Edit task name"
          className="flex-shrink-0 h-6 w-6 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 dark:hover:border-red-800 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Edit task name"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <span className="font-medium text-slate-800 dark:text-slate-100 leading-snug">{display}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 min-w-[10rem] max-w-md">
      <span className="flex-shrink-0 h-6 w-6 inline-flex items-center justify-center rounded-md text-red-500 opacity-80" aria-hidden>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={onKeyDown}
        disabled={disabled}
        className="flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:opacity-60"
      />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => void commitEdit()}
        disabled={disabled}
        title="Save name"
        aria-label="Save task name"
        className="flex-shrink-0 h-8 w-8 inline-flex items-center justify-center rounded-lg text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </button>
    </div>
  );
}

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
  /** When set (e.g. in edit mode), status/priority become dropdowns and task name is editable inline. */
  onInlineUpdate?: (task: Task, updates: TaskInlineUpdates) => Promise<void>;
  onTaskClick?: (task: Task) => void;
  showActions?: boolean;
}

export const STATUS_STYLES: Record<string, string> = {
  "Not Started": "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 shadow-sm",
  "In Progress": "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800 shadow-sm animate-pulse-subtle",
  "Complete": "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 shadow-sm",
  "Future To-do's": "bg-cyan-100 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 shadow-sm",
  "In Review": "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800 shadow-sm",
  "On Hold": "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 shadow-sm",
  "Blocker": "bg-violet-100 dark:bg-violet-950/40 text-violet-800 dark:text-violet-300 border border-violet-300 dark:border-violet-800 shadow-sm",
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

export default function TaskTable({
  tasks,
  columns,
  onEdit,
  onDelete,
  onBumpEta,
  onInlineUpdate,
  onTaskClick,
  showActions = true,
}: TaskTableProps) {
  const [bumpingId, setBumpingId] = useState<string | null>(null);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);

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

  const runInlineUpdate = async (task: Task, updates: TaskInlineUpdates) => {
    if (!onInlineUpdate) return;
    setSavingTaskId(task.taskId);
    try {
      await onInlineUpdate(task, updates);
    } finally {
      setSavingTaskId(null);
    }
  };

  const renderCell = (task: Task, key: string) => {
    const rowBusy = savingTaskId === task.taskId;
    switch (key) {
      case "id":
        return <span className="font-mono text-xs text-slate-500">{task.taskId}</span>;
      case "name":
        if (onInlineUpdate) {
          return (
            <InlineNameCell
              task={task}
              disabled={rowBusy}
              onSave={(name) => runInlineUpdate(task, { name })}
            />
          );
        }
        return <span className="font-medium text-slate-800 dark:text-slate-100">{getTaskDisplayName(task)}</span>;
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
        if (onInlineUpdate) {
          return (
            <select
              value={task.status}
              onChange={(e) => {
                const v = e.target.value as TaskStatus;
                void runInlineUpdate(task, { status: v });
              }}
              disabled={rowBusy}
              className={`inline-flex max-w-full rounded-full px-2 py-1 pr-6 text-[10px] font-black uppercase tracking-wider cursor-pointer disabled:opacity-60 disabled:cursor-wait appearance-none bg-[length:0.65rem] bg-[right_0.35rem_center] bg-no-repeat ${STATUS_STYLES[task.status] || ""}`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
              }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          );
        }
        return (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${STATUS_STYLES[task.status] || ""}`}>
            {task.status}
          </span>
        );
      case "priority":
        if (onInlineUpdate) {
          return (
            <select
              value={task.priority}
              onChange={(e) => {
                const v = e.target.value as TaskPriority;
                void runInlineUpdate(task, { priority: v });
              }}
              disabled={rowBusy}
              className={`inline-flex max-w-full rounded-md px-2 py-0.5 pr-6 text-[10px] font-black uppercase tracking-tighter cursor-pointer disabled:opacity-60 disabled:cursor-wait appearance-none bg-[length:0.65rem] bg-[right_0.35rem_center] bg-no-repeat ${PRIORITY_STYLES[task.priority] || ""}`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
              }}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          );
        }
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
    if (task.status === "Future To-do's") return "bg-cyan-50/60 dark:bg-cyan-950/15 border-l-4 border-l-cyan-500 hover:bg-cyan-100/60 dark:hover:bg-cyan-950/25";
    if (task.status === "In Progress") return "bg-red-50/30 dark:bg-red-900/10 border-l-4 border-l-red-400 hover:bg-red-50 dark:hover:bg-red-900/20";
    if (task.status === "On Hold") return "bg-amber-50/50 dark:bg-amber-950/10 border-l-4 border-l-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20";
    if (task.status === "Blocker") return "bg-violet-50/60 dark:bg-violet-950/15 border-l-4 border-l-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/25";
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
                onClick={() => !onInlineUpdate && onTaskClick?.(task)}
                className={`transition-all duration-200 ${!onInlineUpdate && onTaskClick ? "cursor-pointer" : ""} ${getRowStyles(task)}`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 ${col.key === "name" && onInlineUpdate ? "whitespace-normal align-top min-w-[12rem] max-w-md" : "whitespace-nowrap"}`}
                  >
                    {renderCell(task, col.key)}
                  </td>
                ))}
                {showActions && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {onTaskClick && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                          title="View task details"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit?.(task); }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg border border-red-200 dark:border-red-800 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete?.(task.taskId); }}
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
