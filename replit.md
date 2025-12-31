# Money Stories Research Vault

## Overview

Money Stories Research Vault is an internal AI-augmented research intelligence platform for financial document analysis. The system ingests unstructured financial documents (annual reports, earnings calls, industry reports, investor updates, research notes), extracts and indexes content, generates summaries, enables semantic and keyword search, and provides citation-backed Q&A across all materials.

The platform is designed for non-technical research analysts who need to quickly find insights across large document collections with mandatory source citations. Phase 1 focuses on the Foundational Intelligence Layer: document ingestion, OCR/extraction, classification, summaries, semantic search, Q&A with citations, and a document viewer with AI panel.

## User Preferences

Preferred communication style: Simple, everyday language.

Additional constraints from project requirements:
- AI answers must be grounded only in uploaded documents
- Citations are mandatory for every AI answer (source and page when possible)
- If evidence is insufficient, state so explicitly rather than guessing
- Avoid em dashes in all text output
- Keep UI minimal, professional, and calm (no consumer styling or hype)

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming (light/dark mode support)
- **File Uploads**: Uppy with AWS S3 presigned URL flow
- **Build Tool**: Vite with HMR support

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful JSON APIs under /api prefix
- **File Handling**: Multer for multipart uploads (50MB limit)
- **AI Integration**: Anthropic Claude API for document analysis, summaries, and Q&A
- **Build**: esbuild for production bundling

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: shared/schema.ts (shared between client and server)
- **Migrations**: Drizzle Kit with migrations in /migrations directory
- **Object Storage**: Google Cloud Storage via Replit Object Storage integration for document files

### Key Data Models
- **Documents**: Metadata, processing status, document type classification, extracted full text
- **Document Pages**: Per-page content extraction with page numbers
- **Embeddings**: Vector embeddings for semantic search
- **Entities**: Extracted named entities (companies, people, financial metrics)
- **QA History**: Stored question-answer pairs with citations

### Document Processing Pipeline
1. File upload via presigned URL to object storage
2. Document metadata stored in PostgreSQL
3. Text extraction and OCR processing
4. AI-powered document classification
5. Embedding generation for semantic search
6. Entity extraction and linking

## External Dependencies

### AI Services
- **Anthropic Claude**: Primary AI provider for document analysis, summarization, and Q&A
  - Environment variables: `AI_INTEGRATIONS_ANTHROPIC_API_KEY`, `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`
  - Models: claude-sonnet-4-5 (balanced), claude-opus-4-5 (most capable), claude-haiku-4-5 (fastest)

### Storage Services
- **PostgreSQL**: Primary database (requires `DATABASE_URL` environment variable)
- **Google Cloud Storage**: Document file storage via Replit Object Storage integration
  - Uses sidecar endpoint at `http://127.0.0.1:1106` for credentials

### Frontend Dependencies
- **Radix UI**: Accessible component primitives
- **Uppy**: File upload handling with S3 presigned URL support
- **date-fns**: Date formatting utilities
- **react-day-picker**: Calendar component
- **embla-carousel**: Carousel functionality
- **recharts**: Data visualization charts

### Development Tools
- **Drizzle Kit**: Database schema management and migrations
- **Vite**: Development server with HMR
- **esbuild**: Production bundling for server code