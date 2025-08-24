# Laundry Management System

A comprehensive Laundry Management System built with React + TypeScript frontend and PHP Slim backend.

## Project Structure

```
laundry-management-system/
├── frontend/                    # React + TypeScript frontend
├── backend/                     # PHP Slim API backend  
├── database/                    # Database schema
├── .claude/                     # Claude planning files
└── docs/                        # Documentation
```

## Prerequisites

- Node.js 18+ and npm
- PHP 8.2+
- PostgreSQL
- Composer

## Quick Start

### 1. Frontend Setup

```bash
cd frontend
npm install
npm run dev          # Starts development server on http://localhost:5173
```

### 2. Backend Setup

```bash
cd backend
composer install
php -S localhost:8000 -t public    # Starts API server on http://localhost:8000
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb laundry_db

# Run schema
psql laundry_db < database/schema.sql
```

### 4. Environment Configuration

Frontend (.env):
```
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME="Laundry Management System"
```

Backend (.env):
```
DB_DATABASE=laundry_db
DB_USERNAME=your_username
DB_PASSWORD=your_password
JWT_SECRET=your-secret-key
```

## Features

### Implemented
- ✅ Complete backend API with authentication
- ✅ Frontend architecture with Redux + React Router  
- ✅ User authentication (login/register)
- ✅ Protected routes and layouts
- ✅ Database schema with all entities

### Core Entities
- **Users**: Role-based authentication (admin, manager, user)
- **Categories**: Service categories (Dry Clean, Wash & Fold, etc.)
- **Services**: Individual services with multiple pricing tiers
- **Customers**: Customer profiles with contact info and history
- **Orders**: Order management with status tracking
- **Invoices**: Invoice generation with payment tracking
- **Payments**: Payment records with multiple methods

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `POST /api/auth/refresh` - Refresh token
- `GET /api/me` - Get current user

### Protected Endpoints
- `GET/POST/PUT/DELETE /api/categories` - Category management
- `GET/POST/PUT/DELETE /api/services` - Service management
- `GET/POST/PUT/DELETE /api/customers` - Customer management
- `GET/POST/PUT/DELETE /api/orders` - Order management
- `GET/POST/PUT/DELETE /api/invoices` - Invoice management

## Development Commands

### Frontend
```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript checking
```

### Backend  
```bash
composer install         # Install dependencies
php -S localhost:8000 -t public  # Development server
composer run-script test         # Run tests
```

## Technology Stack

### Frontend
- React 18 + TypeScript
- Redux Toolkit + RTK Query
- React Router DOM v6
- React Hook Form + Zod validation
- Tailwind CSS + shadcn/ui
- Vite build tool

### Backend
- PHP 8.2+ with Slim Framework 4
- PostgreSQL with Doctrine DBAL
- JWT authentication
- PSR-4 autoloading

## Default Login

After running the database schema:
- Email: `admin@lms.com`
- Password: `password` (hashed in database)

## Next Steps

The foundation is complete! You can now:

1. **Start Development Servers**:
   ```bash
   # Terminal 1 - Frontend
   cd frontend && npm run dev
   
   # Terminal 2 - Backend  
   cd backend && php -S localhost:8000 -t public
   ```

2. **Set Up Database**: Create PostgreSQL database and run schema

3. **Begin Development**: The authentication system is ready, start building the UI components

## Documentation

- Migration plan: `.claude/plans/migration-plan.md`
- Setup guide: `.claude/plans/setup-plan.md`  
- API standards: `.claude/docs/api-standards.md`
- Development workflow: `.claude/workflows/development-workflow.md`