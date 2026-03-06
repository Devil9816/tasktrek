import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITask extends Document {
  taskId: string;
  project: string;
  description: string;
  assignedTo: string;
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
    assignedTo: {
      type: String,
      required: true,
      trim: true,
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
