import { ipcMain } from 'electron';
import type { College } from '../../src/types';
import { getTopFiveColleges, setTopFiveColleges } from '../services/collegesService';
import {
  getCategory,
  setDifficulty,
  setDivision,
  syncCategory,
} from '../services/gameStateService';
import {
  notifyCategorySynced,
  notifyCloseTopFive,
  notifyDifficultySynced,
  notifyDivisionSynced,
  notifySwitchToFinals,
  notifyTopFiveColleges,
  notifyTopThreeColleges,
} from '../events/broadcaster';

export function registerGameFlowHandlers(): void {
  ipcMain.handle('sync-category', (_, data?: 'Eliminations' | 'Finals') => {
    const result = syncCategory(data);

    if (result.shouldSwitchToFinals) {
      notifySwitchToFinals(result.topFiveColleges);
    } else {
      notifyCategorySynced(result.category);
    }

    return {
      category: result.category,
      topFiveColleges: result.topFiveColleges,
    };
  });

  ipcMain.handle(
    'sync-difficulty',
    (_, data?: string, clincherColleges?: College[]) => {
      const difficulty = setDifficulty(data);
      notifyDifficultySynced(difficulty, clincherColleges);
      return { success: true };
    },
  );

  ipcMain.handle('sync-division', (_, data?: string) => {
    const division = setDivision(data);
    notifyDivisionSynced(division);
    return { success: true };
  });

  ipcMain.handle('update-top-five', (_, selectedColleges: College[]) => {
    setTopFiveColleges(selectedColleges);

    if (getCategory() === 'Finals') {
      notifySwitchToFinals(getTopFiveColleges());
    }

    return { success: true };
  });

  ipcMain.handle('show-top-five', (_, selectedColleges: College[]) => {
    setTopFiveColleges(selectedColleges);

    const topFive = getTopFiveColleges();

    if (getCategory() === 'Finals') {
      notifySwitchToFinals(topFive);
    }

    notifyTopFiveColleges(topFive);

    return { success: true };
  });

  ipcMain.handle('show-top-three', (_, selectedColleges: College[]) => {
    const topFive = getTopFiveColleges();

    notifySwitchToFinals(topFive);
    notifyTopThreeColleges(selectedColleges);

    return { success: true };
  });

  ipcMain.handle('close-top-five', () => {
    notifyCloseTopFive();
    return { success: true };
  });
}

