import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRiskColor(level?: string): string {
  switch (level) {
    case 'Low': return 'text-emerald-400'
    case 'Medium': return 'text-amber-400'
    case 'High': return 'text-orange-400'
    case 'Critical': return 'text-red-400'
    default: return 'text-slate-400'
  }
}

export function getRiskBg(level?: string): string {
  switch (level) {
    case 'Low': return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
    case 'Medium': return 'bg-amber-400/10 text-amber-400 border-amber-400/20'
    case 'High': return 'bg-orange-400/10 text-orange-400 border-orange-400/20'
    case 'Critical': return 'bg-red-400/10 text-red-400 border-red-400/20'
    default: return 'bg-slate-400/10 text-slate-400 border-slate-400/20'
  }
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}
