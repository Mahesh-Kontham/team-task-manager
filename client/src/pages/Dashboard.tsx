import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/axios";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../context/AuthContext";
import { Skeleton } from "../components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await api.get("/dashboard");
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="col-span-2 h-[400px] w-full" />
          <Skeleton className="col-span-1 h-[400px] w-full" />
        </div>
      </div>
    );
  }

  const { myTasks = [], overdueCount = 0, taskStats = {}, projects = [] } = data || {};
  const totalTasks = (taskStats.TODO || 0) + (taskStats.IN_PROGRESS || 0) + (taskStats.DONE || 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[22px] font-medium tracking-tight">Good morning, {user?.name.split(" ")[0]}</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Here's what's happening with your projects today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="p-5 flex flex-col justify-center h-full">
            <span className="text-[13px] font-medium text-muted-foreground mb-2">Total Tasks</span>
            <span className="text-2xl font-medium">{totalTasks}</span>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5 flex flex-col justify-center h-full">
            <span className="text-[13px] font-medium text-muted-foreground mb-2">In Progress</span>
            <span className="text-2xl font-medium">{taskStats.IN_PROGRESS || 0}</span>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5 flex flex-col justify-center h-full">
            <span className="text-[13px] font-medium text-muted-foreground mb-2">Completed</span>
            <span className="text-2xl font-medium">{taskStats.DONE || 0}</span>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-[#791F1F]">
          <CardContent className="p-5 flex flex-col justify-center h-full">
            <span className="text-[13px] font-medium text-muted-foreground mb-2">Overdue</span>
            <span className="text-2xl font-medium text-[#791F1F]">{overdueCount}</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: My Tasks */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-[15px] font-medium">My Tasks</h2>
          <Card className="shadow-sm overflow-hidden">
            {myTasks.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-muted-foreground">
                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                No tasks assigned to you right now.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {myTasks.map((task: any) => {
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
                  return (
                    <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-4">
                      <div className="flex items-start gap-3">
                        {isOverdue && <div className="mt-1.5 w-2 h-2 rounded-full bg-[#791F1F] shrink-0" />}
                        {!isOverdue && <div className="mt-1.5 w-2 h-2 rounded-full bg-transparent shrink-0" />}
                        <div>
                          <p className={`text-[13px] font-medium ${task.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>
                            {task.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {task.project.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-5 sm:ml-0">
                        <Badge variant={task.status}>{task.status.replace("_", " ")}</Badge>
                        <Badge variant={task.priority}>{task.priority}</Badge>
                        <span className="text-[11px] text-muted-foreground w-[80px] text-right">
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No date"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: My Projects */}
        <div className="space-y-4">
          <h2 className="text-[15px] font-medium">My Projects</h2>
          <div className="space-y-3">
            {projects.length === 0 ? (
              <Card className="shadow-sm p-6 text-center text-[13px] text-muted-foreground">
                You haven't joined any projects yet.
              </Card>
            ) : (
              projects.map((project: any) => {
                // Mock progress for UI demo since we don't have detailed task completion ratios yet
                const mockProgress = Math.floor(Math.random() * 100);
                return (
                  <Link key={project.id} to={`/projects/${project.id}`} className="block">
                    <Card className="shadow-sm hover:border-primary/50 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-[13px] font-medium line-clamp-1">{project.name}</h3>
                          <span className="text-[11px] text-muted-foreground shrink-0">{project._count.tasks} tasks</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 mt-4">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${mockProgress}%` }} />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
