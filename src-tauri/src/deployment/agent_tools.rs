// Source: EchoBird 4.7.2 (MIT). Modifications: removed SSH, local-only.
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::process::{Command, Stdio};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolResult {
    pub success: bool,
    pub output: String,
}

pub fn exec_local_shell(command: &str) -> ToolResult {
    let mut cmd = if cfg!(target_os = "windows") {
        let mut c = std::process::Command::new("powershell");
        c.args(["-NoProfile", "-NonInteractive", "-Command", command]);
        c
    } else {
        let mut c = std::process::Command::new("sh");
        c.arg("-c").arg(command);
        c
    };
    match cmd.stdin(Stdio::null()).output() {
        Ok(o) => {
            let out = String::from_utf8_lossy(&o.stdout).trim().to_string();
            let err = String::from_utf8_lossy(&o.stderr).trim().to_string();
            let output = if err.is_empty() { out } else { format!("{}\n--- stderr ---\n{}", out, err) };
            ToolResult { success: o.status.success(), output }
        }
        Err(e) => ToolResult { success: false, output: format!("Exec error: {}", e) },
    }
}

pub async fn exec_shell(command: &str) -> ToolResult {
    exec_local_shell(command)
}

pub async fn execute_tool(name: &str, args: &str) -> ToolResult {
    let cmd = extract_string_field(args, "command").unwrap_or_default();
    match name {
        "shell_exec" => exec_shell(&cmd).await,
        "file_read" => {
            let p = extract_string_field(args, "path").unwrap_or_default();
            match std::fs::read_to_string(&p) {
                Ok(c) => ToolResult { success: true, output: c },
                Err(e) => ToolResult { success: false, output: format!("Read error: {}", e) },
            }
        }
        "file_write" => {
            let p = extract_string_field(args, "path").unwrap_or_default();
            let c = extract_string_field(args, "content").unwrap_or_default();
            match std::fs::write(&p, &c) {
                Ok(_) => ToolResult { success: true, output: format!("Written {} bytes", c.len()) },
                Err(e) => ToolResult { success: false, output: format!("Write error: {}", e) },
            }
        }
        _ => ToolResult { success: false, output: format!("Unknown tool: {}", name) },
    }
}

fn extract_string_field(args: &str, field: &str) -> Option<String> {
    serde_json::from_str::<Value>(args).ok()
        .and_then(|v| v.get(field).and_then(|v| v.as_str()).map(String::from))
}

pub fn get_tool_definitions() -> Vec<super::llm_client::ToolDef> {
    vec![
        super::llm_client::ToolDef {
            name: "shell_exec".into(),
            description: "Execute a shell command on the local machine.".into(),
            parameters: json!({"type":"object","properties":{"command":{"type":"string"}},"required":["command"]}),
        },
        super::llm_client::ToolDef {
            name: "file_read".into(),
            description: "Read the contents of a file.".into(),
            parameters: json!({"type":"object","properties":{"path":{"type":"string"}},"required":["path"]}),
        },
        super::llm_client::ToolDef {
            name: "file_write".into(),
            description: "Write content to a file.".into(),
            parameters: json!({"type":"object","properties":{"path":{"type":"string"},"content":{"type":"string"}},"required":["path","content"]}),
        },
    ]
}
