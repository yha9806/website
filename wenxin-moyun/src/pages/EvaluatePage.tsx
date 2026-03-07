import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IntentInput } from '../components/evaluate/IntentInput';
import { ResultCard } from '../components/evaluate/ResultCard';
import { FlowToggle } from '../components/evaluate/FlowToggle';
import { CodeExport } from '../components/evaluate/CodeExport';
import { useNoCodeEvaluate } from '../hooks/useNoCodeEvaluate';

type PageState = 'input' | 'loading' | 'result' | 'error';

const EvaluatePage: React.FC = () => {
  const [pageState, setPageState] = useState<PageState>('input');
  const [submittedIntent, setSubmittedIntent] = useState('');
  const { evaluate, result, skillsUsed, error, reset: resetEval } = useNoCodeEvaluate();

  const handleSubmit = useCallback(async (intent: string, image?: File) => {
    setSubmittedIntent(intent);
    setPageState('loading');

    const res = await evaluate(intent, image);
    if (res) {
      setPageState('result');
    } else {
      setPageState('error');
    }
  }, [evaluate]);

  const handleReset = useCallback(() => {
    resetEval();
    setPageState('input');
    setSubmittedIntent('');
  }, [resetEval]);

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
          Evaluate
        </h1>
        <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
          Describe what you want to evaluate — VULCA handles the rest
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
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Analyzing your input...</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Parsing intent, selecting skills, running pipeline</p>
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
            <p className="text-gray-700 dark:text-gray-300 mb-2">Evaluation failed</p>
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

        {pageState === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            <ResultCard result={result} />

            {skillsUsed.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {skillsUsed.map((s) => (
                  <span
                    key={s}
                    className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            <FlowToggle />
            <CodeExport intent={submittedIntent} traditionUsed={result.traditionUsed} />

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
                Start a new evaluation
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EvaluatePage;
