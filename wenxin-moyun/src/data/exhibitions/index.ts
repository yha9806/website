/**
 * Exhibitions Data Module
 *
 * Exports exhibition data and utilities for the VULCA Art Platform
 */

export {
  EXHIBITION_ID,
  EXHIBITION_INFO,
  CHAPTERS,
  transformArtwork,
  groupByChapter,
  buildExhibition,
} from './echoes-and-returns';

export type { RawArtwork } from './echoes-and-returns';

// Re-export types for convenience
export type {
  Exhibition,
  Chapter,
  Artwork,
  Artist,
  Dialogue,
  DialogueTurn,
  DialogueParticipant,
  ExhibitionFilters,
  ArtworkListItem,
} from '../../types/exhibition';

// Static JSON data path
export const ECHOES_DATA_URL = '/data/echoes-and-returns.json';

// Utility to fetch exhibition data
export async function fetchExhibitionData(): Promise<Exhibition> {
  const { buildExhibition, RawArtwork } = await import('./echoes-and-returns');

  // In production, this would fetch from API or static JSON
  // For now, we'll import the raw data directly
  const response = await fetch(ECHOES_DATA_URL);
  const rawData: RawArtwork[] = await response.json();

  return buildExhibition(rawData);
}
