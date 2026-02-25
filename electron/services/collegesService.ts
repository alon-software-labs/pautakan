import type { College } from '../../src/types';
import rawColleges from '../../public/colleges.json';

const originalColleges: College[] = (rawColleges as College[]).map(
  (college) => ({ ...college }),
);

let colleges: College[] = originalColleges.map((college) => ({ ...college }));
let topFiveColleges: College[] = [];

export function getColleges(): College[] {
  return colleges;
}

export function getTopFiveColleges(): College[] {
  return topFiveColleges;
}

export function setTopFiveColleges(selected: College[]): void {
  topFiveColleges = [...selected];
}

export function clearTopFiveColleges(): void {
  topFiveColleges = [];
}

export function computeTopFiveByScore(): College[] {
  return [...colleges]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .filter((college) => college.score > 0);
}

export function resetScoresForColleges(items: College[]): void {
  const ids = new Set(items.map((college) => college.id));

  colleges = colleges.map((college) =>
    ids.has(college.id) ? { ...college, score: 0 } : college,
  );

  topFiveColleges = topFiveColleges.map((college) =>
    ids.has(college.id) ? { ...college, score: 0 } : college,
  );
}

export function updateCollegeScore(
  shorthand: string,
  newScore: number,
): boolean {
  let updated = false;

  colleges = colleges.map((college) => {
    if (college.shorthand === shorthand) {
      updated = true;
      return { ...college, score: newScore };
    }
    return college;
  });

  topFiveColleges = topFiveColleges.map((college) =>
    college.shorthand === shorthand ? { ...college, score: newScore } : college,
  );

  return updated;
}

export function resetAllScores(): void {
  colleges = colleges.map((college) => ({ ...college, score: 0 }));
  topFiveColleges = [];
}

export function __resetForTests(): void {
  colleges = originalColleges.map((college) => ({ ...college }));
  topFiveColleges = [];
}


