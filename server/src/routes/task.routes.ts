import { Router } from "express";
import { getTasks, createTask, getTaskById, updateTask, deleteTask } from "../controllers/task.controller";
import { isProjectMember } from "../middlewares/auth.middleware";

const router = Router({ mergeParams: true });

router.use(isProjectMember);

router.get("/", getTasks);
router.post("/", createTask);

// These routes assume taskId is in the path. In project.routes, they might be nested differently.
// We'll export another router for flat task routes if needed, but for now they are nested under project.
// If nested under /api/projects/:projectId/tasks, then we have access to projectId.
// For operations like getTaskById, updateTask, we don't strictly need projectId in URL if we have taskId,
// but checking isProjectMember requires projectId.
// So we use: /api/projects/:projectId/tasks/:taskId

router.get("/:taskId", getTaskById);
router.put("/:taskId", updateTask);
router.delete("/:taskId", deleteTask);

export default router;
