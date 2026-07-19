/**
 * Utility to trigger web-based haptic feedback using the standard HTML5 Vibration API.
 * Safely checks for support to prevent crashes on non-compatible systems (like desktop browsers or Safari).
 */

export const triggerHaptic = (pattern: number | number[]) => {
  if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // In some sandboxed iframes or browsers, vibrate might throw a security/permission error
      console.warn('Haptic feedback is not allowed in this context or browser:', e);
    }
  }
};

/**
 * Tactical presets mimicking standard iOS Taptic Engine / Android Haptic patterns
 */
export const haptic = {
  // Light tap for standard button presses, card clicks
  light: () => triggerHaptic(12),
  
  // Medium impact for toggling options or switching tabs
  medium: () => triggerHaptic(22),
  
  // Heavy impact for main actions
  heavy: () => triggerHaptic(40),
  
  // Staccato/Double tap for toggling favorite stars (success feel)
  success: () => triggerHaptic([10, 40, 15]),
  
  // Error vibration pattern
  error: () => triggerHaptic([50, 80, 50]),
};
