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

export function DialogueViewer({ dialogues, artworkTitle }: DialogueViewerProps) {
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [language, setLanguage] = useState<'en' | 'zh'>('en');

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

  currentDialogue.participants.forEach((p, i) => {
    participantColors[p.id] = colors[i % colors.length];
  });

  return (
    <IOSCard variant="elevated">
      <IOSCardHeader
        title="Art Criticism Dialogue"
        subtitle={`AI-generated discussion about "${artworkTitle}"`}
        emoji={<EmojiIcon category="people" name="speaking" size="lg" />}
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                language === 'en'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('zh')}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                language === 'zh'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              中文
            </button>
          </div>
        }
      />

      <IOSCardContent className="space-y-4">
        {/* Participants */}
        <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-200 dark:border-gray-700">
          {currentDialogue.participants.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full"
            >
              <div
                className={`w-6 h-6 rounded-full bg-gradient-to-br ${participantColors[participant.id]} flex items-center justify-center text-white text-xs font-bold`}
              >
                {participant.name[0]}
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {participant.name}
              </span>
              {participant.era && (
                <span className="text-xs text-gray-400">({participant.era})</span>
              )}
            </div>
          ))}
        </div>

        {/* Dialogue Turns */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          <AnimatePresence>
            {currentDialogue.turns.map((turn, index) => (
              <DialogueBubble
                key={index}
                turn={turn}
                color={participantColors[turn.speaker_id]}
                language={language}
                index={index}
              />
            ))}
          </AnimatePresence>
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
  language: 'en' | 'zh';
  index: number;
}

function DialogueBubble({ turn, color, language, index }: DialogueBubbleProps) {
  const content = language === 'zh' && turn.content_zh ? turn.content_zh : turn.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
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
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          {turn.speaker_name}
        </p>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {content}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default DialogueViewer;
