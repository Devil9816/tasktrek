"use client";

import { useState, useEffect, useCallback } from "react";
import { Task, fetchTasks, deleteTask, updateTask, isOverdue, getProjects, getEmployees } from "@/utils/api";
import TaskTable from "@/components/TaskTable";
import TaskForm from "@/components/TaskForm";
import { STATUS_STYLES, PRIORITY_STYLES } from "@/components/TaskTable";
import { useEditMode } from "@/components/EditModeProvider";

const ALL_COLUMNS = [
  { key: "id", label: "Task ID" },
  { key: "project", label: "Project" },
  { key: "description", label: "Task Description" },
  { key: "assignedTo", label: "Assigned To" },
  { key: "eta", label: "ETA" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
];

export default function TaskManager() {
  const { isEditMode } = useEditMode();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const allTasks = await fetchTasks();
      setTasks(allTasks);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    let filtered = [...tasks];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          (Array.isArray(t.assignedTo) ? t.assignedTo.some((a) => a.toLowerCase().includes(q)) : false) ||
          t.project.toLowerCase().includes(q) ||
          t.taskId.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "All") filtered = filtered.filter((t) => t.status === statusFilter);
    if (priorityFilter !== "All") filtered = filtered.filter((t) => t.priority === priorityFilter);
    if (projectFilter !== "All") filtered = filtered.filter((t) => t.project === projectFilter);
    setFilteredTasks(filtered);
  }, [tasks, searchQuery, statusFilter, priorityFilter, projectFilter]);

  const handleDelete = (taskId: string) => setDeleteConfirm(taskId);
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    await deleteTask(deleteConfirm);
    setDeleteConfirm(null);
    loadData();
  };
  const handleEdit = (task: Task) => { setEditTask(task); setShowForm(true); };
  const handleFormSave = () => { setShowForm(false); setEditTask(null); loadData(); };
  const handleBumpEta = async (task: Task, newEta: string) => {
    // Optimistically update local state so the UI reflects the change instantly
    setTasks((prev) => prev.map((t) => t.taskId === task.taskId ? { ...t, eta: newEta } : t));
    try {
      await updateTask(task.taskId, { eta: newEta });
    } catch {
      // Revert on failure
      setTasks((prev) => prev.map((t) => t.taskId === task.taskId ? { ...t, eta: task.eta } : t));
    }
  };

  const projects = getProjects(tasks);
  const existingEmployees = getEmployees(tasks);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Complete").length;
  const overdueTasks = tasks.filter((t) => isOverdue(t)).length;
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress").length;

  const closeForm = () => { setShowForm(false); setEditTask(null); };

  return (
    <div className="p-6 space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Task Manager</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Global task overview across all projects</p>
          </div>
          {isEditMode && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 transition-all active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Task
            </button>
          )}
        </header>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Tasks", value: totalTasks, color: "text-slate-900 dark:text-white", bg: "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" },
                { label: "In Progress", value: inProgressTasks, color: "text-blue-900 dark:text-blue-100", bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 shadow-[0_4px_12px_rgba(59,130,246,0.1)]" },
                { label: "Completed", value: completedTasks, color: "text-emerald-900 dark:text-emerald-100", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 shadow-[0_4px_12px_rgba(16,185,129,0.1)]" },
                { label: "Overdue", value: overdueTasks, color: "text-rose-900 dark:text-rose-100", bg: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 shadow-[0_4px_12px_rgba(244,63,94,0.1)]" },
              ].map((stat) => (
                <div key={stat.label} className={`${stat.bg} rounded-2xl p-5 border-2 transition-all hover:scale-[1.02]`}>
                  <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-2">{stat.label}</p>
                  <p className={`text-4xl font-black ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Status breakdown */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Status Breakdown</h3>
              <div className="flex flex-wrap gap-3">
                {(["Not Started", "In Progress", "Complete", "On Hold"] as const).map((s) => {
                  const count = tasks.filter((t) => t.status === s).length;
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[s]}`}>{s}</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{count}</span>
                    </div>
                  );
                })}
                <div className="ml-auto flex items-center gap-2">
                  {(["High", "Medium", "Low"] as const).map((p) => {
                    const count = tasks.filter((t) => t.priority === p).length;
                    return (
                      <div key={p} className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_STYLES[p]}`}>{p}</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search tasks, descriptions, or projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all"
                />
              </div>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="px-4 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-semibold"
              >
                <option value="All">All Projects</option>
                {projects.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-semibold"
              >
                <option value="All">All Statuses</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Complete">Complete</option>
                <option value="On Hold">On Hold</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-semibold"
              >
                <option value="All">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredTasks.length}</span> of <span className="font-semibold text-slate-700 dark:text-slate-200">{totalTasks}</span> tasks
              </p>
              {(searchQuery || statusFilter !== "All" || priorityFilter !== "All" || projectFilter !== "All") && (
                <button onClick={() => { setSearchQuery(""); setStatusFilter("All"); setPriorityFilter("All"); setProjectFilter("All"); }} className="text-xs text-red-600 hover:text-red-800 font-medium">
                  Clear filters
                </button>
              )}
            </div>

            {/* Active tasks */}
            <TaskTable
              tasks={filteredTasks.filter((t) => t.status !== "Complete")}
              columns={ALL_COLUMNS}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onBumpEta={handleBumpEta}
              showActions={isEditMode}
            />

            {/* Completed tasks collapsible section */}
            {(() => {
              const completedFiltered = filteredTasks.filter((t) => t.status === "Complete");
              if (completedFiltered.length === 0) return null;
              return (
                <div className="border border-emerald-200 dark:border-emerald-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowCompleted((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Completed Tasks</span>
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold">{completedFiltered.length}</span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 transition-transform duration-200 ${showCompleted ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showCompleted && (
                    <div className="border-t border-emerald-200 dark:border-emerald-800">
                      <TaskTable
                        tasks={completedFiltered}
                        columns={ALL_COLUMNS}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onBumpEta={handleBumpEta}
                        showActions={isEditMode}
                      />
                    </div>
                  )}
                </div>
              );
            })()}
          </>
        )}

        {/* Task Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-white/10">
              <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {editTask ? "Edit Task" : "Create New Task"}
                </h2>
                <button onClick={closeForm} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <TaskForm editTask={editTask} existingProjects={projects} existingEmployees={existingEmployees} onSave={handleFormSave} onCancel={closeForm} />
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-8 border border-white/10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Delete Task</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">This cannot be undone.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={confirmDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-500/20 transition-all active:scale-95">Delete</button>
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-4 rounded-2xl transition-all active:scale-95">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
