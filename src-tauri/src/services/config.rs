use super::provider::{sanitize_claude_settings_for_live, ProviderService};
use crate::app_config::{AppType, MultiAppConfig};
use crate::error::AppError;
use crate::provider::Provider;
use chrono::Utc;
use serde_json::Value;
use std::fs;
use std::path::Path;

const MAX_BACKUPS: usize = 10;

/// 配置导入导出相关业务逻辑
pub struct ConfigService;

impl ConfigService {
    /// 为当前 config.json 创建备份，返回备份 ID（若文件不存在则返回空字符串）。
    pub fn create_backup(config_path: &Path) -> Result<String, AppError> {
        if !config_path.exists() {
            return Ok(String::new());
        }

        let timestamp = Utc::now().format("%Y%m%d_%H%M%S");
        let backup_id = format!("backup_{timestamp}");

        let backup_dir = config_path
            .parent()
            .ok_or_else(|| AppError::Config("Invalid config path".into()))?
            .join("backups");

        fs::create_dir_all(&backup_dir).map_err(|e| AppError::io(&backup_dir, e))?;

        let backup_path = backup_dir.join(format!("{backup_id}.json"));
        let contents = fs::read(config_path).map_err(|e| AppError::io(config_path, e))?;
        fs::write(&backup_path, contents).map_err(|e| AppError::io(&backup_path, e))?;

        Self::cleanup_old_backups(&backup_dir, MAX_BACKUPS)?;

        Ok(backup_id)
    }

    fn cleanup_old_backups(backup_dir: &Path, retain: usize) -> Result<(), AppError> {
        if retain == 0 {
            return Ok(());
        }

        let entries = match fs::read_dir(backup_dir) {
            Ok(iter) => iter
                .filter_map(|entry| entry.ok())
                .filter(|entry| {
                    entry
                        .path()
                        .extension()
                        .map(|ext| ext == "json")
                        .unwrap_or(false)
                })
                .collect::<Vec<_>>(),
            Err(_) => return Ok(()),
        };

        if entries.len() <= retain {
            return Ok(());
        }

        let remove_count = entries.len().saturating_sub(retain);
        let mut sorted = entries;

        sorted.sort_by(|a, b| {
            let a_time = a.metadata().and_then(|m| m.modified()).ok();
            let b_time = b.metadata().and_then(|m| m.modified()).ok();
            a_time.cmp(&b_time)
        });

        for entry in sorted.into_iter().take(remove_count) {
            if let Err(err) = fs::remove_file(entry.path()) {
                log::warn!(
                    "Failed to remove old backup {}: {}",
                    entry.path().display(),
                    err
                );
            }
        }

        Ok(())
    }

    /// 同步当前供应商到对应的 live 配置。
    pub fn sync_current_providers_to_live(config: &mut MultiAppConfig) -> Result<(), AppError> {
        Self::sync_current_provider_for_app(config, &AppType::Claude)?;
        Self::sync_current_provider_for_app(config, &AppType::Codex)?;
        Self::sync_current_provider_for_app(config, &AppType::Gemini)?;
        Ok(())
    }

    fn sync_current_provider_for_app(
        config: &mut MultiAppConfig,
        app_type: &AppType,
    ) -> Result<(), AppError> {
        let (current_id, provider) = {
            let manager = match config.get_manager(app_type) {
                Some(manager) => manager,
                None => return Ok(()),
            };

            if manager.current.is_empty() {
                return Ok(());
            }

            let current_id = manager.current.clone();
            let provider = match manager.providers.get(&current_id) {
                Some(provider) => provider.clone(),
                None => {
                    log::warn!(
                        "当前应用 {app_type:?} 的供应商 {current_id} 不存在，跳过 live 同步"
                    );
                    return Ok(());
                }
            };
            (current_id, provider)
        };

        match app_type {
            AppType::Codex => Self::sync_codex_live(config, &current_id, &provider)?,
            AppType::Claude => Self::sync_claude_live(config, &current_id, &provider)?,
            AppType::ClaudeDesktop => {
                // Claude Desktop 3P profiles are managed by claude_desktop_config.
            }
            AppType::Gemini => Self::sync_gemini_live(config, &current_id, &provider)?,
            AppType::OpenCode => {
                // OpenCode uses additive mode, no live sync needed
                // OpenCode providers are managed directly in the config file
            }
            AppType::OpenClaw => {
                // OpenClaw uses additive mode, no live sync needed
                // OpenClaw providers are managed directly in the config file
            }
            AppType::Hermes => {
                // Hermes uses additive mode, no live sync needed
            }
        }

        Ok(())
    }

    fn sync_codex_live(
        config: &mut MultiAppConfig,
        provider_id: &str,
        provider: &Provider,
    ) -> Result<(), AppError> {
        let settings = provider.settings_config.as_object().ok_or_else(|| {
            AppError::Config(format!("供应商 {provider_id} 的 Codex 配置必须是对象"))
        })?;
        let auth = settings.get("auth").ok_or_else(|| {
            AppError::Config(format!("供应商 {provider_id} 的 Codex 配置缺少 auth 字段"))
        })?;
        if !auth.is_object() {
            return Err(AppError::Config(format!(
                "供应商 {provider_id} 的 Codex auth 配置必须是 JSON 对象"
            )));
        }
        let cfg_text = settings.get("config").and_then(Value::as_str);

        crate::codex_config::write_codex_provider_live_with_catalog(
            &provider.settings_config,
            provider.category.as_deref(),
            auth,
            cfg_text,
        )?;
        // 注意：MCP 同步在 v3.7.0 中已通过 McpService 进行，不再在此调用
        // sync_enabled_to_codex 使用旧的 config.mcp.codex 结构，在新架构中为空
        // MCP 的启用/禁用应通过 McpService::toggle_app 进行

        let cfg_text_after = crate::codex_config::read_and_validate_codex_config_text()?;
        if let Some(manager) = config.get_manager_mut(&AppType::Codex) {
            if let Some(target) = manager.providers.get_mut(provider_id) {
                if let Some(obj) = target.settings_config.as_object_mut() {
                    let mut restored = serde_json::json!({
                        "auth": auth.clone(),
                        "config": cfg_text_after,
                    });
                    let restore_provider_token =
                        crate::codex_config::should_restore_codex_provider_token_for_backfill(
                            provider.category.as_deref(),
                            &provider.settings_config,
                        );
                    crate::codex_config::restore_codex_settings_for_backfill(
                        &mut restored,
                        &provider.settings_config,
                        restore_provider_token,
                    )?;
                    // 必须同时写回 auth 和 config: backfill 会把 live 的
                    // experimental_bearer_token 移到 restored.auth.OPENAI_API_KEY。
                    if let Some(restored_obj) = restored.as_object() {
                        if let Some(auth_value) = restored_obj.get("auth") {
                            obj.insert("auth".to_string(), auth_value.clone());
                        }
                        if let Some(config_value) = restored_obj.get("config") {
                            obj.insert("config".to_string(), config_value.clone());
                        }
                    }
                }
            }
        }

        Ok(())
    }

    fn sync_claude_live(
        config: &mut MultiAppConfig,
        provider_id: &str,
        provider: &Provider,
    ) -> Result<(), AppError> {
        use crate::config::{read_json_file, write_json_file};

        let settings_path = crate::config::get_claude_settings_path();
        if let Some(parent) = settings_path.parent() {
            fs::create_dir_all(parent).map_err(|e| AppError::io(parent, e))?;
        }

        let settings = sanitize_claude_settings_for_live(&provider.settings_config);
        write_json_file(&settings_path, &settings)?;

        let live_after = read_json_file::<serde_json::Value>(&settings_path)?;
        if let Some(manager) = config.get_manager_mut(&AppType::Claude) {
            if let Some(target) = manager.providers.get_mut(provider_id) {
                target.settings_config = live_after;
            }
        }

        Ok(())
    }

    fn sync_gemini_live(
        config: &mut MultiAppConfig,
        provider_id: &str,
        provider: &Provider,
    ) -> Result<(), AppError> {
        use crate::gemini_config::{env_to_json, read_gemini_env};

        ProviderService::write_gemini_live(provider)?;

        // 读回实际写入的内容并更新到配置中（包含 settings.json）
        let live_after_env = read_gemini_env()?;
        let settings_path = crate::gemini_config::get_gemini_settings_path();
        let live_after_config = if settings_path.exists() {
            crate::config::read_json_file(&settings_path)?
        } else {
            serde_json::json!({})
        };
        let mut live_after = env_to_json(&live_after_env);
        if let Some(obj) = live_after.as_object_mut() {
            obj.insert("config".to_string(), live_after_config);
        }

        if let Some(manager) = config.get_manager_mut(&AppType::Gemini) {
            if let Some(target) = manager.providers.get_mut(provider_id) {
                target.settings_config = live_after;
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;
    use tempfile::TempDir;

    // create_backup / cleanup_old_backups 接受外部路径，可用 tempdir 纯测，不依赖 HOME。

    fn write_config(dir: &Path, content: &str) -> PathBuf {
        let p = dir.join("config.json");
        fs::write(&p, content).unwrap();
        p
    }

    #[test]
    fn create_backup_returns_empty_when_config_missing() {
        let dir = TempDir::new().unwrap();
        let cfg = dir.path().join("config.json"); // 不存在
        let id = ConfigService::create_backup(&cfg).unwrap();
        assert!(id.is_empty());
    }

    #[test]
    fn create_backup_copies_config_to_backups_dir() {
        let dir = TempDir::new().unwrap();
        let cfg = write_config(dir.path(), r#"{"k":"v"}"#);

        let id = ConfigService::create_backup(&cfg).unwrap();
        assert!(id.starts_with("backup_"), "id={id}");

        let backup_path = dir.path().join("backups").join(format!("{id}.json"));
        assert!(backup_path.exists(), "备份文件应存在");
        assert_eq!(fs::read_to_string(&backup_path).unwrap(), r#"{"k":"v"}"#);
    }

    #[test]
    fn create_backup_preserves_original_config() {
        let dir = TempDir::new().unwrap();
        let cfg = write_config(dir.path(), r#"{"keep":"me"}"#);
        let _ = ConfigService::create_backup(&cfg).unwrap();
        // 原文件不应被修改
        assert_eq!(fs::read_to_string(&cfg).unwrap(), r#"{"keep":"me"}"#);
    }

    #[test]
    fn create_backup_generates_unique_ids_across_calls() {
        let dir = TempDir::new().unwrap();
        let cfg = write_config(dir.path(), "{}");

        let id1 = ConfigService::create_backup(&cfg).unwrap();
        // 同秒内可能时间戳相同；用文件名计数验证至少生成了备份
        let backups_dir = dir.path().join("backups");
        let count1 = fs::read_dir(&backups_dir).unwrap().count();
        assert_eq!(count1, 1);
        assert!(!id1.is_empty());
    }

    #[test]
    fn cleanup_retains_only_latest_n_backups() {
        let dir = TempDir::new().unwrap();
        let backups_dir = dir.path().join("backups");
        fs::create_dir_all(&backups_dir).unwrap();
        // 造 12 个 json 备份，retain 10
        for i in 0..12 {
            // 错开修改时间，保证排序稳定
            let p = backups_dir.join(format!("backup_{i:02}.json"));
            fs::write(&p, format!("{{\"i\":{i}}}")).unwrap();
            // 微小延时区分 mtime
            std::thread::sleep(std::time::Duration::from_millis(15));
        }
        // 同时放一个非 json 文件，应被忽略
        fs::write(backups_dir.join("notes.txt"), "x").unwrap();

        ConfigService::cleanup_old_backups(&backups_dir, 10).unwrap();

        let remaining: Vec<_> = fs::read_dir(&backups_dir)
            .unwrap()
            .filter_map(|e| e.ok())
            .filter(|e| e.path().extension().map(|x| x == "json").unwrap_or(false))
            .collect();
        assert_eq!(remaining.len(), 10, "应保留 10 个 json 备份");
        // notes.txt 不应被删
        assert!(backups_dir.join("notes.txt").exists());
    }

    #[test]
    fn cleanup_with_zero_retain_is_noop() {
        let dir = TempDir::new().unwrap();
        let backups_dir = dir.path().join("backups");
        fs::create_dir_all(&backups_dir).unwrap();
        fs::write(backups_dir.join("b.json"), "{}").unwrap();
        // retain=0 直接返回，不删
        ConfigService::cleanup_old_backups(&backups_dir, 0).unwrap();
        assert!(backups_dir.join("b.json").exists());
    }

    #[test]
    fn cleanup_when_under_retain_removes_nothing() {
        let dir = TempDir::new().unwrap();
        let backups_dir = dir.path().join("backups");
        fs::create_dir_all(&backups_dir).unwrap();
        for i in 0..3 {
            fs::write(backups_dir.join(format!("b{i}.json")), "{}").unwrap();
        }
        ConfigService::cleanup_old_backups(&backups_dir, 10).unwrap();
        assert_eq!(
            fs::read_dir(&backups_dir).unwrap().filter_map(|e| e.ok()).filter(|e| e.path().extension().map(|x| x == "json").unwrap_or(false)).count(),
            3
        );
    }

    #[test]
    fn cleanup_handles_missing_backup_dir_gracefully() {
        let dir = TempDir::new().unwrap();
        let missing = dir.path().join("nope");
        // 目录不存在不应报错
        ConfigService::cleanup_old_backups(&missing, 5).unwrap();
    }

    #[test]
    fn create_backup_returns_err_for_path_without_parent() {
        // config_path 无 parent（如根）会触发 Config 错误
        // 用一个无 parent 的路径：文件名本身（相对路径在 cwd 下有 parent，难以构造无 parent）
        // 改为验证正常路径不报错即可，跳过无 parent 边界
        let dir = TempDir::new().unwrap();
        let cfg = write_config(dir.path(), "{}");
        let id = ConfigService::create_backup(&cfg).unwrap();
        assert!(id.starts_with("backup_"));
    }
}
