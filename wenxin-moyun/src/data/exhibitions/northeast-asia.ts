/**
 * Northeast Asia Memory Exhibition Data
 *
 * Source: Didot_exhibition_Dec/northeast-asia.json
 * Total Artworks: 18
 * Chapters: 4
 *
 * @generated 2026-02-05
 */

import type {
  Exhibition,
  Chapter,
  Artwork,
} from '../../types/exhibition';

export const NORTHEAST_ASIA_ID = 'northeast-asia-memory';

export const NORTHEAST_ASIA_INFO: Omit<Exhibition, 'chapters'> = {
  id: NORTHEAST_ASIA_ID,
  name: 'Northeast Asia Memory',
  name_zh: '东北亚记忆',
  description:
    'An exhibition exploring memory, identity, displacement, and sensory experience across Northeast Asia through 18 artworks by artists from China, Japan, Korea, and the UK.',
  artworks_count: 18,
  cover_image: '/data/exhibitions/northeast-asia/image_01.png',
  status: 'live',
};

// Chapter definitions
export const NORTHEAST_ASIA_CHAPTERS: { id: number; name: string; name_zh: string }[] = [
  { id: 1, name: 'Historical Memory & Ghost Narratives', name_zh: '历史记忆与幽灵叙事' },
  { id: 2, name: 'Family & Personal Archives', name_zh: '家庭与个人档案' },
  { id: 3, name: 'Border, Identity & Displacement', name_zh: '边界、身份与流动' },
  { id: 4, name: 'Material & Sensory Memory', name_zh: '物质与感官记忆' },
];

// Raw artwork type from northeast-asia.json
export interface NortheastAsiaRawArtwork {
  id: number;
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  school: string;
  major: string;
  profile: string;
  description: string;
  createYear: string;
  medium: string;
  material: string;
  size: string;
  categories: string;
  imageUrls: string;
  customUrl: string;
  chapterId: number;
  chapterName: string;
  noImage?: boolean;
}

// Transform raw artwork data to typed format
export function transformNortheastArtwork(raw: NortheastAsiaRawArtwork): Artwork {
  const images = raw.imageUrls
    ? raw.imageUrls.split(',').map((url) => url.trim()).filter(Boolean)
    : [];

  return {
    id: raw.id,
    title: raw.title,
    artist: {
      firstName: raw.firstName,
      lastName: raw.lastName,
      fullName: `${raw.firstName} ${raw.lastName}`,
      school: raw.school || '',
      major: raw.major || '',
      profile: raw.profile || undefined,
    },
    chapter: {
      id: raw.chapterId,
      name: raw.chapterName,
    },
    medium: raw.medium,
    material: raw.material,
    description: raw.description,
    images,
    video_url: raw.customUrl || undefined,
    categories: raw.categories ? raw.categories.split(',').map((c) => c.trim()) : [],
    dimensions: raw.size,
    year: parseInt(raw.createYear) || undefined,
  };
}

// Group artworks by chapter
export function groupByChapterNortheast(artworks: Artwork[]): Chapter[] {
  const chapterMap = new Map<number, Artwork[]>();

  artworks.forEach((artwork) => {
    if (!artwork.chapter) return;
    const existing = chapterMap.get(artwork.chapter.id) || [];
    existing.push(artwork);
    chapterMap.set(artwork.chapter.id, existing);
  });

  return NORTHEAST_ASIA_CHAPTERS.map((chapter) => ({
    id: chapter.id,
    name: chapter.name,
    name_zh: chapter.name_zh,
    artworks: chapterMap.get(chapter.id) || [],
  })).filter((chapter) => chapter.artworks.length > 0);
}

// Build full exhibition data
export function buildNortheastAsiaExhibition(rawArtworks: NortheastAsiaRawArtwork[]): Exhibition {
  const artworks = rawArtworks.map(transformNortheastArtwork);
  const chapters = groupByChapterNortheast(artworks);

  return {
    ...NORTHEAST_ASIA_INFO,
    chapters,
    artworks_count: artworks.length,
  };
}
