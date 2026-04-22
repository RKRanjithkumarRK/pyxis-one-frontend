'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  SquarePen, Search, Pin, Trash2, Edit2, Check, X, MessageSquare, MoreHorizontal,
} from 'lucide-react'
import {
  listConversations, deleteConversation, updateConversation, searchConversations,
} from '@/lib/api'
import type { Conversation, ConversationGroup } from '@/lib/types'

interface ConversationSidebarProps {
  sessionId: string
  activeConversationId: string | null
  onSelectConversation: (conv: Conversation) => void
  onNewConversation: () => void
  className?: string
}

export default function ConversationSidebar({
  sessionId,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [groups, setGroups]               = useState<ConversationGroup[]>([])
  const [searchQuery, setSearchQuery]     = useState('')
  const [searchResults, setSearchResults] = useState<Conversation[] | null>(null)
  const [loading, setLoading]             = useState(true)
  const [editingId, setEditingId]         = useState<string | null>(null)
  const [editTitle, setEditTitle]         = useState('')
  const [menuOpenId, setMenuOpenId]       = useState<string | null>(null)
  const [hasMore, setHasMore]             = useState(false)
  const [offset, setOffset]               = useState(0)
  const [searchOpen, setSearchOpen]       = useState(false)

  const editInputRef  = useRef<HTMLInputElement>(null)
  const searchRef     = useRef<HTMLInputElement>(null)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadConversations = useCallback(async (reset = false) => {
    if (!sessionId) return
    setLoading(true)
    try {
      const newOffset = reset ? 0 : offset
      const data = await listConversations(sessionId, 50, newOffset)
      const convs = reset
        ? data.conversations
        : [...conversations, ...data.conversations]
      setConversations(convs)
      setGroups(groupByDate(convs))
      setHasMore(data.conversations.length === 50)
      if (!reset) setOffset(newOffset + 50)
    } catch { /* silent */ } finally { setLoading(false) }
  }, [sessionId, offset, conversations])

  useEffect(() => { loadConversations(true) }, [sessionId]) // eslint-disable-line

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    if (!searchQuery.trim()) { setSearchResults(null); return }
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const data = await searchConversations(sessionId, searchQuery.trim())
        setSearchResults(data.results)
      } catch { setSearchResults([]) }
    }, 300)
  }, [searchQuery, sessionId])

  useEffect(() => { if (editingId) editInputRef.current?.focus() }, [editingId])
  useEffect(() => { if (searchOpen) searchRef.current?.focus() }, [searchOpen])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); setMenuOpenId(null)
    try {
      await deleteConversation(id)
      const updated = conversations.filter(c => c.id !== id)
      setConversations(updated); setGroups(groupByDate(updated))
    } catch { /* silent */ }
  }

  const handlePin = async (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation(); setMenuOpenId(null)
    try {
      const updated = await updateConversation(conv.id, { pinned: !conv.pinned })
      const newList = conversations.map(c => c.id === updated.id ? updated : c)
      setConversations(newList); setGroups(groupByDate(newList))
    } catch { /* silent */ }
  }

  const startEdit = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation(); setMenuOpenId(null)
    setEditingId(conv.id); setEditTitle(conv.title ?? '')
  }

  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) { setEditingId(null); return }
    try {
      const updated = await updateConversation(id, { title: editTitle.trim() })
      const newList = conversations.map(c => c.id === updated.id ? updated : c)
      setConversations(newList); setGroups(groupByDate(newList))
    } catch { /* silent */ }
    setEditingId(null)
  }

  const displayList: Conversation[] = searchResults
    ?? [...conversations.filter(c => c.pinned), ...conversations.filter(c => !c.pinned)]

  return (
    <aside
      className="flex flex-col h-full flex-shrink-0"
      style={{ width: 'var(--sidebar-width)', background: 'var(--bg-sidebar)' }}
    >
      {/* ── Top bar: New chat + Search ── */}
      <div className="flex items-center gap-1 px-3 pt-3 pb-2">
        {/* Brand */}
        <span
          className="flex-1 text-sm font-semibold px-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Pyxis
        </span>
        <button
          onClick={() => { setSearchOpen(s => !s); setSearchQuery('') }}
          title="Search"
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Search size={16} />
        </button>
        <button
          onClick={onNewConversation}
          title="New chat"
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <SquarePen size={16} />
        </button>
      </div>

      {/* ── Search box ── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden px-3 pb-2"
          >
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <Search size={13} style={{ color: 'var(--text-muted)' }} />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search chats…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ color: 'var(--text-muted)' }}>
                  <X size={12} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Conversation list ── */}
      <div className="flex-1 overflow-y-auto py-1">
        {loading && conversations.length === 0 ? (
          /* Skeleton */
          <div className="px-3 space-y-1">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-9 rounded-lg animate-pulse"
                style={{ background: 'var(--bg-hover)', opacity: 0.5 }}
              />
            ))}
          </div>
        ) : searchResults !== null ? (
          /* Search results */
          <div>
            <SectionLabel label={`${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`} />
            {searchResults.map(conv => (
              <ConvItem
                key={conv.id} conv={conv}
                isActive={conv.id === activeConversationId}
                isEditing={editingId === conv.id}
                editTitle={editTitle} editInputRef={editInputRef}
                menuOpen={menuOpenId === conv.id}
                onSelect={onSelectConversation}
                onMenuToggle={id => setMenuOpenId(p => p === id ? null : id)}
                onEdit={startEdit} onDelete={handleDelete} onPin={handlePin}
                onSaveEdit={saveEdit} onCancelEdit={() => setEditingId(null)}
                onEditTitleChange={setEditTitle}
              />
            ))}
          </div>
        ) : (
          /* Grouped list */
          <>
            {conversations.filter(c => c.pinned).length > 0 && (
              <div>
                <SectionLabel label="Pinned" />
                {conversations.filter(c => c.pinned).map(conv => (
                  <ConvItem key={conv.id} conv={conv}
                    isActive={conv.id === activeConversationId}
                    isEditing={editingId === conv.id} editTitle={editTitle}
                    editInputRef={editInputRef} menuOpen={menuOpenId === conv.id}
                    onSelect={onSelectConversation}
                    onMenuToggle={id => setMenuOpenId(p => p === id ? null : id)}
                    onEdit={startEdit} onDelete={handleDelete} onPin={handlePin}
                    onSaveEdit={saveEdit} onCancelEdit={() => setEditingId(null)}
                    onEditTitleChange={setEditTitle}
                  />
                ))}
              </div>
            )}
            {groups.map(group => (
              <div key={group.label}>
                <SectionLabel label={group.label} />
                {group.conversations.map(conv => (
                  <ConvItem key={conv.id} conv={conv}
                    isActive={conv.id === activeConversationId}
                    isEditing={editingId === conv.id} editTitle={editTitle}
                    editInputRef={editInputRef} menuOpen={menuOpenId === conv.id}
                    onSelect={onSelectConversation}
                    onMenuToggle={id => setMenuOpenId(p => p === id ? null : id)}
                    onEdit={startEdit} onDelete={handleDelete} onPin={handlePin}
                    onSaveEdit={saveEdit} onCancelEdit={() => setEditingId(null)}
                    onEditTitleChange={setEditTitle}
                  />
                ))}
              </div>
            ))}
            {hasMore && (
              <button
                onClick={() => loadConversations(false)}
                className="w-full py-2 text-xs transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                Show more
              </button>
            )}
          </>
        )}
      </div>

      {/* ── User footer ── */}
      <div
        className="px-2 py-2 border-t"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            P
          </div>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Pyxis User
          </span>
        </button>
      </div>
    </aside>
  )
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-4 pt-4 pb-1 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
      {label}
    </p>
  )
}

// ── Conversation item ─────────────────────────────────────────────────────────

interface ConvItemProps {
  conv: Conversation
  isActive: boolean
  isEditing: boolean
  editTitle: string
  editInputRef: React.RefObject<HTMLInputElement>
  menuOpen: boolean
  onSelect: (c: Conversation) => void
  onMenuToggle: (id: string) => void
  onEdit: (c: Conversation, e: React.MouseEvent) => void
  onDelete: (id: string, e: React.MouseEvent) => void
  onPin: (c: Conversation, e: React.MouseEvent) => void
  onSaveEdit: (id: string) => void
  onCancelEdit: () => void
  onEditTitleChange: (v: string) => void
}

function ConvItem({
  conv, isActive, isEditing, editTitle, editInputRef,
  menuOpen, onSelect, onMenuToggle, onEdit, onDelete, onPin,
  onSaveEdit, onCancelEdit, onEditTitleChange,
}: ConvItemProps) {
  return (
    <div className="relative group px-2">
      <button
        onClick={() => onSelect(conv)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors"
        style={{
          background: isActive ? 'var(--bg-active)' : 'transparent',
          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)' }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
      >
        {isEditing ? (
          <input
            ref={editInputRef}
            value={editTitle}
            onChange={e => onEditTitleChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter')  { e.stopPropagation(); onSaveEdit(conv.id) }
              if (e.key === 'Escape') { e.stopPropagation(); onCancelEdit() }
            }}
            onClick={e => e.stopPropagation()}
            className="flex-1 bg-transparent outline-none border-b text-sm"
            style={{ color: 'var(--text-primary)', borderColor: 'var(--border-hover)' }}
          />
        ) : (
          <span className="flex-1 truncate leading-5">
            {conv.title ?? 'New chat'}
          </span>
        )}

        {isEditing ? (
          <div className="flex gap-1 shrink-0">
            <button
              onClick={e => { e.stopPropagation(); onSaveEdit(conv.id) }}
              className="p-0.5 rounded"
              style={{ color: 'var(--accent)' }}
            >
              <Check size={13} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onCancelEdit() }}
              className="p-0.5 rounded"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); onMenuToggle(conv.id) }}
            className="shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--text-muted)' }}
          >
            <MoreHorizontal size={15} />
          </button>
        )}
      </button>

      {/* Context menu */}
      <AnimatePresence>
        {menuOpen && !isEditing && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => onMenuToggle(conv.id)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.08 }}
              className="absolute right-2 top-8 z-50 w-44 rounded-xl shadow-2xl overflow-hidden py-1"
              style={{ background: '#2f2f2f', border: '1px solid var(--border-hover)' }}
            >
              <CtxItem icon={<Edit2 size={13} />} label="Rename"
                onClick={e => onEdit(conv, e)} />
              <CtxItem icon={<Pin size={13} />} label={conv.pinned ? 'Unpin' : 'Pin'}
                onClick={e => onPin(conv, e)} />
              <div className="my-1" style={{ borderTop: '1px solid var(--border-color)' }} />
              <CtxItem icon={<Trash2 size={13} />} label="Delete"
                onClick={e => onDelete(conv.id, e)} danger />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function CtxItem({
  icon, label, onClick, danger = false,
}: {
  icon: React.ReactNode; label: string
  onClick: (e: React.MouseEvent) => void; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
      style={{ color: danger ? '#f87171' : 'var(--text-secondary)' }}
      onMouseEnter={e => (e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.1)' : 'var(--bg-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {icon}
      {label}
    </button>
  )
}

// ── Date grouping ─────────────────────────────────────────────────────────────

function groupByDate(convs: Conversation[]): ConversationGroup[] {
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yest  = new Date(today); yest.setDate(yest.getDate() - 1)
  const w7    = new Date(today); w7.setDate(w7.getDate() - 7)
  const d30   = new Date(today); d30.setDate(d30.getDate() - 30)

  const buckets: Record<string, Conversation[]> = {
    Today: [], Yesterday: [], 'Previous 7 days': [],
    'Previous 30 days': [], Older: [],
  }

  for (const conv of convs) {
    if (conv.pinned) continue
    const d = new Date(conv.updated_at)
    if      (d >= today) buckets['Today'].push(conv)
    else if (d >= yest)  buckets['Yesterday'].push(conv)
    else if (d >= w7)    buckets['Previous 7 days'].push(conv)
    else if (d >= d30)   buckets['Previous 30 days'].push(conv)
    else                 buckets['Older'].push(conv)
  }

  return Object.entries(buckets)
    .filter(([, c]) => c.length > 0)
    .map(([label, conversations]) => ({ label, conversations }))
}
