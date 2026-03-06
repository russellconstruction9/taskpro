"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type JobResponse, type TaskResponse, type TimeEntryResponse, type WorkerResponse } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { CardSkeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { calculateLaborCost, formatCurrency } from "@/lib/utils/cost";
import Link from "next/link";

function StatCard({
  title,
  value,
  subtitle,
  href,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  href?: string;
}) {
  const content = (
    <Card className={href ? "hover:border-orange-200 transition-colors cursor-pointer" : ""}>
      <CardContent>
        <p className="text-sm font-medium text-zinc-500">{title}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-zinc-900">
          {value}
        </p>
        {subtitle && (
          <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export default function DashboardPage() {
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => api.get<JobResponse[]>("/api/jobs"),
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => api.get<TaskResponse[]>("/api/tasks"),
  });

  const { data: workers, isLoading: workersLoading } = useQuery({
    queryKey: ["workers"],
    queryFn: () => api.get<WorkerResponse[]>("/api/workers"),
  });

  const { data: activeEntries, isLoading: timeLoading } = useQuery({
    queryKey: ["time-entries", "active"],
    queryFn: () =>
      api.get<TimeEntryResponse[]>("/api/time-entries", { active: "true" }),
    refetchInterval: 30000, // refresh every 30s
  });

  const isLoading = jobsLoading || tasksLoading || workersLoading || timeLoading;

  if (isLoading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-zinc-900">Dashboard</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const activeJobs = jobs?.filter((j) => j.status === "active") || [];
  const pendingTasks = tasks?.filter((t) => t.status === "pending") || [];
  const inProgressTasks = tasks?.filter((t) => t.status === "in_progress") || [];
  const activeWorkers = workers?.filter((w) => w.isActive) || [];
  const clockedIn = activeEntries || [];

  // Calculate total live cost
  const totalLiveCost = clockedIn.reduce((sum, entry) => {
    const { cost } = calculateLaborCost(entry.clockIn, entry.hourlyRate || "0");
    return sum + cost;
  }, 0);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Jobs"
          value={activeJobs.length}
          subtitle={`${jobs?.length || 0} total jobs`}
          href="/dashboard/jobs"
        />
        <StatCard
          title="Pending Tasks"
          value={pendingTasks.length}
          subtitle={`${inProgressTasks.length} in progress`}
          href="/dashboard/tasks"
        />
        <StatCard
          title="Workers"
          value={activeWorkers.length}
          subtitle={`${clockedIn.length} clocked in now`}
          href="/dashboard/workers"
        />
        <StatCard
          title="Live Labor Cost"
          value={formatCurrency(totalLiveCost)}
          subtitle={`${clockedIn.length} active timers`}
          href="/dashboard/time"
        />
      </div>

      {/* Recent Activity */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Active Time Entries */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-zinc-900">
                Workers Clocked In
              </h2>
              <Link
                href="/dashboard/time"
                className="text-sm font-medium text-orange-500 hover:text-orange-600"
              >
                View all
              </Link>
            </div>
            {clockedIn.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4 text-center">
                No workers currently clocked in
              </p>
            ) : (
              <div className="space-y-3">
                {clockedIn.slice(0, 5).map((entry) => {
                  const { elapsed, cost } = calculateLaborCost(
                    entry.clockIn,
                    entry.hourlyRate || "0"
                  );
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-900">
                          {entry.workerName}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {elapsed} elapsed
                        </p>
                      </div>
                      <p className="text-sm font-semibold tabular-nums text-zinc-900">
                        {formatCurrency(cost)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-zinc-900">
                Recent Tasks
              </h2>
              <Link
                href="/dashboard/tasks"
                className="text-sm font-medium text-orange-500 hover:text-orange-600"
              >
                View all
              </Link>
            </div>
            {!tasks || tasks.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4 text-center">
                No tasks yet
              </p>
            ) : (
              <div className="space-y-3">
                {tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {task.title}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {task.assigneeName || "Unassigned"}
                      </p>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
