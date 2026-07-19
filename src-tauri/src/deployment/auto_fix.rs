// Source: EchoBird 4.7.2 (MIT). Modifications: removed SSH (server_id/ssh_pool params), added Hermes intent.
// Post-action verification for known install/repair intents.

use super::agent_tools::{exec_shell, ToolResult};

/// A verifiable install or config-write action.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum InstallIntent {
    ClaudeCode,
    Codex,
    GeminiCli,
    Hermes,
    /// File path that was just written and should parse as JSON.
    JsonConfig(String),
}

impl InstallIntent {
    pub fn label(&self) -> &str {
        match self {
            InstallIntent::ClaudeCode => "Claude Code",
            InstallIntent::Codex => "Codex",
            InstallIntent::GeminiCli => "Gemini CLI",
            InstallIntent::Hermes => "Hermes Agent",
            InstallIntent::JsonConfig(_) => "JSON config file",
        }
    }
}

/// Match a shell command against the known-intent table.
pub fn detect_install_intent_from_shell(command: &str) -> Option<InstallIntent> {
    let cmd = command.to_lowercase();

    if cmd.contains("@anthropic-ai/claude-code") {
        return Some(InstallIntent::ClaudeCode);
    }
    if cmd.contains("@openai/codex") || cmd.contains("@openai/codex-cli") {
        return Some(InstallIntent::Codex);
    }
    if cmd.contains("@google/gemini-cli") {
        return Some(InstallIntent::GeminiCli);
    }
    // Hermes: install.sh / install.ps1 from NousResearch
    if cmd.contains("hermes-agent") || cmd.contains("nousresearch/hermes-agent") {
        return Some(InstallIntent::Hermes);
    }
    None
}

/// Match a written file path against config-validation intents.
pub fn detect_install_intent_from_write(path: &str) -> Option<InstallIntent> {
    let lower = path.to_lowercase().replace('\\', "/");
    if lower.ends_with("/claude_desktop_config.json")
        || lower.ends_with("/mcp.json")
        || lower.ends_with("/.mcp.json")
    {
        return Some(InstallIntent::JsonConfig(path.to_string()));
    }
    None
}

/// Run the verifier for an intent. Returns `Ok(())` on pass, `Err(reason)` when
/// verification fails.
pub async fn verify(intent: &InstallIntent) -> Result<(), String> {
    match intent {
        InstallIntent::ClaudeCode => verify_command_present("claude --version").await,
        InstallIntent::Codex => verify_command_present("codex --version").await,
        InstallIntent::GeminiCli => verify_command_present("gemini --version").await,
        InstallIntent::Hermes => {
            let r = verify_command_present("hermes --version").await;
            if r.is_ok() { r } else { verify_hermes_venv().await }
        }
        InstallIntent::JsonConfig(path) => verify_json_file(path).await,
    }
}

async fn verify_command_present(cmd: &str) -> Result<(), String> {
    let r = exec_shell(cmd).await;
    if !r.success {
        return Err(format!("`{}` failed:\n{}", cmd, first_n_lines(&r.output, 5)));
    }
    if r.output.trim().is_empty() {
        return Err(format!(
            "`{}` succeeded but printed no output -- binary may be broken or not on PATH",
            cmd
        ));
    }
    Ok(())
}

async fn verify_hermes_venv() -> Result<(), String> {
    let paths = &[
        // Windows
        r"%LOCALAPPDATA%\hermes\hermes-agent\venv\Scripts\hermes.exe",
        // Unix
        "~/.hermes/hermes-agent/venv/bin/hermes",
    ];
    for path_template in paths {
        let expanded = expand_env_vars(path_template);
        if std::path::Path::new(&expanded).exists() {
            return Ok(());
        }
    }
    Err("Hermes venv not found at any known path".to_string())
}

fn expand_env_vars(s: &str) -> String {
    let s = s.replace("%LOCALAPPDATA%", &std::env::var("LOCALAPPDATA").unwrap_or_default());
    s.replace('~', &dirs::home_dir().map(|p| p.to_string_lossy().to_string()).unwrap_or_default())
}

async fn verify_json_file(path: &str) -> Result<(), String> {
    let cmd = format!(
        "python3 -c \"import json,sys; json.load(open(r'{}'))\" 2>&1 || \
         python -c \"import json,sys; json.load(open(r'{}'))\" 2>&1",
        path, path
    );
    let r = exec_shell(&cmd).await;
    if !r.success {
        return Err(format!("{} did not parse as JSON:\n{}", path, first_n_lines(&r.output, 5)));
    }
    Ok(())
}

/// Wrap a ToolResult with a verification failure.
pub fn wrap_failure(original: ToolResult, intent: &InstallIntent, reason: String) -> ToolResult {
    let banner = format!(
        "\n\n--- VERIFICATION FAILED ---\n\
         The {} action reported success, but post-action verification failed:\n\
         {}\n\
         Diagnose the cause and fix it. Common causes: PATH not refreshed (run \
         `hash -r` or open a new shell), wrong package name, install partially \
         failed mid-way, sudo required, or a syntax error in the written file.",
        intent.label(), reason,
    );
    ToolResult { success: false, output: format!("{}{}", original.output, banner) }
}

fn first_n_lines(s: &str, n: usize) -> String {
    s.lines().take(n).collect::<Vec<_>>().join("\n")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_claude_code_npm_install() {
        let i = detect_install_intent_from_shell("npm install -g @anthropic-ai/claude-code");
        assert_eq!(i, Some(InstallIntent::ClaudeCode));
    }

    #[test]
    fn detects_hermes_install() {
        let i = detect_install_intent_from_shell("curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash");
        assert_eq!(i, Some(InstallIntent::Hermes));
    }

    #[test]
    fn wrap_failure_preserves_original_output() {
        let original = ToolResult { success: true, output: "added 1 package".to_string() };
        let wrapped = wrap_failure(original, &InstallIntent::ClaudeCode, "claude not found".into());
        assert!(!wrapped.success);
        assert!(wrapped.output.contains("added 1 package"));
        assert!(wrapped.output.contains("VERIFICATION FAILED"));
    }
}
