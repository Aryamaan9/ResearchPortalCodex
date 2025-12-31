# Design Guidelines: Money Stories Research Vault

## Design Approach

**Selected System**: Material Design 3 (adapted for data-intensive applications)  
**Rationale**: Optimized for information-dense interfaces with excellent component patterns for tables, lists, search, and data visualization. Provides clear hierarchy and professional aesthetic suitable for research analysts.

**Core Principles**:
- Prioritize information density and scannability
- Minimize visual decoration; maximize functional clarity
- Support extended reading and analysis sessions (low eye strain)
- Create clear status indicators and processing feedback

## Typography

**Font Stack**: Inter (via Google Fonts CDN)
- Headings: Inter 600 (Semibold)
  - Page titles: text-2xl (24px)
  - Section headers: text-lg (18px)
  - Card titles: text-base (16px)
- Body text: Inter 400 (Regular)
  - Primary: text-sm (14px)
  - Secondary/metadata: text-xs (12px)
- Monospace (file names, IDs): JetBrains Mono 400

**Hierarchy**:
- Document titles and main actions are most prominent
- Metadata (dates, file types, status) use smaller, muted text
- AI-generated content uses distinct but subtle differentiation

## Layout System

**Spacing Units**: Tailwind base-4 system
- Primary spacing: 4, 6, 8 (p-4, gap-6, mb-8)
- Component padding: p-6 for cards, p-4 for compact items
- Page margins: px-8 py-6 for main content areas
- Section gaps: space-y-6 between major sections

**Grid Structure**:
- Documents list: Single column with full-width cards on mobile, 2-column grid on desktop (md:grid-cols-2)
- Search results: Single column layout for optimal readability
- Filters sidebar: Fixed 280px width on desktop, collapsible drawer on mobile

## Component Library

### Upload Zone
- Large dropzone (min-h-64) with dashed border
- Clear file type indicators and size limits
- Progress bars for each uploading file with percentage and estimated time
- Status badges (Processing, Complete, Error) with appropriate icons

### Documents List
- Card-based layout with document thumbnail/icon on left
- Three-line information hierarchy: Title, metadata row (date, type, size), processing status
- Action menu (three-dot) on hover/tap for secondary actions
- Batch selection checkboxes for multi-document operations

### Search Interface
- Prominent search bar (h-12) with instant results
- Filter chips below search showing active filters
- Results cards with highlighted search term matches
- Citation snippets with document reference and page number

### Document Viewer Layout
- Split view: PDF viewer (70% width) + AI panel (30% width) on desktop
- Tabs in AI panel: Summary, Ask AI, Page Insight
- Sticky header with document title and page navigation
- Floating action button for "Generate Summary"

### Tables (for document lists, search results)
- Row hover state for improved scannability
- Sortable columns with clear indicators
- Pagination controls at bottom (items per page selector)
- Dense spacing for information efficiency

### Forms and Inputs
- Standard height (h-10) for all inputs
- Clear labels above inputs, not placeholders
- Validation states with icon + message below field
- Primary action buttons right-aligned, secondary left-aligned

### Status and Feedback
- Toast notifications (top-right) for success/error messages
- Inline loading skeletons for content being processed
- Progress indicators for long-running operations
- Empty states with clear next actions ("Upload your first document")

## Data Visualization
- Simple bar charts for processing statistics (completed vs pending)
- Document type distribution using horizontal bar chart
- Minimal gridlines, clear axis labels
- Muted chart colors that don't compete with primary content

## Interaction Patterns
- Debounced search (300ms) to avoid excessive queries
- Optimistic UI updates (show upload immediately, update status asynchronously)
- Keyboard shortcuts for power users (Cmd+K for search, Esc to close modals)
- Smooth page transitions (150ms) without animation distraction

## Responsive Behavior
- Mobile: Single-column layouts, collapsible filters, bottom sheet for AI panel
- Tablet: Two-column document grid, side drawer for filters
- Desktop: Full layout with sidebar navigation and split document viewer

## Icons
Use Heroicons (outline style) via CDN for consistency:
- Document types: DocumentTextIcon, TableCellsIcon, ChartBarIcon
- Actions: ArrowUpTrayIcon (upload), MagnifyingGlassIcon (search), SparklesIcon (AI features)
- Status: CheckCircleIcon (complete), ExclamationCircleIcon (error), ClockIcon (processing)

## Performance Considerations
- Virtualized lists for 100+ documents (react-window)
- Lazy load PDF pages in viewer
- Debounced AI interactions to prevent rate limit issues
- Skeleton loaders for perceived performance