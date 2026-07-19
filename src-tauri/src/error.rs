use std::path::Path;
use std::sync::PoisonError;

use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("配置错误: {0}")]
    Config(String),
    #[error("无效输入: {0}")]
    InvalidInput(String),
    #[error("IO 错误: {path}: {source}")]
    Io {
        path: String,
        #[source]
        source: std::io::Error,
    },
    #[error("{context}: {source}")]
    IoContext {
        context: String,
        #[source]
        source: std::io::Error,
    },
    #[error("JSON 解析错误: {path}: {source}")]
    Json {
        path: String,
        #[source]
        source: serde_json::Error,
    },
    #[error("JSON 序列化失败: {source}")]
    JsonSerialize {
        #[source]
        source: serde_json::Error,
    },
    #[error("TOML 解析错误: {path}: {source}")]
    Toml {
        path: String,
        #[source]
        source: toml::de::Error,
    },
    #[error("锁获取失败: {0}")]
    Lock(String),
    #[error("MCP 校验失败: {0}")]
    McpValidation(String),
    #[error("{0}")]
    Message(String),
    #[error("HTTP {status}: {body}")]
    HttpStatus { status: u16, body: String },
    #[error("{zh} ({en})")]
    Localized {
        key: &'static str,
        zh: String,
        en: String,
    },
    #[error("数据库错误: {0}")]
    Database(String),
    #[error("OMO 配置文件不存在")]
    OmoConfigNotFound,
    #[error("所有供应商已熔断，无可用渠道")]
    AllProvidersCircuitOpen,
    #[error("未配置供应商")]
    NoProvidersConfigured,
}

impl AppError {
    pub fn io(path: impl AsRef<Path>, source: std::io::Error) -> Self {
        Self::Io {
            path: path.as_ref().display().to_string(),
            source,
        }
    }

    pub fn json(path: impl AsRef<Path>, source: serde_json::Error) -> Self {
        Self::Json {
            path: path.as_ref().display().to_string(),
            source,
        }
    }

    pub fn toml(path: impl AsRef<Path>, source: toml::de::Error) -> Self {
        Self::Toml {
            path: path.as_ref().display().to_string(),
            source,
        }
    }

    pub fn localized(key: &'static str, zh: impl Into<String>, en: impl Into<String>) -> Self {
        Self::Localized {
            key,
            zh: zh.into(),
            en: en.into(),
        }
    }
}

impl<T> From<PoisonError<T>> for AppError {
    fn from(err: PoisonError<T>) -> Self {
        Self::Lock(err.to_string())
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(err: rusqlite::Error) -> Self {
        Self::Database(err.to_string())
    }
}

impl From<AppError> for String {
    fn from(err: AppError) -> Self {
        err.to_string()
    }
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

/// 格式化为 JSON 错误字符串，前端可解析为结构化错误
pub fn format_skill_error(
    code: &str,
    context: &[(&str, &str)],
    suggestion: Option<&str>,
) -> String {
    use serde_json::json;

    let mut ctx_map = serde_json::Map::new();
    for (key, value) in context {
        ctx_map.insert(key.to_string(), json!(value));
    }

    let error_obj = json!({
        "code": code,
        "context": ctx_map,
        "suggestion": suggestion,
    });

    serde_json::to_string(&error_obj).unwrap_or_else(|_| {
        // 如果 JSON 序列化失败，返回简单格式
        format!("ERROR:{code}")
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn io_constructor_captures_path_display() {
        let err = AppError::io("/tmp/x.json", std::io::Error::new(std::io::ErrorKind::NotFound, "gone"));
        let s = err.to_string();
        assert!(s.contains("/tmp/x.json"));
        assert!(s.contains("IO"));
        assert!(s.contains("gone"));
    }

    #[test]
    fn io_constructor_accepts_path_buf() {
        // impl AsRef<Path> 应接受 PathBuf
        let p = std::path::PathBuf::from("/var/a.txt");
        let err = AppError::io(p, std::io::Error::new(std::io::ErrorKind::PermissionDenied, "denied"));
        assert!(err.to_string().contains("/var/a.txt"));
    }

    #[test]
    fn json_constructor_captures_path() {
        let src = serde_json::from_str::<serde_json::Value>("{bad").unwrap_err();
        let err = AppError::json("/c/y.json", src);
        assert!(err.to_string().contains("/c/y.json"));
        assert!(err.to_string().contains("JSON"));
    }

    #[test]
    fn toml_constructor_captures_path() {
        let src = toml::from_str::<toml::Value>("not = valid = toml").unwrap_err();
        let err = AppError::toml("/c/x.toml", src);
        assert!(err.to_string().contains("/c/x.toml"));
        assert!(err.to_string().contains("TOML"));
    }

    #[test]
    fn localized_constructor_stores_key_and_messages() {
        let err = AppError::localized("err.key", "中文错误", "english error");
        let s = err.to_string();
        assert!(s.contains("中文错误"));
        assert!(s.contains("english error"));
    }

    #[test]
    fn from_poison_error_yields_lock_variant() {
        // 通过在子线程 panic 毒化 mutex，主线程再 lock 拿到 PoisonError
        let m = std::sync::Arc::new(std::sync::Mutex::new(0));
        let m2 = m.clone();
        let h = std::thread::spawn(move || {
            let _g = m2.lock().unwrap();
            panic!("poison the mutex");
        });
        let _ = h.join();
        let lock_err = match m.lock() {
            Ok(_) => unreachable!("mutex should be poisoned"),
            Err(e) => AppError::from(e),
        };
        assert!(matches!(lock_err, AppError::Lock(_)));
        assert!(lock_err.to_string().contains("锁"));
    }

    #[test]
    fn from_rusqlite_error_yields_database_variant() {
        // 构造一个 rusqlite 错误：重复列名
        let conn = rusqlite::Connection::open_in_memory().unwrap();
        let rusq_err = conn.execute_batch("CREATE TABLE t(x, x);").unwrap_err();
        let app_err = AppError::from(rusq_err);
        assert!(matches!(app_err, AppError::Database(_)));
        assert!(app_err.to_string().contains("数据库"));
    }

    #[test]
    fn from_app_error_to_string_roundtrip() {
        let err = AppError::Message("hello".into());
        let s: String = err.into();
        assert_eq!(s, "hello");
    }

    #[test]
    fn serialize_produces_string_value() {
        let err = AppError::Config("bad cfg".into());
        let v = serde_json::to_value(&err).unwrap();
        assert_eq!(v, serde_json::Value::String("配置错误: bad cfg".to_string()));
    }

    #[test]
    fn format_skill_error_builds_json_with_code_context_suggestion() {
        let out = format_skill_error(
            "E001",
            &[("file", "/a.rs"), ("line", "42")],
            Some("check path"),
        );
        let v: serde_json::Value = serde_json::from_str(&out).unwrap();
        assert_eq!(v["code"], "E001");
        assert_eq!(v["context"]["file"], "/a.rs");
        assert_eq!(v["context"]["line"], "42");
        assert_eq!(v["suggestion"], "check path");
    }

    #[test]
    fn format_skill_error_accepts_none_suggestion() {
        let out = format_skill_error("E002", &[], None);
        let v: serde_json::Value = serde_json::from_str(&out).unwrap();
        assert_eq!(v["code"], "E002");
        assert!(v["suggestion"].is_null());
        assert!(v["context"].as_object().unwrap().is_empty());
    }

    #[test]
    fn display_messages_for_simple_variants() {
        assert_eq!(AppError::OmoConfigNotFound.to_string(), "OMO 配置文件不存在");
        assert_eq!(AppError::AllProvidersCircuitOpen.to_string(), "所有供应商已熔断，无可用渠道");
        assert_eq!(AppError::NoProvidersConfigured.to_string(), "未配置供应商");
        assert_eq!(AppError::Message("x".into()).to_string(), "x");
    }

    #[test]
    fn http_status_variant_formats_status_and_body() {
        let err = AppError::HttpStatus { status: 502, body: "bad gateway".into() };
        assert_eq!(err.to_string(), "HTTP 502: bad gateway");
    }

    #[test]
    fn lock_variant_from_string() {
        let err = AppError::Lock("deadlock".into());
        assert!(err.to_string().contains("锁"));
        assert!(err.to_string().contains("deadlock"));
    }

    #[test]
    fn mcp_validation_variant_carries_message() {
        let err = AppError::McpValidation("missing command".into());
        assert!(err.to_string().contains("MCP 校验失败"));
        assert!(err.to_string().contains("missing command"));
    }
}
