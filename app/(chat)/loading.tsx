export default function ChatLoading() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-glow animate-pulse">
          <span className="text-white text-lg font-bold">P</span>
        </div>
        <div className="flex gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 breathing-dot" />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 breathing-dot" />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 breathing-dot" />
        </div>
      </div>
    </div>
  )
}
