<?php

namespace App\Utils;

use Psr\Http\Message\ResponseInterface as Response;

class ResponseHelper
{
    public static function success(Response $response, $data = null, int $statusCode = 200): Response
    {
        $payload = [
            'success' => true,
            'data' => $data,
            'timestamp' => date('c')
        ];

        $response->getBody()->write(json_encode($payload));
        
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($statusCode);
    }

    public static function error(Response $response, string $message, int $statusCode = 400, array $details = []): Response
    {
        $payload = [
            'success' => false,
            'error' => [
                'message' => $message,
                'details' => $details
            ],
            'timestamp' => date('c')
        ];

        $response->getBody()->write(json_encode($payload));
        
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($statusCode);
    }

    public static function paginated(Response $response, array $data, array $pagination): Response
    {
        $payload = [
            'success' => true,
            'data' => $data,
            'pagination' => $pagination,
            'timestamp' => date('c')
        ];

        $response->getBody()->write(json_encode($payload));
        
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus(200);
    }
}