// Source: EchoBird 4.7.2 (MIT) concept — adapter for ezSphere probe_tool_installations.
// Adapts ToolInstallationReport into a simpler ToolStatus for frontend consumption.

use crate::commands::misc::ToolInstallationReport;

/// Simplified tool status for the Deployment/repair UI.
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolStatus {
    pub tool_id: String,
    pub display_name: String,
    pub installed: bool,
    pub version: Option<String>,
    pub path: Option<String>,
    pub is_conflict: bool,
}

/// Adapt a ezSphere ToolInstallationReport into ToolStatus.
pub fn adapt(report: &ToolInstallationReport) -> ToolStatus {
    let display_name = match report.tool.as_str() {
        "claude" => "Claude Code",
        "codex" => "Codex",
        "hermes" => "Hermes Agent",
        other => other,
    };

    // Pick the best installation info from the report
    let (version, path) = report.installs.first().map(|inst| {
        (inst.version.clone(), Some(inst.path.clone()))
    }).unwrap_or((None, None));

    let installed = !report.installs.is_empty();

    ToolStatus {
        tool_id: report.tool.clone(),
        display_name: display_name.to_string(),
        installed,
        version,
        path,
        is_conflict: report.is_conflict,
    }
}

/// Adapt multiple reports at once.
pub fn adapt_all(reports: &[ToolInstallationReport]) -> Vec<ToolStatus> {
    reports.iter().map(adapt).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_report(tool: &str, installed: bool, conflict: bool) -> ToolInstallationReport {
        let installs = if installed {
            vec![crate::commands::misc::ToolInstallation {
                path: format!("/usr/local/bin/{}", tool.clone()),
                version: Some("1.0.0".into()),
                runnable: true,
                error: None,
                source: "path".into(),
                is_path_default: true,
                real: std::path::PathBuf::from("/usr/local/bin"),
            }]
        } else {
            vec![]
        };
        ToolInstallationReport {
            tool: tool.into(),
            installs,
            is_conflict: conflict,
            needs_confirmation: false,
            command: format!("npm install -g {}", tool),
            anchored: installed,
        }
    }

    #[test]
    fn adapts_installed_tool() {
        let report = make_report("claude", true, false);
        let status = adapt(&report);
        assert!(status.installed);
        assert_eq!(status.tool_id, "claude");
        assert!(!status.is_conflict);
    }

    #[test]
    fn adapts_not_installed() {
        let report = make_report("codex", false, false);
        let status = adapt(&report);
        assert!(!status.installed);
    }

    #[test]
    fn adapts_conflict() {
        let report = make_report("hermes", true, true);
        let status = adapt(&report);
        assert!(status.is_conflict);
    }
}
