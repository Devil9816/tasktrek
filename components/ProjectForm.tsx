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
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Project Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          list="project-list"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          placeholder="e.g. Collections, Underwriting"
          className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition ${
            error ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
          }`}
          autoFocus
        />
        <datalist id="project-list">
          {existingProjects.map((p) => <option key={p} value={p} />)}
        </datalist>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
        >
          {saving ? "Creating..." : "Create Project"}
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
