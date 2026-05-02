import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "../lib/axios";
import { toast } from "sonner";
import { Plus, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "../components/ui/dialog";
import { useAuth } from "../context/AuthContext";
import { Skeleton } from "../components/ui/skeleton";
import { Avatar } from "../components/ui/avatar";

const projectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
});

export default function Projects() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await api.get("/projects");
      return response.data.data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof projectSchema>) => {
      return api.post("/projects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created successfully");
      setIsCreateOpen(false);
      reset();
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Failed to create project"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
      setIsDeleteOpen(false);
      setProjectToDelete(null);
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Failed to delete project"),
  });

  const onSubmit = (data: z.infer<typeof projectSchema>) => {
    createMutation.mutate(data);
  };

  const confirmDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToDelete(id);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-medium tracking-tight">Projects</h1>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-[12px]" />)}
        </div>
      ) : projects?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border-[0.5px] rounded-[12px] border-dashed border-border bg-card">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
            <FolderKanban className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-[15px] font-medium mb-1">No projects found</p>
          <p className="text-[13px] text-muted-foreground mb-6">Create a new project to start collaborating.</p>
          <Button onClick={() => setIsCreateOpen(true)}>Create Project</Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects?.map((project: any) => {
            const isAdmin = project.ownerId === user?.id; // simplified admin check for list view
            
            return (
              <Link key={project.id} to={`/projects/${project.id}`}>
                <Card className="h-full hover:border-primary/50 transition-colors shadow-sm group">
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-[15px] font-medium line-clamp-1">{project.name}</h3>
                      {isAdmin && (
                        <div className="relative">
                          <button 
                            className="p-1 rounded-md text-muted-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.preventDefault();
                              // Simple dropdown implementation would go here
                            }}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {/* Simplified delete for demo */}
                          <button 
                            className="p-1 rounded-md text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => confirmDelete(e, project.id)}
                            title="Delete Project"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-[13px] text-muted-foreground line-clamp-2 mb-6 flex-1">
                      {project.description || "No description provided."}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t-[0.5px] border-border">
                      <div className="flex -space-x-2">
                        {/* Mock avatar stack since we don't fetch all members here, just a count */}
                        <Avatar name="User A" className="border-background border-2" />
                        <Avatar name="User B" className="border-background border-2" />
                        <div className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted items-center justify-center border-2 border-background text-muted-foreground text-[10px] font-medium z-10">
                          +{Math.max(0, project._count.members - 2)}
                        </div>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {project._count.tasks} tasks
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-[13px] font-medium">Project Name</label>
              <Input id="name" placeholder="E.g., Marketing Campaign" error={!!errors.name} {...register("name")} />
              {errors.name && <p className="text-[11px] text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="description" className="text-[13px] font-medium">Description</label>
              <Textarea id="description" placeholder="A brief description of the project" {...register("description")} />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <DialogClose asChild>
                <Button variant="ghost" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit" isLoading={createMutation.isPending}>
                Create Project
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-[13px] text-muted-foreground">
            Are you sure you want to delete this project? This action cannot be undone and will permanently delete all associated tasks.
          </div>
          <div className="flex justify-end gap-3">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={() => projectToDelete && deleteMutation.mutate(projectToDelete)}
              isLoading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Just importing the icon here for the empty state
import { FolderKanban } from "lucide-react";
