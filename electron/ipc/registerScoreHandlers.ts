import { ipcMain } from 'electron';
import {
  broadcastScoreUpdated,
  broadcastScoresReset,
  notifyCategorySynced,
  notifyRefresh,
  notifySwitchToFinals,
} from '../events/broadcaster';
import {
  getColleges,
  getTopFiveColleges,
  updateCollegeScore,
} from '../services/collegesService';
import { getCategory, resetScoresAndCategoryIfFinals } from '../services/gameStateService';

export function registerScoreHandlers(): void {
  ipcMain.handle('get-colleges', () => {
    if (getCategory() === 'Finals') {
      const topFive = getTopFiveColleges();
      if (topFive.length === 5) {
        return topFive;
      }
    }

    return getColleges();
  });

  ipcMain.handle(
    'update-college-score',
    async (_, shorthand: string, newScore: number) => {
      try {
        const updated = updateCollegeScore(shorthand, newScore);

        if (!updated) {
          return {
            success: false,
            error: new Error(`College with shorthand ${shorthand} not found`),
          };
        }

        broadcastScoreUpdated(shorthand, newScore);

        return { success: true };
      } catch (err) {
        console.error(`Error updating score for ${shorthand}:`, err);
        return { success: false, error: err };
      }
    },
  );

  ipcMain.handle('reset-scores', () => {
    try {
      const { categoryChanged, category } = resetScoresAndCategoryIfFinals();

      if (categoryChanged) {
        notifyCategorySynced(category);
      }

      broadcastScoresReset();

      return { success: true };
    } catch (err) {
      console.error('Error resetting scores:', err);
      return { success: false, error: err };
    }
  });

  ipcMain.handle('refresh', () => {
    const topFive = getTopFiveColleges();

    if (getCategory() === 'Finals' && topFive.length === 5) {
      notifySwitchToFinals(topFive);
    } else {
      notifyRefresh();
    }

    return { success: true };
  });

  ipcMain.handle('get-top-five', () => {
    return getTopFiveColleges();
  });
}

