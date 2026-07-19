//! MCP 服务器配置验证模块

use serde_json::Value;

use crate::error::AppError;

/// 基础校验：允许 stdio/http/sse；或省略 type（视为 stdio）。对应必填字段存在
pub fn validate_server_spec(spec: &Value) -> Result<(), AppError> {
    if !spec.is_object() {
        return Err(AppError::McpValidation(
            "MCP 服务器连接定义必须为 JSON 对象".into(),
        ));
    }
    let t_opt = spec.get("type").and_then(|x| x.as_str());
    // 支持三种：stdio/http/sse；若缺省 type 则按 stdio 处理（与社区常见 .mcp.json 一致）
    let is_stdio = t_opt.map(|t| t == "stdio").unwrap_or(true);
    let is_http = t_opt.map(|t| t == "http").unwrap_or(false);
    let is_sse = t_opt.map(|t| t == "sse").unwrap_or(false);

    if !(is_stdio || is_http || is_sse) {
        return Err(AppError::McpValidation(
            "MCP 服务器 type 必须是 'stdio'、'http' 或 'sse'（或省略表示 stdio）".into(),
        ));
    }

    if is_stdio {
        let cmd = spec.get("command").and_then(|x| x.as_str()).unwrap_or("");
        if cmd.trim().is_empty() {
            return Err(AppError::McpValidation(
                "stdio 类型的 MCP 服务器缺少 command 字段".into(),
            ));
        }
    }
    if is_http {
        let url = spec.get("url").and_then(|x| x.as_str()).unwrap_or("");
        if url.trim().is_empty() {
            return Err(AppError::McpValidation(
                "http 类型的 MCP 服务器缺少 url 字段".into(),
            ));
        }
    }
    if is_sse {
        let url = spec.get("url").and_then(|x| x.as_str()).unwrap_or("");
        if url.trim().is_empty() {
            return Err(AppError::McpValidation(
                "sse 类型的 MCP 服务器缺少 url 字段".into(),
            ));
        }
    }
    Ok(())
}

/// 从 MCP 条目中提取服务器规范
pub fn extract_server_spec(entry: &Value) -> Result<Value, AppError> {
    let obj = entry
        .as_object()
        .ok_or_else(|| AppError::McpValidation("MCP 服务器条目必须为 JSON 对象".into()))?;
    let server = obj
        .get("server")
        .ok_or_else(|| AppError::McpValidation("MCP 服务器条目缺少 server 字段".into()))?;

    if !server.is_object() {
        return Err(AppError::McpValidation(
            "MCP 服务器 server 字段必须为 JSON 对象".into(),
        ));
    }

    Ok(server.clone())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    // ---- validate_server_spec ----

    #[test]
    fn validates_stdio_with_command() {
        assert!(validate_server_spec(&json!({"type":"stdio","command":"npx"})).is_ok());
    }

    #[test]
    fn validates_stdio_omitting_type_defaults_to_stdio() {
        // 省略 type 视为 stdio
        assert!(validate_server_spec(&json!({"command":"node"})).is_ok());
    }

    #[test]
    fn rejects_stdio_without_command() {
        let err = validate_server_spec(&json!({"type":"stdio"})).unwrap_err();
        assert!(err.to_string().contains("command"));
    }

    #[test]
    fn rejects_stdio_with_empty_command() {
        let err = validate_server_spec(&json!({"type":"stdio","command":"  "})).unwrap_err();
        assert!(err.to_string().contains("command"));
    }

    #[test]
    fn validates_http_with_url() {
        assert!(validate_server_spec(&json!({"type":"http","url":"http://x/mcp"})).is_ok());
    }

    #[test]
    fn rejects_http_without_url() {
        let err = validate_server_spec(&json!({"type":"http"})).unwrap_err();
        assert!(err.to_string().contains("url"));
    }

    #[test]
    fn validates_sse_with_url() {
        assert!(validate_server_spec(&json!({"type":"sse","url":"http://x/sse"})).is_ok());
    }

    #[test]
    fn rejects_sse_without_url() {
        let err = validate_server_spec(&json!({"type":"sse"})).unwrap_err();
        assert!(err.to_string().contains("url"));
    }

    #[test]
    fn rejects_unknown_type() {
        let err = validate_server_spec(&json!({"type":"websocket"})).unwrap_err();
        assert!(err.to_string().contains("type"));
    }

    #[test]
    fn rejects_non_object_spec() {
        let err = validate_server_spec(&json!(["not","an","object"])).unwrap_err();
        assert!(err.to_string().contains("对象"));
    }

    #[test]
    fn rejects_string_spec() {
        let err = validate_server_spec(&json!("just a string")).unwrap_err();
        assert!(err.to_string().contains("对象"));
    }

    #[test]
    fn stdio_ignores_url_field() {
        // stdio 有 url 但无 command -> 仍应失败于缺 command
        let err = validate_server_spec(&json!({"type":"stdio","url":"http://x"})).unwrap_err();
        assert!(err.to_string().contains("command"));
    }

    // ---- extract_server_spec ----

    #[test]
    fn extracts_server_object_from_entry() {
        let entry = json!({"server": {"type":"stdio","command":"npx"}});
        let spec = extract_server_spec(&entry).unwrap();
        assert_eq!(spec["command"], "npx");
    }

    #[test]
    fn extract_rejects_entry_without_server_field() {
        let err = extract_server_spec(&json!({"other":"x"})).unwrap_err();
        assert!(err.to_string().contains("server"));
    }

    #[test]
    fn extract_rejects_non_object_entry() {
        let err = extract_server_spec(&json!("not an object")).unwrap_err();
        assert!(err.to_string().contains("对象"));
    }

    #[test]
    fn extract_rejects_non_object_server_field() {
        let err = extract_server_spec(&json!({"server":"not an object"})).unwrap_err();
        assert!(err.to_string().contains("对象"));
    }

    #[test]
    fn extract_clones_server_independently() {
        let entry = json!({"server": {"command":"x"}});
        let spec = extract_server_spec(&entry).unwrap();
        // 修改返回值不应影响原 entry
        let mut spec = spec;
        spec["command"] = json!("y");
        assert_eq!(entry["server"]["command"], "x");
    }
}
