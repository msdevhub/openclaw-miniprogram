import { useEffect, useRef, useState } from 'react';

interface SwipeBackOptions {
  onSwipeBack?: () => void;
  threshold?: number;
  enabled?: boolean;
}

interface SwipeState {
  isDragging: boolean;
  dragX: number;
  dragProgress: number; // 0-1 indicating swipe progress
}

/**
 * Hook for handling iOS-style swipe-back gestures
 * Detects swipe from left edge and provides progress feedback
 */
export function useSwipeBack({
  onSwipeBack,
  threshold = 100,
  enabled = true
}: SwipeBackOptions = {}) {
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isDragging: false,
    dragX: 0,
    dragProgress: 0,
  });

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isValidSwipe = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;

      // Only activate if touch starts near the left edge (within 30px)
      isValidSwipe.current = touch.clientX < 30;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isValidSwipe.current) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;

      // Only continue if horizontal swipe is dominant
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        isValidSwipe.current = false;
        return;
      }

      // Only track right-ward swipes (back gesture)
      if (deltaX > 0) {
        // Prevent default to avoid conflicts
        if (deltaX > 10) {
          e.preventDefault();
        }

        const progress = Math.min(deltaX / threshold, 1);
        setSwipeState({
          isDragging: true,
          dragX: deltaX,
          dragProgress: progress,
        });
      }
    };

    const handleTouchEnd = () => {
      if (!isValidSwipe.current) return;

      const { dragX } = swipeState;

      // Trigger back navigation if threshold is exceeded
      if (dragX > threshold && onSwipeBack) {
        onSwipeBack();
      }

      // Reset state
      setSwipeState({
        isDragging: false,
        dragX: 0,
        dragProgress: 0,
      });
      isValidSwipe.current = false;
    };

    const handleTouchCancel = () => {
      setSwipeState({
        isDragging: false,
        dragX: 0,
        dragProgress: 0,
      });
      isValidSwipe.current = false;
    };

    // Add passive: false for preventDefault to work
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [enabled, onSwipeBack, swipeState.dragX, threshold]);

  return swipeState;
}
