"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type TimeEntryResponse } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { calculateLaborCost, formatCurrency } from "@/lib/utils/cost";
import { format } from "date-fns";

export default function TimeTrackingPage() {
  const [showActive, setShowActive] = useState(true);
  const [, setTick] = useState(0);

  // Tick every second to update live timers
  useEffect(() => {
    if (!showActive) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [showActive]);

  const { data: entries, isLoading } = useQuery({
    queryKey: ["time-entries", showActive ? "active" : "all"],
    queryFn: () =>
      api.get<TimeEntryResponse[]>("/api/time-entries", {
        active: showActive ? "true" : undefined,
      }),
    refetchInterval: showActive ? 30000 : undefined,
  });

  // Summary stats for active view
  const totalCost =
    entries?.reduce((sum, entry) => {
      const { cost } = calculateLaborCost(
        entry.clockIn,
        entry.hourlyRate || "0",
        entry.clockOut
      );
      return sum + cost;
    }, 0) || 0;

  const totalHours =
    entries?.reduce((sum, entry) => {
      const { hours } = calculateLaborCost(
        entry.clockIn,
        entry.hourlyRate || "0",
        entry.clockOut
      );
      return sum + hours;
    }, 0) || 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-zinc-900">Time Tracking</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Monitor worker clock-ins and labor costs
          </p>
        </div>
      </div>

      {/* Toggle */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setShowActive(true)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            showActive
              ? "bg-orange-500 text-white"
              : "bg-white text-zinc-600 border border-zinc-300 hover:bg-zinc-50"
          }`}
        >
          Active Now
        </button>
        <button
          onClick={() => setShowActive(false)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            !showActive
              ? "bg-orange-500 text-white"
              : "bg-white text-zinc-600 border border-zinc-300 hover:bg-zinc-50"
          }`}
        >
          All Entries
        </button>
      </div>

      {/* Summary Cards */}
      {entries && entries.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent>
              <p className="text-sm font-medium text-zinc-500">
                {showActive ? "Workers Clocked In" : "Total Entries"}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900">
                {entries.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm font-medium text-zinc-500">Total Hours</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900">
                {totalHours.toFixed(1)}h
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm font-medium text-zinc-500">
                {showActive ? "Live Labor Cost" : "Total Labor Cost"}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900">
                {formatCurrency(totalCost)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : !entries || entries.length === 0 ? (
        <EmptyState
          title={
            showActive ? "No active clock-ins" : "No time entries yet"
          }
          description={
            showActive
              ? "Workers will appear here when they clock in"
              : "Time entries will appear as workers clock in and out"
          }
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-6 py-3 text-left font-medium text-zinc-500">Worker</th>
                  <th className="px-6 py-3 text-left font-medium text-zinc-500">Clock In</th>
                  <th className="px-6 py-3 text-left font-medium text-zinc-500">Clock Out</th>
                  <th className="px-6 py-3 text-left font-medium text-zinc-500">Duration</th>
                  <th className="px-6 py-3 text-left font-medium text-zinc-500">Rate</th>
                  <th className="px-6 py-3 text-right font-medium text-zinc-500">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {entries.map((entry) => {
                  const { elapsed, cost } = calculateLaborCost(
                    entry.clockIn,
                    entry.hourlyRate || "0",
                    entry.clockOut
                  );
                  const isActive = !entry.clockOut;

                  return (
                    <tr key={entry.id} className="hover:bg-zinc-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-900">
                            {entry.workerName}
                          </span>
                          {isActive && (
                            <Badge variant="success">Live</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-600 tabular-nums">
                        {format(
                          new Date(entry.clockIn),
                          "MMM d, h:mm a"
                        )}
                      </td>
                      <td className="px-6 py-4 text-zinc-600 tabular-nums">
                        {entry.clockOut
                          ? format(
                              new Date(entry.clockOut),
                              "MMM d, h:mm a"
                            )
                          : "—"}
                      </td>
                      <td className="px-6 py-4 tabular-nums font-mono text-zinc-900">
                        {elapsed}
                      </td>
                      <td className="px-6 py-4 text-zinc-600 tabular-nums">
                        {entry.hourlyRate
                          ? `${formatCurrency(parseFloat(entry.hourlyRate))}/hr`
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold tabular-nums text-zinc-900">
                        {formatCurrency(cost)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
