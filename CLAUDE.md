# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Laundry Management System (LMS)** - a fully functional business application built with modern React + PHP architecture. The system manages the complete laundry business workflow from customer orders to invoice generation with real-time status tracking.

## Tech Stack

### Frontend (Production Ready)
- **Framework**: React 18.2.0 + TypeScript
- **Build Tool**: Vite 7.0.0 with React plugin
- **State Management**: Redux Toolkit + RTK Query for server state
- **Routing**: React Router DOM v6 with protected routes
- **Forms**: React Hook Form + Zod validation
- **UI Framework**: shadcn/ui components built on Radix UI
- **Styling**: Tailwind CSS 4.1.11 with CSS variables
- **HTTP Client**: Axios with automatic token refresh
- **Additional Libraries**: 
  - JWT decode for token validation
  - date-fns for date handling
  - Sonner for notifications
  - TanStack React Query (secondary caching)

### Backend (Production Ready)
- **Framework**: PHP 8.2+ with Slim Framework 4
- **Database**: PostgreSQL with Doctrine DBAL
- **Authentication**: Firebase PHP-JWT with refresh tokens
- **Dependency Injection**: PHP-DI container
- **Validation**: Respect/Validation
- **Logging**: Monolog
- **CORS**: Tuupola CORS middleware

## Development Commands

### Frontend Development
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Development server (http://localhost:5173)
npm run build        # Production build with TypeScript compilation
npm run lint         # ESLint code analysis
npm run type-check   # TypeScript type checking only
npm run preview      # Preview production build
```

### Backend Development
```bash
cd backend
composer install     # Install PHP dependencies
composer start       # Development server (http://localhost:8000)
composer migrate     # Run database migrations
composer test        # Run PHPUnit tests
composer cs-check    # PHP CodeSniffer style check
composer cs-fix      # Auto-fix code style issues
```

### Full Stack Development
```bash
# Start both servers simultaneously
# Terminal 1 - Frontend
cd frontend && npm run dev

# Terminal 2 - Backend API
cd backend && composer start
```

## Architecture Overview

### State Management Architecture
The application uses a **hybrid state management approach**:

```typescript
// Redux Store Structure
store: {
  api: apiSlice,           // RTK Query - all server state with caching
  auth: authSlice,         // Authentication state + session management  
  ui: uiSlice,            // UI state (sidebar, modals, global UI)
  rate: rateSlice         // Global rate selector (rate1-rate5)
}
```

**Key Patterns:**
- **Server State**: RTK Query handles all API calls with automatic caching, background refetching, and optimistic updates
- **Client State**: Redux slices manage authentication, UI state, and business logic
- **Session Management**: Automatic token refresh with fallback logout on expiry

### Authentication Flow
```typescript
// Multi-layered security with automatic session management
1. JWT access tokens (short-lived) + refresh tokens (long-lived)
2. Axios interceptors handle automatic token refresh
3. Background session monitoring validates tokens periodically
4. Automatic logout + redirect on session expiry
5. Protected routes with authentication checks
```

### API Integration Pattern
```typescript
// RTK Query endpoints with type safety and caching
export const categoryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<Category[], QueryParams>({
      query: (params) => ({ url: '/categories', params }),
      providesTags: ['Category'],
    }),
    // Automatic cache invalidation on mutations
  }),
});
```

### Component Architecture
```
frontend/src/
├── components/
│   ├── ui/              # shadcn/ui design system
│   ├── forms/           # Business forms with validation
│   ├── layout/          # App shell components  
│   └── common/          # Shared components
├── pages/               # Feature-based page organization
├── store/               # Redux store + RTK Query APIs
├── hooks/               # Custom React hooks + session management
├── lib/                 # Utilities (auth, axios config)
└── types/               # TypeScript definitions
```

### Backend Architecture
```
backend/src/
├── Controllers/         # HTTP request handlers
├── Services/           # Business logic layer
├── Models/             # Data access layer
├── Middleware/         # Request/response middleware
├── Database/           # Database operations + migrations
└── Config/             # Application configuration
```

## Critical Configuration

### TypeScript Configuration
- **Path Aliases**: `@/*` maps to `src/*` for clean imports
- **Project References**: Uses `tsconfig.app.json` and `tsconfig.node.json`
- **Strict Mode**: Full TypeScript strict mode enabled

### Authentication & Security
- **Session Management**: Automatic token validation with periodic monitoring
- **Axios Interceptors**: Handle token refresh and session expiry redirects  
- **Protected Routes**: All main routes require authentication
- **JWT Tokens**: Access tokens (short-lived) + refresh tokens (long-lived)

### shadcn/ui Integration
- **Design System**: New York style with neutral base colors
- **Theming**: CSS variables for consistent theming
- **Components**: Installed to `@/components/ui`
- **Utilities**: Class merging via `cn()` function in `@/lib/utils`
- **Icons**: Lucide React icon library

### Development Environment
- **Hot Reload**: Vite HMR for instant frontend updates
- **Code Quality**: ESLint with TypeScript, React hooks, and refresh plugins
- **Styling**: Tailwind CSS 4.x with Vite plugin
- **Type Checking**: Separate TypeScript validation command

## Business Domain Model

### Core Entities & Relationships
```typescript
Users (Role-based: admin, manager, user)
├── Categories (Dry Clean, Wash & Fold, Iron & Press, Alterations)
│   └── Services (Individual services with 5-tier pricing: rate1-rate5)
├── Customers (Profiles with contact info + order history)
│   └── Orders (Complete lifecycle: pending → processing → ready → delivered)
│       ├── Order Items (Service + quantity + rate tier)
│       └── Invoices (Generated from orders with payment tracking)
│           └── Payments (Multiple payment methods + status tracking)
```

### Multi-Tier Pricing System
- **Rate Tiers**: Each service has 5 pricing levels (rate1-rate5)
- **Global Rate Selector**: Dashboard allows switching active rate tier
- **Customer-Specific Pricing**: Customers can have preferred rate tiers
- **Dynamic Pricing**: Rates can be updated without affecting historical orders

### API Endpoint Structure
```
Authentication:
POST /api/auth/login, /api/auth/register, /api/auth/refresh
GET  /api/me

Business Operations:
GET|POST|PUT|DELETE /api/categories
GET|POST|PUT|DELETE /api/services  
GET|POST|PUT|DELETE /api/customers
GET|POST|PUT|DELETE /api/orders
GET|POST|PUT|DELETE /api/invoices
GET|POST|PUT|DELETE /api/payments

Analytics:
GET /api/reports/revenue
GET /api/reports/customers  
GET /api/reports/services
```

## Development Patterns & Best Practices

### Form Handling Pattern
```typescript
// Standard form pattern with validation
const form = useForm<EntityFormData>({
  resolver: zodResolver(entitySchema),
  defaultValues: existingEntity || {}
});

// RTK Query mutation with optimistic updates
const [createEntity] = useCreateEntityMutation();
```

### API Integration Pattern
```typescript
// RTK Query API slice pattern
export const entityApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getEntities: builder.query<Entity[], QueryParams>({
      query: (params) => ({ url: '/entities', params }),
      providesTags: ['Entity'],
    }),
    createEntity: builder.mutation<Entity, CreateEntityRequest>({
      query: (data) => ({ url: '/entities', method: 'POST', body: data }),
      invalidatesTags: ['Entity'],
    }),
  }),
});
```

### Error Handling
- **API Errors**: Handled by RTK Query with automatic retries
- **Form Validation**: Zod schemas with React Hook Form integration
- **Session Expiry**: Automatic logout with user notification
- **Network Issues**: Loading states and error boundaries

### Code Quality Requirements
```bash
# Always run before committing
npm run type-check    # TypeScript validation
npm run lint         # ESLint code quality
composer cs-check    # PHP code standards (backend)
```

### Environment Setup
```bash
# Frontend environment (.env)
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME="Laundry Management System"

# Backend environment (.env)  
DB_DATABASE=laundry_db
JWT_SECRET=your-secret-key
```

### Database Setup
```bash
# PostgreSQL setup
createdb laundry_db
psql laundry_db < database/schema.sql

# Default login after schema setup
Email: admin@lms.com
Password: password
```