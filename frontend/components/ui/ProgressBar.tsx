import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  colorClass?: string
  className?: string
}

export function ProgressBar({ value, max = 100, label, showValue = true, colorClass, className }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100))

  const autoColor = !colorClass
    ? pct < 26 ? 'bg-emerald-500'
    : pct < 51 ? 'bg-amber-500'
    : pct < 76 ? 'bg-orange-500'
    : 'bg-red-500'
    : colorClass

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex justify-between mb-1">
          {label && <span className="text-xs text-slate-400">{label}</span>}
          {showValue && <span className="text-xs text-slate-300 font-mono">{pct}%</span>}
        </div>
      )}
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', autoColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
