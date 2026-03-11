import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";
import Task from "@/models/Task";

// DELETE /api/projects/[name] — delete project and all its tasks (explicit delete only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    await connectDB();
    const name = decodeURIComponent(params.name);
    const project = await Project.findOneAndDelete({ name }).lean();
    const taskResult = await Task.deleteMany({ project: name });
    return NextResponse.json({
      success: true,
      message: `Project and ${taskResult.deletedCount} task(s) deleted.`,
      deletedTasks: taskResult.deletedCount,
    });
  } catch (error) {
    console.error("DELETE /api/projects/[name] error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete project" }, { status: 500 });
  }
}
