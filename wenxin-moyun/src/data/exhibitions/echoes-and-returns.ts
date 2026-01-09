/**
 * Echoes and Returns Exhibition Data
 *
 * Source: Didot_exhibition_Dec/Echoes and Returns.json
 * Total Artworks: 87
 *
 * @generated 2026-01-09
 */

import type {
  Exhibition,
  Chapter,
  Artwork,
  Artist,
  CHAPTER_NAMES
} from '../../types/exhibition';

// Raw data will be loaded from static JSON
// This file provides type-safe access and utilities

export const EXHIBITION_ID = 'echoes-and-returns';

export const EXHIBITION_INFO: Omit<Exhibition, 'chapters'> = {
  id: EXHIBITION_ID,
  name: 'Echoes and Returns',
  name_zh: '回响与归来',
  description:
    'A contemporary art exhibition exploring themes of cultural transmission, innovation, resonance, and identity through the works of emerging artists from around the world.',
  artworks_count: 87,
  cover_image:
    'https://to-gather.oss-us-east-1.aliyuncs.com/prod/art-forum/pic/20251003/dfbf0327fcfc84ee5c030a1b1944f7b2.png?width=1536&height=1024',
  status: 'live',
};

// Chapter definitions
export const CHAPTERS: { id: number; name: string; name_zh: string }[] = [
  { id: 10000, name: 'Personal Archives & Family Memories', name_zh: '个人档案与家庭记忆' },
  { id: 10001, name: 'Cultural Transmission & Regeneration', name_zh: '文化传承与再生' },
  { id: 10002, name: 'Innovation & Exploration', name_zh: '创新与探索' },
  { id: 10003, name: 'Resonance & Return', name_zh: '共鸣与回归' },
  { id: 10004, name: 'Identity & Belonging', name_zh: '身份与归属' },
];

// Transform raw artwork data to typed format
export function transformArtwork(raw: RawArtwork): Artwork {
  const images = raw.imageUrls
    ? raw.imageUrls.split(',').map((url) => url.trim())
    : [];

  return {
    id: raw.id,
    title: raw.title,
    artist: {
      firstName: raw.firstName,
      lastName: raw.lastName,
      fullName: `${raw.firstName} ${raw.lastName}`,
      nickname: raw.nickname,
      school: raw.school,
      major: raw.major,
      profile: raw.profile || raw.userBio,
      avatar: raw.avatar || raw.userAvatar,
    },
    chapter: {
      id: raw.chapterId,
      name: raw.chapterName,
    },
    medium: raw.medium,
    material: raw.material,
    description: raw.description,
    images,
    video_url: raw.customUrl,
    categories: raw.categories ? raw.categories.split(',').map((c) => c.trim()) : [],
    dimensions: raw.size,
    year: parseInt(raw.createYear) || undefined,
  };
}

// Group artworks by chapter
export function groupByChapter(artworks: Artwork[]): Chapter[] {
  const chapterMap = new Map<number, Artwork[]>();

  artworks.forEach((artwork) => {
    const existing = chapterMap.get(artwork.chapter.id) || [];
    existing.push(artwork);
    chapterMap.set(artwork.chapter.id, existing);
  });

  return CHAPTERS.map((chapter) => ({
    id: chapter.id,
    name: chapter.name,
    name_zh: chapter.name_zh,
    artworks: chapterMap.get(chapter.id) || [],
  })).filter((chapter) => chapter.artworks.length > 0);
}

// Build full exhibition data
export function buildExhibition(rawArtworks: RawArtwork[]): Exhibition {
  const artworks = rawArtworks.map(transformArtwork);
  const chapters = groupByChapter(artworks);

  return {
    ...EXHIBITION_INFO,
    chapters,
    artworks_count: artworks.length,
  };
}

// Raw artwork type from JSON
interface RawArtwork {
  id: number;
  activityId: number;
  userId: number;
  firstName: string;
  lastName: string;
  avatar: string | null;
  nickname: string;
  school: string;
  major: string;
  graduationYear: string;
  profile: string | null;
  title: string;
  chapterId: number;
  chapterName: string;
  email: string;
  createYear: string;
  categories: string;
  medium: string;
  material: string;
  description: string;
  size: string;
  imageUrls: string;
  customUrl: string;
  userAvatar: string | null;
  userEmail: string;
  userBio: string | null;
}

// Export type for external use
export type { RawArtwork };
