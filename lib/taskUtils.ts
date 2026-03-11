/**
 * Normalize assignedTo so API always returns string[].
 * Production may have legacy documents where assignedTo is a string.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeAssignedTo(task: Record<string, any>): Record<string, any> {
  if (!task) return task;
  const raw = task.assignedTo;
  const assignedTo = Array.isArray(raw)
    ? raw.filter((s): s is string => typeof s === "string").map((s) => s.trim()).filter(Boolean)
    : typeof raw === "string" && raw.trim()
      ? [raw.trim()]
      : [];
  return { ...task, assignedTo };
}

/** Accept assignedTo from request body (string or string[]) and return string[] */
export function parseAssignedTo(assignedTo: unknown): string[] {
  if (Array.isArray(assignedTo)) {
    return assignedTo
      .filter((s): s is string => typeof s === "string")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof assignedTo === "string" && assignedTo.trim()) {
    return [assignedTo.trim()];
  }
  return [];
}
