'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { projectsApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Project } from '@/types'
import { Plus, Trash2, ExternalLink, X } from 'lucide-react'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', model_name: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => projectsApi.list().then(r => setProjects(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await projectsApi.create(form)
      setForm({ name: '', model_name: '', description: '' })
      setShowForm(false)
      load()
    } catch {
      setError('Failed to create project')
    } finally {
      setSaving(false)
    }
  }

  const del = async (id: string) => {
    if (!confirm('Delete this project?')) return
    await projectsApi.delete(id)
    setProjects(p => p.filter(x => x.id !== id))
  }

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [f]: e.target.value }))

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Projects</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your model audit projects</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={16} /> New project
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-200">New project</p>
            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={create} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input id="name" label="Project name" value={form.name} onChange={set('name')} required />
            <Input id="model" label="Model name" value={form.model_name} onChange={set('model_name')} placeholder="e.g. GPT-2, Llama 3" required />
            <Input id="desc" label="Description" value={form.description} onChange={set('description')} placeholder="Optional" />
            {error && <p className="col-span-full text-sm text-red-400">{error}</p>}
            <div className="col-span-full flex gap-2">
              <Button type="submit" loading={saving}>Create project</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : projects.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-slate-400 mb-3">No projects yet</p>
          <Button onClick={() => setShowForm(true)}><Plus size={16} /> Create your first project</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <Card key={p.id} className="flex flex-col gap-4 hover:border-slate-600 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-100">{p.name}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{p.model_name}</p>
                </div>
                <button onClick={() => del(p.id)} className="text-slate-600 hover:text-red-400 transition-colors p-1">
                  <Trash2 size={14} />
                </button>
              </div>
              {p.description && <p className="text-sm text-slate-400">{p.description}</p>}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
                <span className="text-xs text-slate-500">{formatDate(p.created_at)}</span>
                <Link href={`/projects/${p.id}`} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  Open <ExternalLink size={12} />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  )
}
