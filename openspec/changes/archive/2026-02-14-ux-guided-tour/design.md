## Context

After completing the setup form (Get Started or Load Sample Data), users land on the Overview page with no guidance about the navigation tabs or what each page does. Warnings for missing prerequisites (no accounts, $0 spending) need to be shown inline in the relevant PortfolioEditor section rather than as disconnected banners.

## Goals / Non-Goals

**Goals:**
- Provide a one-time sequential tooltip tour after first setup
- Rename "Home" → "Overview" across nav and routes
- Replace inline warning banners with inline section warnings in PortfolioEditor that auto-expand when Simulate is blocked
- Keep the implementation lightweight — no third-party tour libraries

**Non-Goals:**
- Persistent help system or "replay tour" button
- Tour on every page load (one-time only, per session)
- Nav-anchored warning indicators (replaced by inline section warnings)

## Decisions

### 1. Tooltip component: custom lightweight popover
Pure CSS/Svelte component positioned absolutely below the target element using a ref-based anchor. A small upward-pointing caret connects tooltip to target. No external dependencies needed.

**Alternative considered**: Skeleton Popover — not flexible enough for sequential tour behavior and anchor management across components.

### 2. Tour orchestration via a store + GuidedTour component
A `tourActive` writable store signals that a tour is in progress. The `GuidedTour` component lives in the root layout and manages the step sequence, timing (auto-advance after ~3s), and dismissal. Tour steps reference nav items by data attributes.

**Alternative considered**: Putting tour logic in AppBar — rejected because the tour may highlight elements outside the AppBar (like the avatar button) and separating concerns is cleaner.

### 3. Inline section warnings via `simulateBlockedSection` store
A `simulateBlockedSection` writable store signals which PortfolioEditor section needs attention. When the user clicks Simulate with missing prerequisites (no accounts or $0 spending), the store is set and the relevant CollapsibleSection auto-expands to show an inline warning with an AlertTriangle icon.

**Alternative considered**: Nav-anchored warning dots/tooltips on AppBar tabs — implemented initially but replaced with inline section warnings per user feedback that expanding the relevant section is more direct than a nav tooltip.

### 4. Tour trigger: dispatched from SetupView after initialization
SetupView already handles both Get Started and Load Sample Data. After initializing the portfolio/profile, it sets `tourActive` to true. The GuidedTour component picks this up and begins the sequence.

## Risks / Trade-offs

- [Tooltip positioning edge cases on narrow viewports] → Tooltip is clamped to viewport edges with 8px margin; caret dynamically repositions to point at target
- [Tour timing may feel too fast or slow] → 3s default with click-to-advance as override; easy to tune later
- [Inline warnings may be missed] → Simulate blocking auto-expands the relevant section, drawing attention to the warning
