// Bundled-asset APIs — read Mother Agent hints and install index from the
// compile-time embedded copy so smart-install works offline.
import { invoke } from '@tauri-apps/api/core';
import { isTauriRuntime } from '@/lib/tauri-runtime';

const FALLBACK_MOTHER_HINTS = JSON.stringify({
  hints: [
    { action: 'install', agent: 'OpenClaw' },
    { action: 'install', agent: 'Claude Code' },
    { action: 'install', agent: 'Hermes Agent' },
    { action: 'showSpecs' },
    { action: 'troubleshoot', agent: 'OpenClaw' },
    { action: 'uninstall', agent: 'OpenClaw' },
    { action: 'networkInfo' },
    { action: 'securityAudit' },
  ],
});

const FALLBACK_INSTALL_INDEX = JSON.stringify({
  ids: [
    'claudecode',
    'codex',
    'qwencode',
    'aider',
    'pi',
    'openclaw',
    'opencode',
    'zeroclaw',
    'nanobot',
    'picoclaw',
    'openfang',
    'hermes',
    'claudedesktop',
    'codexdesktop',
    'geminidesktop',
    'coffeecli',
    'vscode',
    'cursor',
    'windsurf',
    'trae',
    'traecn',
  ],
});

export async function getMotherHints(): Promise<string> {
  if (!isTauriRuntime()) {
    return FALLBACK_MOTHER_HINTS;
  }

  return invoke('deployment_get_mother_hints');
}

export async function getInstallIndex(): Promise<string> {
  if (!isTauriRuntime()) {
    return FALLBACK_INSTALL_INDEX;
  }

  return invoke('deployment_get_install_index');
}
