use serde::{Deserialize, Serialize};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

struct PushProcess(Mutex<Option<Child>>);

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PushOptions {
    push_url: String,
    mode: String,
    camera_device: Option<String>,
    audio_device: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct PushStatus { running: bool, message: String }

fn validate_push_url(url: &str) -> Result<(), String> {
    if (url.starts_with("rtmp://") || url.starts_with("rtmps://")) && !url.contains(['\n', '\r', '"', '\'']) { Ok(()) } else { Err("仅支持安全的 RTMP 推流地址".into()) }
}

fn ffmpeg_command(app: &AppHandle) -> Command {
    let bundled = app.path().resource_dir().ok().map(|dir| {
        if cfg!(target_os = "windows") { dir.join("ffmpeg").join("ffmpeg.exe") } else { dir.join("ffmpeg").join("ffmpeg") }
    });
    let executable = bundled.filter(|path| path.is_file()).unwrap_or_else(|| std::path::PathBuf::from("ffmpeg"));
    Command::new(executable)
}

#[tauri::command]
fn start_native_push(app: AppHandle, options: PushOptions, process: State<'_, PushProcess>) -> Result<PushStatus, String> {
    validate_push_url(&options.push_url)?;
    if options.mode != "camera" && options.mode != "game" { return Err("不支持的采集模式".into()); }
    let mut slot = process.0.lock().map_err(|_| "推流状态锁不可用".to_string())?;
    if let Some(child) = slot.as_mut() {
        if child.try_wait().map_err(|e| e.to_string())?.is_none() { return Err("已有推流进程正在运行".into()); }
    }
    #[cfg(target_os = "macos")]
    let input = if options.mode == "camera" { "0:0" } else { "1:none" };
    #[cfg(target_os = "macos")]
    let mut command = { let mut cmd = ffmpeg_command(&app); cmd.args(["-hide_banner", "-loglevel", "warning", "-f", "avfoundation", "-framerate", "30", "-video_size", "1280x720", "-i", input, "-c:v", "libx264", "-preset", "veryfast", "-tune", "zerolatency", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-f", "flv", &options.push_url]); cmd };
    #[cfg(target_os = "windows")]
    let mut command = {
        let camera = options.camera_device.as_deref().ok_or("Windows 端需要选择摄像头设备")?;
        let audio = options.audio_device.as_deref().ok_or("Windows 端需要选择麦克风设备")?;
        if camera.contains(['"', '\n', '\r']) || audio.contains(['"', '\n', '\r']) { return Err("采集设备名称无效".into()); }
        let mut cmd = ffmpeg_command(&app);
        if options.mode == "camera" {
            cmd.args(["-hide_banner", "-loglevel", "warning", "-f", "dshow", "-video_size", "1280x720", "-i", &format!("video={camera}:audio={audio}"), "-c:v", "libx264", "-preset", "veryfast", "-tune", "zerolatency", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-f", "flv", &options.push_url]);
        } else {
            cmd.args(["-hide_banner", "-loglevel", "warning", "-f", "gdigrab", "-framerate", "30", "-i", "desktop", "-f", "dshow", "-i", &format!("audio={audio}"), "-map", "0:v:0", "-map", "1:a:0", "-c:v", "libx264", "-preset", "veryfast", "-tune", "zerolatency", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-f", "flv", &options.push_url]);
        }
        cmd
    };
    #[cfg(target_os = "linux")]
    let mut command = return Err("Linux 端需要配置 v4l2/PulseAudio 设备名称".into());
    let child = command.stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::piped()).spawn().map_err(|e| format!("启动 FFmpeg 失败，请确认已安装或随 App 内置 FFmpeg：{e}"))?;
    *slot = Some(child);
    Ok(PushStatus { running: true, message: "原生推流已启动".into() })
}

#[tauri::command]
fn list_capture_devices(app: AppHandle) -> Result<Vec<String>, String> {
    #[cfg(target_os = "windows")]
    {
        let output = ffmpeg_command(&app).args(["-hide_banner", "-list_devices", "true", "-f", "dshow", "-i", "dummy"]).output().map_err(|e| format!("无法运行 FFmpeg：{e}"))?;
        let text = String::from_utf8_lossy(&output.stderr);
        return Ok(text.lines().filter_map(|line| { let start = line.find('"')?; let rest = &line[start + 1..]; let end = rest.find('"')?; Some(rest[..end].to_string()) }).collect());
    }
    #[cfg(not(target_os = "windows"))]
    { let _ = app; Err("当前仅实现 Windows DirectShow 设备枚举".into()) }
}

#[tauri::command]
fn stop_native_push(process: State<'_, PushProcess>) -> Result<PushStatus, String> {
    let mut slot = process.0.lock().map_err(|_| "推流状态锁不可用".to_string())?;
    if let Some(mut child) = slot.take() { let _ = child.kill(); let _ = child.wait(); }
    Ok(PushStatus { running: false, message: "原生推流已停止".into() })
}

#[tauri::command]
fn native_push_status(process: State<'_, PushProcess>) -> Result<PushStatus, String> {
    let mut slot = process.0.lock().map_err(|_| "推流状态锁不可用".to_string())?;
    let running = if let Some(child) = slot.as_mut() { child.try_wait().map_err(|e| e.to_string())?.is_none() } else { false };
    Ok(PushStatus { running, message: if running { "原生推流中" } else { "未推流" }.into() })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(PushProcess(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![greet, start_native_push, stop_native_push, native_push_status, list_capture_devices])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
