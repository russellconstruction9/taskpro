"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { api, type JobResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function JobsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingJob, setEditingJob] = useState<JobResponse | null>(null);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowCreate(true);
      router.replace("/dashboard/jobs");
    }
  }, [searchParams, router]);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs", statusFilter],
    queryFn: () =>
      api.get<JobResponse[]>("/api/jobs", {
        status: statusFilter || undefined,
      }),
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-zinc-900">Jobs</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage job sites and projects
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Job
        </Button>
      </div>

      {/* Filter */}
      <div className="mb-4 flex gap-3">
        <div className="w-48">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            placeholder="Filter by status"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : !jobs || jobs.length === 0 ? (
        <EmptyState
          title="No jobs yet"
          description="Create your first job to get started"
          action={
            <Button onClick={() => setShowCreate(true)} size="sm">
              Create Job
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-6 py-3 text-left font-medium text-zinc-500">Title</th>
                  <th className="px-6 py-3 text-left font-medium text-zinc-500">Address</th>
                  <th className="px-6 py-3 text-left font-medium text-zinc-500">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-zinc-500">Created</th>
                  <th className="px-6 py-3 text-right font-medium text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-zinc-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-900">{job.title}</p>
                      {job.description && (
                        <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">
                          {job.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-zinc-600">
                      {job.address || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-6 py-4 text-zinc-500 tabular-nums">
                      {format(new Date(job.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingJob(job)}
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
      <JobFormDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => {
          setShowCreate(false);
          queryClient.invalidateQueries({ queryKey: ["jobs"] });
        }}
      />

      {/* Edit Dialog */}
      {editingJob && (
        <JobFormDialog
          open={!!editingJob}
          onClose={() => setEditingJob(null)}
          job={editingJob}
          onSuccess={() => {
            setEditingJob(null);
            queryClient.invalidateQueries({ queryKey: ["jobs"] });
          }}
        />
      )}
    </div>
  );
}

function JobFormDialog({
  open,
  onClose,
  onSuccess,
  job,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  job?: JobResponse;
}) {
  const isEdit = !!job;
  const [title, setTitle] = useState(job?.title || "");
  const [description, setDescription] = useState(job?.description || "");
  const [address, setAddress] = useState(job?.address || "");
  const [status, setStatus] = useState(job?.status || "active");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        return api.patch(`/api/jobs/${job.id}`, {
          title,
          description: description || null,
          address: address || null,
          status,
        });
      } else {
        return api.post("/api/jobs", {
          title,
          description: description || null,
          address: address || null,
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
        <DialogTitle>{isEdit ? "Edit Job" : "Create New Job"}</DialogTitle>
      </DialogHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g., 123 Main St Renovation"
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional job details..."
        />
        <Input
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Job site address"
        />
        {isEdit && (
          <Select
            label="Status"
            options={[
              { value: "active", label: "Active" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
        )}

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
            {isEdit ? "Save Changes" : "Create Job"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
