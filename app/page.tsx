"use client";

import { useState, useEffect, useCallback } from "react";
import { Task, fetchTasks, deleteTask, fetchProjects, deleteProject, getEmployees, isOverdue } from "@/utils/api";
import TaskTable from "@/components/TaskTable";
import TaskForm from "@/components/TaskForm";
import ProjectForm from "@/components/ProjectForm";

const PROJECT_COLUMNS = [
  { key: "id", label: "Task ID" },
  { key: "description", label: "Task Description" },
  { key: "assignedTo", label: "Assigned To" },
  { key: "eta", label: "ETA" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
];

const PROJECT_COLORS = [
  "from-red-500 to-rose-600",
  "from-red-600 to-orange-500",
  "from-rose-500 to-red-600",
  "from-orange-500 to-red-500",
  "from-pink-500 to-rose-600",
  "from-red-400 to-rose-500",
];

export default function ProjectView() {
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"addProject" | "addTask" | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteProjectConfirm, setDeleteProjectConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (keepProject?: string) => {
    setLoading(true);
    try {
      const [tasks, projs] = await Promise.all([fetchTasks(), fetchProjects()]);
      setAllTasks(tasks);
      setProjects(projs);
      const active = keepProject && projs.includes(keepProject) ? keepProject : (projs.length > 0 ? projs[0] : null);
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
        (t) =>
          t.description.toLowerCase().includes(q) ||
          (Array.isArray(t.assignedTo) ? t.assignedTo.some((a) => a.toLowerCase().includes(q)) : false) ||
          t.taskId.toLowerCase().includes(q)
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

  const handleEdit = (task: Task) => { setEditTask(task); setFormMode(null); setShowForm(true); };
  const handleFormSave = () => { setShowForm(false); setFormMode(null); setEditTask(null); loadData(selectedProject || undefined); };
  const openAddProject = () => { setFormMode("addProject"); setEditTask(null); setShowForm(true); };
  const openAddTask = () => { setFormMode("addTask"); setEditTask(null); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setFormMode(null); setEditTask(null); };

  const getProjectStats = (project: string) => {
    const pt = allTasks.filter((t) => t.project === project);
    return { total: pt.length, completed: pt.filter((t) => t.status === "Complete").length, overdue: pt.filter((t) => isOverdue(t)).length };
  };

  const overdueTasks = filteredTasks.filter((t) => isOverdue(t)).length;
  const completedTasks = filteredTasks.filter((t) => t.status === "Complete").length;
  const inProgressTasks = filteredTasks.filter((t) => t.status === "In Progress").length;
  const existingProjects = projects;
  const existingEmployees = getEmployees(allTasks);

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
            <p className="text-xs text-slate-400 px-2 py-4 text-center">No projects yet.<br />Use &quot;Add Project&quot; below.</p>
          ) : (
            projects.map((project, idx) => {
              const stats = getProjectStats(project);
              const isSelected = selectedProject === project;
              const colorClass = PROJECT_COLORS[idx % PROJECT_COLORS.length];
              return (
                <button
                  key={project}
                  onClick={() => { setSelectedProject(project); setSearchQuery(""); setStatusFilter("All"); }}
                  className={`w-full text-left px-3 py-3 rounded-xl transition-all duration-150 group ${isSelected ? "bg-red-50 border border-red-200 shadow-sm" : "hover:bg-slate-50 border border-transparent"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {project.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isSelected ? "text-red-700" : "text-slate-700"}`}>{project}</p>
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
            onClick={openAddProject}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors"
            title="Add a new project (create first task under new project name)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Project
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
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{selectedProject}</h1>
                <p className="text-sm text-slate-500 mt-0.5">{filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""} shown</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDeleteProjectConfirm(selectedProject)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
                  title="Delete this project and all its tasks"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete project
                </button>
                <button
                  onClick={openAddTask}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                  title={`Add a task to ${selectedProject}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Add Task
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Tasks", value: filteredTasks.length, color: "text-slate-700", bg: "bg-slate-100" },
                { label: "In Progress", value: inProgressTasks, color: "text-red-700", bg: "bg-red-50" },
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
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
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
            <p className="text-sm mt-1">Or add a project using the sidebar</p>
          </div>
        )}
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editTask ? "Edit Task" : formMode === "addProject" ? "Add New Project" : formMode === "addTask" && selectedProject ? `Add Task to ${selectedProject}` : "Add New Task"}
              </h2>
              <button onClick={closeForm} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {formMode === "addProject" ? (
                <ProjectForm
                  existingProjects={existingProjects}
                  onSave={handleFormSave}
                  onCancel={closeForm}
                />
              ) : (
                <TaskForm
                  editTask={editTask}
                  existingProjects={existingProjects}
                  existingEmployees={existingEmployees}
                  defaultProject={formMode === "addTask" ? selectedProject ?? undefined : undefined}
                  lockProject={formMode === "addTask" && !!selectedProject}
                  onSave={handleFormSave}
                  onCancel={closeForm}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Task Confirm Modal */}
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

      {/* Delete Project Confirm Modal */}
      {deleteProjectConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Delete Project</h3>
                <p className="text-sm text-slate-500">
                  Delete &quot;{deleteProjectConfirm}&quot; and all its tasks? This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!deleteProjectConfirm) return;
                  await deleteProject(deleteProjectConfirm);
                  setDeleteProjectConfirm(null);
                  loadData();
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                Delete project
              </button>
              <button onClick={() => setDeleteProjectConfirm(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
