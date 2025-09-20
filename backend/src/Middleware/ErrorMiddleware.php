<?php

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use App\Utils\ResponseHelper;

class ErrorMiddleware implements MiddlewareInterface
{
    public function process(Request $request, RequestHandlerInterface $handler): Response
    {
        try {
            return $handler->handle($request);
        } catch (\Throwable $e) {
            $response = new \Slim\Psr7\Response();
            
            // Log error
            error_log($e->getMessage());
            
            // Return appropriate error response
            $statusCode = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
            $message = $_ENV['APP_DEBUG'] === 'true' ? $e->getMessage() : 'Internal Server Error';
            
            return ResponseHelper::error($response, $message, $statusCode);
        }
    }
}