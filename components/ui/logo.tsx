import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
}

export function Logo({ size = "md", className, showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: "h-8 w-8", text: "text-lg", check: 16 },
    md: { icon: "h-10 w-10", text: "text-xl", check: 20 },
    lg: { icon: "h-12 w-12", text: "text-2xl", check: 24 },
  };

  const s = sizes[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          s.icon,
          "flex items-center justify-center rounded-lg bg-orange-500"
        )}
      >
        <svg
          width={s.check}
          height={s.check}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
            fill="white"
          />
        </svg>
      </div>
      {showText && (
        <span className={cn(s.text, "font-bold text-zinc-900")}>
          <span className="text-zinc-400">Pro</span>{" "}
          <span>Task</span>
        </span>
      )}
    </div>
  );
}

export function LogoDark({ size = "md", className, showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: "h-8 w-8", text: "text-lg", check: 16 },
    md: { icon: "h-10 w-10", text: "text-xl", check: 20 },
    lg: { icon: "h-12 w-12", text: "text-2xl", check: 24 },
  };

  const s = sizes[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          s.icon,
          "flex items-center justify-center rounded-lg bg-orange-500"
        )}
      >
        <svg
          width={s.check}
          height={s.check}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
            fill="white"
          />
        </svg>
      </div>
      {showText && (
        <span className={cn(s.text, "font-bold")}>
          <span className="text-zinc-400">Pro</span>{" "}
          <span className="text-white">Task</span>
        </span>
      )}
    </div>
  );
}
