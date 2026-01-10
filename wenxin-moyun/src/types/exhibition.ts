/**
 * Exhibition Types for VULCA Art Platform
 *
 * Data structure for multiple exhibitions:
 * - "Echoes and Returns" (回响与归来) - Didot_exhibition_Dec/
 * - "Negative Space of the Tide" (潮汐的负形) - VULCA-EMNLP2025/
 *
 * @updated 2026-01-10 - Added multi-exhibition support and RPAIT scoring
 */

export interface Exhibition {
  id: string;
  name: string;
  name_zh: string;
  description: string;
  description_zh?: string;
  chapters?: Chapter[];                    // Echoes uses chapters
  artworks?: Artwork[];                    // Unified artworks list (computed)
  artworks_flat?: ArtworkFlat[];           // Negative Space uses flat list
  artworks_count: number;
  cover_image: string;
  status: 'live' | 'upcoming' | 'archived';
  theme?: ExhibitionTheme;                 // Negative Space theme
  features?: string[];                     // Feature flags
  personas?: Persona[];                    // Critic personas
  created_at?: string;
  updated_at?: string;
}

export interface ExhibitionTheme {
  primaryColor: string;
  accentColor: string;
}

export interface Chapter {
  id: number;
  name: string;
  name_zh?: string;
  description?: string;
  artworks: Artwork[];
}

export interface Artwork {
  id: number | string;
  title: string;
  title_zh?: string;
  artist: Artist;
  chapter?: {                    // Optional for flat exhibitions
    id: number;
    name: string;
  };
  medium: string;
  material: string;
  description: string;
  description_zh?: string;
  image_url?: string;            // Primary image for flat exhibitions
  images: string[] | ArtworkImage[];
  video_url?: string;
  categories: string[];
  dialogues?: Dialogue[];
  critiques?: Critique[];        // RPAIT critiques for Negative Space exhibition
  year?: number;
  dimensions?: string;
}

export interface Artist {
  firstName: string;
  lastName: string;
  fullName: string;
  nickname?: string;
  school: string;
  major: string;
  profile?: string;
  avatar?: string;
}

export interface Dialogue {
  id: string;
  artwork_id: number;
  artwork_title: string;
  image_url?: string;
  topic: string;
  total_turns: number;
  model_used: string;
  created_at: string;
  image_analyzed: boolean;
  visual_analysis?: string;
  participants: string[];
  participant_names: string[];
  turns: DialogueTurn[];
  languages_used?: string[];
  visual_tags?: string[];
}

export interface DialogueParticipant {
  id: string;
  name: string;
  name_zh?: string;
  role: 'critic' | 'artist' | 'curator' | 'historian';
  era?: string;
  nationality?: string;
  avatar?: string;
}

export interface DialogueTurn {
  turn_id: string;
  speaker_id: string;
  speaker_name: string;
  content: string;
  language: string;
  chain_of_thought?: string;
}

// Chapter IDs from Echoes and Returns exhibition
export const CHAPTER_IDS = {
  CULTURAL_TRANSMISSION: 10001,
  INNOVATION_EXPLORATION: 10002,
  RESONANCE_RETURN: 10003,
  IDENTITY_BELONGING: 10004,
} as const;

export const CHAPTER_NAMES: Record<number, { en: string; zh: string }> = {
  10001: {
    en: 'Cultural Transmission & Regeneration',
    zh: '文化传承与再生'
  },
  10002: {
    en: 'Innovation & Exploration',
    zh: '创新与探索'
  },
  10003: {
    en: 'Resonance & Return',
    zh: '共鸣与回归'
  },
  10004: {
    en: 'Identity & Belonging',
    zh: '身份与归属'
  }
};

// Helper types
export type ChapterId = typeof CHAPTER_IDS[keyof typeof CHAPTER_IDS];

export interface ExhibitionFilters {
  chapter?: number;
  medium?: string;
  search?: string;
}

export interface ArtworkListItem {
  id: number;
  title: string;
  artist_name: string;
  chapter_name: string;
  thumbnail: string;
  medium: string;
}

// ============ Multi-Exhibition Support (Negative Space of the Tide) ============

/**
 * Flat artwork structure for exhibitions without chapters
 */
export interface ArtworkFlat {
  id: string;                              // "artwork-N" format
  titleZh: string;
  titleEn: string;
  year: number;
  artist: string;
  imageUrl: string;
  primaryImageId: string;
  context: string;
  images: ArtworkImage[];
  metadata?: ArtworkMetadata;
  critiques?: Critique[];                  // RPAIT critiques
}

export interface ArtworkImage {
  id: string;
  url: string;
  sequence: number;
  titleZh?: string;
  titleEn?: string;
}

export interface ArtworkMetadata {
  source?: string;
  artistZh?: string;
  titleZh?: string;
  descriptionZh?: string;
  technicalNotes?: string;
  imageCount?: number;
  school?: string;                         // Artist school/institution
  major?: string;                          // Artist major/specialization
  confirmationDate?: string;               // Confirmation date
  expectedDate?: string;                   // Expected date
  [key: string]: string | number | undefined;  // Allow additional properties
}

/**
 * Persona (Critic) for dialogue generation
 */
export interface Persona {
  id: string;                              // "su-shi", "guo-xi", etc.
  nameZh: string;
  nameEn: string;
  period: string;
  era: string;
  bio: string;
  bioZh: string;
  color: string;                           // Theme color for UI
  bias: string;                            // Critique focus/bias
}

/**
 * RPAIT Critique with scoring
 */
export interface Critique {
  artworkId: string;
  personaId: string;
  textZh: string;
  textEn: string;
  rpait: RPAITScores;
}

/**
 * RPAIT Scoring System (5 dimensions)
 * R: Reasoning - 推理能力
 * P: Practical - 实践应用
 * A: Aesthetic - 审美判断
 * I: Innovation - 创新思维
 * T: Technical - 技术分析
 */
export interface RPAITScores {
  R: number;                               // Reasoning (0-10)
  P: number;                               // Practical (0-10)
  A: number;                               // Aesthetic (0-10)
  I: number;                               // Innovation (0-10)
  T: number;                               // Technical (0-10)
}

// RPAIT dimension labels
export const RPAIT_LABELS = {
  R: { en: 'Reasoning', zh: '推理能力' },
  P: { en: 'Practical', zh: '实践应用' },
  A: { en: 'Aesthetic', zh: '审美判断' },
  I: { en: 'Innovation', zh: '创新思维' },
  T: { en: 'Technical', zh: '技术分析' },
} as const;

// RPAIT dimension colors (matching iOS design system)
export const RPAIT_COLORS = {
  R: '#007AFF',  // iOS Blue
  P: '#34C759',  // iOS Green
  A: '#AF52DE',  // iOS Purple
  I: '#FF9500',  // iOS Orange
  T: '#FF3B30',  // iOS Red
} as const;

export type RPAITDimension = keyof RPAITScores;
