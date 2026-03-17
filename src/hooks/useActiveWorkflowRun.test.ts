// src/hooks/useActiveWorkflowRun.test.ts
import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useActiveWorkflowRun } from "./useActiveWorkflowRun";

// Mock supabase — createNewSession calls it; we only test state side-effects
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      insert: () => ({
        select: () => ({
          single: async () => ({ data: { id: "run-abc" }, error: null }),
        }),
      }),
    }),
  },
}));

describe("useActiveWorkflowRun", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no workspaceId is provided", () => {
    const { result } = renderHook(() => useActiveWorkflowRun(undefined));
    expect(result.current.activeRunId).toBeNull();
  });

  it("returns null when workspaceId provided but no entry in localStorage", () => {
    const { result } = renderHook(() => useActiveWorkflowRun("ws-1"));
    expect(result.current.activeRunId).toBeNull();
  });

  it("restores from per-workspace key on mount", () => {
    localStorage.setItem("active_workflow_run_id_ws-1", "run-123");
    const { result } = renderHook(() => useActiveWorkflowRun("ws-1"));
    expect(result.current.activeRunId).toBe("run-123");
  });

  it("does NOT read from a different workspace key", () => {
    localStorage.setItem("active_workflow_run_id_ws-2", "run-xyz");
    const { result } = renderHook(() => useActiveWorkflowRun("ws-1"));
    expect(result.current.activeRunId).toBeNull();
  });

  it("does NOT restore from old global key", () => {
    localStorage.setItem("active_workflow_run_id", "run-old");
    const { result } = renderHook(() => useActiveWorkflowRun("ws-1"));
    expect(result.current.activeRunId).toBeNull();
  });

  it("clears activeRunId when workspaceId changes", () => {
    localStorage.setItem("active_workflow_run_id_ws-1", "run-123");
    const { result, rerender } = renderHook(
      ({ wsId }) => useActiveWorkflowRun(wsId),
      { initialProps: { wsId: "ws-1" } }
    );
    expect(result.current.activeRunId).toBe("run-123");

    rerender({ wsId: "ws-2" });
    expect(result.current.activeRunId).toBeNull();
  });

  it("does NOT clear on first render (mount)", () => {
    localStorage.setItem("active_workflow_run_id_ws-1", "run-123");
    const { result } = renderHook(() => useActiveWorkflowRun("ws-1"));
    // After mount, session should still be present
    expect(result.current.activeRunId).toBe("run-123");
  });

  it("setActiveRun writes to per-workspace key and updates state", () => {
    const { result } = renderHook(() => useActiveWorkflowRun("ws-1"));
    act(() => { result.current.setActiveRun("run-999"); });
    expect(result.current.activeRunId).toBe("run-999");
    expect(localStorage.getItem("active_workflow_run_id_ws-1")).toBe("run-999");
  });

  it("clearActiveRun removes per-workspace key and sets state to null", () => {
    localStorage.setItem("active_workflow_run_id_ws-1", "run-123");
    const { result } = renderHook(() => useActiveWorkflowRun("ws-1"));
    act(() => { result.current.clearActiveRun(); });
    expect(result.current.activeRunId).toBeNull();
    expect(localStorage.getItem("active_workflow_run_id_ws-1")).toBeNull();
  });

  it("setActiveRun is a no-op when workspaceId is undefined", () => {
    const { result } = renderHook(() => useActiveWorkflowRun(undefined));
    act(() => { result.current.setActiveRun("run-999"); });
    expect(result.current.activeRunId).toBeNull();
    expect(localStorage.getItem("active_workflow_run_id_undefined")).toBeNull();
  });

  it("does NOT restore previous workspace session after switching back (no auto-resume)", () => {
    localStorage.setItem("active_workflow_run_id_ws-1", "run-123");
    const { result, rerender } = renderHook(
      ({ wsId }) => useActiveWorkflowRun(wsId),
      { initialProps: { wsId: "ws-1" } }
    );
    // Switch away
    rerender({ wsId: "ws-2" });
    expect(result.current.activeRunId).toBeNull();

    // Switch back — still null, no auto-resume
    rerender({ wsId: "ws-1" });
    expect(result.current.activeRunId).toBeNull();
  });
});
