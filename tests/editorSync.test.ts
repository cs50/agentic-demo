import { describe, expect, it } from 'vitest'
import {
  acceptExternal,
  initialSyncState,
  isDirty,
  keepLocal,
  markSent,
  reconcile,
  rollbackFailedWrite,
  type SyncState,
} from '../demo/mario/editorSync'

const DISK = 'const HEIGHT = 8'
const MINE = 'const HEIGHT = 12'
const THEIRS = 'const HEIGHT = 4'

describe('editorSync', () => {
  it('starts in sync with the disk text', () => {
    const s = initialSyncState(DISK)
    expect(isDirty(s, DISK)).toBe(false)
    expect(isDirty(s, MINE)).toBe(true)
  })

  describe('echo of our own write', () => {
    it('is recognised when the editor is unchanged since the save', () => {
      const sent = markSent(initialSyncState(DISK), MINE)
      const { state, result } = reconcile(sent, MINE, MINE)
      expect(result).toEqual({ kind: 'echo', dirty: false })
      expect(state).toEqual(initialSyncState(MINE))
    })

    it('is NOT a conflict when typing resumed before the echo arrived', () => {
      // type -> pause (autosave fires) -> keep typing -> echo of the first save arrives
      const sent = markSent(initialSyncState(DISK), MINE)
      const typedMore = MINE + ' // tall'
      const { state, result } = reconcile(sent, MINE, typedMore)
      expect(result).toEqual({ kind: 'echo', dirty: true })
      expect(isDirty(state, typedMore)).toBe(true) // the scheduled autosave will write it
      expect(state.inflight).toEqual([])
    })

    it('handles two overlapping writes, echoed in order', () => {
      const a = markSent(initialSyncState(DISK), MINE)
      const b = markSent(a, THEIRS) // Cmd+S with newer text before the first echo
      // The older echo must neither clobber the editor nor raise a conflict.
      const first = reconcile(b, MINE, THEIRS)
      expect(first.result).toEqual({ kind: 'echo', dirty: false })
      expect(first.state.inflight).toEqual([THEIRS])
      const second = reconcile(first.state, THEIRS, THEIRS)
      expect(second.result).toEqual({ kind: 'echo', dirty: false })
      expect(second.state).toEqual(initialSyncState(THEIRS))
    })

    it('a stale echo while a newer write is in flight leaves the editor dirty against the newest text', () => {
      const b = markSent(markSent(initialSyncState(DISK), MINE), THEIRS)
      const typedMore = THEIRS + ' // more'
      const { state, result } = reconcile(b, MINE, typedMore)
      expect(result).toEqual({ kind: 'echo', dirty: true })
      expect(state.lastSynced).toBe(THEIRS)
    })
  })

  describe('external change', () => {
    it('is applied in place when the editor is clean', () => {
      const { state, result } = reconcile(initialSyncState(DISK), THEIRS, DISK)
      expect(result).toEqual({ kind: 'apply' })
      expect(state.lastSynced).toBe(THEIRS)
    })

    it('is a conflict when the editor has unsaved edits', () => {
      const s = initialSyncState(DISK)
      const { state, result } = reconcile(s, THEIRS, MINE)
      expect(result).toEqual({ kind: 'conflict' })
      expect(state).toEqual(s) // nothing decided yet
    })

    it('that happens to equal the editor text is just "identical"', () => {
      const { result } = reconcile(initialSyncState(DISK), MINE, MINE)
      expect(result).toEqual({ kind: 'identical' })
    })
  })

  describe('failed write', () => {
    it('rolls lastSynced back so the editor is dirty again and retries', () => {
      const sent = markSent(initialSyncState(DISK), MINE)
      expect(isDirty(sent, MINE)).toBe(false) // optimistic
      const failed = rollbackFailedWrite(sent)
      expect(isDirty(failed, MINE)).toBe(true) // Cmd+S / autosave will re-send
      expect(failed.inflight).toEqual([])
    })

    it('then an external change raises a conflict instead of overwriting', () => {
      const failed = rollbackFailedWrite(markSent(initialSyncState(DISK), MINE))
      const { result } = reconcile(failed, THEIRS, MINE)
      expect(result).toEqual({ kind: 'conflict' })
    })

    it('rolls back to the oldest confirmed text when several writes were in flight', () => {
      const a = markSent(initialSyncState(DISK), MINE)
      const b = markSent(a, THEIRS)
      expect(rollbackFailedWrite(b).lastSynced).toBe(DISK)
    })

    it('is a no-op when nothing is in flight', () => {
      const s = initialSyncState(DISK)
      expect(rollbackFailedWrite(s)).toEqual(s)
    })
  })

  describe('resolving a conflict', () => {
    const conflicted: SyncState = initialSyncState(DISK) // editor shows MINE, disk now THEIRS

    it('"Load the file" takes the disk text', () => {
      const s = acceptExternal(THEIRS)
      expect(isDirty(s, THEIRS)).toBe(false)
    })

    it('"Keep mine" measures the editor against what is on disk now', () => {
      const s = keepLocal(conflicted, THEIRS)
      expect(isDirty(s, MINE)).toBe(true) // so save() writes it
    })

    it('"Keep mine" after undoing to the pre-conflict text still writes', () => {
      // Presenter pressed Cmd+Z back to DISK while the bar was up. Disk holds THEIRS,
      // so DISK is different from disk and must be written, not reported "in sync".
      const s = keepLocal(conflicted, THEIRS)
      expect(isDirty(s, DISK)).toBe(true)
    })
  })

  it('markSent is idempotent for the same text', () => {
    const a = markSent(initialSyncState(DISK), MINE)
    expect(markSent(a, MINE)).toBe(a)
  })
})
