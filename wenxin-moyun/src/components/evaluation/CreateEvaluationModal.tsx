import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Palette, BookOpen, Music } from 'lucide-react';
import { useModels } from '../../hooks/useModels';

type EvaluationTaskType = 'poem' | 'story' | 'painting' | 'music';

interface CreateEvaluationModalProps {
  onClose: () => void;
  onCreate: (data: {
    modelId: string;
    taskType: EvaluationTaskType;
    prompt: string;
    parameters?: Record<string, string>;
  }) => Promise<void>;
}

const CreateEvaluationModal: React.FC<CreateEvaluationModalProps> = ({ onClose, onCreate }) => {
  const { models, loading } = useModels();
  const [formData, setFormData] = useState({
    modelId: '',
    taskType: 'poem' as EvaluationTaskType,
    prompt: '',
    style: '',
    length: 'medium',
    language: 'zh'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (models.length > 0 && !formData.modelId) {
      setFormData(prev => ({ ...prev, modelId: models[0].id }));
    }
  }, [models, formData.modelId]);

  const taskTypes: Array<{
    value: EvaluationTaskType;
    label: string;
    icon: typeof BookOpen;
    placeholder: string;
  }> = [
    { value: 'poem', label: 'Poetry Creation', icon: BookOpen, 
      placeholder: 'Enter poetry theme, e.g., spring, nostalgia, love' },
    { value: 'story', label: 'Story Creation', icon: Sparkles,
      placeholder: 'Enter story theme or beginning, e.g., a story about courage' },
    { value: 'painting', label: 'Painting Creation', icon: Palette,
      placeholder: 'Describe the scene, e.g., landscape, portrait' },
    { value: 'music', label: 'Music Creation', icon: Music,
      placeholder: 'Describe music style or emotion, e.g., cheerful folk song' }
  ];

  const currentTaskType = taskTypes.find(t => t.value === formData.taskType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.modelId || !formData.prompt.trim()) return;

    setIsSubmitting(true);
    try {
      const parameters: Record<string, string> = {};
      if (formData.style) parameters.style = formData.style;
      if (formData.length) parameters.length = formData.length;
      if (formData.language) parameters.language = formData.language;

      await onCreate({
        modelId: formData.modelId,
        taskType: formData.taskType,
        prompt: formData.prompt,
        parameters: Object.keys(parameters).length > 0 ? parameters : undefined
      });
      onClose();
    } catch (err) {
      console.error('Failed to create evaluation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-[#1A1614] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white dark:bg-[#1A1614] border-b dark:border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold gradient-text">Create Evaluation Task</h2>
          <button
            onClick={onClose}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Model Selection */}
          <div>
            <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select AI Model <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            {loading ? (
              <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ) : (
              <select
                id="model-select"
                value={formData.modelId}
                onChange={(e) => setFormData(prev => ({ ...prev, modelId: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-600"
                required
              >
                {models.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name} - {model.organization}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Task Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task Type
            </label>
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Task Type">
              {taskTypes.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    role="radio"
                    aria-checked={formData.taskType === type.value}
                    onClick={() => setFormData(prev => ({ ...prev, taskType: type.value }))}
                    className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      formData.taskType === type.value
                        ? 'border-amber-600 bg-amber-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${
                      formData.taskType === type.value ? 'text-amber-700 dark:text-amber-500' : 'text-gray-600 dark:text-gray-400'
                    }`} />
                    <span className={`font-medium ${
                      formData.taskType === type.value ? 'text-purple-900 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label htmlFor="prompt-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Creation Prompt <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <textarea
              id="prompt-input"
              value={formData.prompt}
              onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
              placeholder={currentTaskType?.placeholder}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-600 resize-none"
              rows={4}
              required
            />
          </div>

          {/* Additional Parameters */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Advanced Parameters (Optional)</h3>

            {(formData.taskType === 'poem' || formData.taskType === 'story') && (
              <div>
                <label htmlFor="style-input" className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Style</label>
                <input
                  id="style-input"
                  type="text"
                  value={formData.style}
                  onChange={(e) => setFormData(prev => ({ ...prev, style: e.target.value }))}
                  placeholder={formData.taskType === 'poem' ? 'e.g., classical, modern, romantic' : 'e.g., sci-fi, fantasy, realistic'}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>
            )}

            {formData.taskType === 'story' && (
              <div>
                <label htmlFor="length-select" className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Length</label>
                <select
                  id="length-select"
                  value={formData.length}
                  onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-600"
                >
                  <option value="short">Short (under 500 words)</option>
                  <option value="medium">Medium (around 1000 words)</option>
                  <option value="long">Long (over 2000 words)</option>
                </select>
              </div>
            )}

            <div>
              <label htmlFor="language-select" className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Language</label>
              <select
                id="language-select"
                value={formData.language}
                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-600"
              >
                <option value="zh">Chinese</option>
                <option value="en">English</option>
                <option value="both">Both (Bilingual)</option>
              </select>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.modelId || !formData.prompt.trim()}
              className="px-6 py-2 bg-gradient-to-r from-amber-700 to-slate-700 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateEvaluationModal;
