interface Props {
  label: string;
  value: number;       // 0-1 for percentages, 0-100 for scores
  asPercent?: boolean;
  colorClass?: string;
}

export default function ScoreMeter({ label, value, asPercent = true, colorClass = "bg-cyan-500" }: Props) {
  const pct = asPercent ? Math.round(value * 100) : value;
  const barWidth = asPercent ? value * 100 : value;

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs font-mono font-medium text-slate-200">{pct}{asPercent ? "%" : "/100"}</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${Math.min(100, barWidth)}%` }}
        />
      </div>
    </div>
  );
}
