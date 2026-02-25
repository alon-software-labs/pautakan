import type { College } from '../../src/types';
import {
  clearTopFiveColleges,
  computeTopFiveByScore,
  getTopFiveColleges,
  resetAllScores,
  resetScoresForColleges,
  setTopFiveColleges,
} from './collegesService';

type Category = 'Eliminations' | 'Finals';

let category: Category = 'Eliminations';
let difficulty = 'Easy';
let division = 'Teams';

export function getCategory(): Category {
  return category;
}

export function getDifficulty(): string {
  return difficulty;
}

export function getDivision(): string {
  return division;
}

export function setDifficulty(next?: string): string {
  if (next) {
    difficulty = next;
  }
  return difficulty;
}

export function setDivision(next?: string): string {
  if (next) {
    division = next;
  }
  resetAllScores();
  return division;
}

export interface SyncCategoryResult {
  category: Category;
  topFiveColleges: College[];
  shouldSwitchToFinals: boolean;
}

export function syncCategory(nextCategory?: Category): SyncCategoryResult {
  const previousCategory = category;

  if (nextCategory) {
    category = nextCategory;
  }

  if (previousCategory === 'Eliminations' && category === 'Finals') {
    let topFive = getTopFiveColleges();

    if (topFive.length === 0) {
      topFive = computeTopFiveByScore();
      setTopFiveColleges(topFive);
    }

    topFive = getTopFiveColleges();

    if (topFive.length === 5) {
      resetScoresForColleges(topFive);
      return {
        category,
        topFiveColleges: getTopFiveColleges(),
        shouldSwitchToFinals: true,
      };
    }

    category = 'Eliminations';
    clearTopFiveColleges();
    return { category, topFiveColleges: [], shouldSwitchToFinals: false };
  }

  return {
    category,
    topFiveColleges: getTopFiveColleges(),
    shouldSwitchToFinals: false,
  };
}

export interface ResetScoresResult {
  categoryChanged: boolean;
  category: Category;
}

export function resetScoresAndCategoryIfFinals(): ResetScoresResult {
  resetAllScores();

  if (category === 'Finals') {
    category = 'Eliminations';
    return { categoryChanged: true, category };
  }

  return { categoryChanged: false, category };
}

export function __resetForTests(): void {
  category = 'Eliminations';
  difficulty = 'Easy';
  division = 'Teams';
  resetAllScores();
  clearTopFiveColleges();
}


