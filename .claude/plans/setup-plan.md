# Project Setup Plan - LMS Implementation

## Overview
This document provides a comprehensive setup plan for implementing the Laundry Management System (LMS) migration from Next.js to React + PHP architecture.

## Prerequisites
- Node.js 18+ and npm
- PHP 8.2+
- PostgreSQL database
- Composer for PHP dependencies
- Basic knowledge of React, TypeScript, and PHP

## Phase 1: Project Foundation Setup

### 1.1 Create Project Structure
```bash
# Create main project directory
mkdir laundry-management-system
cd laundry-management-system

# Create primary directories
mkdir frontend backend database docs

# Frontend structure
cd frontend
mkdir -p src/{components/{ui,forms,layout,common},pages/{auth,dashboard,categories,services,orders,customers,invoices,reports,settings},hooks,store/{slices,api},lib,types,constants,styles} public

# Backend structure
cd ../backend
mkdir -p src/{Controllers,Models,Services,Middleware,Database,Utils,Config} public migrations tests

# Return to root
cd ..
```

### 1.2 Frontend Package Configuration
Create `frontend/package.json`:
```json
{
  "name": "lms-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\""
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.26.1",
    "@reduxjs/toolkit": "^2.2.7",
    "react-redux": "^9.1.2",
    "@tanstack/react-query": "^5.51.23",
    "react-hook-form": "^7.52.2",
    "zod": "^3.23.8",
    "@hookform/resolvers": "^3.9.0",
    "axios": "^1.7.4",
    "sonner": "^1.5.0",
    "lucide-react": "^0.427.0",
    "date-fns": "^3.6.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.4.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-dialog": "^1.1.1",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-select": "^2.1.1",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-scroll-area": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@typescript-eslint/eslint-plugin": "^7.15.0",
    "@typescript-eslint/parser": "^7.15.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "eslint-plugin-react-hooks": "^4.6.2",
    "eslint-plugin-react-refresh": "^0.4.7",
    "postcss": "^8.4.40",
    "prettier": "^3.3.3",
    "tailwindcss": "^3.4.7",
    "typescript": "^5.2.2",
    "vite": "^5.3.4"
  }
}
```

### 1.3 Backend Composer Configuration
Create `backend/composer.json`:
```json
{
    "name": "lms/backend",
    "description": "Laundry Management System Backend API",
    "type": "project",
    "require": {
        "php": "^8.2",
        "slim/slim": "^4.12",
        "slim/psr7": "^1.6",
        "doctrine/dbal": "^4.0",
        "firebase/php-jwt": "^6.8",
        "monolog/monolog": "^3.4",
        "php-di/php-di": "^7.0",
        "vlucas/phpdotenv": "^5.5",
        "respect/validation": "^2.2",
        "tuupola/cors-middleware": "^1.4"
    },
    "require-dev": {
        "phpunit/phpunit": "^10.3",
        "squizlabs/php_codesniffer": "^3.7"
    },
    "autoload": {
        "psr-4": {
            "App\\": "src/"
        }
    },
    "scripts": {
        "start": "php -S localhost:8000 -t public",
        "migrate": "php migrations/migrate.php",
        "test": "phpunit",
        "cs-check": "phpcs",
        "cs-fix": "phpcbf"
    }
}
```

### 1.4 Database Schema Setup
Create `database/schema.sql` with enhanced schema including:
- Users table with role-based access
- Categories with audit fields
- Services with multiple pricing tiers
- Customers with enhanced profile information
- Orders with comprehensive status tracking
- Invoices with payment tracking
- Payments with multiple methods
- Proper indexes and triggers

## Phase 2: Configuration Files

### 2.1 Frontend Configuration
- `vite.config.ts`: Vite configuration with path aliases and proxy
- `tsconfig.json`: TypeScript configuration with strict mode
- `tailwind.config.js`: Tailwind CSS with custom theme
- `.eslintrc.json`: ESLint configuration for TypeScript and React

### 2.2 Backend Configuration
- `public/index.php`: Application entry point
- `src/Config/Database.php`: Database connection configuration
- `src/Config/routes.php`: API route definitions
- `.env`: Environment variables configuration

### 2.3 Environment Files
- Frontend `.env`: API URL and application settings
- Backend `.env`: Database credentials, JWT secrets, CORS settings

## Phase 3: Core Implementation

### 3.1 Backend Core Files
1. **Database Connection**: Doctrine DBAL setup
2. **Authentication**: JWT middleware and auth controller
3. **Base Controller**: Common functionality for all controllers
4. **Error Handling**: Comprehensive error middleware
5. **CORS Setup**: Cross-origin request handling

### 3.2 Frontend Core Files
1. **Main Entry**: React application bootstrap
2. **App Component**: Routing and layout setup
3. **Store Configuration**: Redux Toolkit store setup
4. **Auth Service**: Authentication state management
5. **API Service**: Axios configuration and interceptors

### 3.3 UI Components
1. **Base Components**: Button, Input, Card, Dialog
2. **Layout Components**: Header, Sidebar, Footer
3. **Form Components**: Form fields with validation
4. **Common Components**: Loading, Error, NotFound

## Phase 4: Feature Implementation

### 4.1 Authentication System
- Login/Register pages
- JWT token management
- Protected routes
- Role-based access control

### 4.2 Category Management
- Category CRUD operations
- Category selection components
- Category-based filtering

### 4.3 Service Management
- Service CRUD with pricing tiers
- Service search and filtering
- Category-service relationships

### 4.4 Customer Management
- Customer database with search
- Customer history tracking
- Customer categorization

### 4.5 Order Management
- Order creation and management
- Order status workflow
- Order tracking system

### 4.6 Invoice System
- Invoice generation from orders
- Payment tracking
- Invoice status management

## Phase 5: Testing & Deployment

### 5.1 Testing Setup
- Unit tests for components and services
- Integration tests for API endpoints
- E2E tests for critical workflows

### 5.2 Production Configuration
- Environment-specific settings
- Performance optimizations
- Security hardening

### 5.3 Deployment Setup
- Frontend build and deployment
- Backend deployment configuration
- Database migration scripts
- Apache/Nginx configuration for Hostinger

## Quick Start Commands

### Frontend Development
```bash
cd frontend
npm install
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript checking
```

### Backend Development
```bash
cd backend
composer install
php -S localhost:8000 -t public  # Start development server
composer run-script migrate      # Run database migrations
composer run-script test         # Run tests
```

### Database Setup
```bash
# Create PostgreSQL database
createdb laundry_db

# Run schema
psql laundry_db < database/schema.sql

# Or use migration system
cd backend && composer run-script migrate
```

## Development Workflow

### 1. Feature Development
1. Create feature branch from main
2. Implement backend API endpoints
3. Create frontend components and pages
4. Write tests for new functionality
5. Update documentation

### 2. Testing Process
1. Run unit tests: `npm test` (frontend) and `composer test` (backend)
2. Run integration tests for API endpoints
3. Perform manual testing of user workflows
4. Run E2E tests for critical paths

### 3. Deployment Process
1. Build frontend: `npm run build`
2. Run backend tests: `composer test`
3. Deploy to staging environment
4. Perform UAT (User Acceptance Testing)
5. Deploy to production

## Environment Configuration

### Development Environment
- Local database for development
- Hot reloading enabled
- Debug mode enabled
- Detailed error messages

### Production Environment
- Production database
- Optimized builds
- Error logging enabled
- Security headers configured

## Security Considerations

### Frontend Security
- Input validation and sanitization
- Secure token storage
- Route protection
- XSS prevention

### Backend Security
- JWT authentication
- Input validation
- SQL injection prevention
- CORS configuration
- Rate limiting

### Database Security
- Prepared statements
- Role-based access control
- Audit logging
- Data encryption

## Performance Optimization

### Frontend Performance
- Code splitting and lazy loading
- Bundle optimization
- Image optimization
- Caching strategies

### Backend Performance
- Query optimization
- Response caching
- Connection pooling
- Database indexing

This setup plan provides a comprehensive guide for implementing the LMS migration project, ensuring a structured approach to development and deployment.