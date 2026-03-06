"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  api,
  type TaskResponse,
  type JobResponse,
  type WorkerResponse,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";

const statusFilterOptions = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [jobFilter, setJobFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskResponse | null>(null);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", statusFilter, jobFilter],
    queryFn: () =>
      api.get<TaskResponse[]>("/api/tasks", {
        status: statusFilter || undefined,
        jobId: jobFilter || undefined,
      }),
  });

  const { data: jobs } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => api.get<JobResponse[]>("/api/jobs"),
  });

  const jobFilterOptions = [
    { value: "", label: "All Jobs" },
    ...(jobs?.map((j) => ({ value: String(j.id), label: j.title })) || []),
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-zinc-900">Tasks</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Create and manage tasks across jobs
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Task
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-3">
        <div className="w-48">
          <Select
            options={statusFilterOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
        <div className="w-56">
          <Select
            options={jobFilterOptions}
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : !tasks || tasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          description="Create tasks and assign them to workers"
          action={
            <Button onClick={() => setShowCreate(true)} size="sm">
              Create Task
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-6 py-3 text-left font-medium text-zinc-500">Task</th>
                  <th className="px-6 py-3 text-left font-medium text-zinc-500">Assigned To</th>
                  <th className="px-6 py-3 text-left font-medium text-zinc-500">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-zinc-500">Photos</th>
                  <th className="px-6 py-3 text-left font-medium text-zinc-500">Created</th>
                  <th className="px-6 py-3 text-right font-medium text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-zinc-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-900">{task.title}</p>
                      {task.description && (
                        <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-zinc-600">
                      {task.assigneeName || (
                        <span className="text-zinc-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="tabular-nums text-zinc-600">
                          {task.photoCount}
                        </span>
                        {task.requiresPhoto && (
                          <Badge variant="warning">Required</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 tabular-nums">
                      {format(new Date(task.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTask(task)}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Dialog */}
      <TaskFormDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => {
          setShowCreate(false);
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
        }}
      />

      {/* Edit Dialog */}
      {editingTask && (
        <TaskFormDialog
          open={!!editingTask}
          onClose={() => setEditingTask(null)}
          task={editingTask}
          onSuccess={() => {
            setEditingTask(null);
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
          }}
        />
      )}
    </div>
  );
}

function TaskFormDialog({
  open,
  onClose,
  onSuccess,
  task,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task?: TaskResponse;
}) {
  const isEdit = !!task;
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [jobId, setJobId] = useState(task?.jobId?.toString() || "");
  const [assignedTo, setAssignedTo] = useState(
    task?.assignedTo?.toString() || ""
  );
  const [status, setStatus] = useState(task?.status || "pending");
  const [requiresPhoto, setRequiresPhoto] = useState(
    task?.requiresPhoto || false
  );
  const [error, setError] = useState("");

  const { data: jobs } = useQuery({
    queryKey: ["jobs", "active"],
    queryFn: () => api.get<JobResponse[]>("/api/jobs", { status: "active" }),
  });

  const { data: workers } = useQuery({
    queryKey: ["workers"],
    queryFn: () => api.get<WorkerResponse[]>("/api/workers"),
  });

  const jobOptions = jobs?.map((j) => ({ value: String(j.id), label: j.title })) || [];
  const workerOptions = [
    { value: "", label: "Unassigned" },
    ...(workers
      ?.filter((w) => w.isActive)
      .map((w) => ({ value: String(w.id), label: w.fullName })) || []),
  ];

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        return api.patch(`/api/tasks/${task.id}`, {
          title,
          description: description || null,
          assignedTo: assignedTo ? parseInt(assignedTo, 10) : null,
          status,
          requiresPhoto,
        });
      } else {
        return api.post("/api/tasks", {
          jobId: parseInt(jobId, 10),
          title,
          description: description || null,
          assignedTo: assignedTo ? parseInt(assignedTo, 10) : null,
          requiresPhoto,
        });
      }
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Task" : "Create New Task"}</DialogTitle>
      </DialogHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        {!isEdit && (
          <Select
            label="Job"
            options={jobOptions}
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            required
            placeholder="Select a job"
          />
        )}

        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g., Install drywall in room A"
        />

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional task details..."
        />

        <Select
          label="Assign To"
          options={workerOptions}
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
        />

        {isEdit && (
          <Select
            label="Status"
            options={[
              { value: "pending", label: "Pending" },
              { value: "in_progress", label: "In Progress" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
        )}

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={requiresPhoto}
            onChange={(e) => setRequiresPhoto(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
          />
          <span className="text-sm text-zinc-700">
            Require photo before completion
          </span>
        </label>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEdit ? "Save Changes" : "Create Task"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
