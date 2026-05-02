import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middlewares/auth.middleware";

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  dueDate: z.preprocess((val) => (val === "" ? null : val), z.coerce.date().optional().nullable()),
  assigneeId: z.preprocess((val) => (val === "" ? null : val), z.string().uuid().optional().nullable()),
});

export const getTasks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const { status, assigneeId, dueDate } = req.query;

    const filters: any = { projectId };

    if (status) filters.status = status;
    if (assigneeId) filters.assigneeId = assigneeId;
    if (dueDate) {
      filters.dueDate = {
        lte: new Date(dueDate as string),
      };
    }

    const tasks = await prisma.task.findMany({
      where: filters,
      include: {
        assignee: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const createdById = req.user!.id;
    const data = taskSchema.parse(req.body);

    const task = await prisma.task.create({
      data: {
        ...data,
        projectId,
        createdById,
      },
      include: {
        assignee: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!task) return res.status(404).json({ success: false, error: "Task not found" });

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
    const data = taskSchema.parse(req.body);

    const task = await prisma.task.update({
      where: { id: taskId },
      data,
      include: {
        assignee: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
    await prisma.task.delete({ where: { id: taskId } });
    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    next(error);
  }
};
