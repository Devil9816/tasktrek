"use client";

import { useState, useEffect, useCallback } from "react";
import { Task, fetchTasks, deleteTask, updateTask, fetchProjects, deleteProject, getEmployees, isOverdue } from "@/utils/api";
import TaskTable from "@/components/TaskTable";
import TaskForm from "@/components/TaskForm";
import ProjectForm from "@/components/ProjectForm";
import { useEditMode } from "@/components/EditModeProvider";

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
  const { isEditMode } = useEditMode();
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
  const [showCompleted, setShowCompleted] = useState(false);

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
  const handleBumpEta = async (task: Task, newEta: string) => {
    // Optimistically update local state so the UI reflects the change instantly
    setAllTasks((prev) => prev.map((t) => t.taskId === task.taskId ? { ...t, eta: newEta } : t));
    try {
      await updateTask(task.taskId, { eta: newEta });
    } catch {
      // Revert on failure
      setAllTasks((prev) => prev.map((t) => t.taskId === task.taskId ? { ...t, eta: task.eta } : t));
    }
  };
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
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-sm flex-shrink-0 transition-colors">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Workspace</h2>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Projects</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {loading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
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
                  className={`w-full text-left px-3 py-3 rounded-xl transition-all duration-150 group ${isSelected ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 shadow-sm" : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm`}>
                      {project.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isSelected ? "text-red-700 dark:text-red-400" : "text-slate-700 dark:text-slate-300"}`}>{project}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400 dark:text-slate-500">{stats.total} tasks</span>
                        {stats.overdue > 0 && <span className="text-xs text-red-500 dark:text-red-400 font-medium">• {stats.overdue} overdue</span>}
                      </div>
                    </div>
                  </div>
                  {stats.total > 0 && (
                    <div className="mt-2 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(stats.completed / stats.total) * 100}%` }} />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </nav>
        {isEditMode && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={openAddProject}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white text-sm font-semibold rounded-xl transition-colors"
              title="Add a new project (create first task under new project name)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Project
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-6 space-y-4">
            <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
            <div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
          </div>
        ) : selectedProject ? (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedProject}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""} shown</p>
              </div>
              <div className="flex items-center gap-2">
                {isEditMode && (
                  <>
                    <button
                      onClick={() => setDeleteProjectConfirm(selectedProject)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg border border-red-200 dark:border-red-800 transition-colors"
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
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Tasks", value: filteredTasks.length, color: "text-slate-900 dark:text-white", bg: "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800", iconBg: "bg-slate-200" },
                { label: "In Progress", value: inProgressTasks, color: "text-blue-900 dark:text-blue-100", bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 shadow-sm", iconBg: "bg-blue-200" },
                { label: "Completed", value: completedTasks, color: "text-emerald-900 dark:text-emerald-100", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 shadow-sm", iconBg: "bg-emerald-200" },
                { label: "Overdue", value: overdueTasks, color: "text-rose-900 dark:text-rose-100", bg: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 shadow-sm", iconBg: "bg-rose-200" },
              ].map((stat) => (
                <div key={stat.label} className={`${stat.bg} rounded-2xl p-5 border-2 transition-transform hover:scale-[1.02] duration-200`}>
                  <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-2">{stat.label}</p>
                  <p className={`text-4xl font-black ${stat.color}`}>{stat.value}</p>
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
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              >
                <option value="All">All Statuses</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Complete">Complete</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>

            {/* Active tasks */}
            <TaskTable
              tasks={filteredTasks.filter((t) => t.status !== "Complete")}
              columns={PROJECT_COLUMNS}
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
                <div className="border border-emerald-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowCompleted((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Completed Tasks</span>
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-bold">{completedFiltered.length}</span>
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
                        columns={PROJECT_COLUMNS}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editTask ? "Edit Task" : formMode === "addProject" ? "Add New Project" : formMode === "addTask" && selectedProject ? `Add Task to ${selectedProject}` : "Add New Task"}
              </h2>
              <button onClick={closeForm} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Delete Task</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={confirmDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">Delete</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-2.5 rounded-xl transition-colors text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Project Confirm Modal */}
      {deleteProjectConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Delete Project</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
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
              <button onClick={() => setDeleteProjectConfirm(null)} className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-2.5 rounded-xl transition-colors text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
