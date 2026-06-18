'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login } from '@/lib/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Shield } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(username, password)
      router.push('/dashboard')
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <span className="text-xl font-semibold text-slate-100">Audito</span>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8">
          <h1 className="text-lg font-semibold text-slate-100 mb-1">Sign in</h1>
          <p className="text-sm text-slate-400 mb-6">Access your audit workspace</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="username"
              label="User Name"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="example"
              required
            />
            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="w-full mt-1">
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          No account?{' '}
          <Link href="/register" className="text-blue-400 hover:text-blue-300">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
