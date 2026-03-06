export type TaskStatus = "Not Started" | "In Progress" | "Complete" | "On Hold";
export type TaskPriority = "High" | "Medium" | "Low";

export interface Task {
  _id: string;
  taskId: string;
  project: string;
  description: string;
  assignedTo: string;
  eta: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
}

export type CreateTaskInput = Omit<Task, "_id" | "taskId" | "createdAt" | "updatedAt">;
export type UpdateTaskInput = Partial<CreateTaskInput>;

const BASE = "/api/tasks";

// Fetch all tasks, optionally filtered
export async function fetchTasks(filters?: { project?: string; assignedTo?: string }): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filters?.project) params.set("project", filters.project);
  if (filters?.assignedTo) params.set("assignedTo", filters.assignedTo);
  const url = params.toString() ? `${BASE}?${params}` : BASE;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to fetch tasks");
  return json.data;
}

// Create a new task
export async function createTask(input: CreateTaskInput): Promise<Task> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to create task");
  return json.data;
}

// Update an existing task
export async function updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
  const res = await fetch(`${BASE}/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to update task");
  return json.data;
}

// Delete a task
export async function deleteTask(taskId: string): Promise<void> {
  const res = await fetch(`${BASE}/${taskId}`, { method: "DELETE" });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to delete task");
}

// Seed demo data
export async function seedDemoData(): Promise<void> {
  await fetch("/api/seed", { method: "POST" });
}

// Helpers
export function getProjects(tasks: Task[]): string[] {
  return Array.from(new Set(tasks.map((t) => t.project))).sort();
}

export function getEmployees(tasks: Task[]): string[] {
  return Array.from(new Set(tasks.map((t) => t.assignedTo))).sort();
}

export function isOverdue(task: Task): boolean {
  if (task.status === "Complete") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eta = new Date(task.eta + "T00:00:00");
  return eta < today;
}
