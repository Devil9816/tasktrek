import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";

// Demo task IDs that were added by seed — used to remove only dummy data
const DEMO_TASK_IDS = [
  "TASK-1001", "TASK-1002", "TASK-1003", "TASK-1004", "TASK-1005",
  "TASK-1006", "TASK-1007", "TASK-1008", "TASK-1009",
];

// DELETE /api/seed — remove only the demo/seed tasks (Loan Model, CRM Tool, Collections Model)
export async function DELETE() {
  try {
    await connectDB();
    const result = await Task.deleteMany({ taskId: { $in: DEMO_TASK_IDS } });
    return NextResponse.json({
      success: true,
      message: `Removed ${result.deletedCount} demo task(s).`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("DELETE /api/seed error:", error);
    return NextResponse.json({ success: false, error: "Failed to remove demo data" }, { status: 500 });
  }
}

// POST /api/seed — seed demo data (only if DB is empty)
export async function POST() {
  try {
    await connectDB();
    const count = await Task.countDocuments();
    if (count > 0) {
      return NextResponse.json({ success: true, message: "Database already has data, skipping seed." });
    }

    const today = new Date();
    const addDays = (n: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + n);
      return d.toISOString().split("T")[0];
    };

    const demo = [
      { taskId: DEMO_TASK_IDS[0], project: "Loan Model", description: "Build credit scoring pipeline", assignedTo: ["Alice Johnson"], eta: addDays(5), status: "In Progress", priority: "High" },
      { taskId: DEMO_TASK_IDS[1], project: "Loan Model", description: "Data validation & cleaning", assignedTo: ["Bob Smith"], eta: addDays(-2), status: "Not Started", priority: "High" },
      { taskId: DEMO_TASK_IDS[2], project: "Loan Model", description: "Write unit tests for model", assignedTo: ["Alice Johnson", "Bob Smith"], eta: addDays(10), status: "Not Started", priority: "Medium" },
      { taskId: DEMO_TASK_IDS[3], project: "CRM Tool", description: "Design customer dashboard UI", assignedTo: ["Carol White"], eta: addDays(3), status: "In Progress", priority: "High" },
      { taskId: DEMO_TASK_IDS[4], project: "CRM Tool", description: "Integrate email notification system", assignedTo: ["Bob Smith"], eta: addDays(-1), status: "On Hold", priority: "Medium" },
      { taskId: DEMO_TASK_IDS[5], project: "CRM Tool", description: "Set up CI/CD pipeline", assignedTo: ["David Lee"], eta: addDays(7), status: "Complete", priority: "Low" },
      { taskId: DEMO_TASK_IDS[6], project: "Collections Model", description: "Define collection strategy rules", assignedTo: ["Carol White"], eta: addDays(-3), status: "Not Started", priority: "High" },
      { taskId: DEMO_TASK_IDS[7], project: "Collections Model", description: "Build reporting dashboard", assignedTo: ["David Lee", "Carol White"], eta: addDays(14), status: "In Progress", priority: "Medium" },
      { taskId: DEMO_TASK_IDS[8], project: "Collections Model", description: "QA testing & bug fixes", assignedTo: ["Alice Johnson"], eta: addDays(20), status: "Not Started", priority: "Low" },
    ];

    // Use upsert so re-running seed never throws duplicate key errors
    await Promise.all(
      demo.map((task) =>
        Task.updateOne({ taskId: task.taskId }, { $setOnInsert: task }, { upsert: true })
      )
    );
    return NextResponse.json({ success: true, message: `Seeded ${demo.length} demo tasks.` });
  } catch (error) {
    console.error("POST /api/seed error:", error);
    return NextResponse.json({ success: false, error: "Failed to seed data" }, { status: 500 });
  }
}
