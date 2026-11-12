// =============================================================================
// frontend/src-tauri/src/main.rs - Tauri v2 Desktop Host & Sidecar Lifecycle
// =============================================================================

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use std::time::{Duration, Instant};
use std::{fs, path::Path};
use tauri::{AppHandle, Manager, RunEvent};
use tauri_plugin_shell::{
    process::{CommandChild, CommandEvent},
    ShellExt,
};

struct Backend(Mutex<Option<CommandChild>>);

#[tauri::command]
fn restore_file_to_device(
    app: AppHandle,
    file_name: String,
    file_bytes: Vec<u8>,
) -> Result<Vec<String>, String> {
    if file_name.is_empty()
        || file_name == "."
        || file_name == ".."
        || file_name.contains('/')
        || file_name.contains('\\')
    {
        return Err("The recovery file name is invalid.".to_string());
    }

    let app_data_dir = app.path().app_data_dir().map_err(|error| error.to_string())?;
    let downloads_dir = app.path().download_dir().map_err(|error| error.to_string())?;
    let restored_dir = app_data_dir.join("restored-output");
    let internal_downloads_dir = app_data_dir.join("Downloads");
    fs::create_dir_all(&restored_dir).map_err(|error| error.to_string())?;
    fs::create_dir_all(&internal_downloads_dir).map_err(|error| error.to_string())?;
    fs::create_dir_all(&downloads_dir).map_err(|error| error.to_string())?;

    let mut written_paths = Vec::new();
    for directory in [&restored_dir, &internal_downloads_dir, &downloads_dir] {
        match write_unique_file(directory, &file_name, &file_bytes) {
            Ok(path) => written_paths.push(path),
            Err(error) => {
                for path in &written_paths {
                    let _ = fs::remove_file(path);
                }
                return Err(error);
            }
        }
    }

    Ok(written_paths
        .iter()
        .map(|path| path.to_string_lossy().into_owned())
        .collect())
}

fn write_unique_file(directory: &Path, file_name: &str, bytes: &[u8]) -> Result<std::path::PathBuf, String> {
    use std::fs::OpenOptions;
    use std::io::Write;

    let requested = Path::new(file_name);
    let stem = requested
        .file_stem()
        .and_then(|value| value.to_str())
        .ok_or_else(|| "The recovery file name is invalid.".to_string())?;
    let extension = requested.extension().and_then(|value| value.to_str());

    for suffix in 0..1000 {
        let candidate_name = if suffix == 0 {
            file_name.to_string()
        } else if let Some(extension) = extension {
            format!("{stem} ({suffix}).{extension}")
        } else {
            format!("{stem} ({suffix})")
        };
        let candidate = directory.join(candidate_name);
        match OpenOptions::new().write(true).create_new(true).open(&candidate) {
            Ok(mut file) => {
                if let Err(error) = file.write_all(bytes) {
                    let _ = fs::remove_file(&candidate);
                    return Err(error.to_string());
                }
                return Ok(candidate);
            }
            Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => continue,
            Err(error) => return Err(error.to_string()),
        }
    }

    Err("Could not find an unused destination name for the restored file.".to_string())
}

// Compile-time credentials injected by build_all.ps1.
const MONGODB_URI: Option<&str> = option_env!("CIPHER_MONGODB_URI");
const JWT_SECRET: Option<&str> = option_env!("CIPHER_JWT_SECRET");
const MONGODB_DB_NAME: Option<&str> = option_env!("CIPHER_MONGODB_DB_NAME");

fn main() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![restore_file_to_device])
        .manage(Backend(Mutex::new(None)))
        .setup(|app| {
            let data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&data_dir)?;

            log::info!("Starting Cipher Labs FastAPI sidecar engine with MongoDB Atlas...");

            let mut cmd = app
                .shell()
                .sidecar("cipher-backend")?
                .env("CIPHER_APP_DATA", data_dir.to_string_lossy().to_string());

            if let Some(uri) = MONGODB_URI {
                cmd = cmd.env("MONGODB_URI", uri);
            }
            if let Some(jwt) = JWT_SECRET {
                cmd = cmd.env("JWT_SECRET", jwt);
            }
            if let Some(database_name) = MONGODB_DB_NAME {
                cmd = cmd.env("MONGODB_DB_NAME", database_name);
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
