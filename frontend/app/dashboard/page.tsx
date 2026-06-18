'use client'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { analyticsApi } from '@/lib/api'
import { formatDate, formatPercent, getRiskColor } from '@/lib/utils'
import type { DashboardData } from '@/types'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts'
import { FolderOpen, ClipboardList, ShieldAlert, TrendingUp } from 'lucide-react'

const RISK_CHART_COLORS: Record<string, string> = {
  Low: '#22c55e',
  Medium: '#f59e0b',
  High: '#f97316',
  Critical: '#ef4444',
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsApi.dashboard()
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <AppShell>
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">Loading...</div>
    </AppShell>
  )

  const riskPieData = Object.entries(data?.risk_distribution || {}).map(([name, value]) => ({ name, value }))

  const statCards = [
    { label: 'Total Projects', value: data?.total_projects ?? 0, icon: FolderOpen, color: 'text-blue-400' },
    { label: 'Total Audits', value: data?.total_audits ?? 0, icon: ClipboardList, color: 'text-purple-400' },
    { label: 'Completed Audits', value: data?.completed_audits ?? 0, icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Avg Risk Score', value: `${data?.average_risk_score ?? 0}/100`, icon: ShieldAlert, color: 'text-amber-400' },
  ]

  return (
    <AppShell>
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Privacy leakage overview across all your audit projects</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="flex items-center gap-4">
            <div className={`w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-lg font-semibold text-slate-100">{value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Risk distribution pie */}
        <Card>
          <p className="text-sm font-semibold text-slate-300 mb-4">Risk Distribution</p>
          {riskPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={riskPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                  dataKey="value" nameKey="name" paddingAngle={2}>
                  {riskPieData.map(entry => (
                    <Cell key={entry.name} fill={RISK_CHART_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: 8, fontSize: 12 }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-slate-500">No data yet</div>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {riskPieData.map(({ name }) => (
              <span key={name} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ background: RISK_CHART_COLORS[name] }} />
                {name}
              </span>
            ))}
          </div>
        </Card>

        {/* Recent audits bar */}
        <Card className="lg:col-span-2">
          <p className="text-sm font-semibold text-slate-300 mb-4">Recent Risk Scores</p>
          {(data?.recent_audits.filter(a => a.risk_score != null).length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data?.recent_audits.filter(a => a.risk_score != null).slice(0, 8).reverse()}>
                <XAxis dataKey="project_name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: 8, fontSize: 12 }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="risk_score" name="Risk Score" radius={[3, 3, 0, 0]}>
                  {data?.recent_audits.filter(a => a.risk_score != null).slice(0, 8).reverse().map((entry, i) => (
                    <Cell key={i} fill={RISK_CHART_COLORS[entry.risk_level || ''] || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-slate-500">Run your first audit to see scores here</div>
          )}
        </Card>
      </div>

      {/* Recent audits table */}
      <Card>
        <p className="text-sm font-semibold text-slate-300 mb-4">Recent Audits</p>
        {(data?.recent_audits.length ?? 0) === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No audits yet. Create a project and run your first audit.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-border">
                <th className="text-left pb-2 font-medium">Project</th>
                <th className="text-left pb-2 font-medium">Model</th>
                <th className="text-left pb-2 font-medium">Status</th>
                <th className="text-left pb-2 font-medium">Risk</th>
                <th className="text-left pb-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.recent_audits.map(audit => (
                <tr key={audit.audit_id} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 text-slate-200">{audit.project_name}</td>
                  <td className="py-2.5 text-slate-400 font-mono text-xs">{audit.model_name}</td>
                  <td className="py-2.5"><Badge label={audit.status} variant="status" /></td>
                  <td className="py-2.5">
                    {audit.risk_level ? (
                      <span className={`font-semibold ${getRiskColor(audit.risk_level)}`}>
                        {audit.risk_score}/100 — {audit.risk_level}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-2.5 text-slate-500">{formatDate(audit.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </AppShell>
  )
}
