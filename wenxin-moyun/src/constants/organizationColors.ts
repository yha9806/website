/**
 * Organization Colors Constants
 * Centralized color definitions for AI organizations
 * Used across charts, leaderboards, and visualizations
 */

export const ORGANIZATION_COLORS: Record<string, string> = {
  // Major AI Labs - Primary
  'OpenAI': '#10b981',
  'Anthropic': '#d97757',
  'Google': '#4285F4',
  'Meta': '#0668E1',
  'Microsoft': '#00bcf2',

  // Chinese AI Labs
  'Alibaba': '#ff6900',
  'Baidu': '#2932e1',
  'Tencent': '#1ba3ff',
  'ByteDance': '#fe2c55',
  'Moonshot': '#6366f1',
  'Zhipu': '#8b5cf6',
  'Zhipu AI': '#8b5cf6',
  'MiniMax': '#f59e0b',
  'Minimax': '#f59e0b',
  'iFlytek': '#0891b2',
  'iFLYTEK': '#0891b2',
  'DeepSeek': '#3B82F6',
  'SenseTime': '#0ea5e9',
  '01.AI': '#f43f5e',
  'Kunlun': '#84cc16',

  // International Labs
  'Mistral': '#FF6B35',
  'xAI': '#1D1D1F',
  'Stability AI': '#7C3AED',
  'Midjourney': '#5865F2',
  'Cohere': '#06b6d4',
  'AI21': '#8b5cf6',
  'Hugging Face': '#fbbf24',
  'Together AI': '#14b8a6',
};

// Default color for unknown organizations
export const DEFAULT_ORG_COLOR = '#6b7280';

/**
 * Get color for an organization
 * Falls back to default gray if organization not found
 */
export function getOrganizationColor(org: string): string {
  return ORGANIZATION_COLORS[org] || DEFAULT_ORG_COLOR;
}

/**
 * Get all organization names
 */
export function getAllOrganizations(): string[] {
  return Object.keys(ORGANIZATION_COLORS);
}

/**
 * Check if an organization has a defined color
 */
export function hasOrganizationColor(org: string): boolean {
  return org in ORGANIZATION_COLORS;
}
