import { BrowserWindow } from 'electron';
import type { College } from '../../src/types';

let mainWindow: BrowserWindow | null = null;

export function setMainWindow(window: BrowserWindow | null): void {
  mainWindow = window;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function notifyCategorySynced(category: string): void {
  mainWindow?.webContents.send('category-synced', category);
}

export function notifyDifficultySynced(
  difficulty: string,
  clincherColleges?: College[],
): void {
  mainWindow?.webContents.send(
    'difficulty-synced',
    difficulty,
    clincherColleges,
  );
}

export function notifyDivisionSynced(division: string): void {
  mainWindow?.webContents.send('division-synced', division);
}

export function notifySwitchToFinals(colleges: College[]): void {
  mainWindow?.webContents.send('switch-to-finals', colleges);
}

export function notifyTopFiveColleges(colleges: College[]): void {
  mainWindow?.webContents.send('top-five-colleges', colleges);
}

export function notifyTopThreeColleges(colleges: College[]): void {
  mainWindow?.webContents.send('top-three-colleges', colleges);
}

export function notifyCloseTopFive(): void {
  mainWindow?.webContents.send('close-top-five');
}

export function notifyRefresh(): void {
  mainWindow?.webContents.send('refresh');
}

export function broadcastScoreUpdated(
  shorthand: string,
  newScore: number,
): void {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send('score-updated', shorthand, newScore);
    window.webContents.send('db-updated');
  });
}

export function broadcastScoresReset(): void {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send('scores-reset');
  });
}

