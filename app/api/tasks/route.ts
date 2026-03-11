import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import { normalizeAssignedTo, parseAssignedTo } from "@/lib/taskUtils";

// GET /api/tasks — fetch all tasks (optionally filter by project or assignedTo)
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const project = searchParams.get("project");
    const assignedTo = searchParams.get("assignedTo");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (project) filter.project = project;
    if (assignedTo) filter.assignedTo = assignedTo;

    const tasks = await Task.find(filter).sort({ createdAt: -1 }).lean();
    const normalized = tasks.map((t) => normalizeAssignedTo(t));
    return NextResponse.json({ success: true, data: normalized });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// POST /api/tasks — create a new task (assignedTo can be string or string[] for backward compat)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { project, description, assignedTo, eta, status, priority } = body;

    const assignees = parseAssignedTo(assignedTo);
    if (!project || !description || !eta || assignees.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: project, description, assignedTo (at least one), eta" },
        { status: 400 }
      );
    }

    const taskId = `TASK-${Date.now()}`;
    const task = await Task.create({
      taskId,
      project,
      description,
      assignedTo: assignees,
      eta,
      status: status || "Not Started",
      priority: priority || "Medium",
    });

    const normalized = normalizeAssignedTo(task.toObject ? task.toObject() : task);
    return NextResponse.json({ success: true, data: normalized }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ success: false, error: "Failed to create task" }, { status: 500 });
  }
}
