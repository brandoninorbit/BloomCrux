'use client';

import type { BloomLevel, CardAttempt } from '../types';

const bloomXpValues: Record<BloomLevel, number> = {
    'Remember': 5,
    'Understand': 8,
    'Apply': 12,
    'Analyze': 14,
    'Evaluate': 16,
    'Create': 20,
};

function getBaseXp(level: BloomLevel): number {
    return bloomXpValues[level] || 10;
}

/**
 * Calculates the total XP for a correct answer, including base, weak-card, and recency bonuses.
 * @param level The Bloom's Level of the card.
 * @param previousAttempts An array of previous attempts for this specific card.
 * @returns An object with the base XP and bonus XP.
 */
export function calculateXpForCorrectAnswer(
    level: BloomLevel,
    previousAttempts: CardAttempt[]
): { base: number, weakCardBonus: number, recencyBonus: number } {
    const base = getBaseXp(level);
    let weakCardBonus = 0;
    let recencyBonus = 0; // This will be a negative bonus (a penalty)

    // --- Weak-Card Booster ---
    if (previousAttempts.length > 0) {
        const correctAttempts = previousAttempts.filter(a => a.wasCorrect).length;
        const accuracy = correctAttempts / previousAttempts.length;

        if (accuracy < 0.5) {
            // Tapering bonus: 50% bonus at 0% accuracy, down to 0% bonus at 50% accuracy.
            const bonusPercentage = (1 - accuracy / 0.5) * 0.5;
            weakCardBonus = Math.round(base * bonusPercentage);
        }
    }

    // --- Recency Decay ---
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCorrectAttempts = previousAttempts.filter(a =>
        a.wasCorrect && a.timestamp > twentyFourHoursAgo
    ).length;

    if (recentCorrectAttempts > 0) {
        // Apply a 70% penalty if answered correctly within 24 hours
        recencyBonus = -Math.round(base * 0.7);
    }
    
    // Ensure final XP isn't negative from recency penalty.
    // The base + recencyBonus will be at least 30% of base.
    // Weak card bonus is then added on top of that.
    return { base, weakCardBonus, recencyBonus };
}




