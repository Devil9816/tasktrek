"use client";

import { useState } from "react";
import { createProject } from "@/utils/api";

interface ProjectFormProps {
  existingProjects?: string[];
  onSave: () => void;
  onCancel: () => void;
}

export default function ProjectForm({
  existingProjects = [],
  onSave,
  onCancel,
}: ProjectFormProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Project name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createProject(trimmed);
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Project Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          list="project-list"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          placeholder="e.g. Collections, Underwriting"
          className={`w-full px-4 py-3 rounded-2xl border text-sm focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all duration-200 ${error
              ? "border-red-400 bg-red-50 dark:bg-red-950/20 dark:border-red-800"
              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            }`}
          autoFocus
        />
        <datalist id="project-list">
          {existingProjects.map((p) => <option key={p} value={p} />)}
        </datalist>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 disabled:opacity-60 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-500/20 transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
        >
          {saving ? "Creating..." : "Create Project"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-4 rounded-2xl transition-all active:scale-95 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
