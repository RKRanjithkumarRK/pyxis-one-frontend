import { openDB, type IDBPDatabase } from 'idb'
import type { Message, Session } from './types'

const DB_NAME = 'pyxis-one'
const DB_VERSION = 1

interface PyxisDB {
  sessions: {
    key: string
    value: Session
  }
  messages: {
    key: string
    value: Message & { sessionId: string }
    indexes: { 'by-session': string }
  }
  drafts: {
    key: string
    value: { sessionId: string; content: string; updatedAt: number }
  }
}

let dbPromise: Promise<IDBPDatabase<PyxisDB>> | null = null

function getDB(): Promise<IDBPDatabase<PyxisDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PyxisDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('messages')) {
          const msgStore = db.createObjectStore('messages', { keyPath: 'id' })
          msgStore.createIndex('by-session', 'sessionId')
        }
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts', { keyPath: 'sessionId' })
        }
      },
    })
  }
  return dbPromise
}

// ── Sessions ──────────────────────────────────────────────────────────────

export async function saveSession(session: Session): Promise<void> {
  const db = await getDB()
  await db.put('sessions', session)
}

export async function getSession(id: string): Promise<Session | undefined> {
  const db = await getDB()
  return db.get('sessions', id)
}

export async function getAllSessions(): Promise<Session[]> {
  const db = await getDB()
  return db.getAll('sessions')
}

// ── Messages ──────────────────────────────────────────────────────────────

export async function saveMessage(sessionId: string, message: Message): Promise<void> {
  const db = await getDB()
  await db.put('messages', { ...message, sessionId })
}

export async function getSessionMessages(sessionId: string): Promise<Message[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('messages', 'by-session', sessionId)
  return all.map(({ sessionId: _sid, ...msg }) => msg as Message)
}

export async function clearSessionMessages(sessionId: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('messages', 'readwrite')
  const index = tx.store.index('by-session')
  const keys = await index.getAllKeys(sessionId)
  await Promise.all(keys.map((k) => tx.store.delete(k)))
  await tx.done
}

// ── Drafts ────────────────────────────────────────────────────────────────

export async function saveDraft(sessionId: string, content: string): Promise<void> {
  const db = await getDB()
  await db.put('drafts', { sessionId, content, updatedAt: Date.now() })
}

export async function getDraft(sessionId: string): Promise<string> {
  const db = await getDB()
  const draft = await db.get('drafts', sessionId)
  return draft?.content ?? ''
}

export async function clearDraft(sessionId: string): Promise<void> {
  const db = await getDB()
  await db.delete('drafts', sessionId)
}
