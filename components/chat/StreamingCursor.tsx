'use client'

import { motion } from 'framer-motion'

export function StreamingCursor() {
  return (
    <motion.span
      className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 align-middle rounded-full"
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
    />
  )
}
