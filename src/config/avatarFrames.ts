
export interface FrameConfig {
  name: string;
  unlockLevel: number;
  className: string;
  animationType: 'pulse' | 'none';
  color: string;
}

export const avatarFrames: Record<string, FrameConfig> = {
  "neon-glow": {
    name: "✨ Neon Glow",
    unlockLevel: 10,
    className: "avatar-frame-neon",
    animationType: 'pulse',
    color: '#00BFFF', // DeepSkyBlue
  },
  "commander-gold": {
    name: "🎖️ Commander Gold",
    unlockLevel: 20,
    className: "avatar-frame-gold",
    animationType: 'pulse',
    color: '#FFD700', // Gold
  },
  "galactic-aura": {
    name: "🌌 Galactic Aura",
    unlockLevel: 30,
    className: "avatar-frame-galaxy",
    animationType: 'pulse',
    color: '#9370DB', // MediumPurple
  },
  "electric-surge": {
    name: "⚡ Electric Surge",
    unlockLevel: 40,
    className: "avatar-frame-electric",
    animationType: 'pulse',
    color: '#32CD32', // LimeGreen
  },
};
