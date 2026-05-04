import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

import authRoutes from "./routes/auth.routes";
import projectRoutes from "./routes/project.routes";
import dashboardRoutes from "./routes/dashboard.routes";

app.use(cors({
  origin: ["https://team-task-manager-beta-amber.vercel.app", "http://localhost:5173"],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "OK" });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/dashboard", dashboardRoutes);

import { ZodError } from "zod";

// Default error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  
  if (err instanceof ZodError) {
    const errorMessages = err.issues.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`).join(", ");
    return res.status(400).json({
      success: false,
      error: errorMessages,
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || "Internal Server Error",
    statusCode,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
