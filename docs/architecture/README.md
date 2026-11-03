# Architecture

The MVP is a React + TypeScript shell whose domain model is designed to map onto a future Tauri 2/Rust core. UI fixtures stand in for local SQLite records and native adapter responses. The frontend must remain unable to invoke arbitrary processes; future commands should be narrow, validated, typed, and auditable.
