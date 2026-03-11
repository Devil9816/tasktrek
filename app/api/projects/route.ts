import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";
import Task from "@/models/Task";

// GET /api/projects — list all project names (from Project collection + distinct from tasks for backward compat)
export async function GET() {
  try {
    await connectDB();
    const fromProjects = await Project.find().lean().then((docs) => docs.map((d) => d.name));
    const fromTasks = await Task.distinct("project");
    const merged = Array.from(new Set([...fromProjects, ...fromTasks])).filter(Boolean).sort();
    return NextResponse.json({ success: true, data: merged });
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch projects" }, { status: 500 });
  }
}

// POST /api/projects — create a project (name only)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json(
        { success: false, error: "Project name is required" },
        { status: 400 }
      );
    }
    const existing = await Project.findOne({ name }).lean();
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A project with this name already exists" },
        { status: 400 }
      );
    }
    await Project.create({ name });
    return NextResponse.json({ success: true, data: { name } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ success: false, error: "Failed to create project" }, { status: 500 });
  }
}
