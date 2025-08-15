import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { IOSButton } from './IOSButton';
import type { IOSButtonProps } from './IOSButton';
import { liquidGlass } from '../utils/iosTheme';
import { iosAnimations } from '../utils/animations';
import { EmojiIcon } from './EmojiIcon';
import { ChevronDown } from 'lucide-react';

export interface PopupMenuItem {
  id: string;
  label: string;
  emoji?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  value?: string | number;
  onPress: (item: PopupMenuItem) => void;
}

export interface IOSPopupButtonProps extends Omit<IOSButtonProps, 'children' | 'onClick'> {
  label: string;
  items: PopupMenuItem[];
  selectedId?: string;
  placeholder?: string;
  showArrow?: boolean;
  menuWidth?: 'auto' | 'match' | number;
  maxHeight?: number;
  disabled?: boolean;
  onSelectionChange?: (item: PopupMenuItem) => void;
  renderSelectedItem?: (item: PopupMenuItem | null) => React.ReactNode;
}

export const IOSPopupButton: React.FC<IOSPopupButtonProps> = ({
  label,
  items,
  selectedId,
  placeholder = 'Select an option',
  showArrow = true,
  menuWidth = 'match',
  maxHeight = 300,
  disabled = false,
  onSelectionChange,
  renderSelectedItem,
  variant = 'secondary',
  size = 'md',
  className = '',
  ...buttonProps
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0, width: 0 });
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Find selected item
  const selectedItem = selectedId ? items.find(item => item.id === selectedId) : null;

  // Calculate menu position
  const calculateMenuPosition = () => {
    if (!buttonRef.current) return;
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const padding = 8;
    
    const width = menuWidth === 'match' ? buttonRect.width : 
                menuWidth === 'auto' ? 'auto' : 
                typeof menuWidth === 'number' ? menuWidth : buttonRect.width;
    
    let x = buttonRect.left;
    let y = buttonRect.bottom + padding;

    // Adjust horizontally if menu would overflow
    if (typeof width === 'number' && x + width > window.innerWidth - padding) {
      x = window.innerWidth - width - padding;
    }

    // Adjust vertically if menu would overflow
    const estimatedMenuHeight = Math.min(items.length * 44 + 16, maxHeight);
    if (y + estimatedMenuHeight > window.innerHeight - padding) {
      y = buttonRect.top - estimatedMenuHeight - padding;
    }

    setMenuPosition({ x, y, width: typeof width === 'number' ? width : buttonRect.width });
  };

  // Toggle menu
  const toggleMenu = () => {
    if (disabled) return;
    
    if (!isOpen) {
      calculateMenuPosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Handle item selection
  const handleItemPress = (item: PopupMenuItem) => {
    if (item.disabled) return;
    
    item.onPress(item);
    onSelectionChange?.(item);
    setIsOpen(false);
  };

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle scroll/resize to reposition menu
  useEffect(() => {
    if (isOpen) {
      const handleReposition = () => calculateMenuPosition();
      
      window.addEventListener('scroll', handleReposition, true);
      window.addEventListener('resize', handleReposition);
      
      return () => {
        window.removeEventListener('scroll', handleReposition, true);
        window.removeEventListener('resize', handleReposition);
      };
    }
  }, [isOpen]);

  // Render button content
  const renderButtonContent = () => {
    if (renderSelectedItem && selectedItem) {
      return renderSelectedItem(selectedItem);
    }

    if (selectedItem) {
      return (
        <div className="flex items-center gap-2">
          {selectedItem.emoji && (
            <EmojiIcon 
              category="actions" 
              name={selectedItem.emoji as any} 
              size="sm" 
            />
          )}
          {selectedItem.icon && !selectedItem.emoji && selectedItem.icon}
          <span>{selectedItem.label}</span>
        </div>
      );
    }

    return placeholder;
  };

  const menuContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 400,
            mass: 0.5
          }}
          className="fixed z-50"
          style={{
            left: menuPosition.x,
            top: menuPosition.y,
            width: menuWidth === 'auto' ? 'auto' : menuPosition.width,
            minWidth: menuWidth === 'auto' ? 200 : undefined,
            maxHeight,
          }}
        >
          <div
            className={`
              ${liquidGlass.containers.card}
              rounded-xl overflow-hidden
              border ${liquidGlass.borders.regular}
            `}
            style={{
              boxShadow: liquidGlass.shadows.medium,
              backdropFilter: 'blur(30px) saturate(180%)',
              WebkitBackdropFilter: 'blur(30px) saturate(180%)'
            }}
          >
            <div className="py-1 max-h-full overflow-y-auto">
              {items.map((item, index) => (
                <motion.button
                  key={item.id}
                  disabled={item.disabled}
                  className={`
                    w-full px-4 py-3 flex items-center gap-3
                    text-left transition-colors duration-150
                    ${item.disabled 
                      ? 'opacity-40 cursor-not-allowed' 
                      : 'cursor-pointer hover:bg-white/10 dark:hover:bg-white/5'
                    }
                    ${item.destructive
                      ? 'text-red-500 dark:text-red-400'
                      : 'text-gray-900 dark:text-white'
                    }
                    ${selectedId === item.id 
                      ? 'bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400' 
                      : ''
                    }
                  `}
                  onClick={() => handleItemPress(item)}
                  whileTap={!item.disabled ? { scale: 0.98 } : {}}
                  transition={iosAnimations.spring}
                >
                  {/* Icon/Emoji */}
                  {item.emoji && (
                    <EmojiIcon 
                      category="actions" 
                      name={item.emoji as any} 
                      size="sm" 
                    />
                  )}
                  {item.icon && !item.emoji && (
                    <span className="text-lg w-5 h-5 flex items-center justify-center">
                      {item.icon}
                    </span>
                  )}
                  
                  {/* Label */}
                  <span className="text-sm font-medium flex-1">
                    {item.label}
                  </span>

                  {/* Selection Indicator */}
                  {selectedId === item.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={iosAnimations.spring}
                      className="text-blue-500 dark:text-blue-400"
                    >
                      ✓
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Popup Button */}
      <IOSButton
        ref={buttonRef}
        variant={variant}
        size={size}
        disabled={disabled}
        className={`justify-between ${className}`}
        onClick={toggleMenu}
        {...buttonProps}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="truncate">
            {renderButtonContent()}
          </span>
        </div>
        
        {showArrow && (
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 ml-2"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        )}
      </IOSButton>

      {/* Portal for menu */}
      {createPortal(menuContent, document.body)}
    </>
  );
};

export default IOSPopupButton;