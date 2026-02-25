import { app, BrowserWindow } from 'electron';
import { createWindows } from './main/windows';
import { initializeIPC } from './ipc';
import { setMainWindow } from './events/broadcaster';

let mainView: BrowserWindow | null;

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    mainView = null;
    setMainWindow(null);
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const windows = createWindows();
    mainView = windows.mainView;
    setMainWindow(mainView);
  }
});

app.whenReady().then(async () => {
  try {
    const windows = createWindows();
    mainView = windows.mainView;
    setMainWindow(mainView);
    initializeIPC();
  } catch (err) {
    console.error('Failed to initialize application:', err);
  }
});
