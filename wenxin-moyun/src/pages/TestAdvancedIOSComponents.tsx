import React, { useState } from 'react';
import { 
  IOSTabBar, 
  IOSSegmentedControl, 
  IOSSheet, 
  useIOSSheet,
  IOSActionSheet,
  useIOSActionSheet,
  IOSContextMenu,
  IOSPopupButton,
  IOSNotificationList,
  IOSButton,
  IOSCard,
  IOSCardHeader,
  IOSCardContent,
  liquidGlass,
  EmojiIcon
} from '../components/ios';
import type {
  TabBarItem,
  SegmentItem,
  ActionSheetItem,
  ContextMenuItem,
  PopupMenuItem,
  NotificationItem
} from '../components/ios';
import { motion } from 'framer-motion';

export default function TestAdvancedIOSComponents() {
  // TabBar state
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Segmented Control states
  const [selectedSegment, setSelectedSegment] = useState(0);
  const [selectedViewMode, setSelectedViewMode] = useState(1);
  
  // Sheet hooks
  const basicSheet = useIOSSheet();
  const snapPointSheet = useIOSSheet();
  const fullScreenSheet = useIOSSheet();

  // Action Sheet hooks
  const basicActionSheet = useIOSActionSheet();
  const destructiveActionSheet = useIOSActionSheet();

  // Popup Button state
  const [selectedOption, setSelectedOption] = useState<string>('option1');

  // TabBar items
  const tabItems: TabBarItem[] = [
    {
      id: 'home',
      label: 'Home',
      emoji: 'home',
      badgeCount: 0
    },
    {
      id: 'search',
      label: 'Search', 
      emoji: 'search',
      badgeCount: 0
    },
    {
      id: 'favorites',
      label: 'Favorites',
      emoji: 'heart',
      badgeCount: 3
    },
    {
      id: 'profile',
      label: 'Profile',
      emoji: 'user',
      badgeCount: 0
    },
    {
      id: 'settings',
      label: 'Settings',
      emoji: 'settings',
      badgeCount: 12
    }
  ];

  // Segmented Control segments
  const basicSegments = ['All', 'Images', 'Videos', 'Documents'];
  
  const advancedSegments: SegmentItem[] = [
    {
      id: 'list',
      label: 'List',
      emoji: 'list',
      value: 'list'
    },
    {
      id: 'grid',
      label: 'Grid',
      emoji: 'grid',
      value: 'grid'
    },
    {
      id: 'card',
      label: 'Card',
      emoji: 'card',
      value: 'card'
    }
  ];

  // Action Sheet items
  const basicActions: ActionSheetItem[] = [
    {
      id: 'edit',
      label: 'Edit',
      emoji: 'edit',
      onPress: () => console.log('Edit pressed')
    },
    {
      id: 'share',
      label: 'Share',
      emoji: 'share',
      onPress: () => console.log('Share pressed')
    },
    {
      id: 'favorite',
      label: 'Add to Favorites',
      emoji: 'heart',
      onPress: () => console.log('Favorite pressed')
    }
  ];

  const destructiveActions: ActionSheetItem[] = [
    {
      id: 'delete',
      label: 'Delete',
      emoji: 'trash',
      destructive: true,
      onPress: () => console.log('Delete pressed')
    },
    {
      id: 'archive',
      label: 'Archive',
      emoji: 'archive',
      onPress: () => console.log('Archive pressed')
    }
  ];

  // Context Menu items
  const contextMenuItems: ContextMenuItem[] = [
    {
      id: 'copy',
      label: 'Copy',
      emoji: 'copy',
      shortcut: '⌘C',
      onPress: () => console.log('Copy')
    },
    {
      id: 'paste',
      label: 'Paste',
      emoji: 'paste',
      shortcut: '⌘V',
      onPress: () => console.log('Paste')
    },
    {
      id: 'more',
      label: 'More Actions',
      emoji: 'more',
      submenu: [
        {
          id: 'duplicate',
          label: 'Duplicate',
          emoji: 'duplicate',
          onPress: () => console.log('Duplicate')
        },
        {
          id: 'rename',
          label: 'Rename',
          emoji: 'edit',
          onPress: () => console.log('Rename')
        }
      ],
      onPress: () => {}
    },
    {
      id: 'delete-context',
      label: 'Delete',
      emoji: 'trash',
      destructive: true,
      onPress: () => console.log('Delete from context')
    }
  ];

  // Popup Button options
  const popupOptions: PopupMenuItem[] = [
    {
      id: 'option1',
      label: 'First Option',
      emoji: 'star',
      value: 'option1',
      onPress: (item) => setSelectedOption(item.id)
    },
    {
      id: 'option2',
      label: 'Second Option',
      emoji: 'heart',
      value: 'option2',
      onPress: (item) => setSelectedOption(item.id)
    },
    {
      id: 'option3',
      label: 'Third Option',
      emoji: 'bookmark',
      value: 'option3',
      onPress: (item) => setSelectedOption(item.id)
    },
    {
      id: 'disabled',
      label: 'Disabled Option',
      emoji: 'block',
      disabled: true,
      value: 'disabled',
      onPress: (item) => setSelectedOption(item.id)
    }
  ];

  // Sample notifications
  const sampleNotifications: NotificationItem[] = [
    {
      id: 'notif1',
      title: 'New Message',
      message: 'You have received a new message from John Doe about the project update.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      type: 'info',
      emoji: 'message',
      read: false,
      appName: 'Messages',
      actions: [
        {
          label: 'Reply',
          emoji: 'reply',
          onPress: () => console.log('Reply')
        },
        {
          label: 'Mark as Read',
          onPress: () => console.log('Mark as read')
        }
      ]
    },
    {
      id: 'notif2',
      title: 'System Update',
      message: 'A new system update is available for download.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      type: 'warning',
      emoji: 'update',
      read: true,
      appName: 'System'
    },
    {
      id: 'notif3',
      title: 'Task Completed',
      message: 'Your background task has been completed successfully.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      type: 'success',
      emoji: 'checkmark',
      read: false,
      appName: 'Tasks'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 mb-8">
        <div 
          className={`
            px-4 py-6
            ${liquidGlass.containers.navigation}
          `}
          style={{
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)'
          }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
            🧪 Advanced iOS Components
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-center mt-2">
            Liquid Glass • TabBar • Segments • Sheets
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 space-y-8">
        
        {/* Liquid Glass Showcase */}
        <IOSCard variant="elevated" className="overflow-hidden">
          <IOSCardHeader 
            title="💧 Liquid Glass Effects"
            subtitle="iOS-authentic glass morphism system"
          />
          <IOSCardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(liquidGlass.containers).map(([key, classes]) => (
                <motion.div
                  key={key}
                  className={`p-4 rounded-xl ${classes} text-center`}
                  style={{
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)'
                  }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="text-2xl mb-2">✨</div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {key}
                  </div>
                </motion.div>
              ))}
            </div>
          </IOSCardContent>
        </IOSCard>

        {/* Segmented Control Showcase */}
        <IOSCard variant="elevated">
          <IOSCardHeader 
            title="🔘 Segmented Controls"
            subtitle="Multi-style segment selection"
          />
          <IOSCardContent className="space-y-6">
            {/* Basic Segments */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                Basic String Segments
              </h4>
              <IOSSegmentedControl
                segments={basicSegments}
                selectedIndex={selectedSegment}
                onChange={(index) => setSelectedSegment(index)}
                style="filled"
              />
              <p className="text-xs text-gray-500 mt-2">
                Selected: {basicSegments[selectedSegment]}
              </p>
            </div>

            {/* Advanced Segments with Icons */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                Advanced Segments with Emojis
              </h4>
              <IOSSegmentedControl
                segments={advancedSegments}
                selectedIndex={selectedViewMode}
                onChange={(index) => setSelectedViewMode(index)}
                style="filled"
                size="regular"
              />
              <p className="text-xs text-gray-500 mt-2">
                View Mode: {advancedSegments[selectedViewMode].label}
              </p>
            </div>

            {/* Different Styles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h5 className="text-xs font-medium text-gray-500 mb-2">Plain Style</h5>
                <IOSSegmentedControl
                  segments={['One', 'Two', 'Three']}
                  selectedIndex={0}
                  onChange={() => {}}
                  style="plain"
                  size="compact"
                />
              </div>
              <div>
                <h5 className="text-xs font-medium text-gray-500 mb-2">Bordered Style</h5>
                <IOSSegmentedControl
                  segments={['One', 'Two', 'Three']}
                  selectedIndex={1}
                  onChange={() => {}}
                  style="bordered"
                  size="compact"
                />
              </div>
              <div>
                <h5 className="text-xs font-medium text-gray-500 mb-2">Filled Style</h5>
                <IOSSegmentedControl
                  segments={['One', 'Two', 'Three']}
                  selectedIndex={2}
                  onChange={() => {}}
                  style="filled"
                  size="compact"
                />
              </div>
            </div>
          </IOSCardContent>
        </IOSCard>

        {/* Sheet Showcase */}
        <IOSCard variant="elevated">
          <IOSCardHeader 
            title="📋 iOS Sheets"
            subtitle="Bottom sheets with liquid glass effect"
          />
          <IOSCardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <IOSButton
                variant="primary"
                size="md"
                glassMorphism
                onClick={basicSheet.showSheet}
              >
                <EmojiIcon category="actions" name="expand" size="sm" />
                Basic Sheet
              </IOSButton>

              <IOSButton
                variant="secondary"
                size="md"
                glassMorphism
                onClick={snapPointSheet.showSheet}
              >
                <EmojiIcon category="actions" name="layers" size="sm" />
                Snap Points
              </IOSButton>

              <IOSButton
                variant="destructive"
                size="md"
                glassMorphism
                onClick={fullScreenSheet.showSheet}
              >
                <EmojiIcon category="actions" name="maximize" size="sm" />
                Full Screen
              </IOSButton>
            </div>
          </IOSCardContent>
        </IOSCard>

        {/* Action Sheets Showcase */}
        <IOSCard variant="elevated">
          <IOSCardHeader 
            title="📋 Action Sheets"
            subtitle="Modal action selection with liquid glass"
          />
          <IOSCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <IOSButton
                variant="primary"
                size="md"
                glassMorphism
                onClick={basicActionSheet.showActionSheet}
              >
                <EmojiIcon category="actions" name="list" size="sm" />
                Basic Actions
              </IOSButton>

              <IOSButton
                variant="destructive"
                size="md"
                glassMorphism
                onClick={destructiveActionSheet.showActionSheet}
              >
                <EmojiIcon category="actions" name="warning" size="sm" />
                Destructive Actions
              </IOSButton>
            </div>
          </IOSCardContent>
        </IOSCard>

        {/* Context Menu Showcase */}
        <IOSCard variant="elevated">
          <IOSCardHeader 
            title="🖱️ Context Menu"
            subtitle="Long press or right-click for context menu"
          />
          <IOSCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <IOSContextMenu items={contextMenuItems}>
                <div 
                  className={`
                    p-6 rounded-xl text-center cursor-pointer
                    ${liquidGlass.containers.card}
                    hover:scale-105 transition-transform
                  `}
                  style={{
                    backdropFilter: 'blur(20px) saturate(160%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(160%)'
                  }}
                >
                  <div className="text-2xl mb-2">📱</div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Long Press Me
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Context menu with submenu
                  </p>
                </div>
              </IOSContextMenu>

              <IOSContextMenu 
                items={contextMenuItems.slice(0, 2)} 
                longPressDuration={300}
              >
                <div 
                  className={`
                    p-6 rounded-xl text-center cursor-pointer
                    ${liquidGlass.containers.card}
                    hover:scale-105 transition-transform
                  `}
                  style={{
                    backdropFilter: 'blur(20px) saturate(160%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(160%)'
                  }}
                >
                  <div className="text-2xl mb-2">⚡</div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quick Context
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Faster trigger (300ms)
                  </p>
                </div>
              </IOSContextMenu>
            </div>
          </IOSCardContent>
        </IOSCard>

        {/* Popup Button Showcase */}
        <IOSCard variant="elevated">
          <IOSCardHeader 
            title="⬇️ Popup Button"
            subtitle="Dropdown selection with iOS styling"
          />
          <IOSCardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Option
                </label>
                <IOSPopupButton
                  label="Choose Option"
                  items={popupOptions}
                  selectedId={selectedOption}
                  placeholder="Select an option..."
                  onSelectionChange={(item) => console.log('Selected:', item)}
                  variant="secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Width
                </label>
                <IOSPopupButton
                  label="Wide Menu"
                  items={popupOptions}
                  selectedId={selectedOption}
                  menuWidth={300}
                  variant="primary"
                  glassMorphism
                />
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selected: <strong>{popupOptions.find(o => o.id === selectedOption)?.label || 'None'}</strong>
              </p>
            </div>
          </IOSCardContent>
        </IOSCard>

        {/* Notification List Showcase */}
        <IOSCard variant="elevated">
          <IOSCardHeader 
            title="🔔 Notification List"
            subtitle="iOS-style notifications with swipe actions"
          />
          <IOSCardContent>
            <IOSNotificationList
              notifications={sampleNotifications}
              showTimestamps={true}
              allowSwipeActions={true}
              onNotificationPress={(notif) => console.log('Pressed:', notif.title)}
              onNotificationDismiss={(id) => console.log('Dismissed:', id)}
              onNotificationRead={(id) => console.log('Read:', id)}
              onClearAll={() => console.log('Clear all')}
            />
          </IOSCardContent>
        </IOSCard>

        {/* TabBar Info Card */}
        <IOSCard variant="elevated">
          <IOSCardHeader 
            title="📱 TabBar (Fixed Bottom)"
            subtitle="Check the bottom of your screen!"
            emoji={<EmojiIcon category="navigation" name="menu" size="lg" />}
          />
          <IOSCardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Current Tab:</strong> {tabItems[selectedTab].label}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Badge Count: {tabItems[selectedTab].badgeCount || 'None'}
                </p>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                The TabBar is fixed at the bottom with liquid glass effect, 
                badge notifications, and smooth animations.
              </div>
            </div>
          </IOSCardContent>
        </IOSCard>
      </div>

      {/* Bottom TabBar */}
      <IOSTabBar
        items={tabItems}
        selectedIndex={selectedTab}
        onTabPress={(index, item) => {
          setSelectedTab(index);
          console.log('Tab pressed:', item.label);
        }}
        variant="regular"
        showLabels={true}
      />

      {/* Basic Sheet */}
      <IOSSheet
        visible={basicSheet.visible}
        onClose={basicSheet.hideSheet}
        height="medium"
        showHandle={true}
      >
        <div className="py-6 space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            🌊 Basic Sheet
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            This is a basic iOS sheet with liquid glass background effect. 
            You can drag the handle to dismiss it, or tap the backdrop.
          </p>
          <div className="flex gap-3 pt-4">
            <IOSButton variant="primary" size="sm" onClick={basicSheet.hideSheet}>
              Close Sheet
            </IOSButton>
            <IOSButton variant="text" size="sm">
              Another Action
            </IOSButton>
          </div>
        </div>
      </IOSSheet>

      {/* Snap Points Sheet */}
      <IOSSheet
        visible={snapPointSheet.visible}
        onClose={snapPointSheet.hideSheet}
        snapPoints={[80, 50, 25, 0]}
        showHandle={true}
      >
        <div className="py-6 space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            📏 Snap Points Sheet
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            This sheet has multiple snap points: 80%, 50%, 25%, and 0% (closed).
            Drag the handle up or down to see the snapping behavior!
          </p>
          <div className="space-y-2">
            {['80% - Full View', '50% - Half View', '25% - Peek View', '0% - Closed'].map((point, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </IOSSheet>

      {/* Full Screen Sheet */}
      <IOSSheet
        visible={fullScreenSheet.visible}
        onClose={fullScreenSheet.hideSheet}
        height="large"
        showHandle={true}
      >
        <div className="py-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              📱 Full Screen Sheet
            </h3>
            <IOSButton 
              variant="text" 
              size="sm" 
              onClick={fullScreenSheet.hideSheet}
            >
              Done
            </IOSButton>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300">
            This is a large sheet that covers 90% of the screen height, 
            perfect for detailed content or forms.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div 
                key={index}
                className={`p-4 rounded-xl ${liquidGlass.containers.card}`}
                style={{
                  backdropFilter: 'blur(10px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(10px) saturate(150%)'
                }}
              >
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Card {index + 1}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Content with liquid glass effect inside the sheet.
                </p>
              </div>
            ))}
          </div>
        </div>
      </IOSSheet>

      {/* Basic Action Sheet */}
      <IOSActionSheet
        visible={basicActionSheet.visible}
        onClose={basicActionSheet.hideActionSheet}
        title="Choose Action"
        message="Select an action from the options below"
        actions={basicActions}
        showCancel={true}
        cancelLabel="Cancel"
      />

      {/* Destructive Action Sheet */}
      <IOSActionSheet
        visible={destructiveActionSheet.visible}
        onClose={destructiveActionSheet.hideActionSheet}
        title="Danger Zone"
        message="These actions cannot be undone"
        actions={destructiveActions}
        showCancel={true}
        cancelLabel="Cancel"
      />
    </div>
  );
}