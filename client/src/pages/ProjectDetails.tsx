import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Plus, UserPlus, Trash2, Calendar, LayoutGrid, List as ListIcon, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Avatar } from "../components/ui/avatar";
import { Skeleton } from "../components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "../components/ui/dialog";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

const COLUMNS = {
  TODO: "TODO",
  IN_PROGRESS: "IN PROGRESS",
  DONE: "DONE",
};

export default function ProjectDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"BOARD" | "LIST" | "MEMBERS">("BOARD");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");

  const { data: project, isLoading: isProjectLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}`);
      return response.data.data;
    },
  });

  const { data: tasks = [], isLoading: isTasksLoading } = useQuery({
    queryKey: ["tasks", id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}/tasks`);
      return response.data.data;
    },
  });

  const isAdmin = project?.members.some((m: any) => m.userId === user?.id && m.role === "ADMIN");

  // Mutations
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      return api.put(`/projects/${id}/tasks/${taskId}`, { status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", id] }),
  });

  const saveTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingTask) {
        return api.put(`/projects/${id}/tasks/${editingTask.id}`, data);
      }
      return api.post(`/projects/${id}/tasks`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
      toast.success(editingTask ? "Task updated" : "Task created");
      setIsTaskModalOpen(false);
      setEditingTask(null);
      resetTask();
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Failed to save task"),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => api.delete(`/projects/${id}/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
      toast.success("Task deleted");
      setIsTaskModalOpen(false);
      setEditingTask(null);
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async () => api.post(`/projects/${id}/members`, { email: inviteEmail, role: inviteRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      toast.success("Member added");
      setInviteEmail("");
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Failed to add member"),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => api.delete(`/projects/${id}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      toast.success("Member removed");
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Failed to remove member"),
  });

  const { register: registerTask, handleSubmit: handleTaskSubmit, reset: resetTask, setValue } = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
  });

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId !== destination.droppableId) {
      updateTaskStatusMutation.mutate({ taskId: draggableId, status: destination.droppableId });
    }
  };

  const openNewTaskModal = () => {
    setEditingTask(null);
    resetTask();
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: any) => {
    if (!isAdmin && task.createdById !== user?.id && task.assigneeId !== user?.id) {
       // Just let them view or we could restrict editing, but let's assume they can edit if in project
    }
    setEditingTask(task);
    setValue("title", task.title);
    setValue("description", task.description || "");
    setValue("priority", task.priority);
    setValue("status", task.status);
    setValue("dueDate", task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
    setValue("assigneeId", task.assigneeId || "");
    setIsTaskModalOpen(true);
  };

  if (isProjectLoading || isTasksLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-8 w-full max-w-md" />
        <div className="grid grid-cols-3 gap-6 mt-8">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const groupedTasks = {
    TODO: tasks.filter((t: any) => t.status === "TODO"),
    IN_PROGRESS: tasks.filter((t: any) => t.status === "IN_PROGRESS"),
    DONE: tasks.filter((t: any) => t.status === "DONE"),
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Sub-header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-[0.5px]">
        <div>
          <h1 className="text-[22px] font-medium tracking-tight flex items-center gap-3">
            {project.name}
            <div className="flex -space-x-2 ml-4 border-l-[0.5px] pl-4">
              {project.members.slice(0, 3).map((m: any) => (
                <Avatar key={m.userId} name={m.user.name} className="border-background border-2 w-7 h-7" />
              ))}
              {project.members.length > 3 && (
                <div className="relative flex h-7 w-7 shrink-0 overflow-hidden rounded-full bg-muted items-center justify-center border-2 border-background text-muted-foreground text-[10px] font-medium z-10">
                  +{project.members.length - 3}
                </div>
              )}
            </div>
          </h1>
          {project.description && <p className="text-[13px] text-muted-foreground mt-1">{project.description}</p>}
        </div>
        
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="ghost" onClick={() => setView("MEMBERS")} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invite
            </Button>
          )}
          <Button onClick={openNewTaskModal} className="gap-2">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 text-[13px] font-medium border-b-[0.5px]">
        <button 
          onClick={() => setView("BOARD")} 
          className={`pb-3 flex items-center gap-2 border-b-[2px] transition-colors ${view === "BOARD" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <LayoutGrid className="h-4 w-4" /> Board
        </button>
        <button 
          onClick={() => setView("LIST")} 
          className={`pb-3 flex items-center gap-2 border-b-[2px] transition-colors ${view === "LIST" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <ListIcon className="h-4 w-4" /> List
        </button>
        <button 
          onClick={() => setView("MEMBERS")} 
          className={`pb-3 flex items-center gap-2 border-b-[2px] transition-colors ${view === "MEMBERS" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <UserPlus className="h-4 w-4" /> Team
        </button>
      </div>

      {/* Views */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {view === "BOARD" && (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 h-full overflow-x-auto pb-4">
              {(Object.keys(COLUMNS) as Array<keyof typeof COLUMNS>).map((status) => {
                const columnTasks = groupedTasks[status] || [];
                const isDone = status === "DONE";
                
                return (
                  <div key={status} className={`flex flex-col w-[320px] shrink-0 rounded-[8px] border-[0.5px] bg-muted/30 ${status === "IN_PROGRESS" ? "bg-[#FAEEDA]/30 border-[#FAEEDA]/50 dark:bg-[#633806]/10 dark:border-[#633806]/20" : ""}`}>
                    <div className="p-3 flex items-center justify-between border-b-[0.5px]">
                      <h3 className="text-[13px] font-medium flex items-center gap-2">
                        {COLUMNS[status]}
                        <Badge variant={status}>{columnTasks.length}</Badge>
                      </h3>
                      <button onClick={openNewTaskModal} className="text-muted-foreground hover:text-foreground">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <Droppable droppableId={status}>
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px] transition-colors ${snapshot.isDraggingOver ? "bg-muted/50" : ""}`}
                        >
                          {columnTasks.map((task: any, index: number) => {
                            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
                            
                            return (
                              <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => openEditTaskModal(task)}
                                    className={`bg-card border-[0.5px] rounded-[8px] p-3 shadow-sm hover:border-primary/30 transition-all cursor-pointer ${
                                      snapshot.isDragging ? "ring-[2px] ring-primary/50 shadow-md rotate-2" : ""
                                    } ${isDone ? "opacity-60" : ""} ${isOverdue ? "border-l-4 border-l-[#791F1F]" : ""}`}
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <Badge variant={task.priority}>{task.priority}</Badge>
                                      {task.dueDate && (
                                        <div className={`text-[11px] flex items-center gap-1 ${isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                                          <Calendar className="w-3 h-3" />
                                          {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                      )}
                                    </div>
                                    <p className={`text-[13px] font-medium leading-tight mb-2 ${isDone ? "line-through text-muted-foreground" : ""}`}>
                                      {task.title}
                                    </p>
                                    <div className="flex justify-between items-end mt-2">
                                      <div className="flex-1" />
                                      {task.assignee && (
                                        <Avatar name={task.assignee.name} className="w-6 h-6 text-[9px]" />
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            )
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                )
              })}
            </div>
          </DragDropContext>
        )}

        {view === "LIST" && (
          <div className="border-[0.5px] rounded-[12px] bg-card overflow-hidden">
            {tasks.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-muted-foreground">No tasks found.</div>
            ) : (
              <table className="w-full text-left text-[13px]">
                <thead className="bg-muted/50 text-muted-foreground border-b-[0.5px]">
                  <tr>
                    <th className="font-medium p-3">Task Name</th>
                    <th className="font-medium p-3">Status</th>
                    <th className="font-medium p-3">Priority</th>
                    <th className="font-medium p-3">Assignee</th>
                    <th className="font-medium p-3">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tasks.map((task: any) => (
                    <tr key={task.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => openEditTaskModal(task)}>
                      <td className={`p-3 font-medium ${task.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>{task.title}</td>
                      <td className="p-3"><Badge variant={task.status}>{task.status.replace("_", " ")}</Badge></td>
                      <td className="p-3"><Badge variant={task.priority}>{task.priority}</Badge></td>
                      <td className="p-3">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={task.assignee.name} className="w-6 h-6" />
                            {task.assignee.name}
                          </div>
                        ) : <span className="text-muted-foreground">Unassigned</span>}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {view === "MEMBERS" && (
          <div className="max-w-3xl space-y-6">
            {isAdmin && (
              <div className="border-[0.5px] rounded-[12px] bg-card p-4 flex gap-3 items-end">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[13px] font-medium">Email address</label>
                  <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="name@company.com" />
                </div>
                <div className="w-40 space-y-1.5">
                  <label className="text-[13px] font-medium">Role</label>
                  <select 
                    value={inviteRole} 
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="flex h-9 w-full rounded-[8px] border-[0.5px] border-input bg-background px-3 text-[13px]"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <Button onClick={() => addMemberMutation.mutate()} isLoading={addMemberMutation.isPending}>
                  Invite
                </Button>
              </div>
            )}
            
            <div className="border-[0.5px] rounded-[12px] bg-card overflow-hidden">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-muted/50 text-muted-foreground border-b-[0.5px]">
                  <tr>
                    <th className="font-medium p-3">Member</th>
                    <th className="font-medium p-3">Role</th>
                    {isAdmin && <th className="font-medium p-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {project.members.map((m: any) => (
                    <tr key={m.userId} className="hover:bg-muted/10">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={m.user.name} />
                          <div>
                            <p className="font-medium text-foreground">{m.user.name}</p>
                            <p className="text-muted-foreground">{m.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant={m.role}>{m.role}</Badge>
                      </td>
                      {isAdmin && (
                        <td className="p-3 text-right">
                          {m.userId !== project.ownerId && m.userId !== user?.id && (
                            <Button 
                              variant="ghost" 
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2 text-[11px]"
                              onClick={() => {
                                if (confirm("Remove this member?")) {
                                  removeMemberMutation.mutate(m.userId);
                                }
                              }}
                            >
                              Remove
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Task Modal */}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "Create Task"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTaskSubmit((data) => saveTaskMutation.mutate(data))} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium">Title</label>
              <Input placeholder="Task title" {...registerTask("title")} />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium">Description</label>
              <Textarea placeholder="Add more details..." rows={3} {...registerTask("description")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium">Status</label>
                <select {...registerTask("status")} className="flex h-9 w-full rounded-[8px] border-[0.5px] border-input bg-background px-3 text-[13px]">
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium">Priority</label>
                <select {...registerTask("priority")} className="flex h-9 w-full rounded-[8px] border-[0.5px] border-input bg-background px-3 text-[13px]">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium">Due Date</label>
                <Input type="date" {...registerTask("dueDate")} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium">Assignee</label>
                <select {...registerTask("assigneeId")} className="flex h-9 w-full rounded-[8px] border-[0.5px] border-input bg-background px-3 text-[13px]">
                  <option value="">Unassigned</option>
                  {project.members.map((m: any) => (
                    <option key={m.userId} value={m.userId}>{m.user.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-between pt-4 mt-2 border-t-[0.5px]">
              <div>
                {editingTask && isAdmin && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="text-red-500 hover:bg-red-50"
                    onClick={() => {
                      if (confirm("Delete this task permanently?")) {
                        deleteTaskMutation.mutate(editingTask.id);
                      }
                    }}
                  >
                    Delete Task
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <DialogClose asChild>
                  <Button variant="ghost" type="button">Cancel</Button>
                </DialogClose>
                <Button type="submit" isLoading={saveTaskMutation.isPending}>
                  {editingTask ? "Save Changes" : "Create Task"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
