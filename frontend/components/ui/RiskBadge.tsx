const config = {
  Low:      { bg: "bg-green-500/10",  border: "border-green-500/30",  text: "text-green-400"  },
  Medium:   { bg: "bg-amber-500/10",  border: "border-amber-500/30",  text: "text-amber-400"  },
  High:     { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400" },
  Critical: { bg: "bg-red-500/10",    border: "border-red-500/30",    text: "text-red-400"    },
};

export default function RiskBadge({ level }: { level: string }) {
  const c = config[level as keyof typeof config] || config.Low;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      border ${c.bg} ${c.border} ${c.text}`}>
      {level}
    </span>
  );
}
