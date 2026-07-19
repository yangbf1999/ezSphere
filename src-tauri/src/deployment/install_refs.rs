// Source: EchoBird 4.7.2 (MIT) — standalone install ref lookup.
// Separated from bundled_assets.rs for modularity.

/// Get the bundled install reference JSON for a given tool_id.
/// Returns the raw JSON string embedded at compile time.
pub fn get_install_ref(tool_id: &str) -> Option<&'static str> {
    match tool_id {
        "claudecode" => Some(include_str!("../../../docs/api/tools/install/claudecode.json")),
        "codex" => Some(include_str!("../../../docs/api/tools/install/codex.json")),
        "hermes" => Some(include_str!("../../../docs/api/tools/install/hermes.json")),
        _ => None,
    }
}
