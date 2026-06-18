'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { projectsApi, datasetsApi, auditsApi, reportsApi } from '@/lib/api'
import { formatDate, getRiskColor } from '@/lib/utils'
import type { Project, Dataset, Audit } from '@/types'
import { Upload, Play, FileDown, ArrowLeft, RefreshCw } from 'lucide-react'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [audits, setAudits] = useState<Audit[]>([])
  const [uploading, setUploading] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [polling, setPolling] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    const [proj, ds, aud] = await Promise.all([
      projectsApi.get(id),
      datasetsApi.listByProject(id),
      auditsApi.listByProject(id),
    ])
    setProject(proj.data)
    setDatasets(ds.data)
    setAudits(aud.data)
  }

  useEffect(() => { load() }, [id])

  // Poll running audits
  useEffect(() => {
    const running = audits.some(a => a.status === 'running' || a.status === 'pending')
    if (!running) return
    const t = setInterval(() => load(), 3000)
    return () => clearInterval(t)
  }, [audits])

  const upload = async (type: 'reference' | 'generated', file: File) => {
    setUploading(true)
    setMsg('')
    try {
      await datasetsApi.upload(id, type, file)
      await load()
      setMsg(`${type} dataset uploaded`)
    } catch { setMsg('Upload failed') }
    finally { setUploading(false) }
  }

  const launchAudit = async () => {
    const ref = datasets.find(d => d.dataset_type === 'reference')
    const gen = datasets.find(d => d.dataset_type === 'generated')
    if (!ref || !gen) { setMsg('Upload both datasets first'); return }
    setLaunching(true)
    setMsg('')
    try {
      await auditsApi.create({ project_id: id, reference_dataset_id: ref.id, generated_dataset_id: gen.id })
      await load()
      setMsg('Audit started')
    } catch { setMsg('Failed to start audit') }
    finally { setLaunching(false) }
  }

  const downloadReport = async (auditId: string) => {
    try {
      await reportsApi.generate(auditId)
      window.open(reportsApi.downloadUrl(auditId), '_blank')
    } catch { setMsg('Report generation failed') }
  }

  if (!project) return <AppShell><p className="text-sm text-slate-500">Loading...</p></AppShell>

  const ref = datasets.find(d => d.dataset_type === 'reference')
  const gen = datasets.find(d => d.dataset_type === 'generated')

  return (
    <AppShell>
      <button onClick={() => router.push('/projects')} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-5 transition-colors">
        <ArrowLeft size={14} /> Projects
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">{project.name}</h1>
          <p className="text-sm text-slate-400 mt-0.5">Model: <span className="font-mono">{project.model_name}</span></p>
        </div>
        <Button onClick={launchAudit} loading={launching} disabled={!ref || !gen}>
          <Play size={14} /> Run audit
        </Button>
      </div>

      {msg && <p className="text-sm text-blue-400 mb-4 bg-blue-400/10 border border-blue-400/20 rounded-lg px-3 py-2">{msg}</p>}

      {/* Dataset upload */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {(['reference', 'generated'] as const).map(type => {
          const existing = datasets.find(d => d.dataset_type === type)
          return (
            <Card key={type}>
              <p className="text-sm font-semibold text-slate-200 mb-1 capitalize">{type} dataset</p>
              <p className="text-xs text-slate-500 mb-3">
                {type === 'reference' ? 'Potential training data (CSV/JSON/TXT)' : 'Model outputs to audit (CSV/JSON/TXT)'}
              </p>
              {existing ? (
                <div className="bg-surface-2 rounded-lg px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-200">{existing.name}</p>
                    <p className="text-xs text-slate-500">{existing.record_count} records</p>
                  </div>
                  <Badge label={existing.file_type.toUpperCase()} />
                </div>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="file" accept=".csv,.json,.txt" className="hidden"
                    onChange={e => e.target.files?.[0] && upload(type, e.target.files[0])} />
                  <Button variant="secondary" size="sm" as="span">
                    <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload file'}
                  </Button>
                </label>
              )}
            </Card>
          )
        })}
      </div>

      {/* Audit history */}
      <Card>
        <p className="text-sm font-semibold text-slate-200 mb-4">Audit history</p>
        {audits.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No audits yet. Upload datasets and click Run audit.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {audits.map(audit => (
              <div key={audit.id} className="bg-surface-2 rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge label={audit.status} variant="status" />
                    <span className="text-xs text-slate-500">{formatDate(audit.created_at)}</span>
                  </div>
                  {audit.status === 'completed' && (
                    <button onClick={() => downloadReport(audit.id)}
                      className="text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1 transition-colors">
                      <FileDown size={12} /> Report
                    </button>
                  )}
                </div>

                {(audit.status === 'running' || audit.status === 'pending') && (
                  <ProgressBar value={audit.progress} className="mb-3" />
                )}

                {audit.result && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-3">
                    {[
                      { label: 'Risk', value: `${audit.result.risk_score}/100`, highlight: audit.result.risk_level },
                      { label: 'Exact match', value: `${(audit.result.exact_match_score * 100).toFixed(1)}%` },
                      { label: 'Semantic sim', value: `${(audit.result.semantic_similarity_score * 100).toFixed(1)}%` },
                      { label: 'Membership', value: `${(audit.result.membership_probability * 100).toFixed(1)}%` },
                      { label: 'Sensitive data', value: audit.result.sensitive_data_detected ? 'Detected' : 'None' },
                    ].map(({ label, value, highlight }) => (
                      <div key={label} className="bg-background rounded-lg p-2.5">
                        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                        <p className={`text-sm font-semibold ${highlight ? getRiskColor(highlight) : 'text-slate-200'}`}>
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </AppShell>
  )
}
