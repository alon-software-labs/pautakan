import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL,
} from './env';
import { getAppIconPath } from '../assets/icons';

export interface AppWindows {
  mainView: BrowserWindow;
  techView: BrowserWindow;
}

export function createWindows(): AppWindows {
  const iconPath = getAppIconPath();

  const mainWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(MAIN_DIST, 'preload.mjs'),
    },
    frame: false,
  };

  const techWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 1000,
    height: 1080,
    resizable: false,
    useContentSize: true,
    webPreferences: {
      preload: path.join(MAIN_DIST, 'preload.mjs'),
    },
  };

  if (iconPath) {
    mainWindowOptions.icon = iconPath;
    techWindowOptions.icon = iconPath;
  }

  const mainView = new BrowserWindow(mainWindowOptions);

  const techView = new BrowserWindow(techWindowOptions);

  techView.on('close', () => {
    app.quit();
  });

  if (VITE_DEV_SERVER_URL) {
    mainView.loadURL(VITE_DEV_SERVER_URL);
    techView.loadURL(`${VITE_DEV_SERVER_URL}/control.html`);
  } else {
    mainView.loadFile(path.join(RENDERER_DIST, 'index.html'));
    techView.loadFile(path.join(RENDERER_DIST, 'control.html'));
  }

  return { mainView, techView };
}

