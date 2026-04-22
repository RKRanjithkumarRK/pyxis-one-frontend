'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Image, Code, File } from 'lucide-react'
import type { FileAttachment } from '@/lib/types'
import { cn } from '@/lib/utils'

interface FileUploadPreviewProps {
  files: FileAttachment[]
  onRemove: (fileId: string) => void
}

const EXT_ICONS: Record<string, React.ReactNode> = {
  '.pdf':  <FileText size={14} />,
  '.png':  <Image size={14} />,
  '.jpg':  <Image size={14} />,
  '.jpeg': <Image size={14} />,
  '.gif':  <Image size={14} />,
  '.webp': <Image size={14} />,
  '.py':   <Code size={14} />,
  '.js':   <Code size={14} />,
  '.ts':   <Code size={14} />,
  '.tsx':  <Code size={14} />,
  '.jsx':  <Code size={14} />,
}

const EXT_COLORS: Record<string, string> = {
  '.pdf':  'text-red-400 bg-red-500/10 border-red-500/20',
  '.png':  'text-violet-400 bg-violet-500/10 border-violet-500/20',
  '.jpg':  'text-violet-400 bg-violet-500/10 border-violet-500/20',
  '.jpeg': 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  '.py':   'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  '.js':   'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  '.ts':   'text-blue-400 bg-blue-500/10 border-blue-500/20',
  '.tsx':  'text-blue-400 bg-blue-500/10 border-blue-500/20',
}

export default function FileUploadPreview({ files, onRemove }: FileUploadPreviewProps) {
  if (files.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2">
      <AnimatePresence mode="popLayout">
        {files.map((file) => {
          const ext = file.extension.toLowerCase()
          const icon = EXT_ICONS[ext] ?? <File size={14} />
          const colorClass = EXT_COLORS[ext] ?? 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'

          return (
            <motion.div
              key={file.file_id}
              layout
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'group flex items-center gap-2 rounded-lg border px-2.5 py-1.5 max-w-[200px]',
                colorClass
              )}
            >
              <span className="shrink-0">{icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{file.filename}</p>
                <p className="text-xs opacity-60">
                  {file.file_size}
                  {file.page_count ? ` · ${file.page_count}p` : ''}
                  {file.truncated ? ' · truncated' : ''}
                </p>
              </div>
              <button
                onClick={() => onRemove(file.file_id)}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-white/10"
              >
                <X size={11} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
