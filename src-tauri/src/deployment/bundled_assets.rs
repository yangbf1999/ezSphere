// Source: EchoBird 4.7.2 (MIT). Modifications: include_str! paths + INSTALLABLE_TOOL_IDS narrowed to 3 tools.

// Bundled install/script assets — embedded at compile time via include_str!.
// Lets the smart-install flow work fully offline; no network round-trips for
// system prompt, hints, install references, or task scripts.
//
// Source of truth lives in repo-root `docs/api/...`.
// Bundled via `include_str!` at compile time — no network needed.

pub const MOTHER_SYSTEM_PROMPT: &str = include_str!("../../../docs/api/mother/system_prompt.md");
pub const MOTHER_HINTS_JSON: &str = include_str!("../../../docs/api/mother/hints.json");
pub const INSTALL_INDEX_JSON: &str = include_str!("../../../docs/api/tools/install/index.json");

pub fn get_install_ref(tool_id: &str) -> Option<&'static str> {
    match tool_id {
        "claudecode" => Some(include_str!(
            "../../../docs/api/tools/install/claudecode.json"
        )),
        "codex" => Some(include_str!("../../../docs/api/tools/install/codex.json")),
        "hermes" => Some(include_str!("../../../docs/api/tools/install/hermes.json")),
        _ => None,
    }
}

pub fn get_tool_script(name: &str) -> Option<&'static str> {
    match name {
        "network-info" => Some(include_str!("../../../docs/api/tools/network-info.md")),
        "security-audit" => Some(include_str!("../../../docs/api/tools/security-audit.md")),
        _ => None,
    }
}

pub const INSTALLABLE_TOOL_IDS: &[&str] = &["claudecode", "codex", "hermes"];

/// Build the full embedded-references block to append to the system prompt.
/// The agent reads from these bundled references instead of web_fetch.
pub fn build_embedded_refs_section() -> String {
    let mut out = String::with_capacity(48 * 1024);
    out.push_str("\n\n---\n\n## OFFLINE-FIRST: Embedded Install References\n\n");
    out.push_str(
        "The references below are bundled with EzSphere. **PREFER \
         them over `web_fetch`** — these offline references work without a network. \
         Only fall back to `web_fetch` for tools not in this list.\n\n",
    );

    out.push_str("### Tool Install JSONs\n\n");
    for tool_id in INSTALLABLE_TOOL_IDS {
        if let Some(json) = get_install_ref(tool_id) {
            out.push_str(&format!(
                "#### `{}` install reference\n```json\n{}\n```\n\n",
                tool_id,
                json.trim()
            ));
        }
    }

    out.push_str("### Quick-Action Task Scripts\n\n");
    for name in &["network-info", "security-audit"] {
        if let Some(md) = get_tool_script(name) {
            out.push_str(&format!(
                "#### `{}.md` (use this when the matching Quick Action runs)\n{}\n\n",
                name,
                md.trim()
            ));
        }
    }

    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn installable_tool_ids_match_supported_refs() {
        assert_eq!(INSTALLABLE_TOOL_IDS, &["claudecode", "codex", "hermes"]);
    }

    #[test]
    fn get_install_ref_returns_json_for_known_tools() {
        for tool_id in INSTALLABLE_TOOL_IDS {
            let json = get_install_ref(tool_id).unwrap_or_else(|| {
                panic!("missing install ref for {tool_id}")
            });
            let v: serde_json::Value = serde_json::from_str(json)
                .unwrap_or_else(|e| panic!("install ref for {tool_id} is not valid JSON: {e}"));
            assert!(v.is_object(), "install ref for {tool_id} should be a JSON object");
        }
    }

    #[test]
    fn get_install_ref_returns_none_for_unknown_tool() {
        assert!(get_install_ref("nonexistent-tool").is_none());
        assert!(get_install_ref("").is_none());
    }

    #[test]
    fn get_tool_script_returns_markdown_for_known_scripts() {
        for name in &["network-info", "security-audit"] {
            let md = get_tool_script(name).unwrap_or_else(|| panic!("missing script {name}"));
            assert!(!md.trim().is_empty(), "script {name} should be non-empty");
        }
    }

    #[test]
    fn get_tool_script_returns_none_for_unknown_script() {
        assert!(get_tool_script("unknown-script").is_none());
    }

    #[test]
    fn bundled_constants_are_non_empty() {
        assert!(!MOTHER_SYSTEM_PROMPT.trim().is_empty());
        assert!(!MOTHER_HINTS_JSON.trim().is_empty());
        assert!(!INSTALL_INDEX_JSON.trim().is_empty());
    }

    #[test]
    fn mother_hints_json_is_valid_json() {
        let v: serde_json::Value = serde_json::from_str(MOTHER_HINTS_JSON)
            .expect("MOTHER_HINTS_JSON should be valid JSON");
        assert!(v.is_object() || v.is_array());
    }

    #[test]
    fn install_index_json_is_valid_json() {
        let v: serde_json::Value = serde_json::from_str(INSTALL_INDEX_JSON)
            .expect("INSTALL_INDEX_JSON should be valid JSON");
        assert!(v.is_object() || v.is_array());
    }

    #[test]
    fn build_embedded_refs_section_contains_all_sections() {
        let s = build_embedded_refs_section();
        assert!(s.contains("OFFLINE-FIRST: Embedded Install References"));
        assert!(s.contains("### Tool Install JSONs"));
        assert!(s.contains("### Quick-Action Task Scripts"));
    }

    #[test]
    fn build_embedded_refs_section_includes_every_installable_tool() {
        let s = build_embedded_refs_section();
        for tool_id in INSTALLABLE_TOOL_IDS {
            let header = format!("#### `{tool_id}` install reference");
            assert!(s.contains(&header), "missing section for {tool_id}");
        }
    }

    #[test]
    fn build_embedded_refs_section_includes_quick_action_scripts() {
        let s = build_embedded_refs_section();
        assert!(s.contains("#### `network-info.md`"));
        assert!(s.contains("#### `security-audit.md`"));
    }

    #[test]
    fn build_embedded_refs_section_wraps_json_in_code_fence() {
        let s = build_embedded_refs_section();
        for tool_id in INSTALLABLE_TOOL_IDS {
            let marker = format!("#### `{tool_id}` install reference");
            let idx = s.find(&marker).unwrap();
            let after = &s[idx..];
            assert!(after.contains("```json"), "json code fence missing for {tool_id}");
        }
    }
}
