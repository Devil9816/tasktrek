"use client";

import { useState, useEffect } from "react";
import { Task, TaskStatus, TaskPriority, createTask, updateTask } from "@/utils/api";

interface TaskFormProps {
  editTask?: Task | null;
  existingProjects?: string[];
  existingEmployees?: string[];
  onSave: () => void;
  onCancel: () => void;
}

const STATUS_OPTIONS: TaskStatus[] = ["Not Started", "In Progress", "Complete", "On Hold"];
const PRIORITY_OPTIONS: TaskPriority[] = ["High", "Medium", "Low"];

export default function TaskForm({
  editTask,
  existingProjects = [],
  existingEmployees = [],
  onSave,
  onCancel,
}: TaskFormProps) {
  const [project, setProject] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [eta, setEta] = useState("");
  const [status, setStatus] = useState<TaskStatus>("Not Started");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editTask) {
      setProject(editTask.project);
      setDescription(editTask.description);
      setAssignedTo(editTask.assignedTo);
      setEta(editTask.eta);
      setStatus(editTask.status);
      setPriority(editTask.priority);
    }
  }, [editTask]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!project.trim()) e.project = "Project name is required";
    if (!description.trim()) e.description = "Task description is required";
    if (!assignedTo.trim()) e.assignedTo = "Assigned to is required";
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
    `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
      errors[field] ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Project */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Project Name <span className="text-red-500">*</span>
        </label>
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

      {/* Assigned To */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Assigned To <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          list="employee-list"
          value={assignedTo}
          onChange={(e) => { setAssignedTo(e.target.value); setErrors((p) => ({ ...p, assignedTo: "" })); }}
          placeholder="e.g. Alice Johnson"
          className={inputClass("assignedTo")}
        />
        <datalist id="employee-list">
          {existingEmployees.map((emp) => <option key={emp} value={emp} />)}
        </datalist>
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
            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
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
