import type { Timestamp } from 'firebase/firestore';









import type { User } from 'firebase/auth';








export type RecallLevel = 'hard' | 'medium' | 'easy';

export type CardFormat = 
  | 'Two-Tier MCQ' 
  | 'Standard MCQ' 
  | 'Concept Map' 
  | 'CER' 
  | 'text' 
  | 'code'
  | 'Fill in the Blank'
  | 'Compare/Contrast'
  | 'Drag and Drop Sorting'
  | 'Short Answer'
  | 'Sequencing';

// Defines the strict order for Quest mode progression.
export const cardFormatOrder: CardFormat[] = [
  'Standard MCQ', 
  'Fill in the Blank',
  'Short Answer', 
  'Compare/Contrast', 
  'Drag and Drop Sorting', 
  'Sequencing', 
  'Two-Tier MCQ', 
  'CER'
];


export type BloomLevel = 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
export const bloomOrder: BloomLevel[] = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];

export type DOKLevel = 1 | 2 | 3 | 4;

export type StudyMode = 'quest' | 'remix' | 'practice' | 'starred' | 'timed' | 'bloom-focus' | 'topic-trek';

export type PowerUpType = 'retry' | 'hint' | 'fifty-fifty' | 'time' | 'focus' | 'unlock';

export type PurchaseCounts = Record<PowerUpType, number>;


export interface Deck {
  id: string;
  title: string;
  description: string;
  cards: Flashcard[];
  isMastered?: boolean;
  agentName?: string;
  agentAvatar?: string;
}

export interface Topic {
  id: string;
  name: string;
  icon: string | null;
  decks: Deck[];
}

export interface ShopItem {
  id: PowerUpType; // The ID will be the power-up type for simplicity
  name: string;
  description: string;
  cost: number;
  icon: string; // Corresponds to a lucide-react icon name
  type: 'power-up' | 'theme' | 'avatar';
  payload?: any; // e.g., for power-ups, might contain details for its effect
}


interface BaseCard {
  id: string | number; // Allow string for Firestore document IDs
  cardFormat: CardFormat;
  questionStem: string;
  topic: string;
  subTopic: string;
  bloomLevel: BloomLevel;
  dokLevel: DOKLevel;
  sourceDocument?: string; // To track the origin of imported cards
  isStarred?: boolean; // For starring cards
}

export interface CardInteraction {
    cardId: string | number;
    lastReviewed: string;
    nextReviewDate: string;
    interval: number;
    easeFactor: number;
    correctStreak: number;
    isMastered: boolean;
    correct: boolean; // Was the last answer correct?
    recall: RecallLevel; // How difficult was it for the user?
}

// Firestore types
export interface CardAttempt {
  id?: string;
  userId: string;
  deckId: string;
  cardId: string | number;
  bloomLevel: BloomLevel;
  wasCorrect: boolean;
  timestamp: Date;
  bonusXp?: number;
}

export interface BloomMastery {
  correct: number;
  total: number;
}

export interface DeckProgress {
  deckId: string;
  deckName: string;
  totalCards: number;
  lastStudied: Date;
  isMastered: boolean;
  bloomMastery: {
    [key in BloomLevel]?: BloomMastery;
  };
  // XP properties
  level: number;
  xp: number;
  xpToNext: number;
}

export interface UserDeckProgress {
  lastCardIndex: number;
  randomOrder?: string[];
  mode: StudyMode;
  level: number;
  xp: number;
  xpToNext: number;
  streak?: number;
}

export interface GlobalProgress {
    level: number;
    xp: number;
    xpToNext: number;
}

export interface UserPowerUps {
    tokens: number;
    unlockedLevels?: {
        [deckId: string]: BloomLevel[];
    };
    // inventory could be added here later
}

// This is now the main user data object for settings
export interface UserSettings {
  displayName: string;
  email: string;
  tokens: number;
  unlockedLevels: {
      [deckId: string]: BloomLevel[];
  };
  notifications: {
    inAppAlerts: boolean;
    emailProgressSummary: boolean;
    emailStreakReminders: boolean;
    emailPowerUpAnnouncements: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    accentColor: string;
    fontSize: number;
    cardAnimations: {
        flip: boolean;
        speed: number;
    };
    soundEffects: {
        flip: boolean;
        correctChime: boolean;
        incorrectChime: boolean;
    };
  };
  studyDefaults: {
    bloomFilter: 'all' | BloomLevel;
    defaultDeckCover: string | null;
    timedDrill: {
        defaultTime: number;
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
  dataExport: {};
}


// Maps an item ID (e.g., 'retry') to the number of times it has been purchased.
export type UserInventory = Record<string, number>;

export interface UserXpStats {
  sessionXP: number;
  sessionStart: Timestamp;
  dailyXP: number;
  lastDailyReset: Timestamp;
  bonusVault: number;
  commanderXP: number;
  isXpBoosted?: boolean;
}

// Customization types
export interface UserCustomizations {
  avatarFrames: string[]; // List of unlocked frame IDs
  deckCovers: string[];   // List of unlocked cover IDs
  badges: string[];       // List of unlocked badge/title IDs
}

export interface SelectedCustomizations {
  activeAvatarFrame: string;
  activeDeckCovers: { [deckId: string]: string }; // Map deck ID to cover ID
  activeBadge: string;
}


interface MCQTier {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  distractorRationale?: Record<string, string> | { explanation: string };
}

export interface StandardMCQCard extends BaseCard {
  cardFormat: 'Standard MCQ';
  tier1: MCQTier;
}

export interface TwoTierMCQCard extends BaseCard {
  cardFormat: 'Two-Tier MCQ';
  tier1: MCQTier;
  tier2: MCQTier;
}

export interface ConceptMapCard extends BaseCard {
  cardFormat: 'Concept Map';
  conceptMapTerms: string[];
}

export type CERInputType = 'mcq' | 'text';

export interface CERPart {
    key: 'claim' | 'evidence' | 'reasoning';
    inputType: CERInputType;
    prompt?: string;
    options?: string[];
    correctIndex?: number;
    sampleAnswer?: string;
}

export interface CERCard extends BaseCard {
    cardFormat: 'CER';
    prompt: string; // The main scenario or background
    question: string; // The overarching question for the CER framework
    parts: CERPart[];
}


// A simple card type for compatibility with the old model
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

export interface FillInTheBlankCard extends BaseCard {
  cardFormat: 'Fill in the Blank';
  prompt: string; // e.g., "The powerhouse of the cell is the ____."
  correctAnswer: string;
}

export interface ComparisonPair {
  feature: string;
  pointA: string;
  pointB: string;
}
export interface CompareContrastCard extends BaseCard {
  cardFormat: 'Compare/Contrast';
  itemA: string;
  itemB: string;
  pairs: ComparisonPair[];
}

export interface DndItem {
  term: string;
  correctCategory: string;
}

export interface DragAndDropSortingCard extends BaseCard {
  cardFormat: 'Drag and Drop Sorting';
  prompt: string;
  categories: string[];
  items: DndItem[];
}


export interface ShortAnswerCard extends BaseCard {
  cardFormat: 'Short Answer';
  prompt: string;
  suggestedAnswer: string; // For user to compare against
}

export interface SequencingCard extends BaseCard {
  cardFormat: 'Sequencing';
  prompt: string;
  items: string[]; // Items will be scrambled for the user from this list
  correctOrder: string[]; // The correct sequence to check against
}


export type Flashcard = 
  | StandardMCQCard 
  | TwoTierMCQCard 
  | ConceptMapCard 
  | TextCard 
  | CodeCard
  | FillInTheBlankCard
  | CompareContrastCard
  | DragAndDropSortingCard
  | ShortAnswerCard
  | SequencingCard
  | CERCard;


export declare function uploadProfilePhotoAndUpdateAuth(user: User, file: File): Promise<User>;



