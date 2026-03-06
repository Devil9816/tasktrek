"use client";

import { useState, useEffect, useCallback } from "react";
import { Task, fetchTasks, deleteTask, getProjects, isOverdue, seedDemoData } from "@/utils/api";
import TaskTable from "@/components/TaskTable";
import TaskForm from "@/components/TaskForm";

const PROJECT_COLUMNS = [
  { key: "id", label: "Task ID" },
  { key: "description", label: "Task Description" },
  { key: "assignedTo", label: "Assigned To" },
  { key: "eta", label: "ETA" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
];

const PROJECT_COLORS = [
  "from-indigo-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-red-500",
  "from-pink-500 to-rose-600",
  "from-violet-500 to-indigo-600",
];

export default function ProjectView() {
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (keepProject?: string) => {
    setLoading(true);
    try {
      await seedDemoData();
      const tasks = await fetchTasks();
      const projs = getProjects(tasks);
      setAllTasks(tasks);
      setProjects(projs);
      const active = keepProject || (projs.length > 0 ? projs[0] : null);
      setSelectedProject(active);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    let filtered = selectedProject ? allTasks.filter((t) => t.project === selectedProject) : allTasks;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) => t.description.toLowerCase().includes(q) || t.assignedTo.toLowerCase().includes(q) || t.taskId.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "All") filtered = filtered.filter((t) => t.status === statusFilter);
    setFilteredTasks(filtered);
  }, [allTasks, selectedProject, searchQuery, statusFilter]);

  const handleDelete = (taskId: string) => setDeleteConfirm(taskId);

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    await deleteTask(deleteConfirm);
    setDeleteConfirm(null);
    loadData(selectedProject || undefined);
  };

  const handleEdit = (task: Task) => { setEditTask(task); setShowForm(true); };
  const handleFormSave = () => { setShowForm(false); setEditTask(null); loadData(selectedProject || undefined); };

  const getProjectStats = (project: string) => {
    const pt = allTasks.filter((t) => t.project === project);
    return { total: pt.length, completed: pt.filter((t) => t.status === "Complete").length, overdue: pt.filter((t) => isOverdue(t)).length };
  };

  const overdueTasks = filteredTasks.filter((t) => isOverdue(t)).length;
  const completedTasks = filteredTasks.filter((t) => t.status === "Complete").length;
  const inProgressTasks = filteredTasks.filter((t) => t.status === "In Progress").length;
  const existingProjects = getProjects(allTasks);
  const existingEmployees = Array.from(new Set(allTasks.map((t) => t.assignedTo))).sort();

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm flex-shrink-0">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Workspace</h2>
          <p className="text-sm font-semibold text-slate-700">Projects</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {loading ? (
            <div className="space-y-2 p-2">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : projects.length === 0 ? (
            <p className="text-xs text-slate-400 px-2 py-4 text-center">No projects yet.<br />Add tasks to create projects.</p>
          ) : (
            projects.map((project, idx) => {
              const stats = getProjectStats(project);
              const isSelected = selectedProject === project;
              const colorClass = PROJECT_COLORS[idx % PROJECT_COLORS.length];
              return (
                <button
                  key={project}
                  onClick={() => { setSelectedProject(project); setSearchQuery(""); setStatusFilter("All"); }}
                  className={`w-full text-left px-3 py-3 rounded-xl transition-all duration-150 group ${isSelected ? "bg-indigo-50 border border-indigo-200 shadow-sm" : "hover:bg-slate-50 border border-transparent"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {project.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isSelected ? "text-indigo-700" : "text-slate-700"}`}>{project}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">{stats.total} tasks</span>
                        {stats.overdue > 0 && <span className="text-xs text-red-500 font-medium">• {stats.overdue} overdue</span>}
                      </div>
                    </div>
                  </div>
                  {stats.total > 0 && (
                    <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(stats.completed / stats.total) * 100}%` }} />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={() => { setShowForm(true); setEditTask(null); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Task
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-6 space-y-4">
            <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
            <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
          </div>
        ) : selectedProject ? (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{selectedProject}</h1>
                <p className="text-sm text-slate-500 mt-0.5">{filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""} shown</p>
              </div>
              <button
                onClick={() => { setShowForm(true); setEditTask(null); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Task
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Tasks", value: filteredTasks.length, color: "text-slate-700", bg: "bg-slate-100" },
                { label: "In Progress", value: inProgressTasks, color: "text-blue-700", bg: "bg-blue-50" },
                { label: "Completed", value: completedTasks, color: "text-emerald-700", bg: "bg-emerald-50" },
                { label: "Overdue", value: overdueTasks, color: "text-red-700", bg: "bg-red-50" },
              ].map((stat) => (
                <div key={stat.label} className={`${stat.bg} rounded-xl p-4 border border-slate-200`}>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{stat.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Statuses</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Complete">Complete</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>

            <TaskTable tasks={filteredTasks} columns={PROJECT_COLUMNS} onEdit={handleEdit} onDelete={handleDelete} showActions={true} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p className="text-lg font-medium">Select a project to get started</p>
            <p className="text-sm mt-1">Or add a task to create your first project</p>
          </div>
        )}
      </div>

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
              <TaskForm editTask={editTask} existingProjects={existingProjects} existingEmployees={existingEmployees} onSave={handleFormSave} onCancel={() => { setShowForm(false); setEditTask(null); }} />
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
