use rusqlite::{Connection, Result};
use std::fs;
use std::path::{Path, PathBuf};

pub fn default_data_dir() -> PathBuf {
    dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("Phoenix Pro")
}

pub fn database_path() -> PathBuf {
    default_data_dir().join("phoenix.sqlite3")
}

pub fn initialize() -> Result<PathBuf> {
    let dir = default_data_dir();
    fs::create_dir_all(&dir)
        .map_err(|error| rusqlite::Error::ToSqlConversionFailure(Box::new(error)))?;
    let path = database_path();
    let connection = Connection::open(&path)?;
    connection.execute_batch(
        "PRAGMA journal_mode = WAL;
         PRAGMA foreign_keys = ON;
         CREATE TABLE IF NOT EXISTS schema_migrations (
           version INTEGER PRIMARY KEY,
           applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
         );
         CREATE TABLE IF NOT EXISTS connected_devices (
           id TEXT PRIMARY KEY,
           manufacturer TEXT,
           model TEXT,
           serial TEXT NOT NULL,
           mode TEXT NOT NULL,
           authorization TEXT NOT NULL,
           first_seen TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
           last_seen TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
         );
         CREATE TABLE IF NOT EXISTS service_jobs (
           id TEXT PRIMARY KEY,
           device_id TEXT,
           operation TEXT NOT NULL,
           state TEXT NOT NULL,
           evidence_json TEXT NOT NULL DEFAULT '{}',
           created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
           updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
         );
         CREATE TABLE IF NOT EXISTS audit_logs (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           event TEXT NOT NULL,
           reference TEXT,
           actor TEXT,
           created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
         );
         CREATE TABLE IF NOT EXISTS firmware_assets (
           id TEXT PRIMARY KEY,
           device_codename TEXT NOT NULL,
           source_url TEXT NOT NULL,
           version TEXT NOT NULL,
           algorithm TEXT,
           expected_checksum TEXT,
           verified INTEGER NOT NULL DEFAULT 0,
           created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
         );
         CREATE TABLE IF NOT EXISTS customers (
           id TEXT PRIMARY KEY,
           display_name TEXT NOT NULL,
           authorization_reference TEXT,
           retention_until TEXT,
           created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
         );
         CREATE TABLE IF NOT EXISTS approval_requests (
           id TEXT PRIMARY KEY,
           job_id TEXT,
           customer_name TEXT NOT NULL,
           device_serial TEXT NOT NULL,
           operation TEXT NOT NULL,
           consent_text TEXT NOT NULL,
           signature TEXT NOT NULL,
           status TEXT NOT NULL,
           payload_json TEXT NOT NULL,
           created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
           reviewed_at TEXT,
           reviewer TEXT,
           rejection_reason TEXT
         );
         CREATE TABLE IF NOT EXISTS licenses (
           id TEXT PRIMARY KEY,
           request_id TEXT NOT NULL REFERENCES approval_requests(id),
           job_id TEXT,
           device_serial TEXT NOT NULL,
           operation TEXT NOT NULL,
           issued_at TEXT NOT NULL,
           expires_at TEXT NOT NULL,
           token TEXT NOT NULL UNIQUE,
           public_key TEXT NOT NULL,
           revoked_at TEXT,
           revoked_reason TEXT
         );
         CREATE TABLE IF NOT EXISTS admin_credentials (
           id INTEGER PRIMARY KEY CHECK (id = 1),
           salt TEXT NOT NULL,
           password_hash TEXT NOT NULL,
           updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
         );
         CREATE TABLE IF NOT EXISTS settings (
           key TEXT PRIMARY KEY,
           value TEXT NOT NULL,
           updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
         );",
    )?;
    Ok(path)
}

#[allow(dead_code)]
pub fn open_existing(path: &Path) -> Result<Connection> {
    Connection::open(path)
}
