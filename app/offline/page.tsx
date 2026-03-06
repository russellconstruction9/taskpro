"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-100 p-4">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-100">
          <svg
            className="h-10 w-10 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"
            />
          </svg>
        </div>
        <h1 className="font-display mb-2 text-2xl font-bold tracking-tight text-zinc-900">
          You&apos;re offline
        </h1>
        <p className="mb-6 text-sm text-zinc-500">
          Check your internet connection to use TaskPro. Your data will sync when you&apos;re back online.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex h-10 items-center rounded-lg bg-amber-600 px-4 text-sm font-medium text-white transition-colors hover:bg-amber-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
