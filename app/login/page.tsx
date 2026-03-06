"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LogoDark } from "@/components/ui/logo";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setupSuccess = searchParams.get("setup") === "success";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-900 p-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="login-glow mb-8 flex flex-col items-center">
          <LogoDark size="lg" />
          <h1 className="mt-4 text-2xl font-bold font-display tracking-tight text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Admin sign in to manage your business
          </p>
        </div>

        <Card className="shadow-2xl">
          <CardContent>
            {setupSuccess && (
              <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
                Account created successfully! Sign in to continue.
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
              >
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 space-y-3 text-center">
          <p className="text-sm text-zinc-400">
            Don&apos;t have an account?{" "}
            <a
              href="/setup"
              className="font-medium text-orange-500 hover:text-orange-600"
            >
              Sign up
            </a>
          </p>
          <p className="text-sm text-zinc-400">
            Worker?{" "}
            <a
              href="/pin"
              className="font-medium text-amber-500 hover:text-amber-400"
            >
              Sign in with PIN
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
