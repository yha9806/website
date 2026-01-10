/**
 * useExhibitions Hook
 *
 * Manages exhibition data fetching and state
 * Supports multiple exhibitions:
 * - Echoes and Returns (回响与归来)
 * - Negative Space of the Tide (潮汐的负形)
 *
 * @updated 2026-01-10 - Added multi-exhibition support
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import type { Exhibition, Artwork, Chapter, ExhibitionFilters, Dialogue } from '../../types/exhibition';
import {
  buildExhibition,
  buildNegativeSpaceExhibition,
  EXHIBITION_IDS,
  type RawArtwork,
} from '../../data/exhibitions';

// Data URLs
const ECHOES_DATA_URL = '/data/echoes-and-returns.json';
const DIALOGUES_URL = '/data/dialogues.json';

interface UseExhibitionsReturn {
  exhibition: Exhibition | null;
  artworks: Artwork[];
  chapters: Chapter[];
  dialogues: Map<number | string, Dialogue>;
  loading: boolean;
  error: string | null;
  filters: ExhibitionFilters;
  setFilters: (filters: ExhibitionFilters) => void;
  filteredArtworks: Artwork[];
  getArtworkById: (id: number | string) => Artwork | undefined;
  getChapterById: (id: number) => Chapter | undefined;
  getDialogueByArtworkId: (artworkId: number | string) => Dialogue | undefined;
}

export function useExhibitions(exhibitionIdProp?: string): UseExhibitionsReturn {
  const { id: routeId } = useParams<{ id: string }>();
  const exhibitionId = exhibitionIdProp || routeId || EXHIBITION_IDS.ECHOES_AND_RETURNS;


  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [dialogues, setDialogues] = useState<Map<number | string, Dialogue>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExhibitionFilters>({});

  // Fetch exhibition and dialogues data based on exhibition ID
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        if (exhibitionId === EXHIBITION_IDS.NEGATIVE_SPACE) {
          // Load Negative Space of the Tide exhibition (static data)
          const exhibitionData = buildNegativeSpaceExhibition();
          setExhibition(exhibitionData);
          setDialogues(new Map()); // No dialogues for this exhibition
        } else {
          // Load Echoes and Returns exhibition (from JSON)
          const [artworksResponse, dialoguesResponse] = await Promise.all([
            fetch(ECHOES_DATA_URL),
            fetch(DIALOGUES_URL),
          ]);

          if (!artworksResponse.ok) {
            throw new Error(`Failed to fetch exhibition data: ${artworksResponse.statusText}`);
          }

          const rawData: RawArtwork[] = await artworksResponse.json();
          const exhibitionData = buildExhibition(rawData);

          // Process dialogues if available
          if (dialoguesResponse.ok) {
            const dialoguesData: Dialogue[] = await dialoguesResponse.json();
            const dialogueMap = new Map<number | string, Dialogue>();

            dialoguesData.forEach((dialogue) => {
              dialogueMap.set(dialogue.artwork_id, dialogue);
            });

            // Associate dialogues with artworks
            exhibitionData.chapters?.forEach((chapter) => {
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
        }
      } catch (err) {
        console.error('Error fetching exhibition data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [exhibitionId]);

  // Extract all artworks - handles both chapter-based and flat exhibitions
  const artworks = useMemo(() => {
    if (!exhibition) return [];

    // For exhibitions with chapters (Echoes and Returns)
    if (exhibition.chapters && exhibition.chapters.length > 0) {
      return exhibition.chapters.flatMap((chapter) => chapter.artworks);
    }

    // For flat exhibitions (Negative Space of the Tide)
    return exhibition.artworks || [];
  }, [exhibition]);

  // Get chapters (empty for flat exhibitions)
  const chapters = useMemo(() => {
    return exhibition?.chapters || [];
  }, [exhibition]);

  // Filter artworks based on current filters
  const filteredArtworks = useMemo(() => {
    let result = artworks;

    // Filter by chapter (only for chapter-based exhibitions)
    if (filters.chapter !== undefined && filters.chapter !== null) {
      result = result.filter((artwork) => artwork.chapter?.id === filters.chapter);
    }

    // Filter by medium
    if (filters.medium) {
      result = result.filter((artwork) =>
        artwork.medium?.toLowerCase().includes(filters.medium!.toLowerCase())
      );
    }

    // Filter by search query
    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter((artwork) => {
        const title = artwork.title?.toLowerCase() || '';
        const artistName =
          artwork.artist?.fullName?.toLowerCase() ||
          `${artwork.artist?.firstName || ''} ${artwork.artist?.lastName || ''}`.toLowerCase();
        const description = artwork.description?.toLowerCase() || '';
        const categories = artwork.categories || [];

        return (
          title.includes(query) ||
          artistName.includes(query) ||
          description.includes(query) ||
          categories.some((cat) => cat.toLowerCase().includes(query))
        );
      });
    }

    return result;
  }, [artworks, filters]);

  // Helper to get artwork by ID (supports both number and string IDs)
  const getArtworkById = useCallback(
    (id: number | string) => {
      return artworks.find((artwork) => {
        if (typeof artwork.id === 'number' && typeof id === 'number') {
          return artwork.id === id;
        }
        return String(artwork.id) === String(id);
      });
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
    (artworkId: number | string) => {
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
