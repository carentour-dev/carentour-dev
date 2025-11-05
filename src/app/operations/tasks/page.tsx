"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, MoreHorizontal, PlusCircle, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  adminFetch,
  useAdminInvalidate,
} from "@/components/admin/hooks/useAdminFetch";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";

type OperationsTask = Tables<"operations_tasks">;

const TASKS_QUERY_KEY = ["operations", "tasks"] as const;

const STATUS_DETAILS: Record<
  OperationsTask["status"],
  { label: string; description: string }
> = {
  pending: {
    label: "Pending",
    description: "Tasks waiting to be picked up.",
  },
  in_progress: {
    label: "In Progress",
    description: "Items you are currently tackling.",
  },
  done: {
    label: "Done",
    description: "Completed work ready to archive or review.",
  },
};

const STATUS_ORDER: OperationsTask["status"][] = [
  "pending",
  "in_progress",
  "done",
];

export default function OperationsTasksPage() {
  const { toast } = useToast();
  const invalidate = useAdminInvalidate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const tasksQuery = useQuery({
    queryKey: TASKS_QUERY_KEY,
    queryFn: () => adminFetch<OperationsTask[]>("/api/admin/operations/tasks"),
    staleTime: 30_000,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (payload: { title: string; description?: string }) => {
      return await adminFetch<OperationsTask>("/api/admin/operations/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      setTitle("");
      setDescription("");
      invalidate(TASKS_QUERY_KEY);
      toast({
        title: "Task created",
        description: "Your new task is now in Pending.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Could not create task",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: Partial<Pick<OperationsTask, "status">>;
    }) => {
      return await adminFetch<OperationsTask>(
        `/api/admin/operations/tasks/${taskId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updates),
        },
      );
    },
    onSuccess: () => {
      invalidate(TASKS_QUERY_KEY);
    },
    onError: (error: unknown) => {
      toast({
        title: "Update failed",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return await adminFetch<{ success: boolean }>(
        `/api/admin/operations/tasks/${taskId}`,
        {
          method: "DELETE",
        },
      );
    },
    onSuccess: () => {
      invalidate(TASKS_QUERY_KEY);
      toast({
        title: "Task removed",
        description: "The task has been deleted.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Could not delete task",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const pendingUpdateTaskId =
    updateTaskMutation.status === "pending"
      ? updateTaskMutation.variables?.taskId
      : undefined;
  const pendingDeleteTaskId =
    deleteTaskMutation.status === "pending"
      ? deleteTaskMutation.variables
      : undefined;

  const tasksByStatus = useMemo(() => {
    const grouped: Record<OperationsTask["status"], OperationsTask[]> = {
      pending: [],
      in_progress: [],
      done: [],
    };

    for (const task of tasksQuery.data ?? []) {
      grouped[task.status].push(task);
    }

    return grouped;
  }, [tasksQuery.data]);

  const handleCreateTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Add a short title before creating a task.",
        variant: "destructive",
      });
      return;
    }

    createTaskMutation.mutate({
      title: title.trim(),
      description: description.trim() ? description.trim() : undefined,
    });
  };

  const handleStatusChange = (
    taskId: string,
    status: OperationsTask["status"],
  ) => {
    updateTaskMutation.mutate({ taskId, updates: { status } });
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          My Tasks
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Keep track of personal follow-ups tied to your Operations work. Tasks
          stay private to your account and move between Pending, In Progress,
          and Done.
        </p>
      </header>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <PlusCircle className="h-5 w-5 text-primary" />
            Add a task
          </CardTitle>
          <CardDescription>
            Capture quick reminders or follow-ups so nothing slips through.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4 md:flex-row"
            onSubmit={handleCreateTask}
          >
            <div className="flex-1 space-y-3">
              <Input
                placeholder="Task title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={createTaskMutation.isPending}
                required
              />
              <Textarea
                placeholder="Optional notes or context"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={createTaskMutation.isPending}
                rows={3}
              />
            </div>
            <div className="flex items-end md:w-[160px]">
              <Button
                type="submit"
                className="w-full"
                disabled={createTaskMutation.isPending}
              >
                {createTaskMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create task
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {tasksQuery.isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your tasks…
        </div>
      ) : tasksQuery.isError ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>Unable to load tasks</CardTitle>
            <CardDescription>
              {tasksQuery.error instanceof Error
                ? tasksQuery.error.message
                : "Please refresh and try again."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {STATUS_ORDER.map((status) => {
            const columnTasks = tasksByStatus[status];

            return (
              <Card key={status} className="flex flex-col">
                <CardHeader className="border-b border-border pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">
                        {STATUS_DETAILS[status].label}
                      </CardTitle>
                      <CardDescription>
                        {STATUS_DETAILS[status].description}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{columnTasks.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3 py-4">
                  {columnTasks.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-muted-foreground/30 p-4 text-sm text-muted-foreground">
                      Nothing here yet.
                    </p>
                  ) : (
                    columnTasks.map((task) => (
                      <article
                        key={task.id}
                        className="rounded-lg border border-border bg-card p-4 shadow-sm"
                      >
                        <p className="sr-only">Task status: {status}</p>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">
                              {task.title}
                            </h3>
                            {task.description && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                {task.description}
                              </p>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label="Task actions"
                                disabled={
                                  pendingUpdateTaskId === task.id ||
                                  pendingDeleteTaskId === task.id
                                }
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {status !== "pending" && (
                                <DropdownMenuItem
                                  onSelect={() =>
                                    handleStatusChange(task.id, "pending")
                                  }
                                  disabled={pendingUpdateTaskId === task.id}
                                >
                                  Move to Pending
                                </DropdownMenuItem>
                              )}
                              {status !== "in_progress" && (
                                <DropdownMenuItem
                                  onSelect={() =>
                                    handleStatusChange(task.id, "in_progress")
                                  }
                                  disabled={pendingUpdateTaskId === task.id}
                                >
                                  Move to In Progress
                                </DropdownMenuItem>
                              )}
                              {status !== "done" && (
                                <DropdownMenuItem
                                  onSelect={() =>
                                    handleStatusChange(task.id, "done")
                                  }
                                  disabled={pendingUpdateTaskId === task.id}
                                >
                                  Mark as Done
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={() => handleDeleteTask(task.id)}
                                disabled={pendingDeleteTaskId === task.id}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">
                          Updated {new Date(task.updated_at).toLocaleString()}
                        </p>
                      </article>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
