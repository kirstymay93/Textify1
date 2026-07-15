import { renderHook, act } from "@testing-library/react";
import { useProjectHistory } from "@/hooks/useProjectHistory";

describe("useProjectHistory", () => {
  it("initializes with empty history", () => {
    const { result } = renderHook(() => useProjectHistory());
    expect(result.current.history).toEqual([]);
  });

  it("adds a snapshot to history", () => {
    const { result } = renderHook(() => useProjectHistory());

    act(() => {
      result.current.addSnapshot("Edit 1", "data:image/png;base64,iVBORw0KGgo=");
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].name).toBe("Edit 1");
  });

  it("adds multiple snapshots in reverse chronological order", () => {
    const { result } = renderHook(() => useProjectHistory());

    act(() => {
      result.current.addSnapshot("Edit 1");
      result.current.addSnapshot("Edit 2");
      result.current.addSnapshot("Edit 3");
    });

    expect(result.current.history).toHaveLength(3);
    expect(result.current.history[0].name).toBe("Edit 3");
    expect(result.current.history[1].name).toBe("Edit 2");
    expect(result.current.history[2].name).toBe("Edit 1");
  });

  it("retrieves a snapshot by id", () => {
    const { result } = renderHook(() => useProjectHistory());

    let snapshotId: string;

    act(() => {
      result.current.addSnapshot("Edit 1", "thumbnail1");
      snapshotId = result.current.history[0].id;
    });

    const snapshot = result.current.getSnapshot(snapshotId!);
    expect(snapshot).toBeDefined();
    expect(snapshot?.name).toBe("Edit 1");
    expect(snapshot?.thumbnail).toBe("thumbnail1");
  });

  it("returns undefined for non-existent snapshot id", () => {
    const { result } = renderHook(() => useProjectHistory());

    const snapshot = result.current.getSnapshot("non-existent-id");
    expect(snapshot).toBeUndefined();
  });

  it("clears all history", () => {
    const { result } = renderHook(() => useProjectHistory());

    act(() => {
      result.current.addSnapshot("Edit 1");
      result.current.addSnapshot("Edit 2");
      result.current.clearHistory();
    });

    expect(result.current.history).toEqual([]);
  });

  it("limits history to 50 snapshots", () => {
    const { result } = renderHook(() => useProjectHistory());

    act(() => {
      for (let i = 0; i < 60; i++) {
        result.current.addSnapshot(`Edit ${i}`);
      }
    });

    expect(result.current.history).toHaveLength(50);
    expect(result.current.history[0].name).toBe("Edit 59");
    expect(result.current.history[49].name).toBe("Edit 10");
  });

  it("assigns unique ids to snapshots", () => {
    const { result } = renderHook(() => useProjectHistory());

    act(() => {
      result.current.addSnapshot("Edit 1");
      result.current.addSnapshot("Edit 2");
    });

    const id1 = result.current.history[1].id;
    const id2 = result.current.history[0].id;

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^snapshot-\d+$/);
    expect(id2).toMatch(/^snapshot-\d+$/);
  });

  it("records timestamp for each snapshot", () => {
    const { result } = renderHook(() => useProjectHistory());

    const beforeTime = Date.now();

    act(() => {
      result.current.addSnapshot("Edit 1");
    });

    const afterTime = Date.now();

    expect(result.current.history[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
    expect(result.current.history[0].timestamp).toBeLessThanOrEqual(afterTime);
  });

  it("preserves thumbnail data", () => {
    const { result } = renderHook(() => useProjectHistory());

    const thumbnail = "data:image/png;base64,iVBORw0KGgo=";

    act(() => {
      result.current.addSnapshot("Edit 1", thumbnail);
    });

    expect(result.current.history[0].thumbnail).toBe(thumbnail);
  });
});
