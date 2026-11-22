/**
 * editorSync.ts — the decision logic behind LiveEditor's two-way sync, kept
 * free of Vue and Monaco so it can be unit-tested.
 *
 * The editor tracks three things:
 *   - `current`         what the editor shows right now (passed in by the caller)
 *   - `lastSynced`      the last text the editor believes is on disk
 *   - `inflight`        texts of writes we sent that haven't echoed back yet,
 *                       oldest first
 *
 * A write is only *confirmed* once its echo arrives through HMR (`reconcile`
 * returns 'echo') or the dev server reports it failed (`rollbackFailedWrite`).
 * Until then `lastSynced` is advanced optimistically so the editor doesn't
 * keep re-sending the same text, while `previousSynced` remembers how to undo
 * that optimism if the write turns out not to have happened.
 */

export interface SyncState {
  /** The last text the editor believes matches the file on disk. */
  lastSynced: string
  /** Texts of writes sent and not yet echoed back, oldest first. */
  inflight: string[]
  /** `lastSynced` as it was before the oldest inflight write, for rollback on failure. */
  previousSynced: string | null
}

export type Reconciliation =
  /** The disk text is the echo of one of our own writes; nothing to apply. */
  | { kind: 'echo'; dirty: boolean }
  /** Disk equals what the editor shows (identical external write); nothing to apply. */
  | { kind: 'identical' }
  /** The editor has no unsaved edits; apply the disk text in place. */
  | { kind: 'apply' }
  /** Disk changed under unsaved edits; surface a choice. */
  | { kind: 'conflict' }

function synced(disk: string): SyncState {
  return { lastSynced: disk, inflight: [], previousSynced: null }
}

export function initialSyncState(disk: string): SyncState {
  return synced(disk)
}

/** The editor differs from what it believes is on disk. */
export function isDirty(state: SyncState, current: string): boolean {
  return current !== state.lastSynced
}

/**
 * Record a write being sent. Returns the new state; the caller sends `content`.
 * Idempotent for a repeated send of the text already at the head of the queue.
 */
export function markSent(state: SyncState, content: string): SyncState {
  if (state.inflight[state.inflight.length - 1] === content) return state
  return {
    lastSynced: content,
    inflight: [...state.inflight, content],
    // Keep the oldest confirmed text while several writes overlap.
    previousSynced: state.previousSynced ?? state.lastSynced,
  }
}

/**
 * The dev server refused a write (or never answered). Undo the optimistic
 * `lastSynced` so the editor is dirty again, retries, and a later disk change
 * raises the conflict bar instead of overwriting the unsaved text.
 */
export function rollbackFailedWrite(state: SyncState): SyncState {
  if (state.inflight.length === 0) return state
  return synced(state.previousSynced ?? state.lastSynced)
}

/**
 * A new disk text arrived (via HMR). Decide what it means given what the
 * editor currently shows, and return the updated state.
 */
export function reconcile(
  state: SyncState,
  disk: string,
  current: string,
): { state: SyncState; result: Reconciliation } {
  // One of our own writes coming back. Compare against what we *sent*, not
  // against the live editor text: the presenter may have typed more since the
  // save, and that must not be mistaken for someone else changing the file.
  const i = state.inflight.indexOf(disk)
  if (i !== -1) {
    const remaining = state.inflight.slice(i + 1)
    const next: SyncState = remaining.length
      ? // Newer writes are still in flight; the editor's belief about disk is
        // the newest one it sent, so leave lastSynced alone.
        { lastSynced: state.lastSynced, inflight: remaining, previousSynced: disk }
      : synced(disk)
    return { state: next, result: { kind: 'echo', dirty: current !== next.lastSynced } }
  }
  if (disk === current) {
    return { state: synced(disk), result: { kind: 'identical' } }
  }
  if (!isDirty(state, current)) {
    return { state: synced(disk), result: { kind: 'apply' } }
  }
  // Someone else (the agent) changed the file under our unsaved edits. Leave
  // `lastSynced` alone: the editor's text is still measured against what it
  // last agreed with, until the presenter chooses.
  return { state, result: { kind: 'conflict' } }
}

/** The presenter took the disk version during a conflict. */
export function acceptExternal(disk: string): SyncState {
  return synced(disk)
}

/**
 * The presenter chose to keep their text during a conflict. Disk now holds
 * `disk`, so that is what the editor's text must be compared against; without
 * this, undoing back to the pre-conflict text would look "in sync" while the
 * file on disk says otherwise.
 */
export function keepLocal(state: SyncState, disk: string): SyncState {
  return { ...state, lastSynced: disk }
}
