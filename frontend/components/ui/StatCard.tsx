import { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  sub?: string;
  accent?: boolean;
}

export default function StatCard({ label, value, icon: Icon, sub, accent }: Props) {
  return (
    <div className={`rounded-xl p-5 border transition-colors
      ${accent
        ? "bg-cyan-500/5 border-cyan-500/20 glow-cyan"
        : "bg-slate-900 border-slate-800 hover:border-slate-700"}`}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
        <div className={`p-1.5 rounded-md ${accent ? "bg-cyan-500/15" : "bg-slate-800"}`}>
          <Icon className={`w-4 h-4 ${accent ? "text-cyan-400" : "text-slate-400"}`} />
        </div>
      </div>
      <div className={`text-3xl font-bold tracking-tight ${accent ? "text-gradient" : "text-slate-100"}`}>
        {value}
      </div>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}
