/**
 * Calculate live labor cost from clock-in time and hourly rate.
 * Runs client-side — no DB calls needed.
 */
export function calculateLaborCost(
  clockIn: Date | string,
  hourlyRate: number | string,
  clockOut?: Date | string | null
): { elapsed: string; cost: number; hours: number } {
  const start = new Date(clockIn).getTime();
  const end = clockOut ? new Date(clockOut).getTime() : Date.now();
  const diffMs = Math.max(0, end - start);

  const totalHours = diffMs / 3_600_000;
  const rate = typeof hourlyRate === "string" ? parseFloat(hourlyRate) : hourlyRate;
  const cost = totalHours * rate;

  // Format elapsed time as HH:MM:SS
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const elapsed = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return { elapsed, cost: Math.round(cost * 100) / 100, hours: Math.round(totalHours * 100) / 100 };
}

/**
 * Format a dollar amount for display.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
