use serde_json::{Map, Value};
use std::fs;
use std::path::{Path, PathBuf};

use crate::config::atomic_write;
use crate::error::AppError;
use crate::gemini_config::get_gemini_settings_path;

/// 获取 Gemini MCP 配置文件路径（~/.gemini/settings.json）
fn user_config_path() -> PathBuf {
    get_gemini_settings_path()
}

fn read_json_value(path: &Path) -> Result<Value, AppError> {
    if !path.exists() {
        return Ok(serde_json::json!({}));
    }
    let content = fs::read_to_string(path).map_err(|e| AppError::io(path, e))?;
    let value: Value = serde_json::from_str(&content).map_err(|e| AppError::json(path, e))?;
    Ok(value)
}

fn write_json_value(path: &Path, value: &Value) -> Result<(), AppError> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| AppError::io(parent, e))?;
    }
    let json =
        serde_json::to_string_pretty(value).map_err(|e| AppError::JsonSerialize { source: e })?;
    atomic_write(path, json.as_bytes())
}

/// 读取 Gemini settings.json 中的 mcpServers 映射
///
/// 执行反向格式转换以保持与统一 MCP 结构的兼容性：
/// - httpUrl → url + type: "http"
/// - 仅有 url 字段 → 补齐 type: "sse"（Gemini 以字段名推断传输类型）
/// - 仅有 command 字段 → 补齐 type: "stdio"
pub fn read_mcp_servers_map() -> Result<std::collections::HashMap<String, Value>, AppError> {
    let path = user_config_path();
    if !path.exists() {
        return Ok(std::collections::HashMap::new());
    }

    let root = read_json_value(&path)?;
    let mut servers: std::collections::HashMap<String, Value> = root
        .get("mcpServers")
        .and_then(|v| v.as_object())
        .map(|obj| obj.iter().map(|(k, v)| (k.clone(), v.clone())).collect())
        .unwrap_or_default();

    // 反向格式转换：Gemini 特有格式 → 统一 MCP 格式
    for (_, spec) in servers.iter_mut() {
        if let Some(obj) = spec.as_object_mut() {
            // httpUrl → url + type: "http"
            if let Some(http_url) = obj.remove("httpUrl") {
                obj.insert("url".to_string(), http_url);
                obj.insert("type".to_string(), Value::String("http".to_string()));
            }

            // Gemini CLI 不使用 type 字段：这里补齐成统一结构，便于校验与导入
            if obj.get("type").is_none() {
                if obj.contains_key("command") {
                    obj.insert("type".to_string(), Value::String("stdio".to_string()));
                } else if obj.contains_key("url") {
                    obj.insert("type".to_string(), Value::String("sse".to_string()));
                }
            }
        }
    }

    Ok(servers)
}

/// 将给定的启用 MCP 服务器映射写入到 Gemini settings.json 的 mcpServers 字段
/// 仅覆盖 mcpServers，其他字段保持不变
pub fn set_mcp_servers_map(
    servers: &std::collections::HashMap<String, Value>,
) -> Result<(), AppError> {
    let path = user_config_path();
    let mut root = if path.exists() {
        read_json_value(&path)?
    } else {
        serde_json::json!({})
    };

    // 构建 mcpServers 对象：移除 UI 辅助字段（enabled/source），仅保留实际 MCP 规范
    let mut out: Map<String, Value> = Map::new();
    for (id, spec) in servers.iter() {
        let mut obj = if let Some(map) = spec.as_object() {
            map.clone()
        } else {
            return Err(AppError::McpValidation(format!(
                "MCP 服务器 '{id}' 不是对象"
            )));
        };

        // 提取 server 字段（如果存在）
        if let Some(server_val) = obj.remove("server") {
            let server_obj = server_val.as_object().cloned().ok_or_else(|| {
                AppError::McpValidation(format!("MCP 服务器 '{id}' server 字段不是对象"))
            })?;
            obj = server_obj;
        }

        // Gemini CLI 格式转换：
        // - Gemini 不使用 "type" 字段（从字段名推断传输类型）
        // - HTTP 使用 "httpUrl" 字段，SSE 使用 "url" 字段
        let transport_type = obj.get("type").and_then(|v| v.as_str());
        if transport_type == Some("http") {
            // HTTP streaming: 将 "url" 重命名为 "httpUrl"
            if let Some(url_value) = obj.remove("url") {
                obj.insert("httpUrl".to_string(), url_value);
            }
        }
        // SSE 保持 "url" 字段不变

        // 移除 UI 辅助字段和 type 字段（Gemini 不需要）
        obj.remove("type");
        obj.remove("enabled");
        obj.remove("source");
        obj.remove("id");
        obj.remove("name");
        obj.remove("description");
        obj.remove("tags");
        obj.remove("homepage");
        obj.remove("docs");

        // Timeout 转换：Claude/Codex 使用 startup_timeout_sec/tool_timeout_sec
        // Gemini CLI 只支持 timeout（单位 ms）
        // 默认值：startup=10s, tool=60s
        const DEFAULT_STARTUP_MS: u64 = 10_000;
        const DEFAULT_TOOL_MS: u64 = 60_000;

        let extract_timeout =
            |obj: &mut Map<String, Value>, key: &str, multiplier: u64| -> Option<u64> {
                obj.remove(key).and_then(|val| {
                    val.as_u64()
                        .map(|n| n * multiplier)
                        .or_else(|| val.as_f64().map(|f| (f * multiplier as f64) as u64))
                })
            };

        // 分别收集 startup 和 tool timeout，未设置时使用默认值
        let startup_ms = extract_timeout(&mut obj, "startup_timeout_sec", 1000)
            .or_else(|| extract_timeout(&mut obj, "startup_timeout_ms", 1))
            .unwrap_or(DEFAULT_STARTUP_MS);
        let tool_ms = extract_timeout(&mut obj, "tool_timeout_sec", 1000)
            .or_else(|| extract_timeout(&mut obj, "tool_timeout_ms", 1))
            .unwrap_or(DEFAULT_TOOL_MS);

        // 取最大值作为 Gemini timeout
        let final_timeout = startup_ms.max(tool_ms);
        obj.insert("timeout".to_string(), Value::Number(final_timeout.into()));

        out.insert(id.clone(), Value::Object(obj));
    }

    {
        let obj = root
            .as_object_mut()
            .ok_or_else(|| AppError::Config("~/.gemini/settings.json 根必须是对象".into()))?;
        obj.insert("mcpServers".into(), Value::Object(out));
    }

    write_json_value(&path, &root)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use serial_test::serial;
    use std::collections::HashMap;
    use std::sync::Mutex;
    use tempfile::TempDir;

    // env 变量是进程级的，串行化所有动 CC_SWITCH_TEST_HOME 的测试
    static ENV_LOCK: Mutex<()> = Mutex::new(());

    fn isolate_home() -> TempDir {
        let _g = ENV_LOCK.lock().unwrap();
        let dir = TempDir::new().expect("tempdir");
        std::env::set_var("CC_SWITCH_TEST_HOME", dir.path());
        dir
    }

    fn clear_home() {
        let _g = ENV_LOCK.lock().unwrap();
        std::env::remove_var("CC_SWITCH_TEST_HOME");
    }

    #[serial]
    #[test]
    fn read_returns_empty_when_no_settings_file() {
        let _dir = isolate_home();
        let map = read_mcp_servers_map().unwrap();
        assert!(map.is_empty());
        clear_home();
    }

    #[serial]
    #[test]
    fn read_converts_http_url_to_url_with_http_type() {
        let dir = isolate_home();
        // 预置 Gemini 原生格式：httpUrl 字段
        let settings = json!({
            "mcpServers": {
                "remote": { "httpUrl": "https://x/mcp" }
            }
        });
        std::fs::create_dir_all(dir.path().join(".gemini")).unwrap();
        std::fs::write(
            dir.path().join(".gemini").join("settings.json"),
            serde_json::to_string_pretty(&settings).unwrap(),
        )
        .unwrap();

        let map = read_mcp_servers_map().unwrap();
        let spec = map.get("remote").unwrap();
        assert_eq!(spec["url"], "https://x/mcp");
        assert_eq!(spec["type"], "http");
        assert!(spec.get("httpUrl").is_none(), "httpUrl 应被移除");
        clear_home();
    }

    #[serial]
    #[test]
    fn read_infers_stdio_type_from_command() {
        let dir = isolate_home();
        let settings = json!({
            "mcpServers": {
                "local": { "command": "npx", "args": ["-y", "foo"] }
            }
        });
        std::fs::create_dir_all(dir.path().join(".gemini")).unwrap();
        std::fs::write(
            dir.path().join(".gemini").join("settings.json"),
            serde_json::to_string_pretty(&settings).unwrap(),
        )
        .unwrap();

        let map = read_mcp_servers_map().unwrap();
        let spec = map.get("local").unwrap();
        assert_eq!(spec["type"], "stdio");
        assert_eq!(spec["command"], "npx");
        clear_home();
    }

    #[serial]
    #[test]
    fn read_infers_sse_type_from_bare_url() {
        let dir = isolate_home();
        let settings = json!({
            "mcpServers": {
                "sse-srv": { "url": "https://x/sse" }
            }
        });
        std::fs::create_dir_all(dir.path().join(".gemini")).unwrap();
        std::fs::write(
            dir.path().join(".gemini").join("settings.json"),
            serde_json::to_string_pretty(&settings).unwrap(),
        )
        .unwrap();

        let map = read_mcp_servers_map().unwrap();
        assert_eq!(map.get("sse-srv").unwrap()["type"], "sse");
        clear_home();
    }

    #[serial]
    #[test]
    fn read_preserves_explicit_type() {
        let dir = isolate_home();
        let settings = json!({
            "mcpServers": {
                "typed": { "type": "http", "url": "https://x/mcp" }
            }
        });
        std::fs::create_dir_all(dir.path().join(".gemini")).unwrap();
        std::fs::write(
            dir.path().join(".gemini").join("settings.json"),
            serde_json::to_string_pretty(&settings).unwrap(),
        )
        .unwrap();

        let map = read_mcp_servers_map().unwrap();
        // 已有 type=http，不应被改写
        assert_eq!(map.get("typed").unwrap()["type"], "http");
        clear_home();
    }

    #[serial]
    #[test]
    fn set_then_read_roundtrip_converts_http_type_to_http_url() {
        let _dir = isolate_home();
        let mut servers = HashMap::new();
        servers.insert(
            "remote".to_string(),
            json!({ "type": "http", "url": "https://x/mcp" }),
        );

        set_mcp_servers_map(&servers).unwrap();

        // 写入后应是 Gemini 原生格式：httpUrl + 无 type
        let path = user_config_path();
        let written: Value =
            serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
        let spec = &written["mcpServers"]["remote"];
        assert_eq!(spec["httpUrl"], "https://x/mcp");
        assert!(spec.get("type").is_none(), "Gemini 不保留 type 字段");
        assert!(spec.get("url").is_none(), "http 类型 url 应改名为 httpUrl");

        // 再读回来应还原为统一格式
        let map = read_mcp_servers_map().unwrap();
        assert_eq!(map.get("remote").unwrap()["url"], "https://x/mcp");
        assert_eq!(map.get("remote").unwrap()["type"], "http");
        clear_home();
    }

    #[serial]
    #[test]
    fn set_converts_timeout_seconds_to_milliseconds_and_takes_max() {
        let _dir = isolate_home();
        let mut servers = HashMap::new();
        servers.insert(
            "t".to_string(),
            json!({
                "type": "stdio",
                "command": "npx",
                "startup_timeout_sec": 5,   // 5000ms
                "tool_timeout_sec": 120,    // 120000ms
            }),
        );
        set_mcp_servers_map(&servers).unwrap();

        let path = user_config_path();
        let written: Value =
            serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
        let spec = &written["mcpServers"]["t"];
        // max(5000, 120000) = 120000
        assert_eq!(spec["timeout"], 120_000);
        // 原 timeout_sec 字段应被移除
        assert!(spec.get("startup_timeout_sec").is_none());
        assert!(spec.get("tool_timeout_sec").is_none());
        clear_home();
    }

    #[serial]
    #[test]
    fn set_uses_default_timeouts_when_unset() {
        let _dir = isolate_home();
        let mut servers = HashMap::new();
        servers.insert(
            "t".to_string(),
            json!({ "type": "stdio", "command": "npx" }),
        );
        set_mcp_servers_map(&servers).unwrap();

        let path = user_config_path();
        let written: Value =
            serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
        // 默认 max(10000, 60000) = 60000
        assert_eq!(written["mcpServers"]["t"]["timeout"], 60_000);
        clear_home();
    }

    #[serial]
    #[test]
    fn set_strips_ui_auxiliary_fields() {
        let _dir = isolate_home();
        let mut servers = HashMap::new();
        servers.insert(
            "s".to_string(),
            json!({
                "type": "stdio",
                "command": "npx",
                "enabled": true,
                "source": "manual",
                "id": "s",
                "name": "My Server",
                "description": "desc",
                "tags": ["x"],
                "homepage": "https://h",
                "docs": "https://d",
            }),
        );
        set_mcp_servers_map(&servers).unwrap();

        let path = user_config_path();
        let written: Value =
            serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
        let spec = &written["mcpServers"]["s"];
        for key in ["enabled", "source", "id", "name", "description", "tags", "homepage", "docs", "type"] {
            assert!(spec.get(key).is_none(), "字段 {key} 应被移除");
        }
        assert_eq!(spec["command"], "npx");
        clear_home();
    }

    #[serial]
    #[test]
    fn set_unwraps_server_field() {
        let _dir = isolate_home();
        let mut servers = HashMap::new();
        servers.insert(
            "s".to_string(),
            json!({
                "server": { "type": "stdio", "command": "node" },
                "enabled": true,
            }),
        );
        set_mcp_servers_map(&servers).unwrap();

        let path = user_config_path();
        let written: Value =
            serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
        let spec = &written["mcpServers"]["s"];
        // server 字段应被解包
        assert_eq!(spec["command"], "node");
        assert!(spec.get("server").is_none());
        clear_home();
    }

    #[serial]
    #[test]
    fn set_preserves_other_root_fields() {
        let _dir = isolate_home();
        // 先写入一个带其他字段的 settings.json
        let path = user_config_path();
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        std::fs::write(
            &path,
            serde_json::to_string_pretty(&json!({
                "model": "gemini-2.5-pro",
                "mcpServers": { "old": { "command": "x" } }
            }))
            .unwrap(),
        )
        .unwrap();

        let mut servers = HashMap::new();
        servers.insert("new".to_string(), json!({ "type": "stdio", "command": "y" }));
        set_mcp_servers_map(&servers).unwrap();

        let written: Value =
            serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
        assert_eq!(written["model"], "gemini-2.5-pro"); // 保留
        assert!(written["mcpServers"].get("old").is_none()); // 覆盖
        assert_eq!(written["mcpServers"]["new"]["command"], "y");
        clear_home();
    }

    #[serial]
    #[test]
    fn set_rejects_non_object_spec() {
        let _dir = isolate_home();
        let mut servers = HashMap::new();
        servers.insert("bad".to_string(), json!("not an object"));
        let err = set_mcp_servers_map(&servers).unwrap_err();
        assert!(err.to_string().contains("不是对象"));
        clear_home();
    }
}
