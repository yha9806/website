import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { liquidGlass } from '../utils/iosTheme';
import { iosAnimations } from '../utils/animations';
import { EmojiIcon } from './EmojiIcon';

export interface ContextMenuItem {
  id: string;
  label: string;
  emoji?: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  shortcut?: string;
  onPress: () => void;
  submenu?: ContextMenuItem[];
}

export interface IOSContextMenuProps {
  children: React.ReactNode;
  items: ContextMenuItem[];
  disabled?: boolean;
  longPressDuration?: number;
  previewScale?: number;
  className?: string;
}

export const IOSContextMenu: React.FC<IOSContextMenuProps> = ({
  children,
  items,
  disabled = false,
  longPressDuration = 500,
  previewScale = 1.05,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  
  const triggerRef = useRef<HTMLDivElement>(null);
  const longPressRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate menu position to stay within viewport
  const calculateMenuPosition = (clientX: number, clientY: number) => {
    const menuWidth = 280;
    const menuHeight = items.length * 44 + 16; // Approximate height
    const padding = 16;

    let x = clientX - menuWidth / 2;
    let y = clientY - menuHeight - 10; // Position above touch point by default

    // Adjust horizontally
    if (x < padding) x = padding;
    if (x + menuWidth > window.innerWidth - padding) {
      x = window.innerWidth - menuWidth - padding;
    }

    // Adjust vertically
    if (y < padding) {
      y = clientY + 10; // Position below if not enough space above
    }
    if (y + menuHeight > window.innerHeight - padding) {
      y = window.innerHeight - menuHeight - padding;
    }

    return { x, y };
  };

  // Handle long press start
  const handleLongPressStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    setIsPreviewActive(true);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    longPressRef.current = setTimeout(() => {
      const position = calculateMenuPosition(clientX, clientY);
      setMenuPosition(position);
      setIsVisible(true);
      setIsPreviewActive(false);
    }, longPressDuration);
  };

  // Handle long press cancel
  const handleLongPressCancel = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    setIsPreviewActive(false);
  }, []);

  // Close menu
  const closeMenu = useCallback(() => {
    setIsVisible(false);
    setActiveSubmenu(null);
    handleLongPressCancel();
  }, [handleLongPressCancel]);

  // Handle menu item press
  const handleMenuItemPress = (item: ContextMenuItem) => {
    if (item.disabled) return;
    
    if (item.submenu) {
      setActiveSubmenu(activeSubmenu === item.id ? null : item.id);
    } else {
      item.onPress();
      closeMenu();
    }
  };

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, closeMenu]);

  // Prevent body scroll when menu is visible
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isVisible]);

  const menuContent = (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/10 dark:bg-black/20"
            onClick={closeMenu}
          />

          {/* Context Menu */}
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 400,
              mass: 0.5
            }}
            className="fixed z-50 min-w-70 max-w-80"
            style={{
              left: menuPosition.x,
              top: menuPosition.y,
            }}
          >
            <div
              className={`
                ${liquidGlass.containers.overlay}
                rounded-2xl overflow-hidden
                py-2
              `}
              style={{
                boxShadow: liquidGlass.shadows.strong,
                backdropFilter: 'blur(40px) saturate(200%)',
                WebkitBackdropFilter: 'blur(40px) saturate(200%)'
              }}
            >
              {items.map((item, index) => (
                <div key={item.id} className="relative">
                  {/* Main Menu Item */}
                  <motion.button
                    disabled={item.disabled}
                    className={`
                      w-full px-4 py-3 flex items-center justify-between
                      text-left transition-colors duration-150
                      ${item.disabled 
                        ? 'opacity-40 cursor-not-allowed' 
                        : 'cursor-pointer hover:bg-white/10 dark:hover:bg-white/5'
                      }
                      ${item.destructive
                        ? 'text-red-500 dark:text-red-400'
                        : 'text-gray-900 dark:text-white'
                      }
                    `}
                    onClick={() => handleMenuItemPress(item)}
                    whileTap={!item.disabled ? { scale: 0.98 } : {}}
                    transition={iosAnimations.spring}
                  >
                    <div className="flex items-center gap-3">
                      {/* Icon/Emoji */}
                      {item.emoji && (
                        <EmojiIcon 
                          category="actions" 
                          name={item.emoji}
                          size="sm" 
                        />
                      )}
                      {item.icon && !item.emoji && (
                        <span className="text-lg w-5 h-5 flex items-center justify-center">
                          {item.icon}
                        </span>
                      )}
                      
                      {/* Label */}
                      <span className="text-base font-medium">
                        {item.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Shortcut */}
                      {item.shortcut && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {item.shortcut}
                        </span>
                      )}
                      
                      {/* Submenu Indicator */}
                      {item.submenu && (
                        <motion.div
                          animate={{ rotate: activeSubmenu === item.id ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-gray-500 dark:text-gray-400"
                        >
                          ▶
                        </motion.div>
                      )}
                    </div>
                  </motion.button>

                  {/* Submenu */}
                  <AnimatePresence>
                    {item.submenu && activeSubmenu === item.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gray-50/50 dark:bg-gray-900/50"
                      >
                        {item.submenu.map((subItem) => (
                          <motion.button
                            key={subItem.id}
                            disabled={subItem.disabled}
                            className={`
                              w-full px-8 py-2.5 flex items-center gap-3
                              text-left transition-colors duration-150
                              ${subItem.disabled 
                                ? 'opacity-40 cursor-not-allowed' 
                                : 'cursor-pointer hover:bg-white/10 dark:hover:bg-white/5'
                              }
                              ${subItem.destructive
                                ? 'text-red-500 dark:text-red-400'
                                : 'text-gray-700 dark:text-gray-300'
                              }
                            `}
                            onClick={() => {
                              if (!subItem.disabled) {
                                subItem.onPress();
                                closeMenu();
                              }
                            }}
                            whileTap={!subItem.disabled ? { scale: 0.98 } : {}}
                            transition={iosAnimations.spring}
                          >
                            {subItem.emoji && (
                              <EmojiIcon 
                                category="actions" 
                                name={subItem.emoji}
                                size="xs" 
                              />
                            )}
                            {subItem.icon && !subItem.emoji && (
                              <span className="text-sm w-4 h-4 flex items-center justify-center">
                                {subItem.icon}
                              </span>
                            )}
                            <span className="text-sm">
                              {subItem.label}
                            </span>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Separator */}
                  {index < items.length - 1 && (
                    <div className="h-px bg-gray-200/30 dark:bg-gray-700/30 mx-4" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Trigger Element */}
      <motion.div
        ref={triggerRef}
        className={`select-none ${className}`}
        animate={{
          scale: isPreviewActive ? previewScale : 1,
          filter: isPreviewActive ? 'brightness(0.9)' : 'brightness(1)',
        }}
        transition={iosAnimations.spring}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressCancel}
        onMouseLeave={handleLongPressCancel}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressCancel}
        onTouchCancel={handleLongPressCancel}
        onContextMenu={(e) => e.preventDefault()} // Disable browser context menu
      >
        {children}
      </motion.div>

      {/* Portal for menu */}
      {createPortal(menuContent, document.body)}
    </>
  );
};

export default IOSContextMenu;
