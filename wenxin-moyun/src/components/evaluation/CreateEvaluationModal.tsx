import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Palette, BookOpen, Music } from 'lucide-react';
import { useModels } from '../../hooks/useModels';

interface CreateEvaluationModalProps {
  onClose: () => void;
  onCreate: (data: {
    modelId: string;
    taskType: 'poem' | 'story' | 'painting' | 'music';
    prompt: string;
    parameters?: Record<string, any>;
  }) => Promise<void>;
}

const CreateEvaluationModal: React.FC<CreateEvaluationModalProps> = ({ onClose, onCreate }) => {
  const { models, loading } = useModels();
  const [formData, setFormData] = useState({
    modelId: '',
    taskType: 'poem' as 'poem' | 'story' | 'painting' | 'music',
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
  }, [models]);

  const taskTypes = [
    { value: 'poem', label: '诗歌创作', icon: BookOpen, 
      placeholder: '请输入诗歌主题，如：春天、思乡、爱情等' },
    { value: 'story', label: '故事创作', icon: Sparkles,
      placeholder: '请输入故事主题或开头，如：一个关于勇气的故事' },
    { value: 'painting', label: '绘画创作', icon: Palette,
      placeholder: '请描述画面内容，如：山水画、人物肖像等' },
    { value: 'music', label: '音乐创作', icon: Music,
      placeholder: '请描述音乐风格或情感，如：欢快的民谣' }
  ];

  const currentTaskType = taskTypes.find(t => t.value === formData.taskType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.modelId || !formData.prompt.trim()) return;

    setIsSubmitting(true);
    try {
      const parameters: Record<string, any> = {};
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
        className="bg-neutral-50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-neutral-50 border-b p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold gradient-text">创建评测任务</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择AI模型
            </label>
            {loading ? (
              <div className="animate-pulse h-10 bg-gray-200 rounded-lg"></div>
            ) : (
              <select
                value={formData.modelId}
                onChange={(e) => setFormData(prev => ({ ...prev, modelId: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              任务类型
            </label>
            <div className="grid grid-cols-2 gap-3">
              {taskTypes.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, taskType: type.value as any }))}
                    className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      formData.taskType === type.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${
                      formData.taskType === type.value ? 'text-purple-600' : 'text-gray-600'
                    }`} />
                    <span className={`font-medium ${
                      formData.taskType === type.value ? 'text-purple-900' : 'text-gray-700'
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              创作提示
            </label>
            <textarea
              value={formData.prompt}
              onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
              placeholder={currentTaskType?.placeholder}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={4}
              required
            />
          </div>

          {/* Additional Parameters */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">高级参数（可选）</h3>
            
            {(formData.taskType === 'poem' || formData.taskType === 'story') && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">风格</label>
                <input
                  type="text"
                  value={formData.style}
                  onChange={(e) => setFormData(prev => ({ ...prev, style: e.target.value }))}
                  placeholder={formData.taskType === 'poem' ? '如：古典、现代、浪漫' : '如：科幻、奇幻、现实'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            {formData.taskType === 'story' && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">长度</label>
                <select
                  value={formData.length}
                  onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="short">短篇（500字以内）</option>
                  <option value="medium">中篇（1000字左右）</option>
                  <option value="long">长篇（2000字以上）</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-600 mb-1">语言</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.modelId || !formData.prompt.trim()}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '创建中...' : '创建任务'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateEvaluationModal;