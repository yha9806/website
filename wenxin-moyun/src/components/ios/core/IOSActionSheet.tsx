import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { liquidGlass, iosColors } from '../utils/iosTheme';
import { iosAnimations } from '../utils/animations';
import { EmojiIcon } from './EmojiIcon';

export interface ActionSheetItem {
  id: string;
  label: string;
  emoji?: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export interface IOSActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actions: ActionSheetItem[];
  cancelLabel?: string;
  showCancel?: boolean;
  allowDismiss?: boolean;
  className?: string;
}

export const IOSActionSheet: React.FC<IOSActionSheetProps> = ({
  visible,
  onClose,
  title,
  message,
  actions,
  cancelLabel = 'Cancel',
  showCancel = true,
  allowDismiss = true,
  className = '',
}) => {
  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && allowDismiss) {
      onClose();
    }
  };

  // Handle action press
  const handleActionPress = (action: ActionSheetItem) => {
    if (!action.disabled) {
      action.onPress();
      onClose();
    }
  };

  const actionSheetContent = (
    <AnimatePresence mode="wait">
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60"
            onClick={handleBackdropClick}
            style={{ backdropFilter: 'blur(4px)' }}
          />

          {/* Action Sheet Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 400,
              mass: 0.8
            }}
            className={`
              fixed bottom-0 left-0 right-0 z-50
              p-4 pb-safe
              ${className}
            `}
          >
            {/* Main Actions Card */}
            <div
              className={`
                ${liquidGlass.containers.card}
                rounded-2xl overflow-hidden mb-2
              `}
              style={{
                boxShadow: liquidGlass.shadows.medium,
                backdropFilter: 'blur(30px) saturate(180%)',
                WebkitBackdropFilter: 'blur(30px) saturate(180%)'
              }}
            >
              {/* Header */}
              {(title || message) && (
                <div className="px-6 py-4 text-center border-b border-gray-200/30 dark:border-gray-700/30">
                  {title && (
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {title}
                    </h3>
                  )}
                  {message && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {message}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="divide-y divide-gray-200/30 dark:divide-gray-700/30">
                {actions.map((action, index) => (
                  <motion.button
                    key={action.id}
                    disabled={action.disabled}
                    className={`
                      w-full px-6 py-4 flex items-center justify-center gap-3
                      text-base font-medium
                      transition-colors duration-150
                      ${action.disabled 
                        ? 'opacity-40 cursor-not-allowed' 
                        : 'cursor-pointer active:bg-gray-100/50 dark:active:bg-gray-800/50'
                      }
                      ${action.destructive
                        ? 'text-red-500 dark:text-red-400'
                        : 'text-blue-500 dark:text-blue-400'
                      }
                      ${index === 0 && !title && !message ? 'rounded-t-2xl' : ''}
                      ${index === actions.length - 1 ? 'rounded-b-2xl' : ''}
                    `}
                    onClick={() => handleActionPress(action)}
                    whileHover={!action.disabled ? { scale: 1.02 } : {}}
                    whileTap={!action.disabled ? { scale: 0.98 } : {}}
                    transition={iosAnimations.spring}
                  >
                    {/* Icon/Emoji */}
                    {action.emoji && (
                      <EmojiIcon 
                        category="actions" 
                        name={action.emoji as any} 
                        size="sm" 
                      />
                    )}
                    {action.icon && !action.emoji && (
                      <span className="text-lg">
                        {action.icon}
                      </span>
                    )}
                    
                    {/* Label */}
                    <span>{action.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Cancel Button */}
            {showCancel && (
              <motion.button
                className={`
                  w-full px-6 py-4
                  ${liquidGlass.containers.card}
                  rounded-2xl
                  text-base font-semibold
                  text-blue-500 dark:text-blue-400
                  active:bg-gray-100/50 dark:active:bg-gray-800/50
                  transition-colors duration-150
                `}
                style={{
                  boxShadow: liquidGlass.shadows.soft,
                  backdropFilter: 'blur(30px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(30px) saturate(180%)'
                }}
                onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={iosAnimations.spring}
              >
                {cancelLabel}
              </motion.button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Render in portal to ensure proper z-index stacking
  return createPortal(actionSheetContent, document.body);
};

// Higher-order component for easier action sheet management
export const useIOSActionSheet = () => {
  const [visible, setVisible] = React.useState(false);

  const showActionSheet = () => setVisible(true);
  const hideActionSheet = () => setVisible(false);
  const toggleActionSheet = () => setVisible(!visible);

  return {
    visible,
    showActionSheet,
    hideActionSheet,
    toggleActionSheet,
  };
};

export default IOSActionSheet;