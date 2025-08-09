// src/types/index.ts
import type { Timestamp } from 'firebase/firestore';

export type RecallLevel = 'easy' | 'medium' | 'hard';
export type CardFormat = 'text' | 'code' | 'Standard MCQ' | 'Two-Tier MCQ' | 'Fill in the Blank' | 'Short Answer' | 'Drag and Drop Sorting' | 'Sequencing' | 'Compare/Contrast' | 'CER' | 'other';
export type BloomLevel = 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
export type DOKLevel = 1 | 2 | 3 | 4;

export interface BaseCard {
    id: string; // Changed from number to string for consistency
    questionStem: string;
    topic: string;
    subTopic?: string;
    bloomLevel: BloomLevel;
    dokLevel?: DOKLevel;
    cardFormat: CardFormat;
    isStarred?: boolean;
}

export interface TextCard extends BaseCard {
    cardFormat: 'text';
    front: string;
    back: string;
}

export interface CodeCard extends BaseCard {
    cardFormat: 'code';
    front: string;
    back: string;
}

export interface StandardMCQCard extends BaseCard {
    cardFormat: 'Standard MCQ';
    tier1: {
        question: string;
        options: string[];
        correctAnswerIndex: number;
        distractorRationale?: Record<string, string>;
    };
}

export interface TwoTierMCQCard extends BaseCard {
  cardFormat: 'Two-Tier MCQ';
  tier1: {
      question: string;
      options: string[];
      correctAnswerIndex: number;
      distractorRationale?: Record<string, string>;
  };
  tier2: {
      question: string;
      options: string[];
      correctAnswerIndex: number;
  };
}


export interface FillInTheBlankCard extends BaseCard {
    cardFormat: 'Fill in the Blank';
    prompt: string; // e.g., "The powerhouse of the cell is the {}."
    correctAnswer: string;
}

export interface ShortAnswerCard extends BaseCard {
    cardFormat: 'Short Answer';
    prompt: string;
    suggestedAnswer: string;
    acceptanceCriteria?: string;
}

export interface DndItem {
    term: string;
    correctCategory: string;
}
export interface DragAndDropSortingCard extends BaseCard {
    cardFormat: 'Drag and Drop Sorting';
    prompt: string;
    items: DndItem[];
    categories: string[];
}

export interface SequencingCard extends BaseCard {
    cardFormat: 'Sequencing';
    prompt: string;
    items: string[];
    correctOrder: string[];
}

export interface CompareContrastCard extends BaseCard {
    cardFormat: 'Compare/Contrast';
    itemA: string;
    itemB: string;
    pairs: Array<{
        feature: string;
        pointA: string;
        pointB: string;
    }>;
}

export interface CERPart {
    key: 'claim' | 'evidence' | 'reasoning';
    inputType: 'text' | 'mcq';
    options?: string[];
    correctIndex?: number;
    sampleAnswer?: string;
}
export interface CERCard extends BaseCard {
    cardFormat: 'CER';
    prompt: string; // Scenario or data set
    question: string; // The guiding question
    parts: CERPart[];
}


export type Flashcard = BaseCard & (
  | TextCard
  | CodeCard
  | StandardMCQCard
  | TwoTierMCQCard
  | FillInTheBlankCard
  | ShortAnswerCard
  | DragAndDropSortingCard
  | SequencingCard
  | CompareContrastCard
  | CERCard
);


export type Deck = {
    id: string; // From document ID
    title: string;
    deckName?: string; // Add this to align with progress object
    description: string;
    cards: Flashcard[];
    isMastered?: boolean;
    totalCards?: number; // Add this to align with progress object
};

export type Topic = {
    id: string;
    name: string;
    decks: Deck[];
};

export type CardAttempt = {
    id: string; // from doc ID
    userId: string;
    deckId: string;
    cardId: string;
    timestamp: Date;
    wasCorrect: boolean;
    bloomLevel: BloomLevel;
}

export type BloomMastery = {
    [key in BloomLevel]?: {
        correct: number;
        total: number;
    };
};

export interface DeckProgress {
    deckId: string;
    deckName: string;
    totalCards: number;
    isMastered: boolean;
    lastStudied: Date | Timestamp;
    bloomMastery: BloomMastery;
    level: number;
    xp: number;
    xpToNext: number;
}


export interface GlobalProgress {
    level: number;
    xp: number;
    xpToNext: number;
    total: number;
    reviewed: number;
    percent: number;
}

export interface UserXpStats {
    sessionXP: number;
    dailyXP: number;
    bonusVault: number;
    commanderXP: number;
    sessionStart: Date;
    lastDailyReset: Date;
    isXpBoosted: boolean;
}

export type UserDeckProgress = {
    lastCardIndex: number;
    mode: 'quest' | 'remix' | 'practice' | 'timed' | 'starred';
    randomOrder?: string[];
    level: number;
    xp: number;
    xpToNext: number;
    streak: number;
    deckName?: string;
    totalCards?: number;
    isMastered?: boolean;
};

// Represents the power-ups a user has available to use.
export interface UserPowerUps {
    retry?: number;
    hint?: number;
    ['fifty-fifty']?: number;
}

export type PowerUpType = 'retry' | 'hint' | 'fifty-fifty' | 'time' | 'focus' | 'unlock';

export type PurchaseCounts = {
    [key in PowerUpType]?: number;
};

export interface UserSettings {
    displayName: string | null;
    email: string | null;
    tokens: number;
    unlockedLevels: { [deckId: string]: BloomLevel[] }; // Tracks which bloom levels are unlocked per deck
    notifications: {
        inAppAlerts: boolean;
        emailProgressSummary: boolean;
        emailStreakReminders: boolean;
        emailPowerUpAnnouncements: boolean;
    };
    appearance: {
        theme: 'light' | 'dark' | 'system';
        accentColor: string;
        fontSize: number; // as a multiplier, e.g., 1.0, 1.2
        cardAnimations: {
            flip: boolean;
            speed: number; // multiplier
        };
        soundEffects: {
            flip: boolean;
            correctChime: boolean;
            incorrectChime: boolean;
        }
    };
    studyDefaults: {
        bloomFilter: 'all' | BloomLevel;
        defaultDeckCover: string | null;
        timedDrill: {
            defaultTime: number; // seconds
            autoAdvance: boolean;
        }
    };
    privacy: {
        dataSharing: boolean;
    };
    accessibility: {
        reduceMotion: boolean;
        highContrast: boolean;
        screenReaderMode: boolean;
        focusHighlight: boolean;
    };
    dataExport: {
        // Future properties for data export status
    };
}


// Represents items a user has purchased that are not single-use power-ups.
export interface UserCustomizations {
    avatarFrames: string[];
    deckCovers: string[];
    badges: string[];
}

export interface SelectedCustomizations {
    activeAvatarFrame: string;
    activeDeckCovers: { [deckId: string]: string };
    activeBadge: string;
}

export interface UserInventory {
    [itemId: string]: number; // Maps shop item ID to quantity
}

export interface ShopItem {
    id: string; // matches power-up type or customization key
    name: string;
    description: string;
    cost: number;
    icon: string; // Lucide icon name
    type: 'power-up' | 'avatar-frame' | 'deck-cover' | 'theme';
}

    