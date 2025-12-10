/**
 * Helper utilities for integrating masonry-quilt into applications
 */

/**
 * Debounce function for optimizing resize/scroll events
 */
function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Create a resize observer helper for recalculating layout on viewport changes
 *
 * @param element - Element to observe for size changes
 * @param callback - Function to call when element is resized
 * @param debounceMs - Debounce delay in milliseconds (default: 150)
 * @returns Cleanup function to disconnect observer
 *
 * @example
 * ```ts
 * const cleanup = createResizeObserver(
 *   containerElement,
 *   (width, height) => {
 *     const result = calculateLayout(items, width, height);
 *     // Update your UI with result.cards
 *   },
 *   150
 * );
 *
 * // Later, clean up
 * cleanup();
 * ```
 */
export function createResizeObserver(
  element: Element,
  callback: (width: number, height: number) => void,
  debounceMs = 150,
): () => void {
  const debouncedCallback = debounce(callback, debounceMs);

  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      debouncedCallback(width, height);
    }
  });

  observer.observe(element);

  return () => {
    observer.disconnect();
  };
}

/**
 * Create a scroll optimizer that tracks visible items for performance
 *
 * @param scrollContainer - Scrollable container element
 * @param itemHeight - Estimated average item height for optimization
 * @param callback - Function called with visible range { start, end }
 * @param debounceMs - Debounce delay in milliseconds (default: 100)
 * @returns Cleanup function to remove scroll listener
 *
 * @example
 * ```ts
 * const cleanup = createScrollOptimizer(
 *   scrollContainer,
 *   200, // estimated item height
 *   ({ start, end }) => {
 *     // Only render items from index start to end
 *     setVisibleRange({ start, end });
 *   },
 *   100
 * );
 *
 * // Later, clean up
 * cleanup();
 * ```
 */
export function createScrollOptimizer(
  scrollContainer: Element,
  itemHeight: number,
  callback: (range: { start: number; end: number }) => void,
  debounceMs = 100,
): () => void {
  const calculateVisibleRange = () => {
    const scrollTop = scrollContainer.scrollTop;
    const containerHeight = scrollContainer.clientHeight;

    // Calculate visible indices with buffer
    const buffer = 2;
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    const end = Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer;

    callback({ start, end });
  };

  const debouncedCalculate = debounce(calculateVisibleRange, debounceMs);

  scrollContainer.addEventListener("scroll", debouncedCalculate);

  // Calculate initial range
  calculateVisibleRange();

  return () => {
    scrollContainer.removeEventListener("scroll", debouncedCalculate);
  };
}
