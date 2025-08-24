<?php

namespace App\Services;

use App\Config\Database;
use App\Utils\JwtHelper;

class AuthService
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function login(string $email, string $password): ?array
    {
        $sql = "SELECT id, uuid, name, email, password_hash, role, is_active FROM users WHERE email = ? AND is_active = true";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(1, $email);
        $result = $stmt->executeQuery();
        $user = $result->fetchAssociative();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            return null;
        }

        // Update last login
        $updateSql = "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?";
        $updateStmt = $this->db->prepare($updateSql);
        $updateStmt->bindValue(1, $user['id']);
        $updateStmt->executeStatement();

        // Generate tokens
        $tokenPayload = [
            'id' => $user['id'],
            'uuid' => $user['uuid'],
            'email' => $user['email'],
            'role' => $user['role']
        ];

        $accessToken = JwtHelper::generateToken($tokenPayload);
        $refreshToken = JwtHelper::generateRefreshToken($tokenPayload);

        return [
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'expires_in' => $_ENV['JWT_EXPIRY'] ?? 3600,
            'user' => [
                'id' => $user['id'],
                'uuid' => $user['uuid'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role']
            ]
        ];
    }

    public function register(array $userData): ?array
    {
        // Check if user already exists
        $checkSql = "SELECT id FROM users WHERE email = ?";
        $checkStmt = $this->db->prepare($checkSql);
        $checkStmt->bindValue(1, $userData['email']);
        $result = $checkStmt->executeQuery();
        
        if ($result->fetchOne()) {
            throw new \Exception('User already exists with this email');
        }

        // Hash password
        $passwordHash = password_hash($userData['password'], PASSWORD_DEFAULT);

        // Insert new user
        $sql = "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?) RETURNING id, uuid, name, email, role";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(1, $userData['name']);
        $stmt->bindValue(2, $userData['email']);
        $stmt->bindValue(3, $passwordHash);
        $stmt->bindValue(4, $userData['role'] ?? 'user');
        
        $result = $stmt->executeQuery();
        $user = $result->fetchAssociative();

        if (!$user) {
            throw new \Exception('Failed to create user');
        }

        // Generate tokens
        $tokenPayload = [
            'id' => $user['id'],
            'uuid' => $user['uuid'],
            'email' => $user['email'],
            'role' => $user['role']
        ];

        $accessToken = JwtHelper::generateToken($tokenPayload);
        $refreshToken = JwtHelper::generateRefreshToken($tokenPayload);

        return [
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'expires_in' => $_ENV['JWT_EXPIRY'] ?? 3600,
            'user' => [
                'id' => $user['id'],
                'uuid' => $user['uuid'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role']
            ]
        ];
    }

    public function refreshToken(string $refreshToken): ?array
    {
        $payload = JwtHelper::validateToken($refreshToken);
        
        if (!$payload) {
            return null;
        }

        // Verify user still exists and is active
        $sql = "SELECT id, uuid, name, email, role FROM users WHERE id = ? AND is_active = true";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(1, $payload['id']);
        $result = $stmt->executeQuery();
        $user = $result->fetchAssociative();

        if (!$user) {
            return null;
        }

        // Generate new tokens
        $tokenPayload = [
            'id' => $user['id'],
            'uuid' => $user['uuid'],
            'email' => $user['email'],
            'role' => $user['role']
        ];

        $newAccessToken = JwtHelper::generateToken($tokenPayload);
        $newRefreshToken = JwtHelper::generateRefreshToken($tokenPayload);

        return [
            'access_token' => $newAccessToken,
            'refresh_token' => $newRefreshToken,
            'token_type' => 'Bearer',
            'expires_in' => $_ENV['JWT_EXPIRY'] ?? 3600,
            'user' => [
                'id' => $user['id'],
                'uuid' => $user['uuid'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role']
            ]
        ];
    }

    public function getCurrentUser(int $userId): ?array
    {
        $sql = "SELECT id, uuid, name, email, role, created_at FROM users WHERE id = ? AND is_active = true";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(1, $userId);
        $result = $stmt->executeQuery();
        
        return $result->fetchAssociative() ?: null;
    }
}