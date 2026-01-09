/**
 * useExhibitions Hook
 *
 * Manages exhibition data fetching and state
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Exhibition, Artwork, Chapter, ExhibitionFilters, Dialogue } from '../../types/exhibition';
import { buildExhibition, EXHIBITION_INFO, type RawArtwork } from '../../data/exhibitions';

// Data URLs
const ECHOES_DATA_URL = '/data/echoes-and-returns.json';
const DIALOGUES_URL = '/data/dialogues.json';

interface UseExhibitionsReturn {
  exhibition: Exhibition | null;
  artworks: Artwork[];
  chapters: Chapter[];
  dialogues: Map<number, Dialogue>;
  loading: boolean;
  error: string | null;
  filters: ExhibitionFilters;
  setFilters: (filters: ExhibitionFilters) => void;
  filteredArtworks: Artwork[];
  getArtworkById: (id: number) => Artwork | undefined;
  getChapterById: (id: number) => Chapter | undefined;
  getDialogueByArtworkId: (artworkId: number) => Dialogue | undefined;
}

export function useExhibitions(): UseExhibitionsReturn {
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [dialogues, setDialogues] = useState<Map<number, Dialogue>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExhibitionFilters>({});

  // Fetch exhibition and dialogues data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch both datasets in parallel
        const [artworksResponse, dialoguesResponse] = await Promise.all([
          fetch(ECHOES_DATA_URL),
          fetch(DIALOGUES_URL)
        ]);

        if (!artworksResponse.ok) {
          throw new Error(`Failed to fetch exhibition data: ${artworksResponse.statusText}`);
        }

        const rawData: RawArtwork[] = await artworksResponse.json();
        const exhibitionData = buildExhibition(rawData);

        // Process dialogues if available
        if (dialoguesResponse.ok) {
          const dialoguesData: Dialogue[] = await dialoguesResponse.json();
          const dialogueMap = new Map<number, Dialogue>();

          dialoguesData.forEach((dialogue) => {
            dialogueMap.set(dialogue.artwork_id, dialogue);
          });

          // Associate dialogues with artworks
          exhibitionData.chapters.forEach((chapter) => {
            chapter.artworks.forEach((artwork) => {
              const dialogue = dialogueMap.get(artwork.id);
              if (dialogue) {
                artwork.dialogues = [dialogue];
              }
            });
          });

          setDialogues(dialogueMap);
        }

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

  // Helper to get dialogue by artwork ID
  const getDialogueByArtworkId = useCallback(
    (artworkId: number) => {
      return dialogues.get(artworkId);
    },
    [dialogues]
  );

  return {
    exhibition,
    artworks,
    chapters,
    dialogues,
    loading,
    error,
    filters,
    setFilters,
    filteredArtworks,
    getArtworkById,
    getChapterById,
    getDialogueByArtworkId,
  };
}

// Hook for single artwork
export function useArtwork(artworkId: number | string) {
  const { artworks, loading, error, getArtworkById, getDialogueByArtworkId } = useExhibitions();

  const id = typeof artworkId === 'string' ? parseInt(artworkId, 10) : artworkId;

  const artwork = useMemo(() => {
    return getArtworkById(id);
  }, [id, getArtworkById]);

  const dialogue = useMemo(() => {
    return getDialogueByArtworkId(id);
  }, [id, getDialogueByArtworkId]);

  return {
    artwork,
    dialogue,
    loading,
    error,
  };
}

export default useExhibitions;
