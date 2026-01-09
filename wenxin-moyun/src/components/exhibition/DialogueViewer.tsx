/**
 * DialogueViewer Component
 *
 * Displays AI-generated art criticism dialogues
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Dialogue, DialogueTurn } from '../../types/exhibition';
import { IOSCard, IOSCardContent, IOSCardHeader } from '../ios/core/IOSCard';
import { IOSButton } from '../ios/core/IOSButton';
import { EmojiIcon } from '../ios/core/EmojiIcon';

interface DialogueViewerProps {
  dialogues: Dialogue[];
  artworkTitle: string;
}

// Map participant IDs to display names and colors
const PARTICIPANT_INFO: Record<string, { name: string; name_zh: string; era: string }> = {
  okakura_tenshin: { name: 'Okakura Tenshin', name_zh: '冈仓天心', era: '1863-1913' },
  mama_zola: { name: 'Mama Zola', name_zh: '佐拉妈妈', era: 'Contemporary' },
  brother_thomas: { name: 'Brother Thomas', name_zh: '托马斯修士', era: 'Contemporary' },
  su_shi: { name: 'Su Shi', name_zh: '苏轼', era: '1037-1101' },
  guo_xi: { name: 'Guo Xi', name_zh: '郭熙', era: '1020-1090' },
  john_ruskin: { name: 'John Ruskin', name_zh: '约翰·罗斯金', era: '1819-1900' },
  walter_benjamin: { name: 'Walter Benjamin', name_zh: '瓦尔特·本雅明', era: '1892-1940' },
  frida_kahlo: { name: 'Frida Kahlo', name_zh: '弗里达·卡罗', era: '1907-1954' },
};

export function DialogueViewer({ dialogues, artworkTitle }: DialogueViewerProps) {
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [language, setLanguage] = useState<'all' | 'en' | 'zh' | 'ja'>('all');
  const [showVisualAnalysis, setShowVisualAnalysis] = useState(false);

  if (dialogues.length === 0) {
    return null;
  }

  const currentDialogue = dialogues[currentDialogueIndex];

  // Get unique participant colors
  const participantColors: Record<string, string> = {};
  const colors = [
    'from-blue-400 to-blue-600',
    'from-purple-400 to-purple-600',
    'from-green-400 to-green-600',
    'from-orange-400 to-orange-600',
    'from-pink-400 to-pink-600',
  ];

  currentDialogue.participants.forEach((participantId, i) => {
    participantColors[participantId] = colors[i % colors.length];
  });

  // Get participant display info
  const getParticipantName = (id: string, index: number) => {
    const info = PARTICIPANT_INFO[id];
    if (info) {
      return language === 'zh' ? info.name_zh : info.name;
    }
    // Fallback to participant_names array
    return currentDialogue.participant_names?.[index] || id;
  };

  // Filter turns by language
  const filteredTurns = currentDialogue.turns.filter((turn) => {
    if (language === 'all') return true;
    return turn.language === language;
  });

  return (
    <IOSCard variant="elevated">
      <IOSCardHeader
        title="Art Criticism Dialogue"
        subtitle={`AI-generated discussion about "${artworkTitle}"`}
        emoji={<EmojiIcon category="people" name="speaking" size="lg" />}
        action={
          <div className="flex gap-1">
            {['all', 'en', 'zh', 'ja'].map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang as typeof language)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  language === lang
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                {lang === 'all' ? 'All' : lang === 'en' ? 'EN' : lang === 'zh' ? '中' : '日'}
              </button>
            ))}
          </div>
        }
      />

      <IOSCardContent className="space-y-4">
        {/* Visual Analysis Toggle */}
        {currentDialogue.visual_analysis && (
          <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowVisualAnalysis(!showVisualAnalysis)}
              className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 transition-colors"
            >
              <EmojiIcon category="content" name="visual" size="sm" />
              {showVisualAnalysis ? 'Hide' : 'Show'} Visual Analysis
            </button>
            <AnimatePresence>
              {showVisualAnalysis && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                >
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {currentDialogue.visual_analysis}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Participants */}
        <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-200 dark:border-gray-700">
          {currentDialogue.participants.map((participantId, index) => {
            const info = PARTICIPANT_INFO[participantId];
            const name = getParticipantName(participantId, index);
            return (
              <div
                key={participantId}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full"
              >
                <div
                  className={`w-6 h-6 rounded-full bg-gradient-to-br ${participantColors[participantId]} flex items-center justify-center text-white text-xs font-bold`}
                >
                  {name[0]}
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {name}
                </span>
                {info?.era && (
                  <span className="text-xs text-gray-400">({info.era})</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Dialogue Turns */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          <AnimatePresence>
            {filteredTurns.map((turn, index) => (
              <DialogueBubble
                key={turn.turn_id || index}
                turn={turn}
                color={participantColors[turn.speaker_id]}
                index={index}
              />
            ))}
          </AnimatePresence>
          {filteredTurns.length === 0 && (
            <p className="text-center text-gray-500 py-4">
              No messages in selected language
            </p>
          )}
        </div>

        {/* Meta Info */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <span>Model: {currentDialogue.model_used}</span>
            <span>Turns: {currentDialogue.total_turns}</span>
            {currentDialogue.languages_used && (
              <span>Languages: {currentDialogue.languages_used.join(', ')}</span>
            )}
          </div>
        </div>

        {/* Dialogue Navigation */}
        {dialogues.length > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <IOSButton
              variant="text"
              size="sm"
              onClick={() =>
                setCurrentDialogueIndex((prev) =>
                  prev === 0 ? dialogues.length - 1 : prev - 1
                )
              }
            >
              Previous
            </IOSButton>
            <span className="text-sm text-gray-500">
              {currentDialogueIndex + 1} / {dialogues.length}
            </span>
            <IOSButton
              variant="text"
              size="sm"
              onClick={() =>
                setCurrentDialogueIndex((prev) =>
                  prev === dialogues.length - 1 ? 0 : prev + 1
                )
              }
            >
              Next
            </IOSButton>
          </div>
        )}
      </IOSCardContent>
    </IOSCard>
  );
}

interface DialogueBubbleProps {
  turn: DialogueTurn;
  color: string;
  index: number;
}

// Language flag emoji map
const LANG_FLAGS: Record<string, string> = {
  en: '🇬🇧',
  zh: '🇨🇳',
  ja: '🇯🇵',
  ru: '🇷🇺',
};

function DialogueBubble({ turn, color, index }: DialogueBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex gap-3"
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-xs font-bold`}
      >
        {turn.speaker_name[0]}
      </div>

      {/* Message */}
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
          {turn.speaker_name}
          <span className="text-[10px]">{LANG_FLAGS[turn.language] || ''}</span>
        </p>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {turn.content}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default DialogueViewer;
