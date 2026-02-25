import { describe, expect, it, beforeEach } from 'vitest';
import type { College } from '../../src/types';
import rawColleges from '../../public/colleges.json';
import {
  __resetForTests,
  computeTopFiveByScore,
  getColleges,
  getTopFiveColleges,
  resetAllScores,
  updateCollegeScore,
} from './collegesService';

describe('collegesService', () => {
  beforeEach(() => {
    __resetForTests();
  });

  it('returns all colleges', () => {
    const colleges = getColleges();
    expect(colleges.length).toBe((rawColleges as College[]).length);
  });

  it('computes top five colleges by score with positive scores only', () => {
    const topFive = computeTopFiveByScore();

    expect(topFive.length).toBeLessThanOrEqual(5);
    expect(topFive.every((college) => college.score > 0)).toBe(true);
  });

  it('updates scores for a college and reflects in top five when applicable', () => {
    const [first] = getColleges();

    updateCollegeScore(first.shorthand, 100);

    const updated = getColleges().find(
      (college) => college.shorthand === first.shorthand,
    );

    expect(updated?.score).toBe(100);

    const topFive = getTopFiveColleges();
    const inTopFive = topFive.find(
      (college) => college.shorthand === first.shorthand,
    );

    if (inTopFive) {
      expect(inTopFive.score).toBe(100);
    }
  });

  it('resets all scores and clears top five', () => {
    resetAllScores();

    const colleges = getColleges();
    expect(colleges.every((college) => college.score === 0)).toBe(true);
    expect(getTopFiveColleges().length).toBe(0);
  });
});

