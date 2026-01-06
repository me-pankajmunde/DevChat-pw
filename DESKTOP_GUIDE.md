# Desktop App Conversion Guide

This project has been converted to support running as a Desktop Application using **Electron**.

## Quick Start

### 1. Run in Development Mode
To run the desktop app locally with hot-reloading (frontend):

```bash
npm run electron:dev
```
This command will:
1. Start the Vite development server.
2. Launch the Electron window loading that server.

### 2. Build for Production
To build the installable desktop app for your OS (Windows, macOS*, or Linux):

```bash
npm run electron:build
```
*Note: Building for macOS typically requires a Mac. Windows builds can be done on Windows or Linux (with Wine).*

The output artifacts (installers) will be in the `dist` or `release` folder (default is `dist/` or `electron-dist` depending on config, here checking `dist` output form builder).

## Project Structure Changes

- **`electron/`**: Contains the Electron main process (`main.cjs`) and preload script (`preload.cjs`).
- **`package.json`**: Added `main` entry point and build scripts.
- **`vite.config.ts`**: Updated `base` to `./` to support relative file paths in production.

## Backend Note

The **Python Backend (`backend/`)** is **optional** and is **NOT** bundled with the desktop app by default.
- If you use the app with Supabase and direct OpenAI calls, you normally do not need the Python backend.
- If you rely on the Python backend for specific OAuth flows, you will need to run `python backend/main.py` separately, or further customize the Electron build to bundle the Python executable.
