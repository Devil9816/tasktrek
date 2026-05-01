"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Task, getTaskDisplayName, isOverdue } from "@/utils/api";
import { PRIORITY_STYLES, STATUS_STYLES } from "@/components/TaskTable";

interface TaskDetailsPanelProps {
  task: Task;
  onClose: () => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-1">{label}</p>
      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</div>
    </div>
  );
}

export default function TaskDetailsPanel({ task, onClose }: TaskDetailsPanelProps) {
  const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : task.assignedTo ? [task.assignedTo] : [];
  const overdue = isOverdue(task);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const modal = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(2, 6, 23, 0.75)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-details-title"
    >
      {/* Blur layer — separate from the dark tint so backdrop-filter has a transparent surface to work against */}
      <div className="absolute inset-0 backdrop-blur-md" aria-hidden="true" />

      <section
        className="relative w-full max-w-3xl max-h-[90vh] rounded-2xl border border-red-200 dark:border-red-900 bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-red-50/95 dark:bg-red-950/95 backdrop-blur">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 dark:text-red-400 mb-1">Task Details</p>
            <h2 id="task-details-title" className="text-xl font-black text-slate-900 dark:text-white">{getTaskDisplayName(task)}</h2>
            <p className="mt-1 text-xs font-mono text-slate-500 dark:text-slate-400">{task.taskId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-800 transition-colors"
            aria-label="Close task details"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-2">Description</p>
            <p className="text-sm leading-6 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{task.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <DetailItem label="Project" value={task.project} />
            <DetailItem
              label="Status"
              value={
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${STATUS_STYLES[task.status] || ""}`}>
                  {task.status}
                </span>
              }
            />
            <DetailItem
              label="Priority"
              value={
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter ${PRIORITY_STYLES[task.priority] || ""}`}>
                  {task.priority}
                </span>
              }
            />
            <DetailItem
              label="ETA"
              value={
                <span className={overdue ? "text-red-600 dark:text-red-400" : ""}>
                  {formatDate(task.eta)}
                  {overdue && <span className="ml-2 text-[10px] font-black uppercase">Overdue</span>}
                </span>
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DetailItem
              label="Assigned To"
              value={
                assignees.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {assignees.map((name) => (
                      <span key={name} className="inline-flex items-center px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
                        {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  "-"
                )
              }
            />
            <DetailItem label="Created" value={formatDate(task.createdAt?.slice(0, 10) || "")} />
          </div>
        </div>
      </section>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}
