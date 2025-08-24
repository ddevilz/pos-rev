# Laundry Management System - React + PHP Migration Plan

## Project Overview
Migrating from Next.js to React 18 + PHP backend with improved UI/UX, clean architecture, and Redux state management.

## Technology Stack

### Frontend
- **React 18** - Latest stable version
- **TypeScript** - Type safety
- **Vite** - Fast build tool and dev server
- **Redux Toolkit** - State management
- **React Router DOM v6** - Client-side routing
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Shadcn/ui** - UI components
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Query/TanStack Query** - Server state management
- **Sonner** - Toast notifications
- **Lucide React** - Icons

### Backend
- **PHP 8.2+** - Server-side language
- **Slim Framework 4** - Lightweight PHP framework
- **PostgreSQL** - Database (same as current)
- **JWT** - Authentication
- **PHP-DI** - Dependency injection
- **Monolog** - Logging
- **Doctrine DBAL** - Database abstraction

### Development Tools
- **ESLint + Prettier** - Code formatting
- **Husky** - Git hooks
- **Conventional Commits** - Commit standards

## Project Structure

```
laundry-management-system/
├── frontend/                          # React application
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/                # Reusable UI components
│   │   │   ├── ui/                   # Shadcn components
│   │   │   ├── forms/                # Form components
│   │   │   ├── layout/               # Layout components
│   │   │   └── common/               # Common components
│   │   ├── pages/                    # Page components
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── categories/
│   │   │   ├── services/
│   │   │   └── orders/
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── store/                    # Redux store
│   │   │   ├── slices/
│   │   │   └── api/
│   │   ├── lib/                      # Utilities and configurations
│   │   ├── types/                    # TypeScript type definitions
│   │   ├── constants/                # Application constants
│   │   └── styles/                   # Global styles
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── backend/                          # PHP API
│   ├── public/
│   │   └── index.php                # Entry point
│   ├── src/
│   │   ├── Controllers/             # Request handlers
│   │   ├── Models/                  # Data models
│   │   ├── Services/                # Business logic
│   │   ├── Middleware/              # Request middleware
│   │   ├── Database/                # Database operations
│   │   ├── Utils/                   # Utility functions
│   │   └── Config/                  # Configuration
│   ├── migrations/                  # Database migrations
│   ├── composer.json
│   └── .env
├── database/
│   └── schema.sql                   # Database schema
├── docs/                           # Documentation
└── README.md
```

## Key Improvements

### 1. Enhanced UI/UX Design
- **Modern Dashboard**: Clean, card-based layout with better spacing
- **Responsive Design**: Mobile-first approach with better breakpoints
- **Color Scheme**: Professional blue-gray theme with accent colors
- **Typography**: Improved font hierarchy and readability
- **Animations**: Smooth transitions and micro-interactions
- **Loading States**: Better loading indicators and skeleton screens

### 2. Improved State Management
- **Redux Toolkit**: Simplified Redux with less boilerplate
- **RTK Query**: Built-in data fetching and caching
- **Normalized State**: Proper data normalization for entities
- **Optimistic Updates**: Better UX with optimistic UI updates

### 3. Better Architecture
- **Modular Components**: Highly reusable and composable components
- **Custom Hooks**: Business logic abstraction
- **Service Layer**: Clean separation of concerns
- **Error Boundaries**: Proper error handling
- **Type Safety**: Full TypeScript coverage

### 4. Performance Optimizations
- **Code Splitting**: Route-based and component-based splitting
- **Lazy Loading**: Images and components
- **Memoization**: Proper use of React.memo and useMemo
- **Bundle Optimization**: Tree shaking and dead code elimination

## Migration Steps

### Phase 1: Backend Setup (Week 1)
1. Set up PHP Slim framework
2. Configure database connection
3. Implement authentication with JWT
4. Create API endpoints for all entities
5. Set up CORS and security middleware

### Phase 2: Frontend Foundation (Week 2)
1. Initialize React + Vite project
2. Set up Redux Toolkit store
3. Configure routing with React Router
4. Implement authentication flow
5. Set up Shadcn/ui components

### Phase 3: Core Features (Week 3-4)
1. Dashboard implementation
2. Category management
3. Service management
4. Order/Invoice system
5. Customer management

### Phase 4: Polish & Deploy (Week 5)
1. Performance optimization
2. Error handling improvement
3. Testing
4. Documentation
5. Deployment to Hostinger

## API Endpoints Structure

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Categories
- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/{id}`
- `DELETE /api/categories/{id}`

### Services
- `GET /api/services`
- `GET /api/services/category/{categoryId}`
- `POST /api/services`
- `PUT /api/services/{id}`
- `DELETE /api/services/{id}`

### Customers
- `GET /api/customers`
- `GET /api/customers/search?phone={phone}`
- `POST /api/customers`
- `PUT /api/customers/{id}`

### Orders/Invoices
- `GET /api/orders`
- `POST /api/orders`
- `GET /api/orders/{id}`
- `PUT /api/orders/{id}`
- `DELETE /api/orders/{id}`

## Database Schema Enhancements

```sql
-- Enhanced schema with better indexing and constraints
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- Add audit fields to existing tables
ALTER TABLE categories ADD COLUMN created_by INTEGER REFERENCES users(id);
ALTER TABLE services ADD COLUMN created_by INTEGER REFERENCES users(id);
-- ... similar for other tables
```

## Security Enhancements

### Backend Security
- **Input Validation**: Comprehensive validation using PHP filters
- **SQL Injection Prevention**: Prepared statements with Doctrine DBAL
- **XSS Protection**: Output encoding and CSP headers
- **CSRF Protection**: Token-based CSRF protection
- **Rate Limiting**: API rate limiting middleware
- **Authentication**: JWT with refresh tokens

### Frontend Security
- **XSS Prevention**: Proper data sanitization
- **Authentication State**: Secure token management
- **Route Protection**: Private route components
- **Form Validation**: Client-side validation with Zod

## Deployment Configuration

### Hostinger Setup
```apache
# .htaccess for backend
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.php [QSA,L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
```

### Environment Configuration
```env
# Backend .env
DB_HOST=localhost
DB_NAME=laundry_db
DB_USER=username
DB_PASS=password
JWT_SECRET=your-secret-key
APP_ENV=production
```

## Development Commands

### Frontend
```bash
cd frontend
npm install
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript checking
```

### Backend
```bash
cd backend
composer install
php -S localhost:8000 -t public  # Development server
composer run-script migrate      # Run migrations
composer run-script test         # Run tests
```

## Modern Features to Implement

### 1. Advanced Search & Filtering
- Global search across all entities
- Advanced filters with multiple criteria
- Search history and saved searches

### 2. Real-time Updates
- WebSocket integration for live updates
- Real-time order status changes
- Live dashboard metrics

### 3. Reporting & Analytics
- Revenue reports with charts
- Customer analytics
- Service performance metrics
- Export functionality (PDF, Excel)

### 4. Mobile App Readiness
- PWA implementation
- Offline functionality
- Push notifications

### 5. Integration Capabilities
- WhatsApp API for notifications
- SMS integration
- Email templates
- Payment gateway integration

This migration plan provides a solid foundation for a modern, scalable, and maintainable Laundry Management System that will work perfectly on Hostinger's basic plan while providing significant improvements in performance, user experience, and code quality.