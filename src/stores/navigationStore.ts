interface NavigationState {
  activePage: string;
  motherPrefill?: string;
  motherNewMessage: boolean;
  agentRunning: boolean;
  sshServersVersion: number;
  goToMother: (prefill?: string) => void;
  goToInstall: (prefill?: string) => void;
  setMotherNewMessage: (value: boolean) => void;
  clearMotherBadge: () => void;
  setAgentRunning: (value: boolean) => void;
  bumpSshServersVersion: () => void;
}

let navigationState: NavigationState = {
  activePage: "mother",
  motherPrefill: undefined,
  motherNewMessage: false,
  agentRunning: false,
  sshServersVersion: 0,
  goToMother: (prefill) => updateNavigation({ activePage: "mother", motherPrefill: prefill }),
  goToInstall: (prefill) => updateNavigation({ activePage: "install", motherPrefill: prefill }),
  setMotherNewMessage: (motherNewMessage) => updateNavigation({ motherNewMessage }),
  clearMotherBadge: () => updateNavigation({ motherNewMessage: false }),
  setAgentRunning: (agentRunning) => updateNavigation({ agentRunning }),
  bumpSshServersVersion: () =>
    updateNavigation({ sshServersVersion: navigationState.sshServersVersion + 1 }),
};

const listeners = new Set<() => void>();

function updateNavigation(patch: Partial<NavigationState>) {
  navigationState = { ...navigationState, ...patch };
  listeners.forEach((listener) => listener());
}

export function useNavigationStore<T = NavigationState>(
  selector?: (state: NavigationState) => T,
): T {
  return selector ? selector(navigationState) : (navigationState as T);
}

useNavigationStore.getState = () => navigationState;
useNavigationStore.subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
