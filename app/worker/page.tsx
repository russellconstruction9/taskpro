"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api, type TaskResponse, type TimeEntryResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { LogoDark } from "@/components/ui/logo";
import { Select } from "@/components/ui/select";
import { format, differenceInSeconds } from "date-fns";

interface WorkerSession {
  profileId: number;
  businessId: number;
  fullName: string;
  role: string;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export default function WorkerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [, forceUpdate] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState("");

  // Live clock ticker — re-renders every second to update elapsed time display
  useEffect(() => {
    const interval = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: session, isLoading: sessionLoading } = useQuery<WorkerSession>({
    queryKey: ["worker-session"],
    queryFn: () => api.get<WorkerSession>("/api/auth/pin"),
    retry: false,
  });

  const { data: tasks } = useQuery<TaskResponse[]>({
    queryKey: ["worker-tasks"],
    queryFn: () =>
      api.get<TaskResponse[]>("/api/tasks", { status: "pending" }),
    enabled: !!session,
  });

  const { data: inProgressTasks } = useQuery<TaskResponse[]>({
    queryKey: ["worker-tasks-in-progress"],
    queryFn: () =>
      api.get<TaskResponse[]>("/api/tasks", { status: "in_progress" }),
    enabled: !!session,
  });

  const { data: activeEntry } =
    useQuery<TimeEntryResponse[]>({
      queryKey: ["worker-active-entry"],
      queryFn: () =>
        api.get<TimeEntryResponse[]>("/api/time-entries", { active: "true" }),
      enabled: !!session,
      refetchInterval: 60000,
    });

  const clockedIn = activeEntry && activeEntry.length > 0 ? activeEntry[0] : null;

  const clockInMutation = useMutation({
    mutationFn: () =>
      api.post("/api/time-entries", {
        taskId: selectedTaskId ? parseInt(selectedTaskId, 10) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worker-active-entry"] });
      setSelectedTaskId("");
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/api/time-entries/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worker-active-entry"] });
    },
  });

  const markCompleteMutation = useMutation({
    mutationFn: (taskId: number) =>
      api.patch(`/api/tasks/${taskId}`, { status: "completed" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worker-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["worker-tasks-in-progress"] });
    },
  });

  const markInProgressMutation = useMutation({
    mutationFn: (taskId: number) =>
      api.patch(`/api/tasks/${taskId}`, { status: "in_progress" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worker-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["worker-tasks-in-progress"] });
    },
  });

  async function handleLogout() {
    await api.post("/api/auth/pin/logout");
    router.push("/pin");
  }

  const allTasks = [...(inProgressTasks ?? []), ...(tasks ?? [])];
  const taskOptions = [
    { value: "", label: "No specific task" },
    ...allTasks.map((t) => ({ value: String(t.id), label: t.title })),
  ];

  const elapsedSeconds = clockedIn
    ? differenceInSeconds(new Date(), new Date(clockedIn.clockIn))
    : 0;

  if (sessionLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-zinc-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <LogoDark size="sm" />
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-400">{session?.fullName}</span>
          <button
            onClick={handleLogout}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg p-4 space-y-4">
        {/* Clock In / Out Card */}
        <Card className="bg-zinc-800 border-zinc-700 text-white">
          <CardContent>
            {clockedIn ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm font-medium text-green-400">Clocked In</span>
                </div>
                <div className="text-center">
                  <p className="text-5xl font-mono font-bold tabular-nums tracking-tight text-white">
                    {formatDuration(elapsedSeconds)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Since {format(new Date(clockedIn.clockIn), "h:mm a")}
                  </p>
                  {clockedIn.taskId && (
                    <p className="mt-2 text-sm text-zinc-300">
                      Working on:{" "}
                      <span className="font-medium text-amber-400">
                        {allTasks.find((t) => t.id === clockedIn.taskId)?.title ??
                          `Task #${clockedIn.taskId}`}
                      </span>
                    </p>
                  )}
                </div>
                <Button
                  className="w-full bg-red-600 hover:bg-red-500 text-white border-0"
                  size="lg"
                  loading={clockOutMutation.isPending}
                  onClick={() => clockOutMutation.mutate(clockedIn.id)}
                >
                  Clock Out
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-zinc-500" />
                  <span className="text-sm font-medium text-zinc-400">Not clocked in</span>
                </div>
                {allTasks.length > 0 && (
                  <Select
                    options={taskOptions}
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="bg-zinc-700 border-zinc-600 text-white"
                  />
                )}
                <Button
                  className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-900 border-0"
                  size="lg"
                  loading={clockInMutation.isPending}
                  onClick={() => clockInMutation.mutate()}
                >
                  Clock In
                </Button>
                {clockInMutation.isError && (
                  <p className="text-sm text-red-400 text-center">
                    Failed to clock in. Please try again.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <div>
          <h2 className="mb-3 text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Your Tasks
          </h2>

          {allTasks.length === 0 ? (
            <Card className="bg-zinc-800 border-zinc-700">
              <CardContent>
                <p className="text-center text-sm text-zinc-500 py-4">
                  No tasks assigned to you yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {allTasks.map((task) => (
                <Card key={task.id} className="bg-zinc-800 border-zinc-700">
                  <CardContent className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{task.title}</p>
                        {task.description && (
                          <p className="mt-0.5 text-sm text-zinc-400 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="mt-1.5">
                          <StatusBadge status={task.status} />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        {task.status === "pending" && (
                          <button
                            onClick={() => markInProgressMutation.mutate(task.id)}
                            disabled={markInProgressMutation.isPending}
                            className="rounded px-2 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
                          >
                            Start
                          </button>
                        )}
                        {task.status === "in_progress" && (
                          <button
                            onClick={() => markCompleteMutation.mutate(task.id)}
                            disabled={markCompleteMutation.isPending}
                            className="rounded px-2 py-1 text-xs font-medium bg-green-600 hover:bg-green-500 text-white transition-colors disabled:opacity-50"
                          >
                            Done
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
