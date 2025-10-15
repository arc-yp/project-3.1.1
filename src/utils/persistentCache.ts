// Lightweight persistent cache built on top of localStorage with TTL and simple LRU cleanup
// Safe to use in browser only. No external dependencies.

type JsonValue = unknown;

interface PersistentEntry<T = JsonValue> {
  value: T;
  createdAt: number; // epoch ms
  expiresAt: number; // epoch ms
  lastAccess: number; // epoch ms
}

interface IndexRecord {
  key: string;
  expiresAt: number;
  lastAccess: number;
}

const INDEX_KEY = "__pcache:index";

// Default maximum number of entries per namespace to keep persistent cache bounded
const DEFAULT_MAX_ENTRIES = 500;

// Helpers
const now = () => Date.now();

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn("persistentCache: read error", e);
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn("persistentCache: write error", e);
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn("persistentCache: remove error", e);
  }
}

function readIndex(): IndexRecord[] {
  const raw = safeGet(INDEX_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as IndexRecord[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeIndex(index: IndexRecord[]): void {
  safeSet(INDEX_KEY, JSON.stringify(index));
}

function updateIndex(record: IndexRecord): void {
  const index = readIndex();
  const i = index.findIndex((r) => r.key === record.key);
  if (i >= 0) {
    index[i] = record;
  } else {
    index.push(record);
  }
  writeIndex(index);
}

function removeFromIndex(key: string): void {
  const index = readIndex().filter((r) => r.key !== key);
  writeIndex(index);
}

function cleanupExpiredAndOverflow(
  namespacePrefix: string,
  maxEntries: number
) {
  const index = readIndex();
  const n = now();

  // Remove expired and missing entries
  const filtered = index.filter((r) => {
    if (!r.key.startsWith(namespacePrefix)) return true; // keep records from other namespaces
    const expired = r.expiresAt <= n;
    if (expired) {
      safeRemove(r.key);
      return false;
    }
    // If payload missing, drop
    if (!safeGet(r.key)) return false;
    return true;
  });

  // Enforce max per namespace using lastAccess ascending (evict least recently used)
  const nsRecords = filtered.filter((r) => r.key.startsWith(namespacePrefix));
  if (nsRecords.length > maxEntries) {
    const toEvict = nsRecords
      .sort((a, b) => a.lastAccess - b.lastAccess)
      .slice(0, nsRecords.length - maxEntries);
    for (const rec of toEvict) {
      safeRemove(rec.key);
    }
    const evictSet = new Set(toEvict.map((r) => r.key));
    writeIndex(filtered.filter((r) => !evictSet.has(r.key)));
  } else if (filtered.length !== index.length) {
    writeIndex(filtered);
  }
}

export const persistentCache = {
  // Get an item, returns null if missing or expired
  getItem<T = JsonValue>(key: string): T | null {
    const raw = safeGet(key);
    if (!raw) return null;
    try {
      const entry = JSON.parse(raw) as PersistentEntry<T>;
      if (entry.expiresAt <= now()) {
        safeRemove(key);
        removeFromIndex(key);
        return null;
      }
      // Touch lastAccess and persist lazily (non-blocking best-effort)
      entry.lastAccess = now();
      safeSet(key, JSON.stringify(entry));
      updateIndex({
        key,
        expiresAt: entry.expiresAt,
        lastAccess: entry.lastAccess,
      });
      return entry.value;
    } catch {
      return null;
    }
  },

  // Set an item with ttlMs (time to live in ms)
  setItem<T = JsonValue>(
    key: string,
    value: T,
    ttlMs: number,
    options?: { namespacePrefix?: string; maxEntries?: number }
  ): void {
    const createdAt = now();
    const expiresAt = createdAt + Math.max(0, ttlMs);
    const entry: PersistentEntry<T> = {
      value,
      createdAt,
      expiresAt,
      lastAccess: createdAt,
    };
    safeSet(key, JSON.stringify(entry));
    updateIndex({ key, expiresAt, lastAccess: createdAt });

    const ns = options?.namespacePrefix;
    const cap = options?.maxEntries ?? DEFAULT_MAX_ENTRIES;
    if (ns) {
      cleanupExpiredAndOverflow(ns, cap);
    }
  },

  removeItem(key: string): void {
    safeRemove(key);
    removeFromIndex(key);
  },

  // Clear all keys for a namespace prefix
  clearNamespace(namespacePrefix: string): void {
    const index = readIndex();
    const remain: IndexRecord[] = [];
    for (const rec of index) {
      if (rec.key.startsWith(namespacePrefix)) {
        safeRemove(rec.key);
      } else {
        remain.push(rec);
      }
    }
    writeIndex(remain);
  },

  // Maintenance: remove all expired entries across all namespaces
  sweep(): void {
    const index = readIndex();
    const n = now();
    const remain: IndexRecord[] = [];
    for (const rec of index) {
      if (rec.expiresAt <= n) {
        safeRemove(rec.key);
      } else if (!safeGet(rec.key)) {
        // payload missing
      } else {
        remain.push(rec);
      }
    }
    writeIndex(remain);
  },
};

export type { PersistentEntry };
