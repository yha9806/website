/**
 * Format tradition slug to human-friendly title case.
 * e.g. "chinese_xieyi" → "Chinese Xieyi", "japanese_nihonga" → "Japanese Nihonga"
 */

const CUSTOM_NAMES: Record<string, string> = {
  chinese_xieyi: 'Chinese Xieyi',
  chinese_gongbi: 'Chinese Gongbi',
  japanese_ukiyoe: 'Japanese Ukiyo-e',
  japanese_nihonga: 'Japanese Nihonga',
  japanese_wabi_sabi: 'Japanese Wabi-sabi',
  japanese_traditional: 'Japanese Traditional',
  korean_minhwa: 'Korean Minhwa',
  islamic_geometric: 'Islamic Geometric',
  western_classical: 'Western Classical',
  western_modern: 'Western Modern',
  western_academic: 'Western Academic',
  persian_miniature: 'Persian Miniature',
  african_ubuntu: 'African Ubuntu',
  african_traditional: 'African Traditional',
  indian_miniature: 'Indian Miniature',
  south_asian: 'South Asian',
  aboriginal_dreamtime: 'Aboriginal Dreamtime',
  default: 'Default',
};

export function formatTradition(slug: string): string {
  if (CUSTOM_NAMES[slug]) return CUSTOM_NAMES[slug];
  // Fallback: title case from snake_case
  return slug
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
