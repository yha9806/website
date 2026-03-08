import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IntentInput } from '../components/evaluate/IntentInput';
import { ResultCard } from '../components/evaluate/ResultCard';
import { CodeExport } from '../components/evaluate/CodeExport';
import { useCreateSession } from '../hooks/useCreateSession';

type PageState = 'input' | 'loading' | 'result' | 'error';

const CreatePage: React.FC = () => {
  const [pageState, setPageState] = useState<PageState>('input');
  const [submittedIntent, setSubmittedIntent] = useState('');
  const {
    create,
    result,
    mode,
    sessionId,
    bestCandidateId,
    totalRounds,
    error,
    reset: resetSession,
  } = useCreateSession();

  const handleSubmit = useCallback(async (intent: string, image?: File) => {
    setSubmittedIntent(intent);
    setPageState('loading');

    await create(intent, image);
    setPageState('result');
  }, [create]);

  const handleReset = useCallback(() => {
    resetSession();
    setPageState('input');
    setSubmittedIntent('');
  }, [resetSession]);

  return (
    <div className="min-h-[70vh] py-12 px-4 sm:px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
          Create
        </h1>
        <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
          Describe your vision — VULCA creates, critiques, and refines
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {pageState === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <IntentInput onSubmit={handleSubmit} />
          </motion.div>
        )}

        {pageState === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="relative w-16 h-16 mb-6">
              <motion.div className="absolute inset-0 rounded-full border-2 border-slate-200 dark:border-slate-700" />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-slate-600 dark:border-t-slate-400"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {mode === 'evaluate' ? 'Analyzing your image...' : 'Creating artwork...'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {mode === 'evaluate'
                ? 'Parsing intent, selecting skills, running pipeline'
                : 'Scout → Draft → Critic → Queen evaluation loop'}
            </p>
          </motion.div>
        )}

        {pageState === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-lg mx-auto text-center py-16"
          >
            <div className="text-4xl mb-4">!</div>
            <p className="text-gray-700 dark:text-gray-300 mb-2">Session failed</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{error}</p>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-lg bg-slate-600 text-white text-sm hover:bg-slate-700 transition-colors"
            >
              Try again
            </button>
          </motion.div>
        )}

        {pageState === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            {/* Evaluate mode: show ResultCard */}
            {mode === 'evaluate' && result && (
              <ResultCard result={result} />
            )}

            {/* Create mode: show creation summary */}
            {mode === 'create' && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-lg">&#10003;</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Creation Complete</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Session {sessionId}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                    <span className="text-gray-500 dark:text-gray-400">Rounds</span>
                    <p className="font-medium text-gray-900 dark:text-white">{totalRounds || '—'}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                    <span className="text-gray-500 dark:text-gray-400">Best Candidate</span>
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {bestCandidateId || '—'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <CodeExport intent={submittedIntent} traditionUsed={result?.traditionUsed || 'default'} />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="pt-2 text-center"
            >
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline underline-offset-2 transition-colors"
              >
                Start a new session
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreatePage;
