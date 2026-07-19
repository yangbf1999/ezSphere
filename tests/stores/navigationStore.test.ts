import { describe, it, expect, beforeEach, vi } from "vitest";

describe("navigationStore", () => {
  let useNavigationStore: typeof import("@/stores/navigationStore")["useNavigationStore"];

  beforeEach(async () => {
    vi.resetModules();
    ({ useNavigationStore } = await import("@/stores/navigationStore"));
  });

  it("has correct initial state", () => {
    const state = useNavigationStore.getState();

    expect(state.activePage).toBe("mother");
    expect(state.motherPrefill).toBeUndefined();
    expect(state.motherNewMessage).toBe(false);
    expect(state.agentRunning).toBe(false);
    expect(state.sshServersVersion).toBe(0);
  });

  it("goToMother sets activePage to mother and stores prefill", () => {
    const state = useNavigationStore.getState();

    state.goToMother("hello world");

    const updated = useNavigationStore.getState();
    expect(updated.activePage).toBe("mother");
    expect(updated.motherPrefill).toBe("hello world");
  });

  it("goToMother without prefill sets motherPrefill to undefined", () => {
    const state = useNavigationStore.getState();
    state.goToMother("temp");

    state.goToMother();

    const updated = useNavigationStore.getState();
    expect(updated.activePage).toBe("mother");
    expect(updated.motherPrefill).toBeUndefined();
  });

  it("goToInstall sets activePage to install and stores prefill", () => {
    const state = useNavigationStore.getState();

    state.goToInstall("install me");

    const updated = useNavigationStore.getState();
    expect(updated.activePage).toBe("install");
    expect(updated.motherPrefill).toBe("install me");
  });

  it("setMotherNewMessage sets the value", () => {
    const state = useNavigationStore.getState();

    state.setMotherNewMessage(true);

    expect(useNavigationStore.getState().motherNewMessage).toBe(true);

    state.setMotherNewMessage(false);

    expect(useNavigationStore.getState().motherNewMessage).toBe(false);
  });

  it("clearMotherBadge sets motherNewMessage to false", () => {
    const state = useNavigationStore.getState();
    state.setMotherNewMessage(true);

    state.clearMotherBadge();

    expect(useNavigationStore.getState().motherNewMessage).toBe(false);
  });

  it("setAgentRunning sets the value", () => {
    const state = useNavigationStore.getState();

    state.setAgentRunning(true);
    expect(useNavigationStore.getState().agentRunning).toBe(true);

    state.setAgentRunning(false);
    expect(useNavigationStore.getState().agentRunning).toBe(false);
  });

  it("bumpSshServersVersion increments the version", () => {
    const before = useNavigationStore.getState().sshServersVersion;

    useNavigationStore.getState().bumpSshServersVersion();

    expect(useNavigationStore.getState().sshServersVersion).toBe(before + 1);

    useNavigationStore.getState().bumpSshServersVersion();
    useNavigationStore.getState().bumpSshServersVersion();

    expect(useNavigationStore.getState().sshServersVersion).toBe(before + 3);
  });

  it("subscribe listener is called on state change", () => {
    const listener = vi.fn();
    const unsubscribe = useNavigationStore.subscribe(listener);

    useNavigationStore.getState().setAgentRunning(true);

    expect(listener).toHaveBeenCalledTimes(1);

    useNavigationStore.getState().setAgentRunning(false);

    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
  });

  it("unsubscribe stops notifications", () => {
    const listener = vi.fn();
    const unsubscribe = useNavigationStore.subscribe(listener);

    unsubscribe();

    useNavigationStore.getState().setAgentRunning(true);

    expect(listener).not.toHaveBeenCalled();
  });

  it("useNavigationStore with selector returns the selected value", () => {
    useNavigationStore.getState().goToInstall("prefill text");

    const activePage = useNavigationStore((s) => s.activePage);
    const prefill = useNavigationStore((s) => s.motherPrefill);

    expect(activePage).toBe("install");
    expect(prefill).toBe("prefill text");
  });

  it("useNavigationStore without selector returns the full state", () => {
    const state = useNavigationStore();

    expect(state.activePage).toBe("mother");
    expect(state).toBe(useNavigationStore.getState());
  });

  it("multiple subscribers all receive notifications", () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    const unsub1 = useNavigationStore.subscribe(listener1);
    const unsub2 = useNavigationStore.subscribe(listener2);

    useNavigationStore.getState().setMotherNewMessage(true);

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);

    unsub1();

    useNavigationStore.getState().setMotherNewMessage(false);

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(2);

    unsub2();
  });

  it("preserves action functions across state updates", () => {
    const initial = useNavigationStore.getState();
    const initialGoToMother = initial.goToMother;

    initial.goToInstall("test");

    const updated = useNavigationStore.getState();
    // The action function reference should be preserved (spread from previous state)
    expect(updated.goToMother).toBe(initialGoToMother);
    // And it should still work
    updated.goToMother("back");
    expect(useNavigationStore.getState().activePage).toBe("mother");
  });
});
