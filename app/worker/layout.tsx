import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyWorkerToken } from "@/lib/auth/session";
import type { ReactNode } from "react";

export default async function WorkerLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("worker-token")?.value;

  if (!token) redirect("/pin");

  const session = await verifyWorkerToken(token);
  if (!session) redirect("/pin");

  return <>{children}</>;
}
