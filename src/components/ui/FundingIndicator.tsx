interface FundingIndicatorProps {
  percent: number;
  status: string;
  size?: "sm" | "md" | "lg";
}

export function FundingIndicator({
  percent,
  status,
  size = "md",
}: FundingIndicatorProps) {
  const dims = size === "sm" ? 56 : size === "lg" ? 96 : 72;
  const stroke = size === "sm" ? 5 : 6;
  const radius = (dims - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0" style={{ width: dims, height: dims }}>
        <svg width={dims} height={dims} className="-rotate-90">
          <circle
            cx={dims / 2}
            cy={dims / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-zinc-200 dark:text-zinc-800"
          />
          <circle
            cx={dims / 2}
            cy={dims / 2}
            r={radius}
            fill="none"
            stroke="url(#funding-gradient)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
          <defs>
            <linearGradient id="funding-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center font-semibold text-zinc-800 dark:text-zinc-100 ${
            size === "sm" ? "text-xs" : size === "lg" ? "text-lg" : "text-sm"
          }`}
        >
          {percent}%
        </span>
      </div>
      <div>
        <p
          className={`font-semibold text-zinc-900 dark:text-zinc-50 ${
            size === "sm" ? "text-sm" : "text-base"
          }`}
        >
          {status}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Funding flow</p>
      </div>
    </div>
  );
}
