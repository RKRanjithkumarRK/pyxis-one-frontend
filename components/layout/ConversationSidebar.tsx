'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Pin, Trash2, Edit2, Check, X, MessageSquare, ChevronRight } from 'lucide-react'
import {
  listConversations,
  deleteConversation,
  updateConversation,
  searchConversations,
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
  className = '',
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [groups, setGroups] = useState<ConversationGroup[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Conversation[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  // Load conversations
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
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [sessionId, offset, conversations])

  useEffect(() => {
    loadConversations(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  // Search debounce
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const data = await searchConversations(sessionId, searchQuery.trim())
        setSearchResults(data.results)
      } catch { setSearchResults([]) }
    }, 300)
  }, [searchQuery, sessionId])

  // Auto-focus edit input
  useEffect(() => {
    if (editingId) editInputRef.current?.focus()
  }, [editingId])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpenId(null)
    try {
      await deleteConversation(id)
      setConversations(prev => prev.filter(c => c.id !== id))
      setGroups(prev => prev.map(g => ({
        ...g,
        conversations: g.conversations.filter(c => c.id !== id),
      })).filter(g => g.conversations.length > 0))
    } catch { /* silent */ }
  }

  const handlePin = async (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpenId(null)
    try {
      const updated = await updateConversation(conv.id, { pinned: !conv.pinned })
      setConversations(prev => prev.map(c => c.id === updated.id ? updated : c))
      setGroups(groupByDate(conversations.map(c => c.id === updated.id ? updated : c)))
    } catch { /* silent */ }
  }

  const startEdit = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpenId(null)
    setEditingId(conv.id)
    setEditTitle(conv.title ?? '')
  }

  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) { setEditingId(null); return }
    try {
      const updated = await updateConversation(id, { title: editTitle.trim() })
      setConversations(prev => prev.map(c => c.id === updated.id ? updated : c))
      setGroups(groupByDate(conversations.map(c => c.id === updated.id ? updated : c)))
    } catch { /* silent */ }
    setEditingId(null)
  }

  const displayList = searchResults ?? (conversations.filter(c => c.pinned).concat(conversations.filter(c => !c.pinned)))

  return (
    <aside className={`flex flex-col h-full bg-black/20 backdrop-blur border-r border-white/5 ${className}`}>
      {/* New chat */}
      <div className="p-3 border-b border-white/5">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium text-white/80 hover:text-white"
        >
          <Plus size={16} />
          New conversation
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-white/50">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/30 outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 py-2">
        {loading && conversations.length === 0 ? (
          <div className="space-y-2 px-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : searchResults !== null ? (
          // Search results
          <div>
            <p className="px-4 py-1 text-xs text-white/30">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </p>
            {searchResults.map(conv => (
              <ConvItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === activeConversationId}
                isEditing={editingId === conv.id}
                editTitle={editTitle}
                editInputRef={editInputRef}
                menuOpen={menuOpenId === conv.id}
                onSelect={onSelectConversation}
                onMenuToggle={(id) => setMenuOpenId(prev => prev === id ? null : id)}
                onEdit={startEdit}
                onDelete={handleDelete}
                onPin={handlePin}
                onSaveEdit={saveEdit}
                onCancelEdit={() => setEditingId(null)}
                onEditTitleChange={setEditTitle}
              />
            ))}
          </div>
        ) : (
          // Grouped list
          <>
            {/* Pinned */}
            {conversations.filter(c => c.pinned).length > 0 && (
              <div>
                <SectionLabel label="Pinned" />
                {conversations.filter(c => c.pinned).map(conv => (
                  <ConvItem key={conv.id} conv={conv} isActive={conv.id === activeConversationId}
                    isEditing={editingId === conv.id} editTitle={editTitle}
                    editInputRef={editInputRef} menuOpen={menuOpenId === conv.id}
                    onSelect={onSelectConversation} onMenuToggle={(id) => setMenuOpenId(prev => prev === id ? null : id)}
                    onEdit={startEdit} onDelete={handleDelete} onPin={handlePin}
                    onSaveEdit={saveEdit} onCancelEdit={() => setEditingId(null)} onEditTitleChange={setEditTitle}
                  />
                ))}
              </div>
            )}
            {/* Grouped by date */}
            {groups.map(group => (
              <div key={group.label}>
                <SectionLabel label={group.label} />
                {group.conversations.map(conv => (
                  <ConvItem key={conv.id} conv={conv} isActive={conv.id === activeConversationId}
                    isEditing={editingId === conv.id} editTitle={editTitle}
                    editInputRef={editInputRef} menuOpen={menuOpenId === conv.id}
                    onSelect={onSelectConversation} onMenuToggle={(id) => setMenuOpenId(prev => prev === id ? null : id)}
                    onEdit={startEdit} onDelete={handleDelete} onPin={handlePin}
                    onSaveEdit={saveEdit} onCancelEdit={() => setEditingId(null)} onEditTitleChange={setEditTitle}
                  />
                ))}
              </div>
            ))}
            {hasMore && (
              <button
                onClick={() => loadConversations(false)}
                className="w-full py-2 text-xs text-white/40 hover:text-white/60 transition-colors"
              >
                Load more
              </button>
            )}
          </>
        )}
      </div>
    </aside>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-4 pt-3 pb-1 text-xs font-medium text-white/30 uppercase tracking-wider">
      {label}
    </p>
  )
}

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
        className={`
          w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors
          ${isActive
            ? 'bg-white/10 text-white'
            : 'text-white/60 hover:bg-white/5 hover:text-white/90'
          }
        `}
      >
        <MessageSquare size={14} className="shrink-0 opacity-50" />

        {isEditing ? (
          <input
            ref={editInputRef}
            value={editTitle}
            onChange={e => onEditTitleChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') onSaveEdit(conv.id)
              if (e.key === 'Escape') onCancelEdit()
            }}
            onClick={e => e.stopPropagation()}
            className="flex-1 bg-transparent outline-none border-b border-white/30 text-white text-sm"
          />
        ) : (
          <span className="flex-1 truncate">
            {conv.title ?? 'New conversation'}
          </span>
        )}

        {conv.pinned && !isEditing && (
          <Pin size={10} className="shrink-0 opacity-40" />
        )}

        {isEditing ? (
          <div className="flex gap-1 shrink-0">
            <button onClick={e => { e.stopPropagation(); onSaveEdit(conv.id) }}
              className="p-0.5 rounded text-emerald-400 hover:text-emerald-300">
              <Check size={12} />
            </button>
            <button onClick={e => { e.stopPropagation(); onCancelEdit() }}
              className="p-0.5 rounded text-red-400 hover:text-red-300">
              <X size={12} />
            </button>
          </div>
        ) : (
          // Context menu trigger (show on hover)
          <button
            onClick={e => { e.stopPropagation(); onMenuToggle(conv.id) }}
            className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10 transition-opacity"
          >
            <ChevronRight size={12} className="rotate-90" />
          </button>
        )}
      </button>

      {/* Context menu */}
      <AnimatePresence>
        {menuOpen && !isEditing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute right-2 top-9 z-50 w-40 rounded-lg bg-zinc-900 border border-white/10 shadow-xl py-1"
          >
            <ContextMenuItem
              icon={<Edit2 size={12} />}
              label="Rename"
              onClick={e => onEdit(conv, e)}
            />
            <ContextMenuItem
              icon={<Pin size={12} />}
              label={conv.pinned ? 'Unpin' : 'Pin'}
              onClick={e => onPin(conv, e)}
            />
            <div className="border-t border-white/10 my-1" />
            <ContextMenuItem
              icon={<Trash2 size={12} />}
              label="Delete"
              onClick={e => onDelete(conv.id, e)}
              danger
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ContextMenuItem({
  icon, label, onClick, danger = false,
}: {
  icon: React.ReactNode
  label: string
  onClick: (e: React.MouseEvent) => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors
        ${danger ? 'text-red-400 hover:bg-red-500/10' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
    >
      {icon}
      {label}
    </button>
  )
}

// ── Date grouping ──────────────────────────────────────────────────────────────

function groupByDate(conversations: Conversation[]): ConversationGroup[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  const last7 = new Date(today); last7.setDate(last7.getDate() - 7)
  const last30 = new Date(today); last30.setDate(last30.getDate() - 30)

  const groups: Record<string, Conversation[]> = {
    Today: [],
    Yesterday: [],
    'Last 7 Days': [],
    'Last 30 Days': [],
    Older: [],
  }

  for (const conv of conversations) {
    if (conv.pinned) continue  // pinned shown separately
    const d = new Date(conv.updated_at)
    if (d >= today) groups['Today'].push(conv)
    else if (d >= yesterday) groups['Yesterday'].push(conv)
    else if (d >= last7) groups['Last 7 Days'].push(conv)
    else if (d >= last30) groups['Last 30 Days'].push(conv)
    else groups['Older'].push(conv)
  }

  return Object.entries(groups)
    .filter(([, convs]) => convs.length > 0)
    .map(([label, convs]) => ({ label, conversations: convs }))
}
