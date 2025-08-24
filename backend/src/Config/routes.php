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
        $group->get('/customers/{id}/stats', [CustomerController::class, 'stats']);
        $group->patch('/customers/{id}/toggle-status', [CustomerController::class, 'toggleStatus']);
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