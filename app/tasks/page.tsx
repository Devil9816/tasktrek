"use client";

import { useState, useEffect, useCallback } from "react";
import { Task, fetchTasks, deleteTask, isOverdue, getProjects, getEmployees } from "@/utils/api";
import TaskTable from "@/components/TaskTable";
import TaskForm from "@/components/TaskForm";
import { STATUS_STYLES, PRIORITY_STYLES } from "@/components/TaskTable";

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

  const projects = getProjects(tasks);
  const existingEmployees = getEmployees(tasks);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Complete").length;
  const overdueTasks = tasks.filter((t) => isOverdue(t)).length;
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Task Manager</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create, edit, and manage all tasks</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditTask(null); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}</div>
          <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Tasks", value: totalTasks, color: "text-slate-700", bg: "bg-white border-slate-200" },
              { label: "In Progress", value: inProgressTasks, color: "text-red-700", bg: "bg-red-50 border-red-200" },
              { label: "Completed", value: completedTasks, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
              { label: "Overdue", value: overdueTasks, color: "text-red-700", bg: "bg-red-50 border-red-200" },
            ].map((stat) => (
              <div key={stat.label} className={`${stat.bg} rounded-xl p-4 border`}>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{stat.label}</p>
                <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Status breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-600 mb-3">Status Breakdown</h3>
            <div className="flex flex-wrap gap-3">
              {(["Not Started", "In Progress", "Complete", "On Hold"] as const).map((s) => {
                const count = tasks.filter((t) => t.status === s).length;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[s]}`}>{s}</span>
                    <span className="text-sm font-bold text-slate-700">{count}</span>
                  </div>
                );
              })}
              <div className="ml-auto flex items-center gap-2">
                {(["High", "Medium", "Low"] as const).map((p) => {
                  const count = tasks.filter((t) => t.priority === p).length;
                  return (
                    <div key={p} className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_STYLES[p]}`}>{p}</span>
                      <span className="text-sm font-bold text-slate-700">{count}</span>
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
                placeholder="Search by task, project, or person..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-500">
              <option value="All">All Projects</option>
              {projects.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-500">
              <option value="All">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Complete">Complete</option>
              <option value="On Hold">On Hold</option>
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-500">
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing <span className="font-semibold text-slate-700">{filteredTasks.length}</span> of <span className="font-semibold text-slate-700">{totalTasks}</span> tasks
            </p>
            {(searchQuery || statusFilter !== "All" || priorityFilter !== "All" || projectFilter !== "All") && (
              <button onClick={() => { setSearchQuery(""); setStatusFilter("All"); setPriorityFilter("All"); setProjectFilter("All"); }} className="text-xs text-red-600 hover:text-red-800 font-medium">
                Clear filters
              </button>
            )}
          </div>

          <TaskTable tasks={filteredTasks} columns={ALL_COLUMNS} onEdit={handleEdit} onDelete={handleDelete} showActions={true} />
        </>
      )}

      {/* Task Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{editTask ? "Edit Task" : "Add New Task"}</h2>
              <button onClick={() => { setShowForm(false); setEditTask(null); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <TaskForm editTask={editTask} existingProjects={projects} existingEmployees={existingEmployees} onSave={handleFormSave} onCancel={() => { setShowForm(false); setEditTask(null); }} />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Delete Task</h3>
                <p className="text-sm text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={confirmDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">Delete</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
