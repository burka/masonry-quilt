# masonry-quilt React Example

A visual demonstration of the **masonry-quilt** library with React, featuring colorful cards with big fonts.

## Features

- 🎨 Colorful cards with importance-based sizing
- 📏 Responsive layout that adapts to window resize with **smooth Framer Motion animations**
- 🔤 Big, bold fonts that scale with card size (16-48px)
- 📊 Real-time statistics (grid size, card count, utilization)
- ✨ Smooth hover effects and position transitions
- 🎯 Various card types: text, images, videos, with different aspect ratios
- ⚡ Throttled resize recalculation (150ms debounce) for performance
- 🎭 Framer Motion layout animations for smooth, physics-based transitions

## Running the Example

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Then open your browser to the URL shown (usually http://localhost:5173)

## What to Look For

1. **Smooth animations**: **Try resizing your browser window!** Cards smoothly transition to their new positions
2. **Importance-based sizing**: Cards with higher importance (★ 10, 9, 8) are larger
3. **Content-aware**: Some cards show "📏 Capped" when size is limited by content
4. **Format constraints**: Notice the wide banner cards (4:1 ratio) and portrait cards (1:2 ratio)
5. **Responsive behavior**: Layout recalculates automatically on resize (throttled to 150ms)
6. **Efficient packing**: The algorithm achieves 70-80%+ space utilization

### Animation Details

- **Framer Motion layout prop**: Automatic layout animations when card positions/sizes change
- **Spring physics**: Natural, fluid motion with `stiffness: 250, damping: 20`
- **Entry/exit animations**: Cards fade and scale in/out smoothly
- **LayoutGroup**: Synchronizes animations across all cards for coordinated transitions
- **AnimatePresence**: Handles card removal animations gracefully

## How It Works

The example uses `masonry-quilt`'s core features:

- `calculateCardLayout()` - Calculates optimal card positions and sizes
- `createResizeObserver()` - Efficiently recalculates layout on window resize
- Importance scores (1-10) - Determine card prominence
- Format constraints - Control aspect ratios for specific cards

## Code Structure

- `App.tsx` - Main component with masonry layout logic
- `App.css` - Styling with big fonts and colorful cards
- `main.tsx` - React entry point

This example is not included in the npm package - it's purely for demonstration purposes.
