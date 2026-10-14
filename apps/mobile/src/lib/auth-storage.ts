/** One key→string slot set in the device keychain (an expo-secure-store service). */
export type SecureKeyStore = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

export type AuthStorage = SecureKeyStore & {
  /** Retry writes that failed earlier; call once the keychain is reachable again. */
  flushPendingWrites: () => Promise<void>;
  /** Move `keys` out of the legacy store now rather than on their first read. */
  migrateLegacy: (keys: readonly string[]) => Promise<void>;
};

type AuthStorageOptions = {
  store: SecureKeyStore;
  /**
   * Where an older build kept these keys. Reads fall back to it, and the value
   * moves into `store` on first sight.
   */
  legacyStore?: SecureKeyStore;
  /** Called with every failed write; the write itself is kept and retried. */
  onWriteError: (error: unknown) => void;
};

/** `null` marks a pending removal. */
type PendingValue = string | null;

/**
 * Convex Auth token storage that never loses a token to a failed keychain
 * write. Refresh tokens are single-use: once the server rotates one, a failed
 * write leaves only the spent token on the device, and presenting it later
 * signs the user out. So a failed write is kept in memory, served to reads, and
 * retried by `flushPendingWrites`.
 */
export function createAuthStorage({
  store,
  legacyStore,
  onWriteError,
}: AuthStorageOptions): AuthStorage {
  const pending = new Map<string, PendingValue>();
  let tail: Promise<unknown> = Promise.resolve();

  // Serializes keychain access so a retried write can't land after (and
  // overwrite) a newer one for the same key.
  function exclusive<T>(operation: () => Promise<T>): Promise<T> {
    const result = tail.then(operation);
    // The caller gets `result` and its rejection; the chain only needs ordering.
    tail = result.catch(() => undefined);
    return result;
  }

  async function write(key: string, value: PendingValue): Promise<boolean> {
    try {
      if (value === null) {
        await store.removeItem(key);
      } else {
        await store.setItem(key, value);
      }
    } catch (error) {
      pending.set(key, value);
      onWriteError(error);
      return false;
    }
    pending.delete(key);
    return true;
  }

  async function migrateKey(
    legacy: SecureKeyStore,
    key: string,
  ): Promise<string | null> {
    const value = await legacy.getItem(key);
    if (value === null) {
      return null;
    }
    // Only drop the legacy copy once the new store holds the value.
    if (await write(key, value)) {
      await legacy.removeItem(key);
    }
    return value;
  }

  async function read(key: string): Promise<string | null> {
    if (pending.has(key)) {
      return pending.get(key) ?? null;
    }
    const value = await store.getItem(key);
    if (value !== null || legacyStore === undefined) {
      return value;
    }
    return migrateKey(legacyStore, key);
  }

  return {
    getItem: (key) => exclusive(() => read(key)),
    setItem: (key, value) =>
      exclusive(async () => {
        await write(key, value);
      }),
    removeItem: (key) =>
      exclusive(async () => {
        await write(key, null);
        // A leftover legacy copy would be migrated back on the next read,
        // restoring a signed-out session.
        await legacyStore?.removeItem(key);
      }),
    flushPendingWrites: () =>
      exclusive(async () => {
        for (const [key, value] of [...pending]) {
          if (!(await write(key, value))) {
            return;
          }
        }
      }),
    migrateLegacy: async (keys) => {
      for (const key of keys) {
        await exclusive(() => read(key));
      }
    },
  };
}

/**
 * The storage keys Convex Auth's React client persists a session under: its
 * key constants suffixed with the alphanumeric part of the storage namespace,
 * which defaults to the deployment URL. Mirrors `useNamespacedStorage` in
 * `@convex-dev/auth/react`. If those names ever change, eager migration finds
 * nothing and reads still migrate lazily.
 */
export function convexAuthSessionKeys(namespace: string): string[] {
  const suffix = namespace.replace(/[^a-zA-Z0-9]/g, "");
  return ["__convexAuthJWT", "__convexAuthRefreshToken"].map(
    (key) => `${key}_${suffix}`,
  );
}

/** iOS reports a protected keychain item read or written while the device is locked this way. */
export function isKeychainLockedError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes("User interaction is not allowed")
  );
}
