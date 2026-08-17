# Bundled FFmpeg

Place the licensed FFmpeg executable for each target in this directory before packaging:

- Windows: `ffmpeg.exe`
- macOS: `ffmpeg` (universal or target architecture)

The Tauri bundle copies this directory to the installed app resources. The client uses the bundled executable first and falls back to `ffmpeg` on `PATH` for development.

Do not commit an unverified binary. Record the FFmpeg version, build flags, license text, and source URL alongside the release artifact.
