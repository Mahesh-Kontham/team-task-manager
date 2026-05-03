import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import prisma from "../utils/prisma";
import { getString } from "../utils/helpers";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const isAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = getString(req.cookies.accessToken);
    if (!token) {
      return res.status(401).json({ success: false, error: "Unauthorized: No token provided" });
    }

    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.userId, role: decoded.role };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: "Unauthorized: Invalid token" });
  }
};

export const isProjectMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const projectId = getString(req.params.projectId) || getString(req.params.id);

    if (!userId || !projectId) {
      return res.status(400).json({ success: false, error: "Missing user or project info" });
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (!member && req.user?.role !== "ADMIN") {
      return res.status(403).json({ success: false, error: "Forbidden: Not a member of this project" });
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const isProjectAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const projectId = getString(req.params.projectId) || getString(req.params.id);

    if (!userId || !projectId) {
      return res.status(400).json({ success: false, error: "Missing user or project info" });
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (req.user?.role === "ADMIN") {
      return next(); // System admin has full access
    }

    if (!member || member.role !== "ADMIN") {
      return res.status(403).json({ success: false, error: "Forbidden: Not a project admin" });
    }

    next();
  } catch (error) {
    next(error);
  }
};
