import { Router } from "express";
import { getMembers, addMember, removeMember } from "../controllers/member.controller";
import { isProjectMember, isProjectAdmin } from "../middlewares/auth.middleware";

const router = Router({ mergeParams: true });

router.get("/", isProjectMember, getMembers);
router.post("/", isProjectAdmin, addMember);
router.delete("/:userId", isProjectAdmin, removeMember);

export default router;
