import { Router } from "express";
import { signup, login, logout, refresh, me } from "../controllers/auth.controller";
import { isAuth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.get("/me", isAuth, me);

export default router;
