'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Search, Code2, FileText, CheckCircle, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { ToolCall } from '@/lib/types'

interface ToolStatusCardProps {
  tool: ToolCall
}

const TOOL_META: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  web_search: {
    icon: <Search size={13} />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
  },
  code_interpreter: {
    icon: <Code2 size={13} />,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10 border-violet-500/20',
  },
  read_file: {
    icon: <FileText size={13} />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
  },
}

export default function ToolStatusCard({ tool }: ToolStatusCardProps) {
  const [expanded, setExpanded] = useState(false)
  const meta = TOOL_META[tool.name] ?? {
    icon: <Code2 size={13} />,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/10 border-zinc-500/20',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`inline-flex flex-col rounded-lg border px-3 py-2 text-xs my-1 ${meta.bgColor}`}
    >
      {/* Header row */}
      <div className="flex items-center gap-2">
        <span className={meta.color}>{meta.icon}</span>
        <span className="text-white/70 font-medium">{tool.label}</span>
        {tool.status === 'running' && (
          <span className="flex gap-0.5">
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                className={`w-1 h-1 rounded-full ${meta.color.replace('text-', 'bg-')}`}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </span>
        )}
        {tool.status === 'done' && (
          <CheckCircle size={12} className="text-emerald-400" />
        )}
        {tool.status === 'error' && (
          <AlertCircle size={12} className="text-red-400" />
        )}
        {tool.result && tool.status === 'done' && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-auto text-white/30 hover:text-white/60 transition-colors"
          >
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        )}
      </div>

      {/* Expandable result */}
      <AnimatePresence>
        {expanded && tool.result && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="mt-2 pt-2 border-t border-white/10 text-white/50 text-xs font-mono leading-relaxed max-h-40 overflow-y-auto">
              {tool.result.slice(0, 800)}
              {tool.result.length > 800 && '...'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
