import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import { normalizeAssignedTo, parseAssignedTo } from "@/lib/taskUtils";

// GET /api/tasks/[id] — fetch a single task by taskId
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const task = await Task.findOne({ taskId: params.id }).lean();
    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }
    const normalized = normalizeAssignedTo(task);
    return NextResponse.json({ success: true, data: normalized });
  } catch (error) {
    console.error("GET /api/tasks/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch task" }, { status: 500 });
  }
}

// PUT /api/tasks/[id] — update a task (assignedTo optional; accepts string or string[])
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await req.json();
    const { project, description, assignedTo, eta, status, priority } = body;

    const update: Record<string, unknown> = { project, description, eta, status, priority };
    if (assignedTo !== undefined) {
      const assignees = parseAssignedTo(assignedTo);
      if (assignees.length === 0) {
        return NextResponse.json(
          { success: false, error: "assignedTo must be at least one name (string or array)" },
          { status: 400 }
        );
      }
      update.assignedTo = assignees;
    }

    const task = await Task.findOneAndUpdate(
      { taskId: params.id },
      update,
      { new: true, runValidators: true }
    ).lean();

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    const normalized = normalizeAssignedTo(task);
    return NextResponse.json({ success: true, data: normalized });
  } catch (error) {
    console.error("PUT /api/tasks/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE /api/tasks/[id] — delete a task by taskId
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const task = await Task.findOneAndDelete({ taskId: params.id });
    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/tasks/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete task" }, { status: 500 });
  }
}
