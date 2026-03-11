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
    `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition ${
      errors[field] ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Project */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Project Name <span className="text-red-500">*</span>
        </label>
        {lockProject ? (
          <div className="px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 text-sm font-medium">
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
        <label className="block text-sm font-medium text-slate-700 mb-1">
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
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Assigned To <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-slate-500 mb-2">Select one or more employees</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {assignedTo.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200"
            >
              {name}
              <button
                type="button"
                onClick={() => removeAssignee(name)}
                className="text-red-500 hover:text-red-700 focus:outline-none"
                aria-label={`Remove ${name}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 max-h-32 overflow-y-auto py-2 border border-slate-200 rounded-lg px-3 bg-slate-50">
          {existingEmployees.map((emp) => (
            <label key={emp} className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={assignedTo.includes(emp)}
                onChange={() => toggleAssignee(emp)}
                className="rounded border-slate-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-slate-700">{emp}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            list="employee-list"
            value={addAssigneeInput}
            onChange={(e) => setAddAssigneeInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAssignee())}
            placeholder="Or type and add another name"
            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <datalist id="employee-list">
            {existingEmployees.map((e) => <option key={e} value={e} />)}
          </datalist>
          <button type="button" onClick={addAssignee} className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50">
            Add
          </button>
        </div>
        {errors.assignedTo && <p className="text-red-500 text-xs mt-1">{errors.assignedTo}</p>}
      </div>

      {/* ETA */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
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
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
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
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
