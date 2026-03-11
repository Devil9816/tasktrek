import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITask extends Document {
  taskId: string;
  project: string;
  description: string;
  assignedTo: string[];
  eta: string;
  status: "Not Started" | "In Progress" | "Complete" | "On Hold";
  priority: "High" | "Medium" | "Low";
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    taskId: {
      type: String,
      required: true,
      unique: true,
    },
    project: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    // Supports both string (legacy production data) and string[] (multiple assignees)
    assignedTo: {
      type: Schema.Types.Mixed,
      required: true,
      validate: {
        validator: (v: unknown) => {
          if (typeof v === "string") return v.trim().length > 0;
          if (Array.isArray(v)) return v.length > 0 && v.every((s) => typeof s === "string" && String(s).trim().length > 0);
          return false;
        },
        message: "assignedTo must be a non-empty string or non-empty array of names",
      },
    },
    eta: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Not Started", "In Progress", "Complete", "On Hold"],
      default: "Not Started",
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model re-compilation during hot reload in dev
const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);

export default Task;
