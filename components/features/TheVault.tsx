'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Archive, Search, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { getVaultEntries, deleteVaultEntry, searchVault } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import { Skeleton } from '@/components/ui/Skeleton'

interface VaultEntry {
  id: string
  content: string
  created_at?: string
  timestamp?: string
  tags?: string[]
  concept_tags?: string[]
}

export function TheVault() {
  const { sessionId } = useSessionStore()
  const [entries, setEntries] = useState<VaultEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<VaultEntry[] | null>(null)

  useEffect(() => {
    setLoading(true)
    getVaultEntries(sessionId)
      .then((d) => setEntries(((d as Record<string, unknown>)?.entries as VaultEntry[] | undefined) ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sessionId])

  const handleSearch = async () => {
    if (!query.trim()) { setResults(null); return }
    setSearching(true)
    try {
      const data = await searchVault(sessionId, query)
      setResults(data?.results ?? [])
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteVaultEntry(sessionId, id).catch(() => {})
    setEntries(entries.filter((e) => e.id !== id))
    if (results) setResults(results.filter((r) => r.id !== id))
  }

  const displayed = results ?? entries

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h2 className="text-display-sm text-[var(--text-primary)]">The Vault</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">AES-256 encrypted knowledge archive with semantic search</p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Semantic search..."
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
          />
        </div>
        <Button variant="outline" size="sm" icon={<Search size={13} />} onClick={handleSearch} disabled={searching}>
          {searching ? '...' : 'Search'}
        </Button>
      </div>

      {results && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)]">{results.length} results</span>
          <button onClick={() => { setResults(null); setQuery('') }} className="text-xs text-indigo-400 hover:underline">
            Clear
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="w-full h-16 rounded-xl" />)}
        </div>
      ) : (
        <AnimatePresence>
          {displayed.length > 0 ? displayed.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-elevated rounded-xl p-3 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <Archive size={12} className="text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{entry.content}</p>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-[var(--text-muted)] hover:text-red-400"
                >
                  <Trash2 size={11} />
                </button>
              </div>
              {(entry.tags ?? entry.concept_tags ?? []).length > 0 && (
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {(entry.tags ?? entry.concept_tags ?? []).map((tag, ti) => (
                    <span key={ti} className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-[var(--text-muted)]">{tag}</span>
                  ))}
                </div>
              )}
            </motion.div>
          )) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-8">
              <Archive size={24} className="text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)]">Vault is empty. Bookmark messages to save them here.</p>
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
