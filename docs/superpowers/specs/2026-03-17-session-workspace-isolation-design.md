# Design: Session/Workspace Isolation

**Date:** 2026-03-17
**Status:** Approved
**Scope:** Frontend only — no backend, no edge functions, no DB changes

---

## Problem

`useActiveWorkflowRun` stores the active session ID under a single global localStorage key (`active_workflow_run_id`), with no awareness of which workspace is active. When the user switches workspace, the previous session ID remains active in memory and in localStorage, causing imports and uploads to be tagged with a session that belongs to a different workspace.

---

## Goal

1. Sessions are always scoped to a workspace — no cross-workspace leakage
2. Switching workspace clears the active session in memory
3. The user must explicitly select or create a session after switching workspace
4. Per-workspace localStorage key is written on session creation, for future evolution
5. No automatic session restoration or creation when switching workspaces

---

## Architecture

### What changes

| File | Change |
|---|---|
| `src/hooks/useActiveWorkflowRun.ts` | Accept `workspaceId` param, derive per-workspace key, `useRef`+`useEffect` reset |
| `src/components/WorkflowRunSelector.tsx` | Pass `activeWorkspace?.id` to hook |
| `src/components/WorkflowSessionBanner.tsx` | Pass `activeWorkspace?.id` to hook |
| `src/components/SessionBadge.tsx` | Pass `activeWorkspace?.id` to hook |
| `src/pages/WooImportPage.tsx` | Pass `activeWorkspace?.id` to hook |
| `src/pages/UploadPage.tsx` | Pass `activeWorkspace?.id` to hook |

### What does NOT change

- `src/hooks/useWorkspaces.tsx` — no coupling between WorkspaceProvider and session logic
- `src/components/SessionRequiredDialog.tsx` — props-based, no hook usage
- All edge functions, DB schema, `types.ts`

---

## Hook Design: `useActiveWorkflowRun(workspaceId?: string)`

### localStorage key strategy

```
active_workflow_run_id_${workspaceId}   // per-workspace key
```

When `workspaceId` is `undefined` (workspace not yet loaded), `lsKey` is `null` and `activeRunId` returns `null` — safe for loading states.

### Initial state (mount only)

```typescript
const lsKey = workspaceId ? `active_workflow_run_id_${workspaceId}` : null;

const [activeRunId, setActiveRunIdState] = useState<string | null>(() =>
  lsKey ? localStorage.getItem(lsKey) : null
);
```

The lazy initializer reads the per-workspace key once on mount. This safely restores the session after a page refresh (user was already in that workspace). It does NOT run again on workspace change.

### Reset on workspace change

```typescript
const prevWorkspaceId = useRef<string | undefined>(undefined);

useEffect(() => {
  if (
    prevWorkspaceId.current !== undefined &&
    prevWorkspaceId.current !== workspaceId
  ) {
    setActiveRunIdState(null);
  }
  prevWorkspaceId.current = workspaceId;
}, [workspaceId]);
```

`useRef` tracks the previous `workspaceId`. The effect only clears the session when a **real workspace change** occurs (not on the first render). No automatic restoration — `null` forces the user to select or create a session manually.

### Workspace change behaviour

| Situation | Result |
|---|---|
| Page refresh in workspace A | Session restored from `active_workflow_run_id_${A}` via `useState` initializer |
| Workspace changes A → B | `activeRunId` set to `null` — always, regardless of what is stored for B |
| `workspaceId` is `undefined` (loading) | `activeRunId` is `null` — safe |
| User creates/selects session in B | Written to `active_workflow_run_id_${B}` — persisted for future use |

### `setActiveRun` and `clearActiveRun`

Both operate on the current `lsKey`. If `lsKey` is `null` (no workspace), they are no-ops.

```typescript
const setActiveRun = useCallback((runId: string) => {
  if (!lsKey) return;
  localStorage.setItem(lsKey, runId);
  setActiveRunIdState(runId);
}, [lsKey]);

const clearActiveRun = useCallback(() => {
  if (!lsKey) return;
  localStorage.removeItem(lsKey);
  setActiveRunIdState(null);
}, [lsKey]);
```

### `createNewSession`

No logic changes. Already receives `workspaceId` as a parameter and calls `setActiveRun` internally, which now writes to the correct per-workspace key.

### Return shape — unchanged

```typescript
return { activeRunId, setActiveRun, clearActiveRun, createNewSession };
```

---

## Call Sites

### Uniform pattern

All consumers call the hook with `activeWorkspace?.id`:

```typescript
const { activeWorkspace } = useWorkspaceContext();
const { activeRunId, ... } = useActiveWorkflowRun(activeWorkspace?.id);
```

All five consumer files already import `useWorkspaceContext` — only the hook call line changes in each.

---

## React Query

No manual invalidation required. All queries gated by `enabled: !!activeRunId` automatically deactivate when `activeRunId` becomes `null` after a workspace change. Stale cache entries from the previous session become inert and are replaced naturally when the user selects a new session.

---

## Out of Scope

- Auto-creating a session when none exists
- Auto-resuming the last session of a workspace
- UI changes beyond what is already in place (WorkflowRunSelector, SessionBadge, WorkflowSessionBanner)
- Backend, edge functions, DB schema

---

## Success Criteria

1. Switching workspace sets `activeRunId` to `null` in all consuming components
2. The import button in `WooImportPage` and process button in `UploadPage` become disabled immediately after workspace switch (no session active)
3. Page refresh in workspace A restores the session that was active before the refresh
4. A session created in workspace B is stored under `active_workflow_run_id_${B}` and not visible when workspace A is active
5. No changes required to `useWorkspaces.tsx` or any backend file
