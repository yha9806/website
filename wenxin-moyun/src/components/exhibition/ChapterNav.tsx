/**
 * ChapterNav Component
 *
 * Navigation tabs for exhibition chapters
 */

import { IOSSegmentedControl } from '../ios/core/IOSSegmentedControl';
import type { Chapter } from '../../types/exhibition';

interface ChapterNavProps {
  chapters: Chapter[];
  selectedChapterId: number | null;
  onSelectChapter: (chapterId: number | null) => void;
  showAll?: boolean;
}

export function ChapterNav({
  chapters,
  selectedChapterId,
  onSelectChapter,
  showAll = true,
}: ChapterNavProps) {
  const options = [
    ...(showAll ? [{ value: 'all', label: 'All Works' }] : []),
    ...chapters.map((chapter) => ({
      value: String(chapter.id),
      label: chapter.name,
    })),
  ];

  const selectedValue = selectedChapterId === null ? 'all' : String(selectedChapterId);

  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="min-w-max">
        <IOSSegmentedControl
          options={options}
          value={selectedValue}
          onChange={(value) => {
            onSelectChapter(value === 'all' ? null : parseInt(value, 10));
          }}
        />
      </div>
    </div>
  );
}

// Simplified chapter pills for mobile
export function ChapterPills({
  chapters,
  selectedChapterId,
  onSelectChapter,
}: ChapterNavProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelectChapter(null)}
        className={`
          px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
          ${
            selectedChapterId === null
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }
        `}
      >
        All
      </button>
      {chapters.map((chapter) => (
        <button
          key={chapter.id}
          onClick={() => onSelectChapter(chapter.id)}
          className={`
            px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
            ${
              selectedChapterId === chapter.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }
          `}
        >
          {chapter.name.length > 20 ? chapter.name.slice(0, 20) + '...' : chapter.name}
        </button>
      ))}
    </div>
  );
}

export default ChapterNav;
