/**
 * VULCA Prototype Pipeline — interactive evaluation page.
 *
 * Provides a web interface for running the multi-agent pipeline:
 * Scout → Draft → Critic → Queen with real-time SSE progress.
 */

import { useState } from 'react';
import { usePrototypePipeline } from '../../hooks/usePrototypePipeline';
import PipelineProgress from '../../components/prototype/PipelineProgress';
import RunConfigForm from '../../components/prototype/RunConfigForm';
import CandidateGallery from '../../components/prototype/CandidateGallery';
import CriticScoreTable from '../../components/prototype/CriticScoreTable';
import QueenDecisionPanel from '../../components/prototype/QueenDecisionPanel';

const DIM_LABELS: Record<string, string> = {
  visual_perception: 'L1 Visual',
  technical_analysis: 'L2 Technical',
  cultural_context: 'L3 Cultural',
  critical_interpretation: 'L4 Critical',
  philosophical_aesthetic: 'L5 Aesthetic',
};

function formatDimension(dim: string): string {
  return DIM_LABELS[dim] || dim.replace(/_/g, ' ');
}

export default function PrototypePage() {
  const { state, startRun, submitAction, reset } = usePrototypePipeline();
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const isRunning = state.status === 'running' || state.status === 'waiting_human';
  const isDone = state.status === 'completed' || state.status === 'failed';

  const handleReset = () => {
    setSelectedCandidateId(null);
    reset();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          VULCA Prototype Pipeline
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Multi-agent cultural art evaluation: Scout evidence gathering, Draft image generation,
          Critic L1-L5 scoring, and Queen budget-aware decision making.
        </p>
      </div>

      {/* Config Form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <RunConfigForm
          onSubmit={startRun}
          disabled={isRunning}
        />
      </div>

      {/* Progress */}
      {state.taskId && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pipeline Progress
            </h2>
            <span className="text-xs font-mono text-gray-400">{state.taskId}</span>
          </div>
          <PipelineProgress
            currentStage={state.currentStage}
            currentRound={state.currentRound}
            status={state.status}
            events={state.events}
          />
        </div>
      )}

      {/* Scout Evidence */}
      {state.evidence && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Scout Evidence
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {(state.evidence.sample_matches as unknown[])?.length ?? 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Sample Matches</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {(state.evidence.terminology_hits as unknown[])?.length ?? 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Terminology Hits</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {(state.evidence.taboo_violations as unknown[])?.length ?? 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Taboo Violations</div>
            </div>
          </div>

          {/* Detailed evidence */}
          {(state.evidence.taboo_violations as unknown[])?.length > 0 && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
              <h4 className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Taboo Violations Found:</h4>
              <ul className="text-xs text-red-600 dark:text-red-400 space-y-0.5">
                {(state.evidence.taboo_violations as Array<{ term?: string; severity?: string }>).slice(0, 5).map((v, i) => (
                  <li key={i}>• {v.term || JSON.stringify(v)}{v.severity ? ` (${v.severity})` : ''}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Candidates Gallery */}
      {state.candidates.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Draft Candidates
            <span className="ml-2 text-sm font-normal text-gray-500">
              Round {state.currentRound}
            </span>
            {state.status === 'waiting_human' && (
              <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-normal">
                Click to select for force accept
              </span>
            )}
          </h2>
          <CandidateGallery
            candidates={state.candidates}
            bestCandidateId={state.bestCandidateId}
            selectedCandidateId={selectedCandidateId}
            onSelect={setSelectedCandidateId}
          />
        </div>
      )}

      {/* Critic Scores */}
      {state.scoredCandidates.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Critic Scores (L1-L5)
          </h2>
          {state.hitlConstraints && (
            <div className="mb-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/10 p-3">
              <div className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">
                HITL Constraints Applied This Round
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Locked</div>
                  <div className="flex flex-wrap gap-1">
                    {state.hitlConstraints.locked_dimensions.length > 0 ? (
                      state.hitlConstraints.locked_dimensions.map(dim => (
                        <span key={`lock-${dim}`} className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          🔒 {formatDimension(dim)}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400">none</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Rerun</div>
                  <div className="flex flex-wrap gap-1">
                    {state.hitlConstraints.rerun_dimensions.length > 0 ? (
                      state.hitlConstraints.rerun_dimensions.map(dim => (
                        <span key={`rerun-${dim}`} className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                          🔄 {formatDimension(dim)}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400">none</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Preserved</div>
                  <div className="flex flex-wrap gap-1">
                    {state.hitlConstraints.preserved_dimensions.length > 0 ? (
                      state.hitlConstraints.preserved_dimensions.map(dim => (
                        <span key={`preserve-${dim}`} className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                          {formatDimension(dim)}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400">none</span>
                    )}
                  </div>
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  <div>Applied Scores: <span className="font-semibold">{state.hitlConstraints.applied_scores}</span></div>
                  <div>Candidates Touched: <span className="font-semibold">{state.hitlConstraints.candidates_touched}</span></div>
                </div>
              </div>
            </div>
          )}
          <CriticScoreTable
            scoredCandidates={state.scoredCandidates}
            bestCandidateId={state.bestCandidateId}
          />
        </div>
      )}

      {/* Queen Decision */}
      {(state.decision || state.finalDecision) && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Queen Decision
          </h2>
          <QueenDecisionPanel
            decision={state.decision}
            finalDecision={state.finalDecision}
            status={state.status}
            scoredCandidates={state.scoredCandidates}
            selectedCandidateId={selectedCandidateId}
            onAction={submitAction}
          />
        </div>
      )}

      {/* Final Summary */}
      {isDone && (
        <div className={`rounded-2xl p-6 ${
          state.status === 'completed'
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold">
                {state.status === 'completed' ? '✅ Pipeline Complete' : '❌ Pipeline Failed'}
              </h2>
              {state.error && (
                <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                    {state.error.includes('API_KEY') ? '🔑 ' : state.error.includes('limit') ? '⏳ ' : state.error.includes('server') || state.error.includes('Server') ? '🖥️ ' : '⚠️ '}
                    {state.error}
                  </p>
                </div>
              )}
            </div>
            <div className="text-right text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4 shrink-0">
              {state.totalRounds > 0 && <div>Rounds: {state.totalRounds}</div>}
              {state.totalLatencyMs > 0 && <div>Time: {(state.totalLatencyMs / 1000).toFixed(1)}s</div>}
              {state.totalCostUsd > 0 && <div>Cost: ${state.totalCostUsd.toFixed(4)}</div>}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              New Run
            </button>
            {state.status === 'failed' && (
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
