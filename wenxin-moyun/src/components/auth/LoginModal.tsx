import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Gift, Save, Clock, Star } from 'lucide-react';
import authService from '../../services/auth.service';
import { retryPendingRequests } from '../../services/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: 'limit_reached' | 'save_progress' | 'extended_use' | 'quality_feedback' | 'auth_required';
}

const triggerConfigs = {
  limit_reached: {
    icon: AlertCircle,
    iconColor: 'text-red-500',
    title: '您已达到今日免费评测限额',
    subtitle: '登录后可无限制使用所有功能',
    urgency: 'high',
    benefits: [
      '解锁无限评测次数',
      '保存评测历史记录',
      '获得AI专业评分建议',
      '参与模型投票对战'
    ]
  },
  save_progress: {
    icon: Save,
    iconColor: 'text-blue-500',
    title: '保存您的评测进度',
    subtitle: '创建账号，永久保存您的创作成果',
    urgency: 'medium',
    benefits: [
      '云端同步评测记录',
      '跨设备访问历史',
      '建立个人作品集',
      '获得个性化推荐'
    ]
  },
  extended_use: {
    icon: Clock,
    iconColor: 'text-green-500',
    title: '您已体验10分钟了',
    subtitle: '注册账号，解锁完整功能体验',
    urgency: 'low',
    benefits: [
      '专属用户仪表盘',
      '高级筛选和搜索',
      '批量评测功能',
      '导出评测报告'
    ]
  },
  quality_feedback: {
    icon: Star,
    iconColor: 'text-yellow-500',
    title: '想要更专业的评测反馈？',
    subtitle: '登录后获得AI深度分析报告',
    urgency: 'low',
    benefits: [
      'AI评分详细解析',
      '作品改进建议',
      '同类作品对比',
      '趋势分析图表'
    ]
  },
  auth_required: {
    icon: AlertCircle,
    iconColor: 'text-orange-500',
    title: '此功能需要登录',
    subtitle: '登录后即可使用全部功能',
    urgency: 'high',
    benefits: [
      '访问所有功能',
      '个性化体验',
      '数据永久保存',
      '专属用户权益'
    ]
  }
};

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, trigger }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const config = triggerConfigs[trigger];
  const Icon = config.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authService.login({ username: formData.username, password: formData.password });
      // Retry pending requests after successful login
      retryPendingRequests();
      onClose();
      // Refresh current page to update UI
      window.location.reload();
    } catch (err) {
      setError('登录失败，请检查用户名和密码');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      await authService.login({ username: 'demo', password: 'demo123' });
      retryPendingRequests();
      onClose();
      window.location.reload();
    } catch (err) {
      setError('演示账号登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={config.urgency === 'low' ? onClose : undefined}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-neutral-50 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-primary to-secondary p-6 text-white">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-neutral-50/20 transition-colors"
                disabled={config.urgency === 'high' && !localStorage.getItem('access_token')}
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full bg-neutral-50/20`}>
                  <Icon className={`w-8 h-8 ${config.iconColor}`} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{config.title}</h2>
                  <p className="text-white/90 mt-1">{config.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="p-6 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">登录后您将获得：</h3>
              <div className="grid grid-cols-2 gap-2">
                {config.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-sm text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    用户名
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="请输入用户名"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    密码
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="请输入密码"
                    required
                  />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isLoading ? '登录中...' : '立即登录'}
                </button>

                <button
                  type="button"
                  onClick={handleQuickLogin}
                  disabled={isLoading}
                  className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <Gift className="w-4 h-4 inline mr-2" />
                  使用演示账号
                </button>
              </div>

              <div className="mt-4 text-center">
                <span className="text-sm text-gray-600">
                  还没有账号？
                  <a href="/register" className="text-primary hover:underline ml-1">
                    立即注册
                  </a>
                </span>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};