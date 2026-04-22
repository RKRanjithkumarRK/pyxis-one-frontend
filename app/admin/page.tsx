'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Shield, Activity, Settings, RefreshCw, Trash2,
  CheckCircle, XCircle, ChevronDown, Search, LogOut, Brain,
  AlertTriangle, UserPlus, Loader2
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { adminApi } from '@/lib/api'

type Tab = 'users' | 'stats' | 'health'

interface UserRow {
  id: string
  email: string
  display_name: string
  role: string
  plan: string
  is_active: boolean
  created_at: string
  last_login: string | null
}

export default function AdminPage() {
  const router = useRouter()
  const { user, clearAuth, isAdmin } = useAuthStore()

  const [tab, setTab] = useState<Tab>('users')
  const [users, setUsers] = useState<UserRow[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [health, setHealth] = useState<Record<string, unknown> | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Guard
  useEffect(() => {
    if (!isAdmin()) router.push('/')
  }, [isAdmin, router])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adminApi.listUsers(50, 0, search || undefined)
      setUsers(res.users as UserRow[])
      setTotal(res.total)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [search])

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const [s, h] = await Promise.all([adminApi.stats(), adminApi.health()])
      setStats(s)
      setHealth(h)
    } catch { /* non-fatal */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (tab === 'users') loadUsers()
    else if (tab === 'stats' || tab === 'health') loadStats()
  }, [tab, loadUsers, loadStats])

  async function toggleUser(id: string, currentlyActive: boolean) {
    await adminApi.toggleUser(id, currentlyActive)
    loadUsers()
  }

  async function updateRole(id: string, role: string) {
    await adminApi.updateRole(id, role)
    loadUsers()
  }

  async function deleteUser(id: string, email: string) {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return
    await adminApi.deleteUser(id)
    loadUsers()
  }

  function logout() {
    clearAuth()
    router.push('/login')
  }

  const TABS: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: 'users', icon: <Users size={14} />, label: 'Users' },
    { id: 'stats', icon: <Activity size={14} />, label: 'Stats' },
    { id: 'health', icon: <Shield size={14} />, label: 'Provider Health' },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      {/* Top bar */}
      <header className="border-b border-[var(--border-subtle)] px-6 py-3 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
          <Brain size={14} className="text-indigo-400" />
        </div>
        <span className="font-semibold text-sm text-[var(--text-primary)]">PYXIS Admin</span>
        <div className="flex-1" />
        <span className="text-xs text-[var(--text-muted)]">{user?.email}</span>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors"
        >
          <LogOut size={13} /> Sign out
        </button>
      </header>

      {/* Body */}
      <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-[var(--bg-overlay)] rounded-xl w-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === t.id
                  ? 'bg-[var(--accent-soft)] text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {/* Users tab */}
        <AnimatePresence mode="wait">
          {tab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Search bar */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-xs">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                    placeholder="Search by email…"
                    className="w-full bg-[var(--bg-overlay)] border border-[var(--border-subtle)] rounded-xl pl-8 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-indigo-500/60"
                  />
                </div>
                <button
                  onClick={loadUsers}
                  className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-overlay)] border border-[var(--border-subtle)] rounded-xl px-3 py-2"
                >
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
                <span className="text-xs text-[var(--text-muted)]">{total} total</span>
              </div>

              {/* Table */}
              <div className="glass-elevated rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)]">
                      {['Email', 'Name', 'Role', 'Plan', 'Status', 'Joined', 'Actions'].map((h) => (
                        <th key={h} className="text-left text-xs text-[var(--text-muted)] font-medium px-4 py-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading && users.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-[var(--text-muted)] text-xs">
                          <Loader2 size={14} className="animate-spin inline mr-2" /> Loading…
                        </td>
                      </tr>
                    ) : users.map((u) => (
                      <tr key={u.id} className="border-b border-[var(--border-subtle)]/50 hover:bg-[var(--bg-overlay)]/50">
                        <td className="px-4 py-3 text-[var(--text-primary)]">{u.email}</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{u.display_name}</td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            onChange={(e) => updateRole(u.id, e.target.value)}
                            className="bg-[var(--bg-overlay)] border border-[var(--border-subtle)] rounded-lg px-2 py-1 text-xs text-[var(--text-secondary)] outline-none"
                          >
                            <option value="admin">admin</option>
                            <option value="user">user</option>
                            <option value="guest">guest</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            u.plan === 'pro' ? 'bg-violet-500/20 text-violet-400' :
                            u.plan === 'enterprise' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-[var(--bg-overlay)] text-[var(--text-muted)]'
                          }`}>
                            {u.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleUser(u.id, u.is_active)}
                            className="flex items-center gap-1 text-xs"
                          >
                            {u.is_active
                              ? <><CheckCircle size={12} className="text-emerald-400" /> active</>
                              : <><XCircle size={12} className="text-red-400" /> disabled</>}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {u.id !== user?.id && (
                            <button
                              onClick={() => deleteUser(u.id, u.email)}
                              className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Stats tab */}
          {tab === 'stats' && stats && (
            <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Users', value: stats.total_users },
                  { label: 'Active (7d)', value: stats.active_users_7d },
                  { label: 'Sessions', value: stats.total_sessions },
                  { label: 'Messages', value: stats.total_messages },
                ].map((s) => (
                  <div key={s.label} className="glass-elevated rounded-2xl p-4">
                    <div className="text-2xl font-bold text-[var(--text-primary)]">{String(s.value ?? 0)}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="glass-elevated rounded-2xl p-4">
                <div className="text-sm font-medium text-[var(--text-primary)] mb-3">Configured Providers</div>
                <div className="flex flex-wrap gap-2">
                  {((stats.providers_configured as string[]) ?? []).map((p) => (
                    <span key={p} className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Health tab */}
          {tab === 'health' && health && (
            <motion.div key="health" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="glass-elevated rounded-2xl p-5">
                <div className="text-sm font-medium text-[var(--text-primary)] mb-4">Provider Health</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries((health.providers ?? {}) as Record<string, Record<string, unknown>>).map(([name, info]) => (
                    <div key={name} className="flex items-center gap-3 bg-[var(--bg-overlay)] rounded-xl px-4 py-3">
                      <div className={`w-2 h-2 rounded-full ${
                        info.status === 'ok' ? 'bg-emerald-400' :
                        info.status === 'not_configured' ? 'bg-[var(--text-muted)]' : 'bg-red-400'
                      }`} />
                      <span className="text-sm font-medium text-[var(--text-primary)] capitalize">{name}</span>
                      <span className="ml-auto text-xs text-[var(--text-muted)]">
                        {String(info.status)}
                        {info.http ? ` (${info.http})` : ''}
                        {info.error ? `: ${String(info.error).slice(0, 40)}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-3 text-xs text-[var(--text-muted)]">
                  <span>DB: <strong className="text-[var(--text-secondary)]">{String(health.database)}</strong></span>
                  <span>Redis: <strong className="text-[var(--text-secondary)]">{health.redis ? 'configured' : 'none'}</strong></span>
                  <span>Env: <strong className="text-[var(--text-secondary)]">{String(health.environment)}</strong></span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
