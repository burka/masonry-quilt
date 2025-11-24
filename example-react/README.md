# masonry-quilt React Example

A visual demonstration of the **masonry-quilt** library with React, featuring colorful cards with big fonts.

## Features

- 🎨 Colorful cards with importance-based sizing
- 📏 Responsive layout that adapts to window resize
- 🔤 Big, bold fonts that scale with card size
- 📊 Real-time statistics (grid size, card count, utilization)
- ✨ Smooth hover effects and transitions
- 🎯 Various card types: text, images, videos, with different aspect ratios

## Running the Example

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Then open your browser to the URL shown (usually http://localhost:5173)

## What to Look For

1. **Importance-based sizing**: Cards with higher importance (★ 10, 9, 8) are larger
2. **Content-aware**: Some cards show "📏 Capped" when size is limited by content
3. **Format constraints**: Notice the wide banner cards (4:1 ratio) and portrait cards (1:2 ratio)
4. **Responsive behavior**: Resize your browser window to see the layout adapt
5. **Efficient packing**: The algorithm achieves 70-80%+ space utilization

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
