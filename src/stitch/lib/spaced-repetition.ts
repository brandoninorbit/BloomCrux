
import type { RecallLevel } from '../types';
import { addDays } from 'date-fns';

const MIN_EASE_FACTOR = 1.3;

type RecallString = 'hard' | 'medium' | 'easy';

// map string -> number that the algorithm expects
const recallToNum = (r: number | RecallString): number => {
  if (typeof r === 'number') return r;
  return r === 'hard' ? 0 : r === 'medium' ? 1 : 4;
};


export function getNextReviewDate(recall: RecallLevel | number, currentInterval: number, currentEaseFactor: number) {
  let newEaseFactor = currentEaseFactor;
  let newInterval: number;

  const r = recallToNum(recall);

  if (r <= 0) { // hard
    newEaseFactor = Math.max(MIN_EASE_FACTOR, currentEaseFactor - 0.2);
    newInterval = 1; // Show again soon
  } else if (r === 1) { // medium
    // Ease factor remains the same
    newInterval = Math.round(currentInterval * newEaseFactor);
  } else { // easy
    newEaseFactor = currentEaseFactor + 0.15;
    newInterval = Math.round(currentInterval * newEaseFactor * 1.3);
  }

  // First review after a fail is always 1 day
  if (r <= 0 && currentInterval > 1) {
    newInterval = 1;
  }
  
  // For the very first review of a card
  if (currentInterval === 0) {
      if (r <= 0) newInterval = 0; // hard
      if (r === 1) newInterval = 1; // medium
      if (r >= 4) newInterval = 4; // easy
  }


  const nextReviewDate = addDays(new Date(), Math.max(1, newInterval));
  
  return {
    newInterval: Math.max(1, newInterval),
    newEaseFactor,
    nextReviewDate
  };
}
