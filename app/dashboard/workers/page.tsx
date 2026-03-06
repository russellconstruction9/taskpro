"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type WorkerResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils/cost";
import { format } from "date-fns";

export default function WorkersPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: workers, isLoading } = useQuery({
    queryKey: ["workers"],
    queryFn: () => api.get<WorkerResponse[]>("/api/workers"),
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Workers</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your team members and their access
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Worker
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : !workers || workers.length === 0 ? (
        <EmptyState
          title="No workers yet"
          description="Add workers to assign tasks and track time"
          action={
            <Button onClick={() => setShowCreate(true)} size="sm">
              Add Worker
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-6 py-3 text-left font-medium text-zinc-500">Name</th>
                  <th className="px-6 py-3 text-left font-medium text-zinc-500">Email</th>
                  <th className="px-6 py-3 text-left font-medium text-zinc-500">Hourly Rate</th>
                  <th className="px-6 py-3 text-left font-medium text-zinc-500">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-zinc-500">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {workers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-zinc-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-700 font-medium text-sm">
                          {worker.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <span className="font-medium text-zinc-900">
                          {worker.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600">
                      {worker.email || "—"}
                    </td>
                    <td className="px-6 py-4 text-zinc-900 tabular-nums font-medium">
                      {formatCurrency(parseFloat(worker.hourlyRate))}/hr
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={worker.isActive ? "success" : "danger"}>
                        {worker.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 tabular-nums">
                      {format(new Date(worker.createdAt), "MMM d, yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Dialog */}
      <CreateWorkerDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => {
          setShowCreate(false);
          queryClient.invalidateQueries({ queryKey: ["workers"] });
        }}
      />
    </div>
  );
}

function CreateWorkerDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [hourlyRate, setHourlyRate] = useState("25");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      api.post("/api/workers", {
        fullName,
        role: "worker",
        email: email || null,
        pin: pin || null,
        hourlyRate: parseFloat(hourlyRate),
      }),
    onSuccess: () => {
      setFullName("");
      setEmail("");
      setPin("");
      setHourlyRate("25");
      setError("");
      onSuccess();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Add New Worker</DialogTitle>
      </DialogHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <Input
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          placeholder="John Smith"
        />
        <Input
          label="Email (optional)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@company.com"
        />
        <Input
          label="6-Digit PIN"
          value={pin}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "").slice(0, 6);
            setPin(val);
          }}
          placeholder="123456"
          maxLength={6}
          inputMode="numeric"
        />
        <Input
          label="Hourly Rate ($)"
          type="number"
          step="0.01"
          min="0"
          value={hourlyRate}
          onChange={(e) => setHourlyRate(e.target.value)}
          required
        />

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
            Add Worker
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
