'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getLivingSyllabus } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import { Skeleton } from '@/components/ui/Skeleton'

interface SyllabusNode {
  id: string
  label: string
  mastery: number
  children?: SyllabusNode[]
}

function TreeLeaf({ node, depth = 0 }: { node: SyllabusNode; depth?: number }) {
  const mastery = node.mastery ?? 0
  const color = mastery > 75 ? '#22c55e' : mastery > 40 ? '#f59e0b' : '#6366f1'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: depth * 0.05 }}
      className="ml-4"
    >
      <div className="flex items-center gap-2 py-1.5">
        <div className="flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 1 C4 1 1 5 1 8 C1 12 4 15 8 15 C12 15 15 12 15 8 C15 5 12 1 8 1Z" fill={color} opacity={0.2} />
            <path d="M8 3 C5 3 3 5.5 3 8 C3 11 5 13 8 13 C11 13 13 11 13 8 C13 5.5 11 3 8 3Z" fill={color} opacity={0.6} />
          </svg>
        </div>
        <span className="text-xs text-[var(--text-secondary)]">{node.label}</span>
        <div className="flex-1 h-0.5 rounded-full bg-white/5 ml-1">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${mastery}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-xs font-medium" style={{ color }}>{mastery}%</span>
      </div>
      {node.children?.map((child) => (
        <TreeLeaf key={child.id} node={child} depth={depth + 1} />
      ))}
    </motion.div>
  )
}

export function LivingSyllabus() {
  const { sessionId } = useSessionStore()
  const [tree, setTree] = useState<SyllabusNode[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getLivingSyllabus(sessionId)
      .then((d) => setTree(((d as Record<string, unknown>)?.tree as SyllabusNode[] | undefined) ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sessionId])

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h2 className="text-display-sm text-[var(--text-primary)]">Living Syllabus</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Knowledge tree that grows and colours with your mastery</p>
      </div>

      <div className="glass-elevated rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex gap-2 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Mastered</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Learning</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />New</span>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="w-full h-7 rounded-lg" />)}
          </div>
        ) : tree.length > 0 ? (
          <div>
            {tree.map((node) => <TreeLeaf key={node.id} node={node} />)}
          </div>
        ) : (
          <p className="text-xs text-[var(--text-muted)] text-center py-4">
            Your knowledge tree grows with each conversation
          </p>
        )}
      </div>
    </div>
  )
}
