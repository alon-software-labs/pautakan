import { describe, expect, it, beforeEach } from 'vitest';
import type { College } from '../../src/types';
import rawColleges from '../../public/colleges.json';
import {
  __resetForTests as resetColleges,
  computeTopFiveByScore,
  getColleges,
  getTopFiveColleges,
  setTopFiveColleges,
} from './collegesService';
import {
  __resetForTests as resetGameState,
  getCategory,
  resetScoresAndCategoryIfFinals,
  setDivision,
  syncCategory,
} from './gameStateService';

describe('gameStateService', () => {
  beforeEach(() => {
    resetColleges();
    resetGameState();
  });

  it('starts in Eliminations category', () => {
    expect(getCategory()).toBe('Eliminations');
  });

  it('transitions to Finals only when there are exactly 5 qualifying colleges', () => {
    const allColleges = getColleges() as College[];
    const topFive = allColleges
      .slice(0, 5)
      .map((college, index) => ({ ...college, score: (index + 1) * 10 }));

    setTopFiveColleges(topFive);

    const result = syncCategory('Finals');

    expect(result.category).toBe('Finals');
    expect(result.topFiveColleges.length).toBe(5);
    expect(result.shouldSwitchToFinals).toBe(true);
  });

  it('reverts to Eliminations when less than 5 qualifying colleges exist', () => {
    const allColleges = getColleges() as College[];
    const topThree = allColleges
      .slice(0, 3)
      .map((college, index) => ({ ...college, score: (index + 1) * 10 }));

    setTopFiveColleges(topThree);

    const result = syncCategory('Finals');

    expect(result.category).toBe('Eliminations');
    expect(result.topFiveColleges.length).toBe(0);
    expect(result.shouldSwitchToFinals).toBe(false);
  });

  it('resets scores when switching divisions', () => {
    const collegesBefore = getColleges() as College[];
    const withScores = collegesBefore.map((college, index) => ({
      ...college,
      score: (index + 1) * 5,
    }));

    setTopFiveColleges(computeTopFiveByScore());

    // Simulate scores in the main collection
    (rawColleges as College[]).splice(0, withScores.length, ...withScores);

    setDivision('Teams');

    const collegesAfter = getColleges();
    expect(collegesAfter.every((college) => college.score === 0)).toBe(true);
  });

  it('resets scores and category when resetScoresAndCategoryIfFinals is called in Finals', () => {
    setTopFiveColleges(computeTopFiveByScore());

    syncCategory('Finals');

    const result = resetScoresAndCategoryIfFinals();

    expect(result.category).toBe('Eliminations');
    expect(result.categoryChanged).toBe(true);

    const collegesAfter = getColleges();
    expect(collegesAfter.every((college) => college.score === 0)).toBe(true);
  });
});

