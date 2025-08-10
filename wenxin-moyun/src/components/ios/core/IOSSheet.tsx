import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { createPortal } from 'react-dom';
import { liquidGlass } from '../utils/iosTheme';
import { iosAnimations } from '../utils/animations';

export interface IOSSheetProps {
  visible: boolean;
  onClose: () => void;
  height?: 'small' | 'medium' | 'large' | number;
  showHandle?: boolean;
  snapPoints?: number[];
  allowDismiss?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const IOSSheet: React.FC<IOSSheetProps> = ({
  visible,
  onClose,
  height = 'medium',
  showHandle = true,
  snapPoints,
  allowDismiss = true,
  className = '',
  children,
}) => {
  const [currentSnapPoint, setCurrentSnapPoint] = useState(0);
  const dragControls = useDragControls();

  // Height configurations
  const heightConfig = {
    small: 40, // 40vh
    medium: 60, // 60vh
    large: 90, // 90vh
  };

  const sheetHeight = typeof height === 'number' ? height : heightConfig[height];
  const finalSnapPoints = snapPoints || [sheetHeight, 25, 0]; // Default snap points

  // Handle drag end to determine snap position
  const handleDragEnd = (_: any, info: PanInfo) => {
    const { offset, velocity } = info;
    const currentHeight = finalSnapPoints[currentSnapPoint];
    
    // Determine next snap point based on drag velocity and distance
    if (velocity.y > 500 || offset.y > 100) {
      // Drag down with high velocity or significant distance - go to next lower snap point
      if (currentSnapPoint < finalSnapPoints.length - 1) {
        const nextIndex = currentSnapPoint + 1;
        setCurrentSnapPoint(nextIndex);
        
        // If we reach the lowest point (typically 0), close the sheet
        if (finalSnapPoints[nextIndex] === 0 && allowDismiss) {
          onClose();
        }
      }
    } else if (velocity.y < -500 || offset.y < -100) {
      // Drag up with high velocity or significant distance - go to next higher snap point
      if (currentSnapPoint > 0) {
        setCurrentSnapPoint(currentSnapPoint - 1);
      }
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && allowDismiss) {
      onClose();
    }
  };

  // Prevent body scroll when sheet is visible
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [visible]);

  // Reset snap point when sheet becomes visible
  useEffect(() => {
    if (visible) {
      setCurrentSnapPoint(0);
    }
  }, [visible]);

  const sheetContent = (
    <AnimatePresence mode="wait">
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40"
            onClick={handleBackdropClick}
            style={{ backdropFilter: 'blur(4px)' }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ 
              y: `${100 - finalSnapPoints[currentSnapPoint]}%` 
            }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
              mass: 0.8
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            dragControls={dragControls}
            onDragEnd={handleDragEnd}
            className={`
              fixed bottom-0 left-0 right-0 z-50
              ${liquidGlass.containers.sheet}
              rounded-t-3xl
              max-h-screen
              ${className}
            `}
            style={{
              boxShadow: liquidGlass.shadows.strong,
              backdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)'
            }}
          >
            {/* Drag Handle */}
            {showHandle && (
              <div 
                className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-9 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>
            )}

            {/* Content Container */}
            <div 
              className="flex flex-col h-full overflow-hidden"
              style={{
                maxHeight: `${finalSnapPoints[currentSnapPoint]}vh`
              }}
            >
              {/* Sheet Content */}
              <div className="flex-1 overflow-y-auto px-4 pb-safe">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Render in portal to ensure proper z-index stacking
  return createPortal(sheetContent, document.body);
};

// Higher-order component for easier sheet management
export const useIOSSheet = () => {
  const [visible, setVisible] = useState(false);

  const showSheet = () => setVisible(true);
  const hideSheet = () => setVisible(false);
  const toggleSheet = () => setVisible(!visible);

  return {
    visible,
    showSheet,
    hideSheet,
    toggleSheet,
  };
};

export default IOSSheet;