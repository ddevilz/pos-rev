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
    App\Services\AuthService::class => function () {
        return new App\Services\AuthService();
    },
    App\Services\CategoryService::class => function () {
        return new App\Services\CategoryService();
    },
    App\Services\ServiceService::class => function () {
        return new App\Services\ServiceService();
    },
    App\Services\CustomerService::class => function () {
        return new App\Services\CustomerService();
    },
    App\Controllers\AuthController::class => function ($container) {
        return new App\Controllers\AuthController($container->get(App\Services\AuthService::class));
    },
    App\Controllers\CategoryController::class => function ($container) {
        return new App\Controllers\CategoryController($container->get(App\Services\CategoryService::class));
    },
    App\Controllers\ServiceController::class => function ($container) {
        return new App\Controllers\ServiceController($container->get(App\Services\ServiceService::class));
    },
    App\Controllers\CustomerController::class => function ($container) {
        return new App\Controllers\CustomerController($container->get(App\Services\CustomerService::class));
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
(require_once __DIR__ . '/../src/Config/routes.php')($app);

$app->run();