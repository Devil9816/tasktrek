export type TaskStatus = "Not Started" | "In Progress" | "Complete" | "Future To-do's" | "On Hold" | "Blocker";
export type TaskPriority = "High" | "Medium" | "Low";

export interface Task {
  id: string;
  project: string;
  name: string;
  description: string;
  assignedTo: string[];
  eta: string; // ISO date string YYYY-MM-DD
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
}

const STORAGE_KEY = "tasks_db";

export function getTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function addTask(task: Omit<Task, "id" | "createdAt">): Task {
  const tasks = getTasks();
  const newTask: Task = {
    ...task,
    id: `TASK-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  saveTasks([...tasks, newTask]);
  return newTask;
}

export function updateTask(id: string, updates: Partial<Omit<Task, "id" | "createdAt">>): Task | null {
  const tasks = getTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  tasks[idx] = { ...tasks[idx], ...updates };
  saveTasks(tasks);
  return tasks[idx];
}

export function deleteTask(id: string): void {
  const tasks = getTasks();
  saveTasks(tasks.filter((t) => t.id !== id));
}

export function getProjects(): string[] {
  const tasks = getTasks();
  const set = new Set(tasks.map((t) => t.project));
  return Array.from(set).sort();
}

export function getEmployees(): string[] {
  const tasks = getTasks();
  const names = tasks.flatMap((t) => (Array.isArray(t.assignedTo) ? t.assignedTo : t.assignedTo ? [t.assignedTo] : []));
  return Array.from(new Set(names)).sort();
}

export function isOverdue(task: Task): boolean {
  if (task.status === "Complete" || task.status === "Future To-do's") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eta = new Date(task.eta);
  eta.setHours(0, 0, 0, 0);
  return eta < today;
}

// Seed demo data if localStorage is empty
export function seedDemoData(): void {
  if (typeof window === "undefined") return;
  const existing = getTasks();
  if (existing.length > 0) return;

  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const addDays = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return fmt(d);
  };

  const demo: Task[] = [
    { id: "TASK-1001", project: "Loan Model", name: "Credit scoring pipeline", description: "Build credit scoring pipeline", assignedTo: ["Alice Johnson"], eta: addDays(5), status: "In Progress", priority: "High", createdAt: new Date().toISOString() },
    { id: "TASK-1002", project: "Loan Model", name: "Data validation", description: "Data validation & cleaning", assignedTo: ["Bob Smith"], eta: addDays(-2), status: "Not Started", priority: "High", createdAt: new Date().toISOString() },
    { id: "TASK-1003", project: "Loan Model", name: "Unit tests", description: "Write unit tests for model", assignedTo: ["Alice Johnson"], eta: addDays(10), status: "Not Started", priority: "Medium", createdAt: new Date().toISOString() },
    { id: "TASK-1004", project: "CRM Tool", name: "Dashboard UI", description: "Design customer dashboard UI", assignedTo: ["Carol White"], eta: addDays(3), status: "In Progress", priority: "High", createdAt: new Date().toISOString() },
    { id: "TASK-1005", project: "CRM Tool", name: "Email notifications", description: "Integrate email notification system", assignedTo: ["Bob Smith"], eta: addDays(-1), status: "On Hold", priority: "Medium", createdAt: new Date().toISOString() },
    { id: "TASK-1006", project: "CRM Tool", name: "CI/CD pipeline", description: "Set up CI/CD pipeline", assignedTo: ["David Lee"], eta: addDays(7), status: "Complete", priority: "Low", createdAt: new Date().toISOString() },
    { id: "TASK-1007", project: "Collections Model", name: "Strategy rules", description: "Define collection strategy rules", assignedTo: ["Carol White"], eta: addDays(-3), status: "Not Started", priority: "High", createdAt: new Date().toISOString() },
    { id: "TASK-1008", project: "Collections Model", name: "Reporting dashboard", description: "Build reporting dashboard", assignedTo: ["David Lee"], eta: addDays(14), status: "In Progress", priority: "Medium", createdAt: new Date().toISOString() },
    { id: "TASK-1009", project: "Collections Model", name: "QA & bugs", description: "QA testing & bug fixes", assignedTo: ["Alice Johnson"], eta: addDays(20), status: "Not Started", priority: "Low", createdAt: new Date().toISOString() },
  ];

  saveTasks(demo);
}
