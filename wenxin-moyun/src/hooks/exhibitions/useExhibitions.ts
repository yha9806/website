/**
 * useExhibitions Hook
 *
 * Manages exhibition data fetching and state
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Exhibition, Artwork, Chapter, ExhibitionFilters } from '../../types/exhibition';
import { buildExhibition, EXHIBITION_INFO, type RawArtwork } from '../../data/exhibitions';

// Data URL
const ECHOES_DATA_URL = '/data/echoes-and-returns.json';

interface UseExhibitionsReturn {
  exhibition: Exhibition | null;
  artworks: Artwork[];
  chapters: Chapter[];
  loading: boolean;
  error: string | null;
  filters: ExhibitionFilters;
  setFilters: (filters: ExhibitionFilters) => void;
  filteredArtworks: Artwork[];
  getArtworkById: (id: number) => Artwork | undefined;
  getChapterById: (id: number) => Chapter | undefined;
}

export function useExhibitions(): UseExhibitionsReturn {
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExhibitionFilters>({});

  // Fetch exhibition data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(ECHOES_DATA_URL);
        if (!response.ok) {
          throw new Error(`Failed to fetch exhibition data: ${response.statusText}`);
        }

        const rawData: RawArtwork[] = await response.json();
        const exhibitionData = buildExhibition(rawData);

        setExhibition(exhibitionData);
      } catch (err) {
        console.error('Error fetching exhibition data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Extract all artworks from chapters
  const artworks = useMemo(() => {
    if (!exhibition) return [];
    return exhibition.chapters.flatMap((chapter) => chapter.artworks);
  }, [exhibition]);

  // Get chapters
  const chapters = useMemo(() => {
    return exhibition?.chapters || [];
  }, [exhibition]);

  // Filter artworks based on current filters
  const filteredArtworks = useMemo(() => {
    let result = artworks;

    // Filter by chapter
    if (filters.chapter !== undefined && filters.chapter !== null) {
      result = result.filter((artwork) => artwork.chapter.id === filters.chapter);
    }

    // Filter by medium
    if (filters.medium) {
      result = result.filter((artwork) =>
        artwork.medium.toLowerCase().includes(filters.medium!.toLowerCase())
      );
    }

    // Filter by search query
    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(
        (artwork) =>
          artwork.title.toLowerCase().includes(query) ||
          artwork.artist.fullName.toLowerCase().includes(query) ||
          artwork.description.toLowerCase().includes(query) ||
          artwork.categories.some((cat) => cat.toLowerCase().includes(query))
      );
    }

    return result;
  }, [artworks, filters]);

  // Helper to get artwork by ID
  const getArtworkById = useCallback(
    (id: number) => {
      return artworks.find((artwork) => artwork.id === id);
    },
    [artworks]
  );

  // Helper to get chapter by ID
  const getChapterById = useCallback(
    (id: number) => {
      return chapters.find((chapter) => chapter.id === id);
    },
    [chapters]
  );

  return {
    exhibition,
    artworks,
    chapters,
    loading,
    error,
    filters,
    setFilters,
    filteredArtworks,
    getArtworkById,
    getChapterById,
  };
}

// Hook for single artwork
export function useArtwork(artworkId: number | string) {
  const { artworks, loading, error, getArtworkById } = useExhibitions();

  const artwork = useMemo(() => {
    const id = typeof artworkId === 'string' ? parseInt(artworkId, 10) : artworkId;
    return getArtworkById(id);
  }, [artworkId, getArtworkById]);

  return {
    artwork,
    loading,
    error,
  };
}

export default useExhibitions;
