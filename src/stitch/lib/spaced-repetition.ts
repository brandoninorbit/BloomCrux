import type { RecallLevel } from '../types';
import { addDays } from 'date-fns';

const MIN_EASE_FACTOR = 1.3;

function normRecall(r: RecallLevel | number): RecallLevel {
  if (typeof r === 'number') {
    if (r <= 0) return 'hard';
    if (r === 1) return 'medium';
    return 'easy';
  }
  return r;
}

export function getNextReviewDate(recall: RecallLevel | number, currentInterval: number, currentEaseFactor: number) {
  let newEaseFactor = currentEaseFactor;
  let newInterval: number;

  const normalizedRecall = normRecall(recall);

  if (normalizedRecall === 'hard') {
    newEaseFactor = Math.max(MIN_EASE_FACTOR, currentEaseFactor - 0.2);
    newInterval = 1; // Show again soon
  } else if (normalizedRecall === 'medium') {
    // Ease factor remains the same
    newInterval = Math.round(currentInterval * newEaseFactor);
  } else { // 'easy'
    newEaseFactor = currentEaseFactor + 0.15;
    newInterval = Math.round(currentInterval * newEaseFactor * 1.3);
  }

  // First review after a fail is always 1 day
  if (normalizedRecall === 'hard' && currentInterval > 1) {
    newInterval = 1;
  }
  
  // For the very first review of a card
  if (currentInterval === 0) {
      if (normalizedRecall === 'hard') newInterval = 0;
      if (normalizedRecall === 'medium') newInterval = 1;
      if (normalizedRecall === 'easy') newInterval = 4;
  }


  const nextReviewDate = addDays(new Date(), Math.max(1, newInterval));
  
  return {
    newInterval: Math.max(1, newInterval),
    newEaseFactor,
    nextReviewDate
  };
}

    