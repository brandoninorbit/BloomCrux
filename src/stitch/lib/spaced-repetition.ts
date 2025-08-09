import type { RecallLevel } from '../types';
import { addDays } from 'date-fns';

const MIN_EASE_FACTOR = 1.3;

export function getNextReviewDate(recall: RecallLevel, currentInterval: number, currentEaseFactor: number) {
  let newEaseFactor = currentEaseFactor;
  let newInterval: number;

  if (recall === 'hard') {
    newEaseFactor = Math.max(MIN_EASE_FACTOR, currentEaseFactor - 0.2);
    newInterval = 1; // Show again soon
  } else if (recall === 'medium') {
    // Ease factor remains the same
    newInterval = Math.round(currentInterval * newEaseFactor);
  } else { // 'easy'
    newEaseFactor = currentEaseFactor + 0.15;
    newInterval = Math.round(currentInterval * newEaseFactor * 1.3);
  }

  // First review after a fail is always 1 day
  if (recall === 'hard' && currentInterval > 1) {
    newInterval = 1;
  }
  
  // For the very first review of a card
  if (currentInterval === 0) {
      if (recall === 'hard') newInterval = 0;
      if (recall === 'medium') newInterval = 1;
      if (recall === 'easy') newInterval = 4;
  }


  const nextReviewDate = addDays(new Date(), Math.max(1, newInterval));
  
  return {
    newInterval: Math.max(1, newInterval),
    newEaseFactor,
    nextReviewDate
  };
}



