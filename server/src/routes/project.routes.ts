import { Router } from "express";
import { getProjects, createProject, getProjectById, updateProject, deleteProject } from "../controllers/project.controller";
import { isAuth, isProjectMember, isProjectAdmin } from "../middlewares/auth.middleware";
import memberRoutes from "./member.routes";
import taskRoutes from "./task.routes";

const router = Router();

router.use(isAuth);

router.get("/", getProjects);
router.post("/", createProject);

router.get("/:id", isProjectMember, getProjectById);
router.put("/:id", isProjectAdmin, updateProject);
router.delete("/:id", isProjectAdmin, deleteProject);

// Nested routes
router.use("/:projectId/members", memberRoutes);
router.use("/:projectId/tasks", taskRoutes);

export default router;
