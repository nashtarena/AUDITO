import { cn, getRiskBg } from '@/lib/utils'
import type { RiskLevel } from '@/types'

interface BadgeProps {
  label: string
  variant?: 'risk' | 'status' | 'default'
  riskLevel?: RiskLevel
  className?: string
}

export function Badge({ label, variant = 'default', riskLevel, className }: BadgeProps) {
  const statusColors: Record<string, string> = {
    completed: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
    running: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
    pending: 'bg-slate-400/10 text-slate-400 border-slate-400/20',
    failed: 'bg-red-400/10 text-red-400 border-red-400/20',
  }

  const base = 'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border'

  if (variant === 'risk' && riskLevel) {
    return <span className={cn(base, getRiskBg(riskLevel), className)}>{label}</span>
  }

  if (variant === 'status') {
    return <span className={cn(base, statusColors[label.toLowerCase()] || statusColors.pending, className)}>{label}</span>
  }

  return <span className={cn(base, 'bg-slate-400/10 text-slate-400 border-slate-400/20', className)}>{label}</span>
}
