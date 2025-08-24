# Complete Project Setup Guide

## Step 1: Create Project Structure

```bash
mkdir laundry-management-system
cd laundry-management-system

# Create main directories
mkdir frontend backend database docs

# Frontend structure
cd frontend
mkdir -p src/{components/{ui,forms,layout,common},pages/{auth,dashboard,categories,services,orders},hooks,store/{slices,api},lib,types,constants,styles} public

# Backend structure
cd ../backend
mkdir -p src/{Controllers,Models,Services,Middleware,Database,Utils,Config} public migrations

cd ..
```

## Step 2: Frontend Package.json

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
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-dialog": "^1.1.1",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-select": "^2.1.1",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-scroll-area": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.1",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.4.0",
    "date-fns": "^3.6.0"
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

## Step 3: Frontend Configuration Files

### `frontend/vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          state: ['@reduxjs/toolkit', 'react-redux'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
})
```

### `frontend/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### `frontend/tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### `frontend/.eslintrc.json`
```json
{
  "root": true,
  "env": { "browser": true, "es2020": true },
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "eslint:recommended",
    "@typescript-eslint/recommended"
  ],
  "ignorePatterns": ["dist", ".eslintrc.cjs"],
  "parser": "@typescript-eslint/parser",
  "plugins": ["react-refresh"],
  "rules": {
    "react-refresh/only-export-components": [
      "warn",
      { "allowConstantExport": true }
    ],
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

## Step 4: Backend Composer Configuration

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
    "autoload-dev": {
        "psr-4": {
            "Tests\\": "tests/"
        }
    },
    "scripts": {
        "start": "php -S localhost:8000 -t public",
        "migrate": "php migrations/migrate.php",
        "test": "phpunit",
        "cs-check": "phpcs",
        "cs-fix": "phpcbf"
    },
    "config": {
        "optimize-autoloader": true,
        "sort-packages": true
    }
}
```

## Step 5: Database Schema

Create `database/schema.sql`:

```sql
-- Enhanced schema with better structure
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with enhanced structure
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'manager')),
    is_active BOOLEAN DEFAULT true,
    email_verified_at TIMESTAMP NULL,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table with enhanced structure
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    catid VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services table with enhanced structure
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    ino INTEGER UNIQUE,
    iname VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id),
    rate1 DECIMAL(10,2) NOT NULL DEFAULT 0,
    rate2 DECIMAL(10,2) DEFAULT 0,
    rate3 DECIMAL(10,2) DEFAULT 0,
    rate4 DECIMAL(10,2) DEFAULT 0,
    rate5 DECIMAL(10,2) DEFAULT 0,
    itype VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table with enhanced structure
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    cname VARCHAR(255) NOT NULL,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255),
    add1 TEXT,
    add2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    rtype VARCHAR(50) DEFAULT 'regular' CHECK (rtype IN ('regular', 'premium', 'vip')),
    is_active BOOLEAN DEFAULT true,
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table with enhanced structure
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    due_date DATE,
    due_time TIME,
    pickup_date DATE,
    delivery_date DATE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delivered', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    total_quantity INTEGER DEFAULT 0,
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    tax_percentage DECIMAL(5,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    advance_paid DECIMAL(12,2) DEFAULT 0,
    remaining_amount DECIMAL(12,2) DEFAULT 0,
    payment_status VARCHAR(30) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id),
    service_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    rate DECIMAL(10,2) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table (separate from orders for better tracking)
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    order_id INTEGER REFERENCES orders(id),
    customer_id INTEGER REFERENCES customers(id),
    invoice_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    balance_amount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    order_id INTEGER REFERENCES orders(id),
    invoice_id INTEGER REFERENCES invoices(id),
    customer_id INTEGER REFERENCES customers(id),
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'upi', 'bank_transfer', 'cheque')),
    payment_reference VARCHAR(255),
    payment_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_uuid ON users(uuid);
CREATE INDEX idx_categories_catid ON categories(catid);
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_services_itype ON services(itype);
CREATE INDEX idx_customers_mobile ON customers(mobile);
CREATE INDEX idx_customers_uuid ON customers(uuid);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(created_at);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_invoices_order ON invoices(order_id);
CREATE INDEX idx_payments_order ON payments(order_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data
INSERT INTO users (name, email, password_hash, role) VALUES 
('Admin User', 'admin@lms.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Manager User', 'manager@lms.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager');

INSERT INTO categories (catid, category, description) VALUES 
('DRY_CLEAN', 'Dry Cleaning', 'Professional dry cleaning services'),
('WASH_FOLD', 'Wash & Fold', 'Regular washing and folding service'),
('IRON_PRESS', 'Iron & Press', 'Ironing and pressing service'),
('ALTERATIONS', 'Alterations', 'Clothing alteration services');
```

## Step 6: Environment Files

### `backend/.env`
```env
# Application
APP_NAME="Laundry Management System"
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=laundry_db
DB_USERNAME=your_username
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=3600
JWT_REFRESH_EXPIRY=604800

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=Content-Type,Authorization,X-Requested-With

# Mail (for future use)
MAIL_DRIVER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/
```

### `frontend/.env`
```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME="Laundry Management System"
VITE_APP_VERSION=1.0.0
```

## Step 7: Key Frontend Files Structure

### `frontend/src/main.tsx`
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

import App from './App.tsx'
import { store } from './store/index.ts'
import './styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster 
            position="top-right" 
            richColors 
            closeButton 
            duration={4000}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
)
```

### `frontend/src/App.tsx`
```typescript
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from './store'

// Layout Components
import AuthLayout from './components/layout/AuthLayout'
import DashboardLayout from './components/layout/DashboardLayout'
import ProtectedRoute from './components/common/ProtectedRoute'

// Page Components
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import CategoriesPage from './pages/categories/CategoriesPage'
import ServicesPage from './pages/services/ServicesPage'
import OrdersPage from './pages/orders/OrdersPage'
import CustomersPage from './pages/customers/CustomersPage'
import InvoicesPage from './pages/invoices/InvoicesPage'
import ReportsPage from './pages/reports/ReportsPage'
import SettingsPage from './pages/settings/SettingsPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route index element={<Navigate to="/auth/login" replace />} />
      </Route>

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Redirect based on auth status */}
      <Route 
        path="*" 
        element={
          isAuthenticated ? 
            <Navigate to="/dashboard" replace /> : 
            <Navigate to="/auth/login" replace />
        } 
      />
    </Routes>
  )
}

export default App
```

### `frontend/src/store/index.ts`
```typescript
import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'

// Slices
import authSlice from './slices/authSlice'
import uiSlice from './slices/uiSlice'
import categoriesSlice from './slices/categoriesSlice'
import servicesSlice from './slices/servicesSlice'
import ordersSlice from './slices/ordersSlice'
import customersSlice from './slices/customersSlice'

// API
import { apiSlice } from './api/apiSlice'

export const store = configureStore({
  reducer: {
    // API
    [apiSlice.reducerPath]: apiSlice.reducer,
    
    // State slices
    auth: authSlice,
    ui: uiSlice,
    categories: categoriesSlice,
    services: servicesSlice,
    orders: ordersSlice,
    customers: customersSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== 'production',
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

## Step 8: Backend Core Files Structure

### `backend/public/index.php`
```php
<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Slim\Factory\AppFactory;
use DI\ContainerBuilder;
use App\Config\Database;
use App\Middleware\CorsMiddleware;
use App\Middleware\JwtMiddleware;
use App\Middleware\ErrorMiddleware;

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Create Container
$containerBuilder = new ContainerBuilder();

// Add container definitions
$containerBuilder->addDefinitions([
    'db' => function () {
        return Database::getConnection();
    },
]);

$container = $containerBuilder->build();
AppFactory::setContainer($container);

// Create App
$app = AppFactory::create();

// Add middleware
$app->addBodyParsingMiddleware();
$app->add(new CorsMiddleware());
$app->add(new ErrorMiddleware());

// Add routing middleware
$app->addRoutingMiddleware();

// Register routes
require_once __DIR__ . '/../src/Config/routes.php';

$app->run();
```

### `backend/src/Config/Database.php`
```php
<?php

namespace App\Config;

use Doctrine\DBAL\Connection;
use Doctrine\DBAL\DriverManager;

class Database
{
    private static ?Connection $connection = null;

    public static function getConnection(): Connection
    {
        if (self::$connection === null) {
            $connectionParams = [
                'dbname' => $_ENV['DB_DATABASE'],
                'user' => $_ENV['DB_USERNAME'],
                'password' => $_ENV['DB_PASSWORD'],
                'host' => $_ENV['DB_HOST'],
                'port' => $_ENV['DB_PORT'],
                'driver' => 'pdo_pgsql',
                'charset' => 'utf8',
            ];

            self::$connection = DriverManager::getConnection($connectionParams);
        }

        return self::$connection;
    }
}
```

### `backend/src/Config/routes.php`
```php
<?php

use Slim\App;
use App\Controllers\AuthController;
use App\Controllers\CategoryController;
use App\Controllers\ServiceController;
use App\Controllers\CustomerController;
use App\Controllers\OrderController;
use App\Controllers\InvoiceController;
use App\Controllers\ReportController;
use App\Middleware\JwtMiddleware;

return function (App $app) {
    // CORS preflight
    $app->options('/{routes:.+}', function ($request, $response, $args) {
        return $response;
    });

    // Auth routes (public)
    $app->group('/api/auth', function ($group) {
        $group->post('/login', [AuthController::class, 'login']);
        $group->post('/register', [AuthController::class, 'register']);
        $group->post('/refresh', [AuthController::class, 'refresh']);
    });

    // Protected API routes
    $app->group('/api', function ($group) {
        // User routes
        $group->get('/me', [AuthController::class, 'me']);
        $group->post('/logout', [AuthController::class, 'logout']);
        
        // Categories
        $group->get('/categories', [CategoryController::class, 'index']);
        $group->post('/categories', [CategoryController::class, 'store']);
        $group->get('/categories/{id}', [CategoryController::class, 'show']);
        $group->put('/categories/{id}', [CategoryController::class, 'update']);
        $group->delete('/categories/{id}', [CategoryController::class, 'delete']);
        
        // Services
        $group->get('/services', [ServiceController::class, 'index']);
        $group->get('/services/category/{categoryId}', [ServiceController::class, 'byCategory']);
        $group->post('/services', [ServiceController::class, 'store']);
        $group->get('/services/{id}', [ServiceController::class, 'show']);
        $group->put('/services/{id}', [ServiceController::class, 'update']);
        $group->delete('/services/{id}', [ServiceController::class, 'delete']);
        
        // Customers
        $group->get('/customers', [CustomerController::class, 'index']);
        $group->get('/customers/search', [CustomerController::class, 'search']);
        $group->post('/customers', [CustomerController::class, 'store']);
        $group->get('/customers/{id}', [CustomerController::class, 'show']);
        $group->put('/customers/{id}', [CustomerController::class, 'update']);
        $group->delete('/customers/{id}', [CustomerController::class, 'delete']);
        
        // Orders
        $group->get('/orders', [OrderController::class, 'index']);
        $group->post('/orders', [OrderController::class, 'store']);
        $group->get('/orders/{id}', [OrderController::class, 'show']);
        $group->put('/orders/{id}', [OrderController::class, 'update']);
        $group->delete('/orders/{id}', [OrderController::class, 'delete']);
        $group->patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);
        
        // Invoices
        $group->get('/invoices', [InvoiceController::class, 'index']);
        $group->post('/invoices', [InvoiceController::class, 'store']);
        $group->get('/invoices/{id}', [InvoiceController::class, 'show']);
        $group->put('/invoices/{id}', [InvoiceController::class, 'update']);
        $group->get('/invoices/{id}/pdf', [InvoiceController::class, 'generatePdf']);
        
        // Reports
        $group->get('/reports/dashboard', [ReportController::class, 'dashboard']);
        $group->get('/reports/revenue', [ReportController::class, 'revenue']);
        $group->get('/reports/orders', [ReportController::class, 'orders']);
        $group->get('/reports/customers', [ReportController::class, 'customers']);
        
    })->add(new JwtMiddleware());
};
```

## Step 9: Claude Code Instructions

### Create a file `claude-instructions.md`:

```markdown
# Claude Code Instructions for LMS

## Project Setup Commands

1. **Initialize Frontend:**
```bash
cd frontend
npm install
npm run dev
```

2. **Initialize Backend:**
```bash
cd backend
composer install
php -S localhost:8000 -t public
```

3. **Database Setup:**
```bash
# Create PostgreSQL database
createdb laundry_db
psql laundry_db < ../database/schema.sql
```

## Development Workflow

### Frontend Development
- Use `npm run dev` for development server
- Follow the component structure in `/src/components/`
- Use Redux Toolkit for state management
- Implement React Query for server state
- Follow TypeScript best practices

### Backend Development
- Use PSR-4 autoloading
- Follow MVC pattern with Controllers/Services/Models
- Use Doctrine DBAL for database operations
- Implement proper error handling
- Use JWT for authentication

## Key Features to Implement

### Phase 1: Authentication & Core Setup
1. User authentication with JWT
2. Protected routes setup
3. Basic CRUD for categories
4. Basic CRUD for services

### Phase 2: Business Logic
1. Customer management with search
2. Order creation and management
3. Invoice generation
4. Payment tracking

### Phase 3: Advanced Features
1. Dashboard with analytics
2. Reporting system
3. Export functionality
4. Real-time updates

### Phase 4: Polish & Optimization
1. Performance optimization
2. Error handling improvement
3. UI/UX enhancements
4. Testing implementation

## File Structure Guidelines

### Frontend Components
- Keep components small and focused
- Use TypeScript interfaces for props
- Implement proper error boundaries
- Use React.memo for performance
- Follow naming conventions: PascalCase for components

### Backend Structure
- Controllers handle HTTP requests/responses
- Services contain business logic
- Models define data structures
- Middleware handles cross-cutting concerns
- Use dependency injection

## Coding Standards

### Frontend
- Use functional components with hooks
- Implement proper TypeScript types
- Use ESLint and Prettier
- Follow React best practices
- Implement proper error handling

### Backend
- Follow PSR-12 coding standards
- Use type hints for all functions
- Implement proper validation
- Use prepared statements for SQL
- Handle exceptions properly

## Security Considerations

1. **Input Validation:** Validate all inputs on both client and server
2. **SQL Injection:** Use prepared statements
3. **XSS Prevention:** Sanitize outputs
4. **CSRF Protection:** Implement CSRF tokens
5. **Authentication:** Secure JWT implementation
6. **Authorization:** Role-based access control

## Performance Optimization

### Frontend
- Code splitting with React.lazy
- Memoization with React.memo and useMemo
- Optimize bundle size
- Implement virtual scrolling for large lists
- Use React Query for caching

### Backend
- Database indexing
- Query optimization
- Response caching
- Pagination for large datasets
- Connection pooling

## Testing Strategy

### Frontend
- Unit tests with React Testing Library
- Integration tests for critical flows
- E2E tests with Playwright
- Component testing with Storybook

### Backend
- Unit tests with PHPUnit
- Integration tests for APIs
- Database testing with test database
- API documentation with OpenAPI

## Deployment Guide

### Frontend (Static files)
1. Run `npm run build`
2. Upload `dist/` folder to Hostinger
3. Configure Apache/Nginx for SPA routing

### Backend (PHP)
1. Upload files to server
2. Configure database connection
3. Set up environment variables
4. Configure web server
5. Set up SSL certificate

## Environment Configuration

### Development
- Use local database
- Enable debug mode
- Use hot reloading
- Detailed error messages

### Production
- Use production database
- Disable debug mode
- Enable compression
- Minimal error messages
- Enable caching
```

## Step 10: Hostinger Deployment Configuration

### `frontend/dist/.htaccess` (for SPA routing)
```apache
RewriteEngine On
RewriteBase /

# Handle client-side routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Cache static assets
<filesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 month"
</filesMatch>
```

### `backend/public/.htaccess`
```apache
RewriteEngine On

# Redirect to index.php
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.php [QSA,L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"

# CORS headers (adjust origins as needed)
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"

# Handle preflight requests
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
```

This complete setup provides you with:

1. **Modern React 18 + TypeScript frontend** with Vite for fast development
2. **Clean PHP backend** with Slim framework and proper architecture
3. **Enhanced database schema** with better relationships and indexing
4. **Redux Toolkit + RTK Query** for excellent state management
5. **Shadcn/ui components** for consistent, modern UI
6. **Comprehensive development workflow** with proper tooling
7. **Production-ready deployment configuration** for Hostinger

You can now use Claude Code to implement this step by step, starting with the basic setup and gradually adding features according to the phases outlined in the plan.