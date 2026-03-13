"use client";

import { useState, useEffect } from "react";
import { Task, TaskStatus, TaskPriority, createTask, updateTask } from "@/utils/api";

interface TaskFormProps {
  editTask?: Task | null;
  existingProjects?: string[];
  existingEmployees?: string[];
  /** When set, form opens with this project and (if lockProject) user cannot change it */
  defaultProject?: string;
  /** When true, project field is read-only (for adding a task to current project only) */
  lockProject?: boolean;
  onSave: () => void;
  onCancel: () => void;
}

const STATUS_OPTIONS: TaskStatus[] = ["Not Started", "In Progress", "Complete", "On Hold"];
const PRIORITY_OPTIONS: TaskPriority[] = ["High", "Medium", "Low"];

export default function TaskForm({
  editTask,
  existingProjects = [],
  existingEmployees = [],
  defaultProject,
  lockProject = false,
  onSave,
  onCancel,
}: TaskFormProps) {
  const [project, setProject] = useState(defaultProject ?? "");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [addAssigneeInput, setAddAssigneeInput] = useState("");
  const [eta, setEta] = useState("");
  const [status, setStatus] = useState<TaskStatus>("Not Started");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editTask) {
      setProject(editTask.project);
      setDescription(editTask.description);
      setAssignedTo(Array.isArray(editTask.assignedTo) ? [...editTask.assignedTo] : editTask.assignedTo ? [editTask.assignedTo] : []);
      setEta(editTask.eta);
      setStatus(editTask.status);
      setPriority(editTask.priority);
    } else if (defaultProject !== undefined) {
      setProject(defaultProject);
    }
  }, [editTask, defaultProject]);

  const toggleAssignee = (name: string) => {
    setAssignedTo((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
    setErrors((p) => ({ ...p, assignedTo: "" }));
  };

  const addAssignee = () => {
    const name = addAssigneeInput.trim();
    if (!name || assignedTo.includes(name)) return;
    setAssignedTo((prev) => [...prev, name]);
    setAddAssigneeInput("");
    setErrors((p) => ({ ...p, assignedTo: "" }));
  };

  const removeAssignee = (name: string) => {
    setAssignedTo((prev) => prev.filter((n) => n !== name));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!project.trim()) e.project = "Project name is required";
    if (!description.trim()) e.description = "Task description is required";
    if (assignedTo.length === 0) e.assignedTo = "Select at least one assignee";
    if (!eta) e.eta = "ETA is required";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      if (editTask) {
        await updateTask(editTask.taskId, { project, description, assignedTo, eta, status, priority });
      } else {
        await createTask({ project, description, assignedTo, eta, status, priority });
      }
      onSave();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 ${errors[field]
      ? "border-red-400 bg-red-50 dark:bg-red-950/20 dark:border-red-800"
      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Project */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Project Name <span className="text-red-500">*</span>
        </label>
        {lockProject ? (
          <div className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm font-medium transition-colors">
            {project || "—"}
          </div>
        ) : (
          <>
            <input
              type="text"
              list="project-list"
              value={project}
              onChange={(e) => { setProject(e.target.value); setErrors((p) => ({ ...p, project: "" })); }}
              placeholder="e.g. Loan Model"
              className={inputClass("project")}
            />
            <datalist id="project-list">
              {existingProjects.map((p) => <option key={p} value={p} />)}
            </datalist>
          </>
        )}
        {errors.project && <p className="text-red-500 text-xs mt-1">{errors.project}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Task Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: "" })); }}
          placeholder="Describe the task..."
          rows={3}
          className={`${inputClass("description")} resize-none`}
        />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
      </div>

      {/* Assigned To (multiple) */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Assigned To <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400">Select one or more employees</p>

        <div className="flex flex-wrap gap-2">
          {assignedTo.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-sm border border-red-200 dark:border-red-800 transition-colors"
            >
              {name}
              <button
                type="button"
                onClick={() => removeAssignee(name)}
                className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 focus:outline-none transition-colors"
                aria-label={`Remove ${name}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 max-h-32 overflow-y-auto py-2 border border-slate-200 dark:border-slate-800 rounded-lg px-3 bg-slate-50 dark:bg-slate-900 transition-colors">
          {existingEmployees.map((emp) => (
            <label key={emp} className="inline-flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={assignedTo.includes(emp)}
                onChange={() => toggleAssignee(emp)}
                className="rounded border-slate-300 dark:border-slate-700 text-red-600 focus:ring-red-500 dark:bg-slate-800"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{emp}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            list="employee-list"
            value={addAssigneeInput}
            onChange={(e) => setAddAssigneeInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAssignee())}
            placeholder="Add another name"
            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
          />
          <datalist id="employee-list">
            {existingEmployees.map((e) => <option key={e} value={e} />)}
          </datalist>
          <button type="button" onClick={addAssignee} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            Add
          </button>
        </div>
        {errors.assignedTo && <p className="text-red-500 text-xs mt-1">{errors.assignedTo}</p>}
      </div>

      {/* ETA */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          ETA <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={eta}
          onChange={(e) => { setEta(e.target.value); setErrors((p) => ({ ...p, eta: "" })); }}
          className={inputClass("eta")}
        />
        {errors.eta && <p className="text-red-500 text-xs mt-1">{errors.eta}</p>}
      </div>

      {/* Status & Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
          >
            {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 disabled:opacity-60 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-95 text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
        >
          {saving && (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {saving ? "Saving..." : editTask ? "Update Task" : "Add Task"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 px-4 rounded-xl transition-colors active:scale-95 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
