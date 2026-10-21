// =============================================================================
// frontend/src-tauri/src/main.rs - Tauri v2 Desktop Host & Sidecar Lifecycle
// =============================================================================

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{Manager, RunEvent};
use tauri_plugin_shell::{
    process::{CommandChild, CommandEvent},
    ShellExt,
};

struct Backend(Mutex<Option<CommandChild>>);

// Compile-time credentials, injected during build_all.ps1 / build_backend.ps1
const SUPABASE_URL: Option<&str> = option_env!("CIPHER_SUPABASE_URL");
const SUPABASE_ANON_KEY: Option<&str> = option_env!("CIPHER_SUPABASE_ANON_KEY");

fn main() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init())
        .manage(Backend(Mutex::new(None)))
        .setup(|app| {
            let data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&data_dir)?;

            log::info!("Starting Cipher Labs FastAPI sidecar engine...");

            let mut cmd = app
                .shell()
                .sidecar("cipher-backend")?
                .env("CIPHER_APP_DATA", data_dir.to_string_lossy().to_string());

            if let (Some(url), Some(key)) = (SUPABASE_URL, SUPABASE_ANON_KEY) {
                cmd = cmd.env("SUPABASE_URL", url).env("SUPABASE_ANON_KEY", key);
            }

            let (mut rx, child) = cmd.spawn()?;
            *app.state::<Backend>().0.lock().unwrap() = Some(child);

            // Stream sidecar logs (never logging credentials)
            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    if let CommandEvent::Stdout(line) | CommandEvent::Stderr(line) = event {
                        log::info!("backend: {}", String::from_utf8_lossy(&line).trim());
                    }
                }
            });

            // Poll /api/health with timeout up to 15 seconds
            let start = Instant::now();
            let mut healthy = false;
            while start.elapsed() < Duration::from_secs(15) {
                if let Ok(resp) = ureq::get("http://127.0.0.1:8765/api/health")
                    .timeout(Duration::from_millis(500))
                    .call()
                {
                    if resp.status() == 200 {
                        healthy = true;
                        log::info!("FastAPI sidecar engine verified healthy on port 8765.");
                        break;
                    }
                }
                std::thread::sleep(Duration::from_millis(250));
            }

            if !healthy {
                log::warn!("Backend health poll timed out. Continuing in offline/mock diagnostic mode.");
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building Cipher Labs")
        .run(|app, event| {
            if let RunEvent::Exit = event {
                // Ensure sidecar process is terminated cleanly upon app closure
                if let Some(child) = app.state::<Backend>().0.lock().unwrap().take() {
                    let _ = child.kill();
                    log::info!("FastAPI sidecar process terminated.");
                }
            }
        });
}
