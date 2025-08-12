export interface Unlockable {
  key: string; // unique identifier
  label: string; // human-readable name
  type: 'commander' | 'powerup'; // which group it belongs to
  requirement: number; // commanderLevel (for commander items) or cost (for powerups)
  icon: string; // lucide-react icon name
  isImplemented?: boolean; // Is the feature ready?
}

export const unlockables: Unlockable[] = [
  // Commander-level features
  { key: 'badgeDisplay',       label: 'Badge & Title Display',      type: 'commander', requirement: 5,  icon: 'Trophy', isImplemented: true },
  { key: 'avatarFrames',       label: 'Animated Avatar Frames',       type: 'commander', requirement: 10, icon: 'Shield', isImplemented: true },
  { key: 'deckCovers',         label: 'Customizable Deck Covers',     type: 'commander', requirement: 15, icon: 'Image', isImplemented: false },
  

  // Power-Ups
  { key: 'retry',            label: 'Retry Power-Up',               type: 'powerup',   requirement: 20,  icon: 'RefreshCw', isImplemented: true },
  { key: 'hint',             label: 'Hint Power-Up',                type: 'powerup',   requirement: 50,  icon: 'Lightbulb', isImplemented: false },
  { key: 'fifty-fifty',      label: '50/50 Power-Up',               type: 'powerup',   requirement: 100, icon: 'CheckCheck', isImplemented: true },
  { key: 'time',             label: 'Time Warp Power-Up',           type: 'powerup',   requirement: 15,  icon: 'Timer', isImplemented: true },
  { key: 'focus',            label: 'Focus Lens Power-Up',          type: 'powerup',   requirement: 20,  icon: 'Search', isImplemented: false },
  { key: 'unlock',           label: 'Bloom Unlock Power-Up',        type: 'powerup',   requirement: 200, icon: 'LockOpen', isImplemented: true },
];


