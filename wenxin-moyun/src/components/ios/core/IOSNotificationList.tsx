import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { liquidGlass } from '../utils/iosTheme';
import { iosAnimations } from '../utils/animations';
import { EmojiIcon } from './EmojiIcon';
import { X, Eye, Archive } from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  type?: 'info' | 'success' | 'warning' | 'error';
  emoji?: string;
  icon?: React.ReactNode;
  read?: boolean;
  avatar?: string;
  appName?: string;
  actions?: {
    label: string;
    emoji?: string;
    destructive?: boolean;
    onPress: () => void;
  }[];
}

export interface NotificationGroup {
  id: string;
  title: string;
  notifications: NotificationItem[];
  collapsed?: boolean;
}

export interface IOSNotificationListProps {
  notifications?: NotificationItem[];
  groups?: NotificationGroup[];
  showTimestamps?: boolean;
  allowSwipeActions?: boolean;
  showGroupHeaders?: boolean;
  onNotificationPress?: (notification: NotificationItem) => void;
  onNotificationDismiss?: (id: string) => void;
  onNotificationRead?: (id: string) => void;
  onClearAll?: () => void;
  className?: string;
}

export const IOSNotificationList: React.FC<IOSNotificationListProps> = ({
  notifications = [],
  groups = [],
  showTimestamps = true,
  allowSwipeActions = true,
  showGroupHeaders = true,
  onNotificationPress,
  onNotificationDismiss,
  onNotificationRead,
  onClearAll,
  className = '',
}) => {
  const [swipedNotification, setSwipedNotification] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return timestamp.toLocaleDateString();
  };

  // Get notification type styling
  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'success': return 'text-green-500 dark:text-green-400';
      case 'warning': return 'text-orange-500 dark:text-orange-400';
      case 'error': return 'text-red-500 dark:text-red-400';
      default: return 'text-blue-500 dark:text-blue-400';
    }
  };

  // Handle swipe action
  const handleSwipeAction = (notificationId: string, action: 'dismiss' | 'read') => {
    if (action === 'dismiss') {
      onNotificationDismiss?.(notificationId);
    } else if (action === 'read') {
      onNotificationRead?.(notificationId);
    }
    setSwipedNotification(null);
  };

  // Handle drag end for swipe actions
  const handleDragEnd = (notificationId: string) => (_: any, info: PanInfo) => {
    const { offset, velocity } = info;
    
    if (Math.abs(offset.x) > 100 || Math.abs(velocity.x) > 500) {
      setSwipedNotification(notificationId);
    }
  };

  // Toggle group collapse
  const toggleGroup = (groupId: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupId)) {
      newCollapsed.delete(groupId);
    } else {
      newCollapsed.add(groupId);
    }
    setCollapsedGroups(newCollapsed);
  };

  // Render notification item
  const renderNotification = (notification: NotificationItem, index: number, inGroup = false) => (
    <motion.div
      key={notification.id}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -300, transition: { duration: 0.2 } }}
      transition={{ ...iosAnimations.spring, delay: index * 0.05 }}
      className="relative"
    >
      {/* Swipe Actions Background */}
      <AnimatePresence>
        {swipedNotification === notification.id && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-y-0 right-0 flex items-center"
          >
            <motion.button
              className="h-full px-6 bg-blue-500 flex items-center justify-center text-white"
              onClick={() => handleSwipeAction(notification.id, 'read')}
              whileTap={{ scale: 0.9 }}
            >
              <Eye className="w-5 h-5" />
            </motion.button>
            <motion.button
              className="h-full px-6 bg-red-500 flex items-center justify-center text-white"
              onClick={() => handleSwipeAction(notification.id, 'dismiss')}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Card */}
      <motion.div
        drag={allowSwipeActions ? "x" : false}
        dragConstraints={{ left: -200, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd(notification.id)}
        className={`
          relative z-10 mb-2
          ${liquidGlass.containers.card}
          rounded-2xl p-4
          cursor-pointer
          ${!notification.read ? 'ring-1 ring-blue-500/20' : ''}
          ${inGroup ? 'ml-4' : ''}
        `}
        style={{
          boxShadow: liquidGlass.shadows.soft,
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)'
        }}
        onClick={() => onNotificationPress?.(notification)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={iosAnimations.spring}
      >
        <div className="flex items-start gap-3">
          {/* Avatar/Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(notification.type)}`}>
            {notification.avatar ? (
              <img 
                src={notification.avatar} 
                alt="" 
                className="w-full h-full rounded-full object-cover" 
              />
            ) : notification.emoji ? (
              <EmojiIcon 
                category="content" 
                name={notification.emoji as any} 
                size="md" 
              />
            ) : notification.icon ? (
              notification.icon
            ) : (
              <div className="w-6 h-6 bg-current/20 rounded-full" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {notification.appName && (
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {notification.appName}
                  </p>
                )}
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {notification.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                  {notification.message}
                </p>
              </div>

              {/* Timestamp & Unread Indicator */}
              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                {showTimestamps && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimestamp(notification.timestamp)}
                  </span>
                )}
                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </div>
            </div>

            {/* Actions */}
            {notification.actions && notification.actions.length > 0 && (
              <div className="flex gap-2 mt-3">
                {notification.actions.map((action, actionIndex) => (
                  <motion.button
                    key={actionIndex}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-medium
                      ${action.destructive
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20'
                      }
                      transition-colors duration-150
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onPress();
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {action.emoji && (
                      <EmojiIcon 
                        category="actions" 
                        name={action.emoji as any} 
                        size="xs" 
                        className="mr-1" 
                      />
                    )}
                    {action.label}
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  // Prepare data for rendering
  const hasGroups = groups.length > 0;
  const allNotifications = hasGroups ? [] : notifications;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Clear All Button */}
      {(allNotifications.length > 0 || groups.some(g => g.notifications.length > 0)) && onClearAll && (
        <div className="flex justify-end mb-4">
          <motion.button
            className="text-sm text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
            onClick={onClearAll}
            whileTap={{ scale: 0.95 }}
          >
            Clear All
          </motion.button>
        </div>
      )}

      {/* Individual Notifications */}
      <AnimatePresence mode="popLayout">
        {allNotifications.map((notification, index) => 
          renderNotification(notification, index)
        )}
      </AnimatePresence>

      {/* Grouped Notifications */}
      {hasGroups && groups.map((group, groupIndex) => (
        <div key={group.id} className="space-y-2">
          {/* Group Header */}
          {showGroupHeaders && (
            <motion.button
              className="w-full text-left p-3 rounded-xl bg-gray-100/50 dark:bg-gray-800/50 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
              onClick={() => toggleGroup(group.id)}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {group.title}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {group.notifications.filter(n => !n.read).length} new
                  </span>
                  <motion.div
                    animate={{ rotate: collapsedGroups.has(group.id) ? -90 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-gray-400"
                  >
                    ▼
                  </motion.div>
                </div>
              </div>
            </motion.button>
          )}

          {/* Group Notifications */}
          <AnimatePresence>
            {!collapsedGroups.has(group.id) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-2"
              >
                {group.notifications.map((notification, index) => 
                  renderNotification(notification, index, true)
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {/* Empty State */}
      {allNotifications.length === 0 && groups.every(g => g.notifications.length === 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            ${liquidGlass.containers.card}
            rounded-2xl p-8 text-center
          `}
          style={{
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)'
          }}
        >
          <div className="text-4xl mb-4">🔔</div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Notifications
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You're all caught up!
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default IOSNotificationList;