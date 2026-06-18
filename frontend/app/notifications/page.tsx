'use client'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { notificationsApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Notification } from '@/types'
import { Bell, Check } from 'lucide-react'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => notificationsApi.list().then(r => setNotifications(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const markRead = async (id: string) => {
    await notificationsApi.markRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const unread = notifications.filter(n => !n.is_read).length

  return (
    <AppShell>
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-slate-100">Notifications</h1>
        <p className="text-sm text-slate-400 mt-1">{unread > 0 ? `${unread} unread` : 'All caught up'}</p>
      </div>

      <Card>
        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-3">
            <Bell size={32} className="text-slate-600" />
            <p className="text-sm text-slate-500">No notifications yet</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {notifications.map(n => (
              <div key={n.id} className={`py-4 flex items-start gap-4 ${!n.is_read ? 'opacity-100' : 'opacity-60'}`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-blue-400' : 'bg-transparent'}`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${!n.is_read ? 'text-slate-100' : 'text-slate-400'}`}>{n.title}</p>
                  <p className="text-sm text-slate-400 mt-0.5">{n.message}</p>
                  <p className="text-xs text-slate-600 mt-1">{formatDate(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <button onClick={() => markRead(n.id)}
                    className="text-slate-500 hover:text-emerald-400 transition-colors p-1 shrink-0">
                    <Check size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </AppShell>
  )
}
