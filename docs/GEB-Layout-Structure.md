# GEB Layout Structure

Author: Frontend
Last updated: 2025-11-19

This document codifies the design and interaction rules used on the GEB page so they can be reused consistently on future pages.

## Page Overview
- **Framework**: Next.js + React + TypeScript
- **Styling**: Tailwind CSS utility classes
- **Charts**: ECharts
- **Map**: ArcGIS JS API (client-only dynamic import)
- **Icons**: lucide-react (stroke width standardized)
- **Theme**: Dark/Light via `next-themes`

## High-Level Layout
- **Desktop (landscape)**
  - Left: Map/Charts (resizable)
  - Right: Combined Ranking Table (resizable)
  - A vertical drag handle divides the two panes.
- **Tablet portrait**
  - Top pane: toggle between Chart or Map
  - Bottom pane: Table (can expand/minimize to 35/65 or 50/50)
  - Toggle is synced to URL query: `?top=chart|map`

## Split/Divider Behavior
- **Vertical divider** (desktop) and **horizontal divider** (tablet)
  - Dragging updates flex-basis percentages with CSS-safe limits.
  - While dragging: set pointer capture, disable text selection, and show subtle grip indicator.
  - Ensure scroll containers have `min-h-0` to avoid overflow collapse.

## Shared Header Component
- **Component**: `components/chart/chart-header.tsx`
- **Purpose**: Provides a consistent header across **charts** (and serves as a visual reference for table header rows)
- **Elements**:
  - Title: `h3` with compact `text-sm font-medium`, truncated to a single line
  - Source (optional):
    - **Desktop (lg+)**: full text pill inline with title
    - **Tablet/Mobile (< lg)**: compact `(i)` icon with tooltip, no pill
  - Right actions slot: for buttons (Reset, Download, Fullscreen, etc.)
- **Styles**:
  - Container: `px-4 py-[2px] border-b bg-card`
  - Pill (desktop): `px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground border border-border`
  - Info icon (tablet/mobile): `p-1 rounded-full border border-border bg-muted/60 hover:bg-accent`
  - **Important rule**: `ChartHeader` is **for charts only** – charts do **not** own a search field; searching is handled by the table header.

## Icons
- **Library**: lucide-react
- **Sizes**: `w-4 h-4`
- **Stroke**: `strokeWidth={1.75}` (standard across Download, Maximize2, Minimize2)
- **Buttons**: `p-1.5 hover:bg-accent rounded`

## Tabs (Bottom Navigation for Charts)
- Excel-like flat tabs
  - Container boxed in subtle border background.
  - Active tab: white background (or `bg-background`), no corner radius, flat look.
  - Inactive tabs: muted background; hover lightens.

## Table
- **Location**: Right pane (desktop) or bottom pane (tablet portrait)
- **Header (title/search/actions)**: Static row above the scroll area. Behavior differs by breakpoint:
  - **Desktop (lg+)**
    - Left: `Combined Ranking` title + full **Source pill** (text pill, same style as charts).
    - Right: **Always-visible search input** + action icons (e.g. Download, Fullscreen in the main header).
    - The search here is a normal text field (no icon mode).
  - **Tablet/Mobile (< lg)**
    - Left: `Combined Ranking` title + compact `(i)` **info icon** for source.
    - Right: **Search icon** + actions.
    - Tapping the search icon replaces the header content with a full-width search input and an `X` button to clear.
    - On blur or when `X` is pressed, the search input collapses back to the icon state. `X` also clears the current search value.
- Search input uses `h-7` with tight padding and border to match compact density.
- **Column Header (thead)**: Sticky
  - `thead` uses `sticky top-0 z-30 bg-card`
  - Bottom border: `border-b border-border`
- **Rows (tbody)**
  - Scroll container is the middle section only: `flex-1 overflow-y-scroll bg-card min-h-0`
  - Alternating row background permitted (muted stripes)
- **Pagination**
  - Sticky footer inside the table card (below the scroll area)
  - Always visible even when rows overflow

### Sorting
- **Trigger**: Click column header labels
- **Indicators**: Up/Down chevrons (lucide `ChevronUp`/`ChevronDown`)
  - Size: `w-2.5 h-2.5` stacked vertically
  - Active direction: `text-primary`; inactive: `text-muted-foreground/60`
- **Logic**: Sort state (`sortBy`, `sortDir`) applied before pagination

### Searching
- **Owner**: The **Combined Ranking table header**, not the chart header.
- **Desktop (lg+)**
  - Search is a **persistent text input** in the table header.
  - Filters client-side across key columns and resets to page 1 on change.
- **Tablet/Mobile (< lg)**
  - Search is entered via an **icon that expands to a full-width input + X**.
  - Input auto-focuses when expanded.
  - On blur, header returns to icon mode (unless `X` was pressed first, which also clears the search).

### Scroll & Stickiness Rules
- Use `min-h-0` on all flex parents of scroll areas.
- Only the rows section scrolls; header and pagination are outside and sticky.
- The column header is `sticky` with higher `z-index` and solid `bg-card` to prevent bleed through.
- Scrollbars can be forced visible with `overflow-y-scroll` (macOS auto-hide compatible).

## Map
- **Component**: `components/map/arcgis-viewer.tsx`
- **Filtering**: Accepts `allowedBasins` to filter GeoJSON layers via `definitionExpression` (IN list) against best-match name field per layer.
- **Theming**: Basemap switches with theme (dark-gray vs oceans)

## Charts
- **Components**: `app/dashboard-echarts/components/*`
  - `TernaryChart`: Combined Ranking Methodology (Geological vs Above Ground)
  - `ScatterChart`: Total Overall Score vs YTF
- **Header**: Both use `ChartHeader` with standardized actions
- **Fullscreen**: `Maximize2` toggles fullscreen; sync indicator with `document.fullscreenElement`
- **Legend/filters**: Displayed as a compact checklist under charts

## Pills
- **Usage**: Source indicator next to titles
- **Style**: `px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground border border-border`
- **Placement**: Inline with title, separated by small gap

## Theming
- **Backgrounds**: Use `bg-card` for card bodies/headers to match table header color
- **Borders**: `border-border` for card outlines and dividers
- **Text**: `text-foreground` for main content; `text-muted-foreground` for secondary
- **Dark Mode**: Charts update grid/axis colors; map basemap changes

## Responsive/URL Behavior
- Tablet top pane mode synced to `?top=chart|map`
- Resizes trigger chart `resize()` via `ResizeObserver` and window `resize` listeners

## Data
- JSON files under `/data/`
  - `basin-combined-scoring.json`
  - `basin-ranking.json`
  - `basin-ytf-scoring.json`

## Reuse Checklist for New Pages
- **Use `ChartHeader`** for any **chart** header with title, pill, and actions (no search field in chart header)
- **Standardize icons** with lucide `w-4 h-4` and `strokeWidth={1.75}`
- **Implement rows-only scroll**: header and pagination outside scroll area
- **Add `min-h-0`** on every flex parent of scroll containers
- **Sticky `thead`**: `sticky top-0 z-30 bg-card`
- **Sorting chevrons**: stacked small `ChevronUp`/`ChevronDown`, active colored
- **Tabs**: flat Excel-like with white active tab
- **Divider**: pointer capture + visual dots; update flex-basis safely
- **Map filters**: pass `allowedBasins` when needed
- **Dark mode**: prefer `bg-card`, `text-foreground`, and chart dark overrides

## File Pointers
- Page: `app/geb/page.tsx`
- Shared header: `components/chart/chart-header.tsx`
- Map: `components/map/arcgis-viewer.tsx`
- Charts: `app/dashboard-echarts/components/ternary-chart.tsx`, `scatter-chart.tsx`

