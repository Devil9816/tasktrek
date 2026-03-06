"use client";

import { Task, isOverdue } from "@/utils/storage";

interface Column {
  key: string;
  label: string;
}

interface TaskTableProps {
  tasks: Task[];
  columns: Column[];
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export const STATUS_STYLES: Record<string, string> = {
  "Not Started": "bg-slate-100 text-slate-600 border border-slate-300",
  "In Progress": "bg-blue-100 text-blue-700 border border-blue-300",
  "Complete": "bg-emerald-100 text-emerald-700 border border-emerald-300",
  "On Hold": "bg-amber-100 text-amber-700 border border-amber-300",
};

export const PRIORITY_STYLES: Record<string, string> = {
  High: "bg-red-100 text-red-700 border border-red-300",
  Medium: "bg-orange-100 text-orange-700 border border-orange-300",
  Low: "bg-green-100 text-green-700 border border-green-300",
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function TaskTable({ tasks, columns, onEdit, onDelete, showActions = true }: TaskTableProps) {
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
        return <span className="font-mono text-xs text-slate-500">{task.id}</span>;
      case "description":
        return <span className="font-medium text-slate-800">{task.description}</span>;
      case "project":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200">
            {task.project}
          </span>
        );
      case "assignedTo":
        return (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {task.assignedTo.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-slate-700">{task.assignedTo}</span>
          </div>
        );
      case "eta": {
        const overdue = isOverdue(task);
        return (
          <span className={`text-sm font-medium ${overdue ? "text-red-600" : "text-slate-600"}`}>
            {formatDate(task.eta)}
            {overdue && (
              <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-600 border border-red-200">
                Overdue
              </span>
            )}
          </span>
        );
      }
      case "status":
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[task.status] || ""}`}>
            {task.status}
          </span>
        );
      case "priority":
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${PRIORITY_STYLES[task.priority] || ""}`}>
            {task.priority}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                {col.label}
              </th>
            ))}
            {showActions && (
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tasks.map((task) => {
            const overdue = isOverdue(task);
            return (
              <tr
                key={task.id}
                className={`transition-colors ${
                  overdue
                    ? "bg-red-50 hover:bg-red-100"
                    : "bg-white hover:bg-slate-50"
                }`}
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete?.(task.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
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
