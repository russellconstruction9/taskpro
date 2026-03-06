"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function SetupCompanyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [businessId, setBusinessId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Company info
  const [companyName, setCompanyName] = useState("");

  // Admin info
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (step === 1) {
      if (!companyName.trim()) {
        setError("Company name is required");
        return;
      }
      setStep(2);
      return;
    }

    // Validate admin form
    if (!adminName.trim()) {
      setError("Admin name is required");
      return;
    }
    if (!adminEmail.trim()) {
      setError("Email is required");
      return;
    }
    if (adminPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (adminPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const result = await api.post<{ success: boolean; businessId: number }>("/api/setup", {
        companyName: companyName.trim(),
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim().toLowerCase(),
        adminPassword,
      });
      setBusinessId(result.businessId);
      setStep(3); // Show success screen with Business ID
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function copyBusinessId() {
    if (businessId === null) return;
    await navigator.clipboard.writeText(String(businessId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ─── Step 3: Success screen with Business ID ─────────────
  if (step === 3 && businessId !== null) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-50 p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Account Created!</h1>
            <p className="mt-1 text-sm text-zinc-500">Your company is set up and ready to go</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Business ID</CardTitle>
              <p className="text-sm text-zinc-500">
                Workers need this ID to log in via PIN. Save it and share it with your team.
              </p>
            </CardHeader>
            <CardContent>
              <div className="mb-4 rounded-lg border-2 border-dashed border-orange-300 bg-orange-50 p-6 text-center">
                <p className="text-sm font-medium text-orange-600 mb-1">Business ID</p>
                <p className="text-4xl font-bold font-mono tracking-wider text-zinc-900">
                  {businessId}
                </p>
              </div>

              <button
                onClick={copyBusinessId}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                {copied ? (
                  <>
                    <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                    </svg>
                    Copy to Clipboard
                  </>
                )}
              </button>

              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800 mb-6">
                <strong>Important:</strong> You can always find your Business ID later in{" "}
                <span className="font-medium">Dashboard → Settings</span>.
              </div>

              <Button
                onClick={() => router.push("/login?setup=success")}
                className="w-full"
                size="lg"
              >
                Continue to Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-orange-500">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">
            <span className="text-zinc-400">Pro</span> Task
          </h1>
          <p className="mt-1 text-sm text-zinc-500">Project Management Software</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 ? "Set Up Your Company" : "Create Admin Account"}
            </CardTitle>
            <p className="text-sm text-zinc-500">
              {step === 1
                ? "Enter your company name to get started"
                : "Create your administrator account"}
            </p>
          </CardHeader>
          <CardContent>
            {/* Progress indicator */}
            <div className="mb-6 flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                    step >= 1
                      ? "bg-orange-500 text-white"
                      : "bg-zinc-200 text-zinc-500"
                  }`}
                >
                  1
                </div>
                <span className="text-sm font-medium text-zinc-700">Company</span>
              </div>
              <div className="h-0.5 w-8 bg-zinc-200" />
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                    step >= 2
                      ? "bg-orange-500 text-white"
                      : "bg-zinc-200 text-zinc-500"
                  }`}
                >
                  2
                </div>
                <span className="text-sm font-medium text-zinc-700">Admin</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 ? (
                <Input
                  label="Company Name"
                  type="text"
                  placeholder="Acme Construction"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  autoFocus
                />
              ) : (
                <>
                  <Input
                    label="Your Name"
                    type="text"
                    placeholder="John Smith"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    required
                    autoFocus
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="admin@company.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </>
              )}

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                {step === 2 && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                )}
                <Button
                  type="submit"
                  loading={loading}
                  className="flex-1"
                  size="lg"
                >
                  {step === 1 ? "Continue" : "Create Account"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-500">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-medium text-orange-500 hover:text-orange-600"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
