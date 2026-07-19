// Source: New for ezSphere v1. Bridges deployment/ module to Tauri IPC.
// Follows ADR-002 naming: deployment_ / agent_ prefix for ezSphere commands.

use tauri::{AppHandle, Emitter, State};
use uuid::Uuid;

use crate::deployment::{agent_loop, probe_adapter, bundled_assets};
use crate::commands::misc;
use crate::store::AppState;
use crate::app_config::AppType;

pub type SessionMap = agent_loop::SharedSessionMap;

/// 工具 tool_id → AppType / 显示名映射
fn tool_id_to_app_type(tool_id: &str) -> Option<(AppType, &'static str)> {
    match tool_id {
        "claude" | "claudecode" => Some((AppType::Claude, "Claude Code")),
        "codex" => Some((AppType::Codex, "Codex")),
        "hermes" => Some((AppType::Hermes, "Hermes Agent")),
        _ => None,
    }
}

/// 在 install/repair 成功后建默认 provider 档 + 写 installed_tools（T16 事务）
fn build_default_provider_and_record(
    state: &AppState,
    tool_id: &str,
    exe_path: Option<&str>,
    version: Option<&str>,
) -> Result<String, String> {
    let (app_type, display_name) = tool_id_to_app_type(tool_id)
        .ok_or_else(|| format!("未知工具: {tool_id}"))?;

    // 检查是否已有该工具的 provider 档
    let existing = state.db.get_all_providers(app_type.as_str())
        .map_err(|e| e.to_string())?;
    if existing.values().any(|p| p.name.contains("(Default)")) {
        // 已有默认档，只更新 installed_tools 状态
        state.db.upsert_installed_tool_status(tool_id, "installed", exe_path, version)
            .map_err(|e| e.to_string())?;
        return Ok(existing.keys().next().cloned().unwrap_or_default());
    }

    // 建默认 provider 档（key 空，base_url 用官方默认）
    let default_settings = serde_json::json!({
        "baseUrl": "https://api.anthropic.com",
        "apiKey": "",
        "model": match tool_id {
            "claude" | "claudecode" => "claude-sonnet-4-6",
            "codex" => "gpt-4o",
            "hermes" => "hermes-3",
            _ => "default",
        },
    });

    let provider = crate::provider::Provider {
        id: format!("{}-default-{}", tool_id, chrono::Utc::now().timestamp()),
        name: format!("{} (Default)", display_name),
        settings_config: default_settings,
        website_url: None,
        category: None,
        created_at: Some(chrono::Utc::now().timestamp()),
        sort_index: None,
        notes: None,
        meta: None,
        icon: None,
        icon_color: None,
        in_failover_queue: false,
    };

    // 写 providers 表
    state.db.save_provider(app_type.as_str(), &provider)
        .map_err(|e| e.to_string())?;

    // 写 installed_tools 表
    state.db.upsert_installed_tool_status(tool_id, "installed", exe_path, version)
        .map_err(|e| e.to_string())?;

    log::info!("已为 {tool_id} 建默认 provider 档 + 安装记录");
    Ok(provider.id)
}

/// 检查是否已配 LLM 模型（AC-9）
fn check_llm_configured(state: &AppState) -> Result<bool, String> {
    for app_type in [AppType::Claude, AppType::Codex, AppType::Gemini] {
        let providers = state.db.get_all_providers(app_type.as_str())
            .map_err(|e| e.to_string())?;
        for (_, p) in &providers {
            if let Some(key) = p.settings_config.get("apiKey").and_then(|v| v.as_str()) {
                if !key.is_empty() {
                    return Ok(true);
                }
            }
            if let Some(key) = p.settings_config.get("anthropicApiKey").and_then(|v| v.as_str()) {
                if !key.is_empty() {
                    return Ok(true);
                }
            }
        }
    }
    Ok(false)
}

// ========== deployment_scan_tools ==========
#[tauri::command]
pub async fn deployment_scan_tools() -> Result<Vec<probe_adapter::ToolStatus>, String> {
    let tools = vec!["claude".into(), "codex".into(), "hermes".into()];
    let reports = misc::probe_tool_installations(tools).await.map_err(|e| e.to_string())?;
    Ok(probe_adapter::adapt_all(&reports))
}

// ========== deployment_install_tool ==========
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum InstallResult {
    Installed,
    RepairStarted,
    NeedsLlmModel,
}

#[tauri::command]
pub async fn deployment_install_tool(
    tool_id: String,
    state: State<'_, AppState>,
) -> Result<InstallResult, String> {
    let tools = vec![tool_id.clone()];
    let result = misc::run_tool_lifecycle_action(tools, "install".to_string(), None).await;

    match result {
        Ok(()) => {
            // 安装成功 → probe 确认 → 建默认 provider 档（T16）
            let reports = misc::probe_tool_installations(vec![tool_id.clone()]).await
                .map_err(|e| e.to_string())?;

            let exe_path = reports.first()
                .and_then(|r| r.installs.first())
                .map(|i| i.path.clone())
                .or_else(|| Some(format!("{}", tool_id)));
            let version = reports.first()
                .and_then(|r| r.installs.first())
                .and_then(|i| i.version.clone());

            build_default_provider_and_record(
                &state,
                &tool_id,
                exe_path.as_deref(),
                version.as_deref(),
            )?;

            Ok(InstallResult::Installed)
        }
        Err(e) => {
            // II-a: 装失败 → 检查 LLM（AC-9）
            let has_llm = check_llm_configured(&state)?;
            if !has_llm {
                log::info!("Install failed for {}, but no LLM configured. Skipping auto-repair.", tool_id);
                return Ok(InstallResult::NeedsLlmModel);
            }

            let session_id = Uuid::new_v4().to_string();
            log::info!("Install failed for {}: {}. Repair session {}.", tool_id, e, session_id);
            Ok(InstallResult::RepairStarted)
        }
    }
}

// ========== FailureCtx ==========
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FailureCtx {
    pub tool_id: String,
    pub command: String,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
}

// ========== deployment_repair_tool ==========
#[tauri::command]
pub async fn deployment_repair_tool(
    tool_id: String,
    failure_ctx: FailureCtx,
    app: AppHandle,
    state: State<'_, AppState>,
    sessions: State<'_, SessionMap>,
) -> Result<String, String> {
    // AC-9: 检查是否已配 LLM 模型
    let has_llm = check_llm_configured(&state)?;
    if !has_llm {
        return Err("NEEDS_LLM_MODEL".into());
    }

    let session_map = sessions.inner().clone();
    let session_id = Uuid::new_v4().to_string();

    let message = format!(
        "工具 {} 安装失败，请诊断修复。\n执行命令: {}\nstderr: {}\nexit_code: {}",
        failure_ctx.tool_id, failure_ctx.command, failure_ctx.stderr, failure_ctx.exit_code
    );

    // 创建 Agent 请求
    let request = agent_loop::AgentRequest {
        message: message.clone(),
        model_id: "default".into(),
        base_url: String::new(),
        api_key: String::new(),
        model_name: "default".into(),
        provider: "anthropic".into(),
        anthropic_url: None,
        server_ids: vec!["local".into()],
        skills: vec![],
        locale: None,
    };

    // 插入 session 并 spawn Agent 修复循环
    {
        let mut map = session_map.lock().await;
        map.insert(session_id.clone(), agent_loop::AgentSession::new());
    }

    let app_clone = app.clone();
    let sessions_clone = session_map.clone();
    let sid = session_id.clone();
    let tool_id_c = tool_id.clone();
    let state_db = state.db.clone();

    tauri::async_runtime::spawn(async move {
        let r = agent_loop::run_agent(app_clone, request, sessions_clone).await;
        match r {
            Ok(()) => {
                // 修复成功 → probe 重新探测 → 建档
                let reports = misc::probe_tool_installations(vec![tool_id_c.clone()]).await
                    .unwrap_or_default();
                let exe_path = reports.first()
                    .and_then(|r| r.installs.first())
                    .map(|i| i.path.clone());
                let version = reports.first()
                    .and_then(|r| r.installs.first())
                    .and_then(|i| i.version.clone());

                if let Ok(_pid) = build_default_provider_and_record(
                    &AppState::new(state_db),
                    &tool_id_c,
                    exe_path.as_deref(),
                    version.as_deref(),
                ) {
                    log::info!("Repair succeeded for {}, provider created.", tool_id_c);
                } else {
                    log::warn!("Repair succeeded for {} but provider creation failed.", tool_id_c);
                }
            }
            _ => {
                log::warn!("Repair failed or was aborted for {}.", tool_id_c);
            }
        }
    });

    Ok(session_id)
}

// ========== Agent commands ==========
#[tauri::command]
pub async fn agent_send_message(
    request: agent_loop::AgentRequest,
    app: AppHandle,
    sessions: State<'_, SessionMap>,
) -> Result<String, String> {
    // 日志：记录 AgentRequest 参数（排查 LLM 配置问题）
    log::info!("[Agent] agent_send_message: model_id={}, provider={}, base_url={}, api_key_len={}, anthropic_url={}, locale={}",
        request.model_id,
        request.provider,
        if request.base_url.is_empty() { "(empty)" } else { "set" },
        request.api_key.len(),
        request.anthropic_url.as_ref().map(|_| "set").unwrap_or("None"),
        request.locale.as_ref().map(|l| l.as_str()).unwrap_or("(not set)"),
    );
    if request.api_key.is_empty() {
        log::warn!("[Agent] ⚠️ api_key is empty — LLM calls will fail without authentication");
    }

    let session_map = sessions.inner().clone();
    let session_id = Uuid::new_v4().to_string();

    {
        let mut map = session_map.lock().await;
        map.insert(session_id.clone(), agent_loop::AgentSession::new());
    }

    let app_clone = app.clone();
    let sessions_clone = session_map.clone();
    let sid = session_id.clone();

    tauri::async_runtime::spawn(async move {
        let r = agent_loop::run_agent(app_clone, request, sessions_clone).await;
        let _ = r;
    });

    Ok(session_id)
}

#[tauri::command]
pub async fn agent_abort(
    sessions: State<'_, SessionMap>,
    server_key: String,
) -> Result<bool, String> {
    let mut map = sessions.lock().await;
    if let Some(session) = map.get_mut(&server_key) {
        session.cancel();
        Ok(true)
    } else {
        Ok(false)
    }
}

#[tauri::command]
pub async fn agent_reset(
    sessions: State<'_, SessionMap>,
    server_key: String,
) -> Result<String, String> {
    let mut map = sessions.lock().await;
    map.remove(&server_key);
    Ok("reset".into())
}

// ========== Bundled asset commands ==========
#[tauri::command]
pub fn deployment_get_install_index() -> String {
    bundled_assets::INSTALL_INDEX_JSON.to_string()
}

#[tauri::command]
pub fn deployment_get_mother_hints() -> String {
    bundled_assets::MOTHER_HINTS_JSON.to_string()
}
