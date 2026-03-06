import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";

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
    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error("GET /api/tasks/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch task" }, { status: 500 });
  }
}

// PUT /api/tasks/[id] — update a task by taskId
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await req.json();
    const { project, description, assignedTo, eta, status, priority } = body;

    const task = await Task.findOneAndUpdate(
      { taskId: params.id },
      { project, description, assignedTo, eta, status, priority },
      { new: true, runValidators: true }
    ).lean();

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: task });
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
