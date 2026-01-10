import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IOSButton } from './IOSButton';
import { StatusEmoji } from './EmojiIcon';
import { iosColors, iosRadius, iosShadows } from '../utils/iosTheme';
import { iosAnimations } from '../utils/animations';

export interface IOSAlertAction {
  label: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive';
  disabled?: boolean;
}

export interface IOSAlertProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  actions?: IOSAlertAction[];
  showCloseButton?: boolean;
  customIcon?: React.ReactNode;
  className?: string;
}

export const IOSAlert: React.FC<IOSAlertProps> = ({
  visible,
  onClose,
  title,
  message,
  type = 'info',
  actions = [{ label: '确定', onPress: onClose, style: 'default' }],
  showCloseButton = false,
  customIcon,
  className = '',
}) => {
  // Type-based configurations
  const typeConfig = {
    info: {
      emoji: 'info',
      titleColor: 'text-blue-900 dark:text-blue-100',
      borderColor: 'border-blue-200 dark:border-blue-800',
      bgColor: 'bg-blue-50/80 dark:bg-blue-900/20',
    },
    success: {
      emoji: 'completed',
      titleColor: 'text-green-900 dark:text-green-100',
      borderColor: 'border-green-200 dark:border-green-800',
      bgColor: 'bg-green-50/80 dark:bg-green-900/20',
    },
    warning: {
      emoji: 'pending',
      titleColor: 'text-orange-900 dark:text-orange-100',
      borderColor: 'border-orange-200 dark:border-orange-800',
      bgColor: 'bg-orange-50/80 dark:bg-orange-900/20',
    },
    error: {
      emoji: 'failed',
      titleColor: 'text-red-900 dark:text-red-100',
      borderColor: 'border-red-200 dark:border-red-800',
      bgColor: 'bg-red-50/80 dark:bg-red-900/20',
    },
  };

  const config = typeConfig[type];

  // Action button variant mapping
  const getActionVariant = (style: IOSAlertAction['style']) => {
    switch (style) {
      case 'cancel':
        return 'secondary';
      case 'destructive':
        return 'destructive';
      default:
        return 'primary';
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Alert Container */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              className={`
                relative w-full max-w-sm mx-auto
                bg-white/95 dark:bg-gray-800/95
                backdrop-blur-xl
                rounded-2xl
                shadow-2xl
                border border-white/20 dark:border-gray-700/50
                overflow-hidden
                ${className}
              `}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={iosAnimations.spring}
            >
              {/* Glass morphism overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              
              {/* Content */}
              <div className="relative z-10 p-6">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  {customIcon || (
                    <StatusEmoji 
                      status={config.emoji as any} 
                      size="lg" 
                      animated 
                    />
                  )}
                </div>
                
                {/* Title */}
                {title && (
                  <h3 className={`
                    text-lg font-semibold text-center mb-2
                    ${config.titleColor}
                  `}>
                    {title}
                  </h3>
                )}
                
                {/* Message */}
                {message && (
                  <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed mb-6">
                    {message}
                  </p>
                )}
                
                {/* Actions */}
                <div className={`
                  flex gap-3
                  ${actions.length > 2 ? 'flex-col' : 'flex-row'}
                `}>
                  {actions.map((action, index) => (
                    <IOSButton
                      key={index}
                      variant={getActionVariant(action.style)}
                      size="md"
                      disabled={action.disabled}
                      onClick={action.onPress}
                      className={`
                        ${actions.length <= 2 ? 'flex-1' : ''}
                        ${action.style === 'cancel' ? 'order-last' : ''}
                      `}
                    >
                      {action.label}
                    </IOSButton>
                  ))}
                </div>
              </div>
              
              {/* Close Button */}
              {showCloseButton && (
                <motion.button
                  className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  onClick={onClose}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ✕
                </motion.button>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

// Utility function for programmatic alerts
interface ShowAlertOptions extends Omit<IOSAlertProps, 'visible' | 'onClose'> {
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const showIOSAlert = (options: ShowAlertOptions): Promise<boolean> => {
  return new Promise((resolve) => {
    const alertContainer = document.createElement('div');
    document.body.appendChild(alertContainer);
    
    const cleanup = () => {
      document.body.removeChild(alertContainer);
    };
    
    const handleConfirm = () => {
      options.onConfirm?.();
      cleanup();
      resolve(true);
    };
    
    const handleCancel = () => {
      options.onCancel?.();
      cleanup();
      resolve(false);
    };
    
    const actions: IOSAlertAction[] = [];
    
    if (options.cancelText) {
      actions.push({
        label: options.cancelText,
        onPress: handleCancel,
        style: 'cancel',
      });
    }
    
    actions.push({
      label: options.confirmText || '确定',
      onPress: handleConfirm,
      style: 'default',
    });
    
    // Use React.createElement and render to create the alert
    // This would require additional setup with ReactDOM in a real implementation
    console.warn('showIOSAlert utility requires ReactDOM integration for programmatic usage');
    
    // For now, return a resolved promise
    resolve(true);
  });
};