<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\AuthService;
use App\Utils\ResponseHelper;

class AuthController
{
    private AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function login(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            
            if (empty($data['email']) || empty($data['password'])) {
                return ResponseHelper::error($response, 'Email and password are required', 400);
            }

            $result = $this->authService->login($data['email'], $data['password']);
            
            if (!$result) {
                return ResponseHelper::error($response, 'Invalid credentials', 401);
            }

            return ResponseHelper::success($response, $result);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 500);
        }
    }

    public function register(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            
            // Basic validation
            $required = ['name', 'email', 'password'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    return ResponseHelper::error($response, ucfirst($field) . ' is required', 400);
                }
            }

            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                return ResponseHelper::error($response, 'Invalid email format', 400);
            }

            if (strlen($data['password']) < 6) {
                return ResponseHelper::error($response, 'Password must be at least 6 characters', 400);
            }

            $result = $this->authService->register($data);
            
            return ResponseHelper::success($response, $result, 201);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 400);
        }
    }

    public function refresh(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            
            if (empty($data['refresh_token'])) {
                return ResponseHelper::error($response, 'Refresh token is required', 400);
            }

            $result = $this->authService->refreshToken($data['refresh_token']);
            
            if (!$result) {
                return ResponseHelper::error($response, 'Invalid or expired refresh token', 401);
            }

            return ResponseHelper::success($response, $result);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 500);
        }
    }

    public function me(Request $request, Response $response): Response
    {
        try {
            $user = $request->getAttribute('user');
            $currentUser = $this->authService->getCurrentUser($user['id']);
            
            if (!$currentUser) {
                return ResponseHelper::error($response, 'User not found', 404);
            }

            return ResponseHelper::success($response, $currentUser);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 500);
        }
    }

    public function logout(Request $request, Response $response): Response
    {
        // In a stateless JWT system, logout is handled client-side
        // You could implement token blacklisting here if needed
        return ResponseHelper::success($response, ['message' => 'Logged out successfully']);
    }
}