"use client";

import { useState, useEffect } from "react";
import { Task, fetchTasks, isOverdue, getEmployees } from "@/utils/api";
import TaskTable from "@/components/TaskTable";
import { useEditMode } from "@/components/EditModeProvider";

const EMPLOYEE_COLUMNS = [
  { key: "id", label: "Task ID" },
  { key: "project", label: "Project" },
  { key: "description", label: "Task" },
  { key: "eta", label: "ETA" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
];

const AVATAR_COLORS = [
  "from-red-400 to-rose-500",
  "from-rose-400 to-pink-500",
  "from-emerald-400 to-teal-500",
  "from-orange-400 to-red-500",
  "from-pink-400 to-rose-500",
  "from-red-500 to-rose-600",
];

export default function EmployeeView() {
  const { isEditMode } = useEditMode();
  const [employees, setEmployees] = useState<string[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [employeeTasks, setEmployeeTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const tasks = await fetchTasks();
        setAllTasks(tasks);
        const emps = getEmployees(tasks);
        setEmployees(emps);
        if (emps.length > 0) setSelectedEmployee(emps[0]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedEmployee) { setEmployeeTasks([]); return; }
    let filtered = allTasks.filter((t) => Array.isArray(t.assignedTo) && t.assignedTo.includes(selectedEmployee));
    if (statusFilter !== "All") filtered = filtered.filter((t) => t.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) => t.description.toLowerCase().includes(q) || t.project.toLowerCase().includes(q) || t.taskId.toLowerCase().includes(q)
      );
    }
    setEmployeeTasks(filtered);
  }, [selectedEmployee, allTasks, statusFilter, searchQuery]);

  const getStats = (employee: string) => {
    const tasks = allTasks.filter((t) => Array.isArray(t.assignedTo) && t.assignedTo.includes(employee));
    return {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === "Complete").length,
      pending: tasks.filter((t) => t.status !== "Complete").length,
      overdue: tasks.filter((t) => isOverdue(t)).length,
    };
  };

  const selectedStats = selectedEmployee ? getStats(selectedEmployee) : null;
  const selectedIdx = selectedEmployee ? employees.indexOf(selectedEmployee) : 0;
  const avatarColor = AVATAR_COLORS[selectedIdx % AVATAR_COLORS.length];

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-sm flex-shrink-0 transition-colors">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Team</h2>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Employees</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {loading ? (
            <div className="space-y-2 p-2">{[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div>
          ) : employees.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 px-2 py-4 text-center">No employees yet.</p>
          ) : (
            employees.map((emp, idx) => {
              const stats = getStats(emp);
              const isSelected = selectedEmployee === emp;
              const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              return (
                <button
                  key={emp}
                  onClick={() => { setSelectedEmployee(emp); setStatusFilter("All"); setSearchQuery(""); }}
                  className={`w-full text-left px-3 py-3 rounded-xl transition-all duration-150 ${isSelected ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 shadow-sm" : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                      {emp.split(" ").map(n => n.charAt(0)).join("").toUpperCase().substring(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isSelected ? "text-red-700 dark:text-red-400" : "text-slate-700 dark:text-slate-300"}`}>{emp}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400 dark:text-slate-500">{stats.total} tasks</span>
                        {stats.overdue > 0 && <span className="text-xs text-red-500 dark:text-red-400 font-medium">• {stats.overdue} overdue</span>}
                      </div>
                    </div>
                  </div>
                  {stats.total > 0 && (
                    <div className="mt-2 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(stats.completed / stats.total) * 100}%` }} />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-6 space-y-4">
            <div className="h-14 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
            <div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div>
            <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          </div>
        ) : selectedEmployee && selectedStats ? (
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-2xl font-bold shadow-md`}>
                {selectedEmployee.split(" ").map(n => n.charAt(0)).join("").toUpperCase().substring(0, 2)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedEmployee}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{selectedStats.total} task{selectedStats.total !== 1 ? "s" : ""} assigned</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Tasks", value: selectedStats.total, color: "text-slate-900 dark:text-white", bg: "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" },
                { label: "Completed", value: selectedStats.completed, color: "text-emerald-900 dark:text-emerald-100", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 shadow-[0_4px_12px_rgba(16,185,129,0.1)]" },
                { label: "Pending", value: selectedStats.pending, color: "text-blue-900 dark:text-blue-100", bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 shadow-[0_4px_12px_rgba(59,130,246,0.1)]" },
                { label: "Overdue", value: selectedStats.overdue, color: "text-rose-900 dark:text-rose-100", bg: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 shadow-[0_4px_12px_rgba(244,63,94,0.1)]" },
              ].map((stat) => (
                <div key={stat.label} className={`${stat.bg} rounded-2xl p-5 border-2 transition-all hover:scale-[1.02]`}>
                  <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-2">{stat.label}</p>
                  <p className={`text-4xl font-black ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Progress */}
            {selectedStats.total > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Completion Progress</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{Math.round((selectedStats.completed / selectedStats.total) * 100)}%</span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500" style={{ width: `${(selectedStats.completed / selectedStats.total) * 100}%` }} />
                </div>
              </div>
            )}

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

            <TaskTable tasks={employeeTasks} columns={EMPLOYEE_COLUMNS} showActions={isEditMode} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-lg font-medium">Select an employee to view their tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}
