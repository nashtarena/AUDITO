'use client'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { analyticsApi } from '@/lib/api'
import { formatDate, getRiskColor } from '@/lib/utils'
import type { RecentAudit } from '@/types'

export default function AuditsPage() {
  const [audits, setAudits] = useState<RecentAudit[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    analyticsApi.dashboard()
      .then(r => setAudits(r.data.recent_audits))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? audits : audits.filter(a =>
    filter === 'completed' ? a.status === 'completed'
    : filter === 'running' ? a.status === 'running'
    : a.risk_level === filter
  )

  return (
    <AppShell>
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-slate-100">Audit History</h1>
        <p className="text-sm text-slate-400 mt-1">All audits across your projects</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['all', 'completed', 'running', 'Low', 'Medium', 'High', 'Critical'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              filter === f
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                : 'bg-surface text-slate-400 border-border hover:border-slate-600'
            }`}>
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <p className="text-sm text-slate-500 py-4">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">No audits found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-border">
                {['Project', 'Model', 'Status', 'Risk Score', 'Risk Level', 'Date'].map(h => (
                  <th key={h} className="text-left pb-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.audit_id} className="border-b border-border/50 last:border-0 hover:bg-surface-2/50 transition-colors">
                  <td className="py-3 text-slate-200 font-medium">{a.project_name}</td>
                  <td className="py-3 text-slate-400 font-mono text-xs">{a.model_name}</td>
                  <td className="py-3"><Badge label={a.status} variant="status" /></td>
                  <td className="py-3">
                    <span className={`font-mono font-semibold ${getRiskColor(a.risk_level)}`}>
                      {a.risk_score != null ? `${a.risk_score}/100` : '—'}
                    </span>
                  </td>
                  <td className="py-3">
                    {a.risk_level ? <Badge label={a.risk_level} variant="risk" riskLevel={a.risk_level} /> : '—'}
                  </td>
                  <td className="py-3 text-slate-500">{formatDate(a.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </AppShell>
  )
}
