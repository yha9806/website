/**
 * ZoomableChartWrapper - Mobile-friendly chart container with pinch-to-zoom
 * Wraps Recharts components to enable touch gestures on mobile devices
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface ZoomableChartWrapperProps {
  children: React.ReactNode;
  className?: string;
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
  showControls?: boolean;
}

// Get distance between two touch points
const getDistance = (touch1: React.Touch, touch2: React.Touch): number => {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

export const ZoomableChartWrapper: React.FC<ZoomableChartWrapperProps> = ({
  children,
  className = '',
  minScale = 0.5,
  maxScale = 3,
  initialScale = 1,
  showControls = true,
}) => {
  const [scale, setScale] = useState(initialScale);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchDistance = useRef<number>(0);
  const lastPosition = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });

  // Handle pinch zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      lastTouchDistance.current = getDistance(e.touches[0], e.touches[1]);
    } else if (e.touches.length === 1) {
      // Pan start
      setIsDragging(true);
      dragStart.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
    }
  }, [position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      const newDistance = getDistance(e.touches[0], e.touches[1]);
      const delta = newDistance / lastTouchDistance.current;

      setScale(prevScale => {
        const newScale = prevScale * delta;
        return Math.min(Math.max(newScale, minScale), maxScale);
      });

      lastTouchDistance.current = newDistance;
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      // Pan only when zoomed in
      const newX = e.touches[0].clientX - dragStart.current.x;
      const newY = e.touches[0].clientY - dragStart.current.y;

      // Constrain pan within bounds
      const maxPan = (scale - 1) * 100;
      setPosition({
        x: Math.min(Math.max(newX, -maxPan), maxPan),
        y: Math.min(Math.max(newY, -maxPan), maxPan),
      });
    }
  }, [isDragging, scale, minScale, maxScale]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    lastTouchDistance.current = 0;
  }, []);

  // Reset zoom
  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Zoom in/out buttons
  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.25, maxScale));
  }, [maxScale]);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.25, minScale));
  }, [minScale]);

  // Detect if device supports touch
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Zoom controls */}
      {showControls && (
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          <button
            onClick={zoomOut}
            disabled={scale <= minScale}
            className="p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow-sm border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={resetZoom}
            disabled={scale === 1 && position.x === 0 && position.y === 0}
            className="p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow-sm border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            aria-label="Reset zoom"
          >
            <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={zoomIn}
            disabled={scale >= maxScale}
            className="p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow-sm border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      )}

      {/* Zoom indicator */}
      {scale !== 1 && (
        <div className="absolute bottom-2 left-2 z-10 px-2 py-1 rounded-full bg-black/60 text-white text-xs font-medium">
          {Math.round(scale * 100)}%
        </div>
      )}

      {/* Touch hint for mobile */}
      {isTouchDevice && scale === 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium pointer-events-none"
        >
          Pinch to zoom
        </motion.div>
      )}

      {/* Zoomable content container */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="touch-manipulation"
        style={{
          touchAction: scale > 1 ? 'none' : 'pan-y',
        }}
      >
        <motion.div
          animate={{
            scale,
            x: position.x,
            y: position.y,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          style={{
            transformOrigin: 'center center',
          }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default ZoomableChartWrapper;
