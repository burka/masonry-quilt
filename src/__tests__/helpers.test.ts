/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createResizeObserver, createScrollOptimizer } from "../helpers";

describe("createResizeObserver", () => {
  let mockElement: Element;
  let mockObserver: {
    observe: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  };
  let observerCallback: ResizeObserverCallback;

  beforeEach(() => {
    vi.useFakeTimers();

    // Mock Element
    mockElement = document.createElement("div");

    // Mock ResizeObserver
    mockObserver = {
      observe: vi.fn(),
      disconnect: vi.fn(),
    };

    // Create proper constructor mock for ResizeObserver
    const MockResizeObserver = function (
      this: typeof mockObserver,
      callback: ResizeObserverCallback,
    ) {
      observerCallback = callback;
      return mockObserver;
    };
    MockResizeObserver.prototype.observe = vi.fn();
    MockResizeObserver.prototype.disconnect = vi.fn();

    global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test("creates ResizeObserver and observes element", () => {
    const callback = vi.fn();
    createResizeObserver(mockElement, callback);

    expect(mockObserver.observe).toHaveBeenCalledWith(mockElement);
  });

  test("calls callback with width and height when element resizes", () => {
    const callback = vi.fn();
    createResizeObserver(mockElement, callback);

    // Trigger resize event
    const entries: ResizeObserverEntry[] = [
      {
        target: mockElement,
        contentRect: {
          width: 800,
          height: 600,
          x: 0,
          y: 0,
          top: 0,
          right: 800,
          bottom: 600,
          left: 0,
        } as DOMRectReadOnly,
        borderBoxSize: [] as ResizeObserverSize[],
        contentBoxSize: [] as ResizeObserverSize[],
        devicePixelContentBoxSize: [] as ResizeObserverSize[],
      },
    ];

    observerCallback(entries, {} as ResizeObserver);

    // Callback should not be called immediately due to debounce
    expect(callback).not.toHaveBeenCalled();

    // Fast-forward debounce timer (default 150ms)
    vi.advanceTimersByTime(150);

    expect(callback).toHaveBeenCalledWith(800, 600);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test("debounces multiple resize events", () => {
    const callback = vi.fn();
    createResizeObserver(mockElement, callback);

    const createEntry = (width: number, height: number): ResizeObserverEntry[] => [
      {
        target: mockElement,
        contentRect: {
          width,
          height,
          x: 0,
          y: 0,
          top: 0,
          right: width,
          bottom: height,
          left: 0,
        } as DOMRectReadOnly,
        borderBoxSize: [] as ResizeObserverSize[],
        contentBoxSize: [] as ResizeObserverSize[],
        devicePixelContentBoxSize: [] as ResizeObserverSize[],
      },
    ];

    // Trigger multiple resize events rapidly
    observerCallback(createEntry(800, 600), {} as ResizeObserver);
    vi.advanceTimersByTime(50);
    observerCallback(createEntry(900, 700), {} as ResizeObserver);
    vi.advanceTimersByTime(50);
    observerCallback(createEntry(1000, 800), {} as ResizeObserver);

    // Only the last resize should trigger callback after debounce completes
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(150);

    expect(callback).toHaveBeenCalledWith(1000, 800);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test("respects custom debounce delay", () => {
    const callback = vi.fn();
    const customDebounce = 300;
    createResizeObserver(mockElement, callback, customDebounce);

    const entries: ResizeObserverEntry[] = [
      {
        target: mockElement,
        contentRect: {
          width: 1920,
          height: 1080,
          x: 0,
          y: 0,
          top: 0,
          right: 1920,
          bottom: 1080,
          left: 0,
        } as DOMRectReadOnly,
        borderBoxSize: [] as ResizeObserverSize[],
        contentBoxSize: [] as ResizeObserverSize[],
        devicePixelContentBoxSize: [] as ResizeObserverSize[],
      },
    ];

    observerCallback(entries, {} as ResizeObserver);

    // Should not be called before custom delay
    vi.advanceTimersByTime(150);
    expect(callback).not.toHaveBeenCalled();

    // Should be called after custom delay
    vi.advanceTimersByTime(150);
    expect(callback).toHaveBeenCalledWith(1920, 1080);
  });

  test("cleanup function disconnects observer", () => {
    const callback = vi.fn();
    const cleanup = createResizeObserver(mockElement, callback);

    expect(mockObserver.disconnect).not.toHaveBeenCalled();

    cleanup();

    expect(mockObserver.disconnect).toHaveBeenCalledTimes(1);
  });

  test("handles multiple entries in ResizeObserver callback", () => {
    const callback = vi.fn();
    createResizeObserver(mockElement, callback);

    const entries: ResizeObserverEntry[] = [
      {
        target: mockElement,
        contentRect: {
          width: 800,
          height: 600,
          x: 0,
          y: 0,
          top: 0,
          right: 800,
          bottom: 600,
          left: 0,
        } as DOMRectReadOnly,
        borderBoxSize: [] as ResizeObserverSize[],
        contentBoxSize: [] as ResizeObserverSize[],
        devicePixelContentBoxSize: [] as ResizeObserverSize[],
      },
      {
        target: mockElement,
        contentRect: {
          width: 900,
          height: 700,
          x: 0,
          y: 0,
          top: 0,
          right: 900,
          bottom: 700,
          left: 0,
        } as DOMRectReadOnly,
        borderBoxSize: [] as ResizeObserverSize[],
        contentBoxSize: [] as ResizeObserverSize[],
        devicePixelContentBoxSize: [] as ResizeObserverSize[],
      },
    ];

    observerCallback(entries, {} as ResizeObserver);
    vi.advanceTimersByTime(150);

    // Due to debouncing, only the last entry's callback fires
    // (each call to debouncedCallback cancels the previous timer)
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(900, 700);
  });
});

describe("createScrollOptimizer", () => {
  let mockScrollContainer: HTMLElement;
  let scrollListener: EventListener;

  beforeEach(() => {
    vi.useFakeTimers();

    // Mock scroll container
    mockScrollContainer = document.createElement("div");
    Object.defineProperty(mockScrollContainer, "scrollTop", {
      writable: true,
      value: 0,
    });
    Object.defineProperty(mockScrollContainer, "clientHeight", {
      writable: true,
      value: 600,
    });

    // Spy on addEventListener to capture scroll listener
    vi.spyOn(mockScrollContainer, "addEventListener").mockImplementation(
      (event: string, listener: EventListener) => {
        if (event === "scroll") {
          scrollListener = listener;
        }
      },
    );

    vi.spyOn(mockScrollContainer, "removeEventListener");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test("calculates initial visible range on creation", () => {
    const callback = vi.fn();
    const itemHeight = 100;

    createScrollOptimizer(mockScrollContainer, itemHeight, callback);

    // Should call immediately with initial range (no debounce for initial)
    expect(callback).toHaveBeenCalledWith({ start: 0, end: 8 });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test("adds scroll event listener", () => {
    const callback = vi.fn();
    createScrollOptimizer(mockScrollContainer, 100, callback);

    expect(mockScrollContainer.addEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
    );
  });

  test("calculates visible range based on scroll position", () => {
    const callback = vi.fn();
    const itemHeight = 100;

    createScrollOptimizer(mockScrollContainer, itemHeight, callback);
    callback.mockClear(); // Clear initial call

    // Scroll down 500px
    Object.defineProperty(mockScrollContainer, "scrollTop", { value: 500 });

    // Trigger scroll event
    scrollListener(new Event("scroll"));
    vi.advanceTimersByTime(100);

    // start = max(0, floor(500 / 100) - 2) = max(0, 3) = 3
    // end = ceil((500 + 600) / 100) + 2 = ceil(11) + 2 = 13
    expect(callback).toHaveBeenCalledWith({ start: 3, end: 13 });
  });

  test("includes buffer in range calculation", () => {
    const callback = vi.fn();
    const itemHeight = 200;

    // Container height: 600, scroll position: 0
    createScrollOptimizer(mockScrollContainer, itemHeight, callback);

    // start = max(0, floor(0 / 200) - 2) = max(0, -2) = 0
    // end = ceil((0 + 600) / 200) + 2 = ceil(3) + 2 = 5
    expect(callback).toHaveBeenCalledWith({ start: 0, end: 5 });
  });

  test("prevents negative start index", () => {
    const callback = vi.fn();
    const itemHeight = 100;

    createScrollOptimizer(mockScrollContainer, itemHeight, callback);

    // At top of scroll, start should be 0 (not negative due to buffer)
    expect(callback).toHaveBeenCalledWith({ start: 0, end: 8 });
  });

  test("debounces scroll events", () => {
    const callback = vi.fn();
    createScrollOptimizer(mockScrollContainer, 100, callback);
    callback.mockClear();

    // Trigger multiple scroll events
    scrollListener(new Event("scroll"));
    vi.advanceTimersByTime(30);
    scrollListener(new Event("scroll"));
    vi.advanceTimersByTime(30);
    scrollListener(new Event("scroll"));

    // Should not be called yet
    expect(callback).not.toHaveBeenCalled();

    // Advance past debounce delay (default 100ms)
    vi.advanceTimersByTime(100);

    // Should be called only once with final scroll position
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test("respects custom debounce delay", () => {
    const callback = vi.fn();
    const customDebounce = 200;

    createScrollOptimizer(mockScrollContainer, 100, callback, customDebounce);
    callback.mockClear();

    scrollListener(new Event("scroll"));

    // Should not be called before custom delay
    vi.advanceTimersByTime(100);
    expect(callback).not.toHaveBeenCalled();

    // Should be called after custom delay
    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test("cleanup function removes scroll listener", () => {
    const callback = vi.fn();
    const cleanup = createScrollOptimizer(mockScrollContainer, 100, callback);

    expect(mockScrollContainer.removeEventListener).not.toHaveBeenCalled();

    cleanup();

    expect(mockScrollContainer.removeEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
    );
  });

  test("calculates correct range for various scroll positions", () => {
    const callback = vi.fn();
    const itemHeight = 150;

    createScrollOptimizer(mockScrollContainer, itemHeight, callback);
    callback.mockClear();

    // Test scroll position at 1000px
    Object.defineProperty(mockScrollContainer, "scrollTop", { value: 1000 });
    scrollListener(new Event("scroll"));
    vi.advanceTimersByTime(100);

    // start = max(0, floor(1000 / 150) - 2) = max(0, 4) = 4
    // end = ceil((1000 + 600) / 150) + 2 = ceil(10.67) + 2 = 13
    expect(callback).toHaveBeenCalledWith({ start: 4, end: 13 });
    callback.mockClear();

    // Test scroll position at 2500px
    Object.defineProperty(mockScrollContainer, "scrollTop", { value: 2500 });
    scrollListener(new Event("scroll"));
    vi.advanceTimersByTime(100);

    // start = max(0, floor(2500 / 150) - 2) = max(0, 14) = 14
    // end = ceil((2500 + 600) / 150) + 2 = ceil(20.67) + 2 = 23
    expect(callback).toHaveBeenCalledWith({ start: 14, end: 23 });
  });

  test("handles different container heights", () => {
    const callback = vi.fn();
    const itemHeight = 100;

    // Change container height to 1200px
    Object.defineProperty(mockScrollContainer, "clientHeight", { value: 1200 });

    createScrollOptimizer(mockScrollContainer, itemHeight, callback);

    // start = max(0, floor(0 / 100) - 2) = 0
    // end = ceil((0 + 1200) / 100) + 2 = ceil(12) + 2 = 14
    expect(callback).toHaveBeenCalledWith({ start: 0, end: 14 });
  });

  test("handles small item heights", () => {
    const callback = vi.fn();
    const itemHeight = 50;

    createScrollOptimizer(mockScrollContainer, itemHeight, callback);

    // start = max(0, floor(0 / 50) - 2) = 0
    // end = ceil((0 + 600) / 50) + 2 = ceil(12) + 2 = 14
    expect(callback).toHaveBeenCalledWith({ start: 0, end: 14 });
  });

  test("handles large item heights", () => {
    const callback = vi.fn();
    const itemHeight = 300;

    createScrollOptimizer(mockScrollContainer, itemHeight, callback);

    // start = max(0, floor(0 / 300) - 2) = 0
    // end = ceil((0 + 600) / 300) + 2 = ceil(2) + 2 = 4
    expect(callback).toHaveBeenCalledWith({ start: 0, end: 4 });
  });
});
