# Pautakan 2025

### Quickstart

1. Install packages with `npm install`.
2. Start the development environment with `npm run dev`.
3. To package the app, run `npm run build`.

This project uses Electron, React, TailwindCSS, and SQLite3.

### Guide

The backend of this application can be found in the `electron` folder. This is home to the main process, where operations such as database initialization and interprocess communication is defined. Everything else is part of the renderer process, or the frontend. Frontend files can be found in the `src` folder.

### Electron backend architecture

- **Main entry**: `electron/main.ts` wires Electron app lifecycle, creates windows via `electron/main/windows.ts`, and initializes IPC through `electron/ipc/index.ts`.
- **Environment & paths**: `electron/main/env.ts` centralizes `APP_ROOT`, `MAIN_DIST`, `RENDERER_DIST`, and `VITE_PUBLIC` resolution for both development and production builds.
- **Window creation**: `electron/main/windows.ts` is responsible for creating the main display window and the control window. It uses `electron/assets/icons.ts` to select an appropriate app icon with platform-aware fallbacks.
- **Business logic services**: `electron/services/collegesService.ts` and `electron/services/gameStateService.ts` own all in-memory state and domain rules (scores, categories, finals transitions, divisions). They are pure TypeScript modules with no Electron imports and are covered by unit tests.
- **IPC layer**: `electron/ipc/registerGameFlowHandlers.ts` and `electron/ipc/registerScoreHandlers.ts` register IPC channels and delegate to the services layer. Outbound events are sent through `electron/events/broadcaster.ts`, which encapsulates all `BrowserWindow` messaging.
- **Preload bridge**: `electron/preload.ts` exposes a minimal, typed bridge to the renderer via `window.ipcRenderer`.

To extend the backend for future editions:

1. Add or adjust domain behavior in the services under `electron/services/`.
2. Expose that behavior to the renderer by adding or updating IPC handlers in `electron/ipc/`.
3. If new renderer events are needed, add corresponding helpers in `electron/events/broadcaster.ts` instead of calling `BrowserWindow` directly.
4. Keep `electron/main.ts` focused on app lifecycle and window wiring; avoid placing business logic there.

### Existing Issues

- [x] The control window's HTML isn't rendered in the packaged version of the app.
- [x] Fonts don't render in the packaged version of the app.
- [x] The DS-Digital font isn't rendering in any version.
