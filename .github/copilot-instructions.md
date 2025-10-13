# Body Tracker - AI Coding Agent Instructions

## Architecture Overview

This is a **pnpm workspace monorepo** body weight/fat tracking app with **React 19 + Hono + PostgreSQL + Drizzle ORM**. The project emphasizes learning modern React 19 features while building a practical application.

### Key Components
- `apps/frontend/` - React 19 app with Vite + Tailwind CSS
- `apps/backend/` - Hono API server with Drizzle ORM
- `packages/shared/` - Shared TypeScript types and validation
- **Dev Container**: PostgreSQL (5432), Adminer (8080), Redis (6379)

## Development Workflows

### Essential Commands
```bash
# Development (parallel frontend/backend)
pnpm dev

# Individual services  
pnpm dev:frontend  # localhost:3000
pnpm dev:backend   # localhost:8000

# Type-safe build order
pnpm build:shared  # Always build shared types first
pnpm build

# Code quality (Biome + ESLint)
pnpm check:fix  # Format, lint, organize imports
```

### Database Operations
- **Connection**: `apps/backend/src/db/connection.ts` (Drizzle client)
- **Schema**: `apps/backend/src/db/schema.ts` (table definitions)
- **Migrations**: Use `drizzle-kit push` for schema changes
- **Access**: Adminer UI at `localhost:8080` (developer/password123)

## Project-Specific Patterns

### React 19 Feature Usage
- **useOptimistic**: Implemented in `AuthProvider.tsx` for optimistic auth updates
- **useTransition**: Used for non-blocking auth operations
- **Actions**: Server Actions pattern for form submissions
- **Dependency rule**: Never include `startTransition` in useCallback deps (React internally stable)

### Type Safety Architecture  
- **Shared types**: `packages/shared/src/types.ts` - source of truth for API contracts
- **DB schema inference**: `typeof bodyRecords.$inferSelect` for type generation  
- **API validation**: Hono validator middleware with shared validation functions
- **Import pattern**: Always import from `@body-tracker/shared` for cross-package types

### Authentication Structure (Google OAuth)
- **Provider**: `apps/frontend/src/auth/AuthProvider.tsx` (React 19 features)
- **Export pattern**: `apps/frontend/src/auth/index.ts` (centralized exports)
- **Middleware**: `apps/backend/src/middleware/auth.ts` (JWT validation)
- **Routes**: `apps/backend/src/routes/auth.ts` (OAuth endpoints)

### Feature-Based Organization
```
src/
  auth/          # Authentication module (self-contained)
  dashboard/     # Main dashboard components  
  layout/        # App-level layout components
  ui/           # Reusable UI components
```

## Code Quality Standards

### Biome Configuration
- **Formatter**: 2-space indent, single quotes, trailing commas, 100 char width
- **Import organization**: Automatic with `organizeImports.enabled`
- **Run**: `pnpm check:fix` for comprehensive code cleanup

### React Patterns
- **useCallback deps**: Include ALL referenced values (exhaustive-deps enforced)
- **SVG accessibility**: Always include `<title>` tags for screen readers
- **Error boundaries**: `AppErrorBoundary.tsx` for production error handling

## Integration Points

### API Communication
- **Base URL**: Environment-based (`VITE_API_BASE` or localhost:8000)
- **CORS**: Configured for localhost:3000 with credentials
- **Error format**: Consistent `ApiResponse<T>` wrapper with error/data fields
- **Authentication**: Bearer token in Authorization header

### Database Schema
- **Users**: `uuid` primary keys, Google OAuth fields planned
- **BodyRecords**: Foreign key to users, decimal precision for measurements
- **Timestamps**: All tables have created_at/updated_at with timezone

### Development Philosophy
- **Claude AI Collaboration**: One file output at a time, staged progression
- **Learning Focus**: React 19 features over complex patterns
- **Type Safety**: Comprehensive TypeScript across all packages
- **Practical Application**: Real-world usage drives implementation decisions

## Common Tasks

**Add new API endpoint**: Update `apps/backend/src/server.ts` + add types to `packages/shared/src/types.ts`

**New React component**: Follow feature-based structure, use React 19 hooks appropriately

**Database changes**: Modify `schema.ts`, run `drizzle-kit push`, update shared types

**Type updates**: Always update `packages/shared` first, then rebuild dependent packages