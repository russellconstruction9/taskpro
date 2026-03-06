"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardSkeleton } from "@/components/ui/skeleton";

interface BusinessSettings {
  id: number;
  name: string;
  createdAt: string;
  totalWorkers: number;
  activeWorkers: number;
}

export default function SettingsPage() {
  const [copied, setCopied] = useState(false);

  const { data: business, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<BusinessSettings>("/api/settings"),
  });

  async function copyBusinessId() {
    if (!business) return;
    await navigator.clipboard.writeText(String(business.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-zinc-900">
          Company Settings
        </h1>
        <p className="mt-1 mb-6 text-sm text-zinc-500">
          Manage your company information
        </p>
        <div className="grid grid-cols-1 gap-6 max-w-2xl">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-zinc-900">
          Company Settings
        </h1>
        <p className="mt-4 text-sm text-zinc-500">
          Unable to load company settings.
        </p>
      </div>
    );
  }

  const createdDate = new Date(business.createdAt).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div>
      <h1 className="text-2xl font-bold font-display tracking-tight text-zinc-900">
        Company Settings
      </h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500">
        Manage your company information
      </p>

      <div className="grid grid-cols-1 gap-6 max-w-2xl">
        {/* Business ID Card */}
        <Card className="border-l-4 border-l-orange-400">
          <CardHeader>
            <CardTitle>Business ID</CardTitle>
            <p className="text-sm text-zinc-500">
              Share this ID with your workers so they can log in via PIN
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="rounded-lg border-2 border-dashed border-orange-300 bg-orange-50 px-6 py-4 text-center">
                <p className="text-3xl font-bold font-mono tracking-wider text-zinc-900">
                  {business.id}
                </p>
              </div>
              <button
                onClick={copyBusinessId}
                className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                {copied ? (
                  <>
                    <svg
                      className="h-4 w-4 text-emerald-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                      />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
              Workers enter this ID along with their PIN at{" "}
              <span className="font-mono font-medium">/pin</span> to clock in and view tasks.
            </div>
          </CardContent>
        </Card>

        {/* Company Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <dt className="text-sm font-medium text-zinc-500">
                  Company Name
                </dt>
                <dd className="text-sm font-semibold text-zinc-900">
                  {business.name}
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <dt className="text-sm font-medium text-zinc-500">
                  Created
                </dt>
                <dd className="text-sm text-zinc-900">{createdDate}</dd>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <dt className="text-sm font-medium text-zinc-500">
                  Total Workers
                </dt>
                <dd className="text-sm text-zinc-900">
                  {business.totalWorkers}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm font-medium text-zinc-500">
                  Active Workers
                </dt>
                <dd className="text-sm text-zinc-900">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {business.activeWorkers}
                  </span>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Worker Login Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Worker Login Instructions</CardTitle>
            <p className="text-sm text-zinc-500">
              Share these steps with your workers
            </p>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-zinc-700">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                  1
                </span>
                <span>
                  Open the app and go to the{" "}
                  <span className="font-medium">Worker PIN Login</span> page
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                  2
                </span>
                <span>
                  Enter Business ID:{" "}
                  <span className="font-mono font-bold text-zinc-900">
                    {business.id}
                  </span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                  3
                </span>
                <span>Enter the 6-digit PIN assigned to them by the admin</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
