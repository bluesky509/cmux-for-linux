# Bug Fix: Window Reset Session Loss

## Problem
Opening a new Tauri window resets all existing terminals to `~`, losing their sessions. Each window gets its own React app + Zustand store, and the second window's `useWorkspacePersist` overwrites Window 1's data.

## Root Cause
`useWorkspacePersist` sees `workspaces.length <= 1` (bootstrap state), rebuilds all workspaces from saved JSON, creates new PTY sessions at `~`, then saves that state globally — overwriting Window 1's active sessions.

## Fix: Leader Election
- Added `bootstrapped: AtomicBool` to `AppState` in `lib.rs`
- Added `claim_leader()` Tauri command — first caller wins, returns `true`; subsequent callers get `false`
- Added `get_window_count()` Tauri command for future use
- `useWorkspacePersist` calls `claim_leader()` on mount:
  - Leader: loads persistent data, bootstraps workspaces, owns save subscription
  - Follower: skips bootstrap entirely, mounts with minimal local state
- Save logic only runs from leader window (guarded by `isLeader` ref)

## Files Modified
- `src-tauri/src/lib.rs` — AtomicBool in AppState
- `src-tauri/src/commands/window.rs` — New file with claim_leader and get_window_count
- `src-tauri/src/commands/mod.rs` — Added window module
- `src/lib/ipc.ts` — claimLeader() and getWindowCount() wrappers
- `src/hooks/useWorkspacePersist.ts` — Leader-aware bootstrap and save logic

## Follow-up: leader election alone doesn't cover the real trigger
`bootstrapped: AtomicBool` lives in per-process `AppState`. Nothing in this
app ever creates a second `WebviewWindow` inside one process — the app has
exactly one window (`tauri.conf.json`) and no window-creation code. So the
realistic way users hit this bug is launching the app a second time (icon
double-click, running the binary again), which starts an entirely separate
OS process with its own independent `AppState` and its own `bootstrapped =
false`. That second process also wins "leadership" and both processes race
to read/write `data.json` — reproducing the original bug regardless of the
election logic.

Fixed by adding `tauri-plugin-single-instance`, registered first in the
builder chain, so a second launch attempt focuses the existing window
instead of starting a second process. This makes the leader-election code
meaningful (it now only ever runs within one process).

## Acceptance Criteria
- [x] Open ptrterminal, create workspaces, cd to various dirs
- [x] Launch the app a second time — existing window is focused, no second process/window is created
- [x] Persisted state (workspaces, CWDs) survives relaunch after quitting fully
