/**
 * Exhibition Types for VULCA Art Platform
 *
 * Data structure for "Echoes and Returns" exhibition
 * Source: Didot_exhibition_Dec/Echoes and Returns.json
 *
 * @locked 2026-01-09
 */

export interface Exhibition {
  id: string;
  name: string;
  name_zh: string;
  description: string;
  chapters: Chapter[];
  artworks_count: number;
  cover_image: string;
  status: 'live' | 'upcoming' | 'archived';
  created_at?: string;
  updated_at?: string;
}

export interface Chapter {
  id: number;
  name: string;
  name_zh?: string;
  description?: string;
  artworks: Artwork[];
}

export interface Artwork {
  id: number;
  title: string;
  artist: Artist;
  chapter: {
    id: number;
    name: string;
  };
  medium: string;
  material: string;
  description: string;
  description_zh?: string;
  images: string[];
  video_url?: string;
  categories: string[];
  dialogues?: Dialogue[];
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
  participants: DialogueParticipant[];
  turns: DialogueTurn[];
  language: 'en' | 'zh' | 'mixed';
  generated_at?: string;
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
  speaker_id: string;
  speaker_name: string;
  content: string;
  content_zh?: string;
  language: 'en' | 'zh';
  timestamp?: number;
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
