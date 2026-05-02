import { Response, NextFunction } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middlewares/auth.middleware";

export const getDashboardData = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const myTasks = await prisma.task.findMany({
      where: { assigneeId: userId },
      include: { project: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 10,
    });

    const overdueCount = await prisma.task.count({
      where: {
        assigneeId: userId,
        status: { not: "DONE" },
        dueDate: { lt: new Date() },
      },
    });

    const taskStats = await prisma.task.groupBy({
      by: ["status"],
      where: { assigneeId: userId },
      _count: true,
    });

    const projectsIBelongTo = await prisma.project.findMany({
      where: { members: { some: { userId } } },
      include: {
        _count: { select: { members: true, tasks: true } },
      },
      take: 5,
    });

    res.json({
      success: true,
      data: {
        myTasks,
        overdueCount,
        taskStats: taskStats.reduce((acc, curr) => {
          acc[curr.status] = curr._count;
          return acc;
        }, {} as Record<string, number>),
        projects: projectsIBelongTo,
      },
    });
  } catch (error) {
    next(error);
  }
};
