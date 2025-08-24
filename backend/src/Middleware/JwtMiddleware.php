<?php

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use App\Utils\JwtHelper;
use App\Utils\ResponseHelper;

class JwtMiddleware implements MiddlewareInterface
{
    public function process(Request $request, RequestHandlerInterface $handler): Response
    {
        $authHeader = $request->getHeaderLine('Authorization');
        
        if (empty($authHeader)) {
            $response = new \Slim\Psr7\Response();
            return ResponseHelper::error($response, 'Authorization header missing', 401);
        }

        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $response = new \Slim\Psr7\Response();
            return ResponseHelper::error($response, 'Invalid authorization header format', 401);
        }

        $token = $matches[1];
        $payload = JwtHelper::validateToken($token);

        if ($payload === null) {
            $response = new \Slim\Psr7\Response();
            return ResponseHelper::error($response, 'Invalid or expired token', 401);
        }

        // Add user data to request attributes
        $request = $request->withAttribute('user', $payload);

        return $handler->handle($request);
    }
}