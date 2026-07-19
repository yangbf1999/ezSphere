use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ProxyError {
    #[error("服务器已在运行")]
    AlreadyRunning,

    #[error("服务器未运行")]
    NotRunning,

    #[error("地址绑定失败: {0}")]
    BindFailed(String),

    #[error("停止超时")]
    StopTimeout,

    #[error("停止失败: {0}")]
    StopFailed(String),

    #[error("请求转发失败: {0}")]
    ForwardFailed(String),

    #[error("无可用的Provider")]
    NoAvailableProvider,

    #[error("所有供应商已熔断，无可用渠道")]
    AllProvidersCircuitOpen,

    #[error("未配置供应商")]
    NoProvidersConfigured,

    #[allow(dead_code)]
    #[error("Provider不健康: {0}")]
    ProviderUnhealthy(String),

    #[error("上游错误 (状态码 {status}): {body:?}")]
    UpstreamError { status: u16, body: Option<String> },

    #[error("超过最大重试次数")]
    MaxRetriesExceeded,

    #[error("数据库错误: {0}")]
    DatabaseError(String),

    #[error("配置错误: {0}")]
    ConfigError(String),

    #[allow(dead_code)]
    #[error("格式转换错误: {0}")]
    TransformError(String),

    #[allow(dead_code)]
    #[error("无效的请求: {0}")]
    InvalidRequest(String),

    #[error("超时: {0}")]
    Timeout(String),

    /// 流式响应空闲超时
    #[allow(dead_code)]
    #[error("流式响应空闲超时: {0}秒无数据")]
    StreamIdleTimeout(u64),

    /// 认证错误
    #[error("认证失败: {0}")]
    AuthError(String),

    #[allow(dead_code)]
    #[error("内部错误: {0}")]
    Internal(String),
}

impl IntoResponse for ProxyError {
    fn into_response(self) -> Response {
        let (status, body) = match &self {
            ProxyError::UpstreamError {
                status: upstream_status,
                body: upstream_body,
            } => {
                let http_status =
                    StatusCode::from_u16(*upstream_status).unwrap_or(StatusCode::BAD_GATEWAY);

                // 尝试解析上游响应体为 JSON，如果失败则包装为字符串
                let error_body = if let Some(body_str) = upstream_body {
                    if let Ok(json_body) = serde_json::from_str::<serde_json::Value>(body_str) {
                        // 上游返回的是 JSON，直接透传
                        json_body
                    } else {
                        // 上游返回的不是 JSON，包装为错误消息
                        json!({
                            "error": {
                                "message": body_str,
                                "type": "upstream_error",
                            }
                        })
                    }
                } else {
                    json!({
                        "error": {
                            "message": format!("Upstream error (status {})", upstream_status),
                            "type": "upstream_error",
                        }
                    })
                };

                (http_status, error_body)
            }
            _ => {
                let (http_status, message) = match &self {
                    ProxyError::AlreadyRunning => (StatusCode::CONFLICT, self.to_string()),
                    ProxyError::NotRunning => (StatusCode::SERVICE_UNAVAILABLE, self.to_string()),
                    ProxyError::BindFailed(_) => {
                        (StatusCode::INTERNAL_SERVER_ERROR, self.to_string())
                    }
                    ProxyError::StopTimeout => {
                        (StatusCode::INTERNAL_SERVER_ERROR, self.to_string())
                    }
                    ProxyError::StopFailed(_) => {
                        (StatusCode::INTERNAL_SERVER_ERROR, self.to_string())
                    }
                    ProxyError::ForwardFailed(_) => (StatusCode::BAD_GATEWAY, self.to_string()),
                    ProxyError::NoAvailableProvider => {
                        (StatusCode::SERVICE_UNAVAILABLE, self.to_string())
                    }
                    ProxyError::AllProvidersCircuitOpen => {
                        (StatusCode::SERVICE_UNAVAILABLE, self.to_string())
                    }
                    ProxyError::NoProvidersConfigured => {
                        (StatusCode::SERVICE_UNAVAILABLE, self.to_string())
                    }
                    ProxyError::ProviderUnhealthy(_) => {
                        (StatusCode::SERVICE_UNAVAILABLE, self.to_string())
                    }
                    ProxyError::MaxRetriesExceeded => {
                        (StatusCode::SERVICE_UNAVAILABLE, self.to_string())
                    }
                    ProxyError::DatabaseError(_) => {
                        (StatusCode::INTERNAL_SERVER_ERROR, self.to_string())
                    }
                    ProxyError::ConfigError(_) => (StatusCode::BAD_REQUEST, self.to_string()),
                    ProxyError::TransformError(_) => {
                        (StatusCode::UNPROCESSABLE_ENTITY, self.to_string())
                    }
                    ProxyError::InvalidRequest(_) => (StatusCode::BAD_REQUEST, self.to_string()),
                    ProxyError::Timeout(_) => (StatusCode::GATEWAY_TIMEOUT, self.to_string()),
                    ProxyError::StreamIdleTimeout(_) => {
                        (StatusCode::GATEWAY_TIMEOUT, self.to_string())
                    }
                    ProxyError::AuthError(_) => (StatusCode::UNAUTHORIZED, self.to_string()),
                    ProxyError::Internal(_) => {
                        (StatusCode::INTERNAL_SERVER_ERROR, self.to_string())
                    }
                    ProxyError::UpstreamError { .. } => unreachable!(),
                };

                let error_body = json!({
                    "error": {
                        "message": message,
                        "type": "proxy_error",
                    }
                });

                (http_status, error_body)
            }
        };

        (status, Json(body)).into_response()
    }
}

/// 错误分类
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ErrorCategory {
    /// 可重试错误（网络问题、5xx）
    Retryable, // 网络超时、5xx 错误
    /// 不可重试错误（4xx、认证失败）
    NonRetryable, // 认证失败、参数错误、4xx 错误
    #[allow(dead_code)]
    ClientAbort, // 客户端主动中断
}

/// 判断错误是否可重试
#[allow(dead_code)]
pub fn categorize_error(error: &reqwest::Error) -> ErrorCategory {
    if error.is_timeout() || error.is_connect() {
        return ErrorCategory::Retryable;
    }

    if let Some(status) = error.status() {
        if status.is_server_error() {
            ErrorCategory::Retryable
        } else if status.is_client_error() {
            ErrorCategory::NonRetryable
        } else {
            ErrorCategory::Retryable
        }
    } else {
        ErrorCategory::Retryable
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::StatusCode;
    use axum::response::IntoResponse;

    fn status_of(err: ProxyError) -> StatusCode {
        let resp = err.into_response();
        resp.status()
    }

    #[test]
    fn already_running_is_conflict() {
        assert_eq!(status_of(ProxyError::AlreadyRunning), StatusCode::CONFLICT);
    }

    #[test]
    fn not_running_is_service_unavailable() {
        assert_eq!(status_of(ProxyError::NotRunning), StatusCode::SERVICE_UNAVAILABLE);
    }

    #[test]
    fn bind_failed_is_internal_server_error() {
        assert_eq!(
            status_of(ProxyError::BindFailed("addr".into())),
            StatusCode::INTERNAL_SERVER_ERROR
        );
    }

    #[test]
    fn stop_timeout_is_internal_server_error() {
        assert_eq!(status_of(ProxyError::StopTimeout), StatusCode::INTERNAL_SERVER_ERROR);
    }

    #[test]
    fn stop_failed_is_internal_server_error() {
        assert_eq!(
            status_of(ProxyError::StopFailed("x".into())),
            StatusCode::INTERNAL_SERVER_ERROR
        );
    }

    #[test]
    fn forward_failed_is_bad_gateway() {
        assert_eq!(
            status_of(ProxyError::ForwardFailed("upstream".into())),
            StatusCode::BAD_GATEWAY
        );
    }

    #[test]
    fn no_available_provider_is_service_unavailable() {
        assert_eq!(status_of(ProxyError::NoAvailableProvider), StatusCode::SERVICE_UNAVAILABLE);
    }

    #[test]
    fn all_providers_circuit_open_is_service_unavailable() {
        assert_eq!(
            status_of(ProxyError::AllProvidersCircuitOpen),
            StatusCode::SERVICE_UNAVAILABLE
        );
    }

    #[test]
    fn no_providers_configured_is_service_unavailable() {
        assert_eq!(
            status_of(ProxyError::NoProvidersConfigured),
            StatusCode::SERVICE_UNAVAILABLE
        );
    }

    #[test]
    fn provider_unhealthy_is_service_unavailable() {
        assert_eq!(
            status_of(ProxyError::ProviderUnhealthy("p".into())),
            StatusCode::SERVICE_UNAVAILABLE
        );
    }

    #[test]
    fn max_retries_exceeded_is_service_unavailable() {
        assert_eq!(
            status_of(ProxyError::MaxRetriesExceeded),
            StatusCode::SERVICE_UNAVAILABLE
        );
    }

    #[test]
    fn database_error_is_internal_server_error() {
        assert_eq!(
            status_of(ProxyError::DatabaseError("db".into())),
            StatusCode::INTERNAL_SERVER_ERROR
        );
    }

    #[test]
    fn config_error_is_bad_request() {
        assert_eq!(
            status_of(ProxyError::ConfigError("cfg".into())),
            StatusCode::BAD_REQUEST
        );
    }

    #[test]
    fn transform_error_is_unprocessable_entity() {
        assert_eq!(
            status_of(ProxyError::TransformError("t".into())),
            StatusCode::UNPROCESSABLE_ENTITY
        );
    }

    #[test]
    fn invalid_request_is_bad_request() {
        assert_eq!(
            status_of(ProxyError::InvalidRequest("bad".into())),
            StatusCode::BAD_REQUEST
        );
    }

    #[test]
    fn timeout_is_gateway_timeout() {
        assert_eq!(
            status_of(ProxyError::Timeout("slow".into())),
            StatusCode::GATEWAY_TIMEOUT
        );
    }

    #[test]
    fn stream_idle_timeout_is_gateway_timeout() {
        assert_eq!(
            status_of(ProxyError::StreamIdleTimeout(30)),
            StatusCode::GATEWAY_TIMEOUT
        );
    }

    #[test]
    fn auth_error_is_unauthorized() {
        assert_eq!(
            status_of(ProxyError::AuthError("bad key".into())),
            StatusCode::UNAUTHORIZED
        );
    }

    #[test]
    fn internal_error_is_internal_server_error() {
        assert_eq!(
            status_of(ProxyError::Internal("boom".into())),
            StatusCode::INTERNAL_SERVER_ERROR
        );
    }

    // ---- UpstreamError 透传逻辑 ----

    #[test]
    fn upstream_error_uses_upstream_status_code() {
        let resp = ProxyError::UpstreamError {
            status: 429,
            body: Some(r#"{"error":"rate limited"}"#.into()),
        }
        .into_response();
        assert_eq!(resp.status(), StatusCode::TOO_MANY_REQUESTS);
    }

    #[test]
    fn upstream_error_falls_back_to_bad_gateway_on_invalid_status() {
        let resp = ProxyError::UpstreamError {
            status: 9999, // 非法 u16 状态码
            body: Some("oops".into()),
        }
        .into_response();
        assert_eq!(resp.status(), StatusCode::BAD_GATEWAY);
    }

    #[test]
    fn upstream_error_with_no_body_synthesizes_message() {
        let resp = ProxyError::UpstreamError {
            status: 503,
            body: None,
        }
        .into_response();
        assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    }

    #[test]
    fn upstream_error_with_non_json_body_wraps_as_message() {
        // 非 JSON body 应包装为 {"error":{"message":..., "type":"upstream_error"}}
        let resp = ProxyError::UpstreamError {
            status: 500,
            body: Some("plain text failure".into()),
        }
        .into_response();
        assert_eq!(resp.status(), StatusCode::INTERNAL_SERVER_ERROR);
    }

    // ---- ErrorCategory ----

    #[test]
    fn error_category_variants_are_distinct() {
        assert_ne!(ErrorCategory::Retryable, ErrorCategory::NonRetryable);
        assert_ne!(ErrorCategory::Retryable, ErrorCategory::ClientAbort);
        assert_ne!(ErrorCategory::NonRetryable, ErrorCategory::ClientAbort);
    }

    #[test]
    fn error_category_is_copy_and_eq() {
        let a = ErrorCategory::Retryable;
        let b = a; // Copy
        assert_eq!(a, b);
    }
}
