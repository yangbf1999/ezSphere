//! 已安装工具数据访问对象
//!
//! 管理 installed_tools 表的 CRUD 操作（ADR-004）。
//! 记录工具安装状态（已装/损坏/未装），与 providers 表通过 provider_id 软关联。

use crate::database::{lock_conn, Database};
use crate::error::AppError;
use rusqlite::params;

/// 已安装工具记录
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct InstalledTool {
    pub tool_id: String,
    pub display_name: String,
    pub exe_path: Option<String>,
    pub version: Option<String>,
    pub status: String,
    pub installed_at: Option<i64>,
    pub provider_id: Option<i64>,
}

impl Database {
    /// 插入一条已安装工具记录
    pub fn insert_installed_tool(&self, tool: &InstalledTool) -> Result<(), AppError> {
        let conn = lock_conn!(self.conn);
        conn.execute(
            "INSERT INTO installed_tools (tool_id, display_name, exe_path, version, status, installed_at, provider_id)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                tool.tool_id,
                tool.display_name,
                tool.exe_path,
                tool.version,
                tool.status,
                tool.installed_at,
                tool.provider_id,
            ],
        )
        .map_err(|e| AppError::Database(format!("insert_installed_tool 失败: {e}")))?;
        Ok(())
    }

    /// 按 tool_id 查询已安装工具
    pub fn get_installed_tool(&self, tool_id: &str) -> Result<Option<InstalledTool>, AppError> {
        let conn = lock_conn!(self.conn);
        let mut stmt = conn
            .prepare(
                "SELECT tool_id, display_name, exe_path, version, status, installed_at, provider_id
                 FROM installed_tools WHERE tool_id = ?1",
            )
            .map_err(|e| AppError::Database(e.to_string()))?;

        let mut rows = stmt
            .query(params![tool_id])
            .map_err(|e| AppError::Database(e.to_string()))?;

        if let Some(row) = rows.next().map_err(|e| AppError::Database(e.to_string()))? {
            Ok(Some(InstalledTool {
                tool_id: row.get(0).map_err(|e| AppError::Database(e.to_string()))?,
                display_name: row.get(1).map_err(|e| AppError::Database(e.to_string()))?,
                exe_path: row.get(2).map_err(|e| AppError::Database(e.to_string()))?,
                version: row.get(3).map_err(|e| AppError::Database(e.to_string()))?,
                status: row.get(4).map_err(|e| AppError::Database(e.to_string()))?,
                installed_at: row.get(5).map_err(|e| AppError::Database(e.to_string()))?,
                provider_id: row.get(6).map_err(|e| AppError::Database(e.to_string()))?,
            }))
        } else {
            Ok(None)
        }
    }

    /// 列出全部已安装工具记录
    pub fn list_installed_tools(&self) -> Result<Vec<InstalledTool>, AppError> {
        let conn = lock_conn!(self.conn);
        let mut stmt = conn
            .prepare(
                "SELECT tool_id, display_name, exe_path, version, status, installed_at, provider_id
                 FROM installed_tools ORDER BY installed_at DESC",
            )
            .map_err(|e| AppError::Database(e.to_string()))?;

        let rows = stmt
            .query_map([], |row| {
                Ok(InstalledTool {
                    tool_id: row.get(0)?,
                    display_name: row.get(1)?,
                    exe_path: row.get(2)?,
                    version: row.get(3)?,
                    status: row.get(4)?,
                    installed_at: row.get(5)?,
                    provider_id: row.get(6)?,
                })
            })
            .map_err(|e| AppError::Database(e.to_string()))?;

        let mut result = Vec::new();
        for row in rows {
            result.push(row.map_err(|e| AppError::Database(e.to_string()))?);
        }
        Ok(result)
    }

    /// 更新已安装工具的状态（installed / broken / not_installed）
    pub fn upsert_installed_tool_status(
        &self,
        tool_id: &str,
        status: &str,
        exe_path: Option<&str>,
        version: Option<&str>,
    ) -> Result<(), AppError> {
        let conn = lock_conn!(self.conn);
        conn.execute(
            "INSERT INTO installed_tools (tool_id, display_name, exe_path, version, status, installed_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)
             ON CONFLICT(tool_id) DO UPDATE SET
                status = excluded.status,
                exe_path = COALESCE(excluded.exe_path, installed_tools.exe_path),
                version = COALESCE(excluded.version, installed_tools.version)",
            params![
                tool_id,
                tool_id, // display_name 复用 tool_id 作为默认值
                exe_path,
                version,
                status,
                chrono::Utc::now().timestamp(),
            ],
        )
        .map_err(|e| AppError::Database(format!("upsert_installed_tool_status 失败: {e}")))?;
        Ok(())
    }

    /// 更新 provider_id 回填（建档后调用）
    pub fn update_installed_tool_provider_id(
        &self,
        tool_id: &str,
        provider_id: i64,
    ) -> Result<(), AppError> {
        let conn = lock_conn!(self.conn);
        conn.execute(
            "UPDATE installed_tools SET provider_id = ?1 WHERE tool_id = ?2",
            params![provider_id, tool_id],
        )
        .map_err(|e| AppError::Database(format!("update_installed_tool_provider_id 失败: {e}")))?;
        Ok(())
    }

    /// 删除已安装工具记录
    pub fn delete_installed_tool(&self, tool_id: &str) -> Result<(), AppError> {
        let conn = lock_conn!(self.conn);
        conn.execute("DELETE FROM installed_tools WHERE tool_id = ?1", params![tool_id])
            .map_err(|e| AppError::Database(format!("delete_installed_tool 失败: {e}")))?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::Database;

    fn test_db() -> Database {
        let db = Database::memory().expect("create memory db");
        // apply_schema_migrations handles v11→v12 (installed_tools table)
        db.apply_schema_migrations().expect("apply migrations");
        db
    }

    #[test]
    fn test_insert_and_get() {
        let db = test_db();
        let tool = InstalledTool {
            tool_id: "claude".into(),
            display_name: "Claude Code".into(),
            exe_path: Some("/usr/local/bin/claude".into()),
            version: Some("1.0.0".into()),
            status: "installed".into(),
            installed_at: Some(chrono::Utc::now().timestamp()),
            provider_id: None,
        };
        db.insert_installed_tool(&tool).unwrap();
        let retrieved = db.get_installed_tool("claude").unwrap().unwrap();
        assert_eq!(retrieved.tool_id, "claude");
        assert_eq!(retrieved.display_name, "Claude Code");
        assert_eq!(retrieved.status, "installed");
    }

    #[test]
    fn test_upsert_status() {
        let db = test_db();
        db.upsert_installed_tool_status("codex", "installed", Some("/usr/local/bin/codex"), Some("0.1.0")).unwrap();
        let tool = db.get_installed_tool("codex").unwrap().unwrap();
        assert_eq!(tool.status, "installed");

        // upsert to broken
        db.upsert_installed_tool_status("codex", "broken", None, None).unwrap();
        let tool = db.get_installed_tool("codex").unwrap().unwrap();
        assert_eq!(tool.status, "broken");
    }

    #[test]
    fn test_list() {
        let db = test_db();
        db.upsert_installed_tool_status("claude", "installed", None, None).unwrap();
        db.upsert_installed_tool_status("codex", "installed", None, None).unwrap();
        let list = db.list_installed_tools().unwrap();
        assert_eq!(list.len(), 2);
    }

    #[test]
    fn test_delete() {
        let db = test_db();
        db.upsert_installed_tool_status("hermes", "installed", None, None).unwrap();
        assert!(db.get_installed_tool("hermes").unwrap().is_some());
        db.delete_installed_tool("hermes").unwrap();
        assert!(db.get_installed_tool("hermes").unwrap().is_none());
    }
}
