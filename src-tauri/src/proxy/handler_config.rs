//! Handler 配置模块
//!
//! 定义各 API 处理器的配置结构和使用量解析器

use crate::app_config::AppType;
use crate::proxy::usage::parser::TokenUsage;
use serde_json::Value;

/// 使用量解析器类型别名
pub type StreamUsageParser = fn(&[Value]) -> Option<TokenUsage>;
pub type ResponseUsageParser = fn(&Value) -> Option<TokenUsage>;

/// 模型提取器类型别名
/// 参数: (流式事件列表, 请求中的模型名称) -> 最终使用的模型名称
pub type StreamModelExtractor = fn(&[Value], &str) -> String;

/// 流式 usage 事件预过滤器类型别名。
///
/// 参数是 SSE `data:` 原始字符串。返回 false 时跳过 JSON parse，避免在
/// token/chunk 高频路径上解析与 usage 无关的事件。
pub type StreamUsageEventFilter = fn(&str) -> bool;

/// 各 API 的使用量解析配置
#[derive(Clone, Copy)]
pub struct UsageParserConfig {
    /// 流式响应解析器
    pub stream_parser: StreamUsageParser,
    /// 非流式响应解析器
    pub response_parser: ResponseUsageParser,
    /// 流式响应中的模型提取器
    pub model_extractor: StreamModelExtractor,
    /// 流式 usage 事件预过滤器
    pub stream_event_filter: Option<StreamUsageEventFilter>,
    /// 应用类型字符串（用于日志记录）
    pub app_type_str: &'static str,
}

// ============================================================================
// 流式 usage 事件预过滤
// ============================================================================

pub fn claude_stream_usage_event_filter(data: &str) -> bool {
    data.contains("\"message_start\"") || data.contains("\"message_delta\"")
}

fn openai_stream_usage_event_filter(data: &str) -> bool {
    data.contains("\"usage\"")
}

pub fn codex_stream_usage_event_filter(data: &str) -> bool {
    data.contains("\"response.completed\"") || data.contains("\"usage\"")
}

fn gemini_stream_usage_event_filter(data: &str) -> bool {
    data.contains("\"usageMetadata\"")
}

// ============================================================================
// 模型提取器实现
// ============================================================================

/// Claude 流式响应模型提取（优先使用 usage.model）
///
/// 空字符串模型名视为缺失（转换层对无回显上游会合成 model:""），
/// 落到 fallback_model（映射后的出站模型或客户端请求模型）。
fn claude_model_extractor(events: &[Value], fallback_model: &str) -> String {
    // 首先尝试从解析的 usage 中获取模型
    if let Some(usage) = TokenUsage::from_claude_stream_events(events) {
        if let Some(model) = usage.model.filter(|m| !m.is_empty()) {
            return model;
        }
    }
    fallback_model.to_string()
}

/// OpenAI Chat Completions 流式响应模型提取（优先使用 usage.model）
fn openai_model_extractor(events: &[Value], fallback_model: &str) -> String {
    // 首先尝试从解析的 usage 中获取模型
    if let Some(usage) = TokenUsage::from_openai_stream_events(events) {
        if let Some(model) = usage.model.filter(|m| !m.is_empty()) {
            return model;
        }
    }
    // 回退：从事件中直接提取
    events
        .iter()
        .find_map(|e| e.get("model")?.as_str().filter(|m| !m.is_empty()))
        .unwrap_or(fallback_model)
        .to_string()
}

/// Codex 智能流式响应模型提取（自动检测格式）
fn codex_auto_model_extractor(events: &[Value], fallback_model: &str) -> String {
    // 首先尝试从解析的 usage 中获取模型
    if let Some(usage) = TokenUsage::from_codex_stream_events_auto(events) {
        if let Some(model) = usage.model.filter(|m| !m.is_empty()) {
            return model;
        }
    }
    // 回退：从 response.completed 事件中提取
    events
        .iter()
        .find_map(|e| {
            if e.get("type")?.as_str()? == "response.completed" {
                e.get("response")?
                    .get("model")?
                    .as_str()
                    .filter(|m| !m.is_empty())
            } else {
                None
            }
        })
        .or_else(|| {
            // 再回退：从 OpenAI 格式事件中提取
            events
                .iter()
                .find_map(|e| e.get("model")?.as_str().filter(|m| !m.is_empty()))
        })
        .unwrap_or(fallback_model)
        .to_string()
}

/// Gemini 流式响应模型提取（优先使用 usage.model）
fn gemini_model_extractor(events: &[Value], fallback_model: &str) -> String {
    // 首先尝试从解析的 usage 中获取模型
    if let Some(usage) = TokenUsage::from_gemini_stream_chunks(events) {
        if let Some(model) = usage.model.filter(|m| !m.is_empty()) {
            return model;
        }
    }
    fallback_model.to_string()
}

// ============================================================================
// 预定义配置
// ============================================================================

/// Claude API 解析配置
pub const CLAUDE_PARSER_CONFIG: UsageParserConfig = UsageParserConfig {
    stream_parser: TokenUsage::from_claude_stream_events,
    response_parser: TokenUsage::from_claude_response,
    model_extractor: claude_model_extractor,
    stream_event_filter: Some(claude_stream_usage_event_filter),
    app_type_str: "claude",
};

/// OpenAI Chat Completions API 解析配置（用于 Codex /v1/chat/completions）
pub const OPENAI_PARSER_CONFIG: UsageParserConfig = UsageParserConfig {
    stream_parser: TokenUsage::from_openai_stream_events,
    response_parser: TokenUsage::from_openai_response,
    model_extractor: openai_model_extractor,
    stream_event_filter: Some(openai_stream_usage_event_filter),
    app_type_str: "codex",
};

/// Codex 智能解析配置（自动检测 OpenAI 或 Codex 格式）
pub const CODEX_PARSER_CONFIG: UsageParserConfig = UsageParserConfig {
    stream_parser: TokenUsage::from_codex_stream_events_auto,
    response_parser: TokenUsage::from_codex_response_auto,
    model_extractor: codex_auto_model_extractor,
    stream_event_filter: Some(codex_stream_usage_event_filter),
    app_type_str: "codex",
};

/// Gemini API 解析配置
pub const GEMINI_PARSER_CONFIG: UsageParserConfig = UsageParserConfig {
    stream_parser: TokenUsage::from_gemini_stream_chunks,
    response_parser: TokenUsage::from_gemini_response,
    model_extractor: gemini_model_extractor,
    stream_event_filter: Some(gemini_stream_usage_event_filter),
    app_type_str: "gemini",
};

// ============================================================================
// Handler 配置（预留，用于进一步简化）
// ============================================================================

/// Handler 基础配置
///
/// 预留结构，可用于进一步统一各 handler 的配置
#[allow(dead_code)]
#[derive(Clone)]
pub struct HandlerConfig {
    /// 应用类型
    pub app_type: AppType,
    /// 日志标签
    pub tag: &'static str,
    /// 应用类型字符串
    pub app_type_str: &'static str,
    /// 使用量解析配置
    pub parser_config: &'static UsageParserConfig,
}

/// Claude Handler 配置
#[allow(dead_code)]
pub const CLAUDE_HANDLER_CONFIG: HandlerConfig = HandlerConfig {
    app_type: AppType::Claude,
    tag: "Claude",
    app_type_str: "claude",
    parser_config: &CLAUDE_PARSER_CONFIG,
};

/// Codex Chat Completions Handler 配置
#[allow(dead_code)]
pub const CODEX_CHAT_HANDLER_CONFIG: HandlerConfig = HandlerConfig {
    app_type: AppType::Codex,
    tag: "Codex",
    app_type_str: "codex",
    parser_config: &OPENAI_PARSER_CONFIG,
};

/// Codex Responses Handler 配置
#[allow(dead_code)]
pub const CODEX_RESPONSES_HANDLER_CONFIG: HandlerConfig = HandlerConfig {
    app_type: AppType::Codex,
    tag: "Codex",
    app_type_str: "codex",
    parser_config: &CODEX_PARSER_CONFIG,
};

/// Gemini Handler 配置
#[allow(dead_code)]
pub const GEMINI_HANDLER_CONFIG: HandlerConfig = HandlerConfig {
    app_type: AppType::Gemini,
    tag: "Gemini",
    app_type_str: "gemini",
    parser_config: &GEMINI_PARSER_CONFIG,
};

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    // =========================================================================
    // 流式 usage 事件预过滤器
    // =========================================================================

    #[test]
    fn claude_filter_matches_message_start_and_delta() {
        assert!(claude_stream_usage_event_filter(
            r#"data: {"type":"message_start"}"#
        ));
        assert!(claude_stream_usage_event_filter(
            r#"data: {"type":"message_delta"}"#
        ));
    }

    #[test]
    fn claude_filter_rejects_unrelated_events() {
        assert!(!claude_stream_usage_event_filter(
            r#"data: {"type":"content_block_delta"}"#
        ));
        assert!(!claude_stream_usage_event_filter("ping"));
        assert!(!claude_stream_usage_event_filter(""));
    }

    #[test]
    fn openai_filter_matches_usage_key() {
        assert!(openai_stream_usage_event_filter(
            r#"data: {"choices":[],"usage":{"prompt_tokens":5}}"#
        ));
    }

    #[test]
    fn openai_filter_rejects_chunks_without_usage() {
        assert!(!openai_stream_usage_event_filter(
            r#"data: {"choices":[{"delta":{"content":"hi"}}]}"#
        ));
        assert!(!openai_stream_usage_event_filter(""));
    }

    #[test]
    fn codex_filter_matches_response_completed_or_usage() {
        assert!(codex_stream_usage_event_filter(
            r#"data: {"type":"response.completed"}"#
        ));
        assert!(codex_stream_usage_event_filter(
            r#"data: {"usage":{"prompt_tokens":1}}"#
        ));
    }

    #[test]
    fn codex_filter_rejects_other_event_types() {
        assert!(!codex_stream_usage_event_filter(
            r#"data: {"type":"response.output_text.delta"}"#
        ));
    }

    #[test]
    fn gemini_filter_matches_usage_metadata() {
        assert!(gemini_stream_usage_event_filter(
            r#"data: {"usageMetadata":{"totalTokenCount":10}}"#
        ));
    }

    #[test]
    fn gemini_filter_rejects_non_usage_chunks() {
        assert!(!gemini_stream_usage_event_filter(
            r#"data: {"candidates":[{"content":{"parts":[{"text":"hi"}]}}]}"#
        ));
    }

    // =========================================================================
    // 模型提取器
    // =========================================================================

    #[test]
    fn claude_model_extractor_prefers_usage_model() {
        let events = vec![
            json!({
                "type": "message_start",
                "message": {
                    "id": "msg_1",
                    "model": "claude-sonnet-4",
                    "usage": { "input_tokens": 10 }
                }
            }),
            json!({ "type": "message_delta", "usage": { "output_tokens": 5 } }),
        ];
        assert_eq!(claude_model_extractor(&events, "fallback"), "claude-sonnet-4");
    }

    #[test]
    fn claude_model_extractor_falls_back_when_model_missing() {
        // 无 message_start，usage 缺失 -> 回退到 fallback
        let events = vec![json!({ "type": "message_delta", "usage": { "output_tokens": 5 } })];
        assert_eq!(claude_model_extractor(&events, "fallback-model"), "fallback-model");
    }

    #[test]
    fn claude_model_extractor_falls_back_when_model_empty() {
        // model 为空字符串应视为缺失，落到 fallback
        let events = vec![json!({
            "type": "message_start",
            "message": { "id": "msg_1", "model": "", "usage": { "input_tokens": 1 } }
        })];
        assert_eq!(claude_model_extractor(&events, "fallback"), "fallback");
    }

    #[test]
    fn claude_model_extractor_falls_back_on_empty_events() {
        let events: Vec<Value> = vec![];
        assert_eq!(claude_model_extractor(&events, "fallback"), "fallback");
    }

    #[test]
    fn openai_model_extractor_prefers_usage_model() {
        // 最后一个 chunk 带 usage 与 model
        let events = vec![
            json!({ "choices": [{ "delta": { "content": "hi" } }] }),
            json!({ "model": "gpt-4o", "usage": { "prompt_tokens": 3, "completion_tokens": 2 } }),
        ];
        assert_eq!(openai_model_extractor(&events, "fallback"), "gpt-4o");
    }

    #[test]
    fn openai_model_extractor_uses_event_model_when_no_usage() {
        // 无 usage（from_openai_stream_events 返回 None），但有事件带非空 model
        let events = vec![json!({ "model": "gpt-4o-mini", "choices": [] })];
        assert_eq!(openai_model_extractor(&events, "fallback"), "gpt-4o-mini");
    }

    #[test]
    fn openai_model_extractor_falls_back_when_no_model_anywhere() {
        let events = vec![json!({ "choices": [{ "delta": { "content": "x" } }] })];
        assert_eq!(openai_model_extractor(&events, "fallback"), "fallback");
    }

    #[test]
    fn openai_model_extractor_ignores_empty_model_in_event() {
        // 事件 model 为空字符串应跳过，落到 fallback
        let events = vec![json!({ "model": "", "choices": [] })];
        assert_eq!(openai_model_extractor(&events, "fallback"), "fallback");
    }

    #[test]
    fn codex_auto_extractor_prefers_response_completed_model() {
        let events = vec![
            json!({ "type": "response.output_text.delta", "delta": "hi" }),
            json!({
                "type": "response.completed",
                "response": { "model": "gpt-5-codex" }
            }),
        ];
        assert_eq!(codex_auto_model_extractor(&events, "fallback"), "gpt-5-codex");
    }

    #[test]
    fn codex_auto_extractor_falls_back_to_openai_model_when_no_completed() {
        // 无 response.completed -> 走 openai 回退，从事件 model 字段提取
        let events = vec![json!({ "model": "gpt-4o", "choices": [] })];
        assert_eq!(codex_auto_model_extractor(&events, "fallback"), "gpt-4o");
    }

    #[test]
    fn codex_auto_extractor_falls_back_when_model_empty_everywhere() {
        let events = vec![
            json!({ "type": "response.completed", "response": { "model": "" } }),
            json!({ "model": "" }),
        ];
        assert_eq!(codex_auto_model_extractor(&events, "fallback"), "fallback");
    }

    #[test]
    fn codex_auto_extractor_ignores_non_completed_event_model() {
        // 非 response.completed 事件即使带 model，也不在主路径提取；无 completed 且无 openai model -> fallback
        let events = vec![json!({ "type": "response.created", "response": { "model": "should-not-use" } })];
        assert_eq!(codex_auto_model_extractor(&events, "fallback"), "fallback");
    }

    #[test]
    fn gemini_model_extractor_prefers_usage_model() {
        let chunks = vec![json!({
            "usageMetadata": { "totalTokenCount": 7 },
            "modelVersion": "gemini-2.5-pro"
        })];
        assert_eq!(gemini_model_extractor(&chunks, "fallback"), "gemini-2.5-pro");
    }

    #[test]
    fn gemini_model_extractor_falls_back_when_no_usage() {
        // 无 usageMetadata -> from_gemini_stream_chunks 返回 None -> fallback
        let chunks = vec![json!({ "candidates": [] })];
        assert_eq!(gemini_model_extractor(&chunks, "fallback"), "fallback");
    }

    #[test]
    fn gemini_model_extractor_falls_back_on_empty_events() {
        let chunks: Vec<Value> = vec![];
        assert_eq!(gemini_model_extractor(&chunks, "fallback"), "fallback");
    }

    // =========================================================================
    // 预定义配置常量
    // =========================================================================

    #[test]
    fn predefined_configs_have_correct_app_type_str() {
        assert_eq!(CLAUDE_PARSER_CONFIG.app_type_str, "claude");
        assert_eq!(OPENAI_PARSER_CONFIG.app_type_str, "codex");
        assert_eq!(CODEX_PARSER_CONFIG.app_type_str, "codex");
        assert_eq!(GEMINI_PARSER_CONFIG.app_type_str, "gemini");
    }

    #[test]
    fn predefined_configs_all_carry_event_filters() {
        assert!(CLAUDE_PARSER_CONFIG.stream_event_filter.is_some());
        assert!(OPENAI_PARSER_CONFIG.stream_event_filter.is_some());
        assert!(CODEX_PARSER_CONFIG.stream_event_filter.is_some());
        assert!(GEMINI_PARSER_CONFIG.stream_event_filter.is_some());
    }

    #[test]
    fn handler_configs_point_to_matching_parser_config() {
        // UsageParserConfig 含函数指针，无法 derive PartialEq/Debug，
        // 改用各自 parser_config 的 app_type_str 间接验证指向正确。
        assert_eq!(CLAUDE_HANDLER_CONFIG.parser_config.app_type_str, "claude");
        assert_eq!(CODEX_CHAT_HANDLER_CONFIG.parser_config.app_type_str, "codex");
        assert_eq!(
            CODEX_RESPONSES_HANDLER_CONFIG.parser_config.app_type_str,
            "codex"
        );
        assert_eq!(GEMINI_HANDLER_CONFIG.parser_config.app_type_str, "gemini");
        // 验证函数指针非空（配置确实挂载了解析器）
        let _ = CLAUDE_HANDLER_CONFIG.parser_config.stream_parser;
        let _ = OPENAI_PARSER_CONFIG.stream_parser;
    }

    #[test]
    fn handler_configs_have_consistent_app_type_str() {
        assert_eq!(CLAUDE_HANDLER_CONFIG.app_type_str, "claude");
        assert_eq!(CLAUDE_HANDLER_CONFIG.app_type, AppType::Claude);
        assert_eq!(CODEX_CHAT_HANDLER_CONFIG.app_type, AppType::Codex);
        assert_eq!(CODEX_RESPONSES_HANDLER_CONFIG.app_type, AppType::Codex);
        assert_eq!(GEMINI_HANDLER_CONFIG.app_type, AppType::Gemini);
    }
}
