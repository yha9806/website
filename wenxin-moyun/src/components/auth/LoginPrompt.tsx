import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Shield, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface LoginPromptProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: 'limit_reached' | 'save_progress' | 'share_result' | 'advanced_features';
  remainingUsage?: number;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({ 
  isOpen, 
  onClose, 
  trigger, 
  remainingUsage = 0 
}) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    navigate(`/login?from=${returnUrl}`);
  };

  const getTriggerConfig = () => {
    switch (trigger) {
      case 'limit_reached':
        return {
          icon: Clock,
          title: '今日体验次数已用完',
          subtitle: `您今日已使用了3次免费评测服务`,
          description: '注册登录后可享受无限制使用，还能保存您的评测历史记录。',
          buttonText: '立即注册',
          urgency: 'high' as const
        };
      case 'save_progress':
        return {
          icon: Shield,
          title: '保存您的评测进度',
          subtitle: '避免数据丢失，建立专属评测档案',
          description: '登录后可以保存所有评测记录，随时查看历史数据和趋势分析。',
          buttonText: '保存进度',
          urgency: 'medium' as const
        };
      case 'share_result':
        return {
          icon: TrendingUp,
          title: '分享您的精彩作品',
          subtitle: '让更多人看到您的创作成果',
          description: '登录后可以分享评测结果，参与社区讨论，发现更多优秀作品。',
          buttonText: '开始分享',
          urgency: 'low' as const
        };
      case 'advanced_features':
        return {
          icon: User,
          title: '解锁更多高级功能',
          subtitle: '专业评测工具等您探索',
          description: '登录用户可使用批量评测、详细报告、自定义模板等高级功能。',
          buttonText: '解锁功能',
          urgency: 'medium' as const
        };
    }
  };

  const config = getTriggerConfig();
  const IconComponent = config.icon;

  const getUrgencyStyles = () => {
    switch (config.urgency) {
      case 'high':
        return {
          iconColor: 'text-red-500',
          gradient: 'from-red-500 to-pink-500',
          buttonClass: 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700'
        };
      case 'medium':
        return {
          iconColor: 'text-orange-500',
          gradient: 'from-orange-500 to-amber-500',
          buttonClass: 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700'
        };
      case 'low':
        return {
          iconColor: 'text-blue-500',
          gradient: 'from-blue-500 to-purple-500',
          buttonClass: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
        };
    }
  };

  const styles = getUrgencyStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors z-10"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              {/* Header with gradient background */}
              <div className={`bg-gradient-to-r ${styles.gradient} p-6 text-white relative`}>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{config.title}</h3>
                    <p className="text-sm opacity-90">{config.subtitle}</p>
                  </div>
                </div>
                
                {/* Usage indicator for limit_reached */}
                {trigger === 'limit_reached' && (
                  <div className="mt-4 flex items-center space-x-2">
                    <div className="flex-1 bg-white bg-opacity-20 rounded-full h-2">
                      <div className="h-full bg-white rounded-full" style={{ width: '100%' }} />
                    </div>
                    <span className="text-sm font-medium">3/3</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {config.description}
                </p>

                {/* Benefits list */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm text-gray-700">无限制评测次数</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm text-gray-700">保存评测历史记录</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm text-gray-700">高级数据分析功能</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleLogin}
                    className={`flex-1 ${styles.buttonClass} text-white px-4 py-3 rounded-lg font-medium transition-all hover:shadow-lg`}
                  >
                    {config.buttonText}
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    稍后再说
                  </button>
                </div>

                {/* Guest continue option for non-critical prompts */}
                {trigger !== 'limit_reached' && (
                  <div className="mt-3 text-center">
                    <button
                      onClick={onClose}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      继续以游客身份使用
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LoginPrompt;