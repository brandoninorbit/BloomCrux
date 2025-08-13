
import type { ShopItem } from '@/types';

// This file acts as the "database" for all available shop items.
// In a larger application, this would be fetched from Firestore.

export const GLOBAL_SHOP_ITEMS: ShopItem[] = [
    {
        id: 'retry',
        name: 'Retry',
        description: 'Get a second chance on a wrong answer during a study session.',
        cost: 20,
        icon: 'RefreshCw',
        type: 'power-up'
    },
    {
        id: 'hint',
        name: 'Hint',
        description: 'Reveal a helpful clue or memory aid for the current flashcard.',
        cost: 50,
        icon: 'Lightbulb',
        type: 'power-up'
    },
    {
        id: 'fifty-fifty',
        name: '50/50',
        description: 'Eliminate two incorrect options from a multiple-choice question.',
        cost: 100,
        icon: 'CheckCheck',
        type: 'power-up'
    },
    {
        id: 'time',
        name: 'Time Warp',
        description: 'Instantly add 15 seconds to the clock in a Timed Drill mission.',
        cost: 15,
        icon: 'Timer',
        type: 'power-up'
    },
    {
        id: 'focus',
        name: 'Focus Lens',
        description: 'Highlight important keywords or phrases on the flashcard.',
        cost: 20,
        icon: 'Search',
        type: 'power-up'
    },
    {
        id: 'unlock',
        name: 'Bloom Unlock',
        description: 'Bypass the 80% mastery requirement to unlock the next Bloom level.',
        cost: 200,
        icon: 'LockOpen',
        type: 'power-up'
    }
];


