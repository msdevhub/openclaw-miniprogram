import { useEffect } from 'react';

/**
 * Hook to handle iOS-specific PWA optimizations
 * - Updates theme-color meta tag based on dark mode
 * - Handles iOS standalone mode detection
 */
export function useIOSPWA() {
  useEffect(() => {
    // Update theme color based on dark mode
    const updateThemeColor = () => {
      const isDark = document.documentElement.classList.contains('dark');
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');

      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', isDark ? '#1a1b2e' : '#67B88B');
      }
    };

    // Initial theme color update
    updateThemeColor();

    // Watch for dark mode changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          updateThemeColor();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Detect if running in standalone mode (iOS PWA)
  const isStandalone = () => {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-ignore - iOS specific
      window.navigator.standalone === true
    );
  };

  // Detect if on iOS
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  };

  return {
    isStandalone: isStandalone(),
    isIOS: isIOS(),
    showInstallPrompt: isIOS() && !isStandalone(),
  };
}
