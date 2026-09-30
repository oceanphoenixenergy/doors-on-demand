# Doors On Demand - Instant Door Quote

## Overview

Doors On Demand is a mobile-first web application for a UK internal door supply-and-fit business. Its primary purpose is to provide instant supply-and-fit quotes for internal oak doors through an intuitive, multi-step wizard interface. Users can configure door options, receive immediate pricing including deposit calculations, and submit their quote with preferred timing or questions. The application aims for a 60-90 second completion time, featuring a professional, trade-led aesthetic with a blue/white trust design and warm oak accents. The business vision is to streamline the door quotation process, enhance customer experience, and optimize lead generation and conversion.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application is built as a monorepo with a React 18 (TypeScript) frontend and an Express 5 (ESM) backend. Data is managed using PostgreSQL with Drizzle ORM.

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: React Query for server state, React useState for local wizard state
- **Styling**: Tailwind CSS with shadcn/ui (New York style) and Lucide React/React Icons
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite

### Backend
- **Framework**: Express 5 (ESM modules)
- **API Pattern**: RESTful JSON API (`/api` prefix)
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Validation**: Zod schemas (shared with frontend)

### Key Design Patterns & Features
- **Monorepo Structure**: Client, server, and shared codebases.
- **Shared Schemas**: Database schemas and Zod validators defined once for consistency.
- **Multi-step Quote Wizard**: A 10-step flow for configuring quotes, tracking progress, and capturing customer details.
- **Early Lead Capture**: Lead records are saved and updated progressively as users advance through the wizard.
- **Conversion Optimization**: Includes price anchoring, trust elements, scarcity messaging, and strategic CTAs.
- **Gallery System**: Public gallery (`/gallery`) showcases before/after transformations with admin management (`/admin/gallery`).
- **Follow-up Email Strategy**: Automated email sequences designed to engage and convert leads using psychological persuasion techniques.
- **Quote Calculation Logic**: Comprehensive logic for calculating door prices, fitting charges, and additional costs, with a minimum order of 3 doors and a 50% deposit requirement.
- **Meta (Facebook) Ad Offer Flow**: A dedicated flow for a 6-door deal at a flat price, integrated into the existing wizard with specific pricing overrides and tagging.
- **Kanban Pipeline Board**: An admin interface (`/admin/pipeline`) for managing customer journey stages via drag-and-drop, with automatic stage-status synchronization and tagging.
- **Lead Tagging System**: `leadSource` and `tags` fields on `quote_submissions` for classification and campaign targeting.
- **Double/French Door Support**: Guided configuration flow for double doors — users select thickness (35mm standard / 40mm rebated) to determine whether they need a French Door Set (£840 flat, glazed, unfinished) or a Standard Double Door Pair (2× normal pricing + £350 fitting + £15 rack bolt + optional pair maker). Each set counts as 2 doors in total. Configuration stored in `doorSizes` array with `isDoubleDoor`, `doubleDoorType`, `doubleDoorWidthMm` fields.

## External Dependencies

- **Database**: PostgreSQL (via `DATABASE_URL`), Drizzle Kit for migrations.
- **UI Components**: Radix UI, shadcn/ui, Lucide React, React Icons.
- **Payment Processing**: Stripe for deposit collection via Checkout Sessions, automated balance payment links, and webhook handling.
- **Google Calendar Integration**: Fetches availability, creates event bookings post-payment, supports multi-day bookings, and includes comprehensive event details.
- **Meta (Facebook) Lead Forms**: Webhook integration for receiving and processing leadgen data, auto-tagging leads.
- **Replit Object Storage**: For storing gallery media files.