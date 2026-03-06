import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";

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
      { taskId: "TASK-1001", project: "Loan Model", description: "Build credit scoring pipeline", assignedTo: "Alice Johnson", eta: addDays(5), status: "In Progress", priority: "High" },
      { taskId: "TASK-1002", project: "Loan Model", description: "Data validation & cleaning", assignedTo: "Bob Smith", eta: addDays(-2), status: "Not Started", priority: "High" },
      { taskId: "TASK-1003", project: "Loan Model", description: "Write unit tests for model", assignedTo: "Alice Johnson", eta: addDays(10), status: "Not Started", priority: "Medium" },
      { taskId: "TASK-1004", project: "CRM Tool", description: "Design customer dashboard UI", assignedTo: "Carol White", eta: addDays(3), status: "In Progress", priority: "High" },
      { taskId: "TASK-1005", project: "CRM Tool", description: "Integrate email notification system", assignedTo: "Bob Smith", eta: addDays(-1), status: "On Hold", priority: "Medium" },
      { taskId: "TASK-1006", project: "CRM Tool", description: "Set up CI/CD pipeline", assignedTo: "David Lee", eta: addDays(7), status: "Complete", priority: "Low" },
      { taskId: "TASK-1007", project: "Collections Model", description: "Define collection strategy rules", assignedTo: "Carol White", eta: addDays(-3), status: "Not Started", priority: "High" },
      { taskId: "TASK-1008", project: "Collections Model", description: "Build reporting dashboard", assignedTo: "David Lee", eta: addDays(14), status: "In Progress", priority: "Medium" },
      { taskId: "TASK-1009", project: "Collections Model", description: "QA testing & bug fixes", assignedTo: "Alice Johnson", eta: addDays(20), status: "Not Started", priority: "Low" },
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
