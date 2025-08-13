
// src/lib/xp.ts

/**
 * Calculates the streak bonus XP based on a logistic curve.
 * Bonus starts at 3 consecutive correct answers and caps at 100 XP.
 * @param streak The current number of consecutive correct answers.
 * @returns The bonus XP earned for the streak.
 */
export function getStreakBonus(streak: number): number {
  if (streak < 3) {
    return 0;
  }

  // Adjusted logistic function parameters
  const K = 102;  // Max bonus is capped at 100, K is slightly higher to reach the cap
  const r = 0.9;  // Steepness of the curve
  const x0 = 6;   // Midpoint of the curve (at a 6-card streak)

  // Calculate bonus using logistic function
  const rawBonus = K / (1 + Math.exp(-r * (streak - x0)));
  
  // Start the bonus at 2 for a 3-streak and ensure it doesn't exceed 100
  return Math.min(100, Math.round(rawBonus));
}



