import { Router } from "express";
import { getDashboardData } from "../controllers/dashboard.controller";
import { isAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", isAuth, getDashboardData);

export default router;
