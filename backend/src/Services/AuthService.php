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
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            return null;
        }

        // Update last login
        $updateSql = "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?";
        $updateStmt = $this->db->prepare($updateSql);
        $updateStmt->bind_param("i", $user['id']);
        $updateStmt->execute();

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
        $checkStmt->bind_param("s", $userData['email']);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        
        if ($result->fetch_assoc()) {
            throw new \Exception('User already exists with this email');
        }

        // Hash password
        $passwordHash = password_hash($userData['password'], PASSWORD_DEFAULT);
        $role = $userData['role'] ?? 'user';

        // Insert new user
        $sql = "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("ssss", $userData['name'], $userData['email'], $passwordHash, $role);
        $stmt->execute();
        
        if ($stmt->affected_rows === 0) {
            throw new \Exception('Failed to create user');
        }
        
        // Get the inserted user
        $userId = $this->db->insert_id;
        $selectSql = "SELECT id, uuid, name, email, role FROM users WHERE id = ?";
        $selectStmt = $this->db->prepare($selectSql);
        $selectStmt->bind_param("i", $userId);
        $selectStmt->execute();
        $result = $selectStmt->get_result();
        $user = $result->fetch_assoc();

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
        $stmt->bind_param("i", $payload['id']);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();

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
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        return $result->fetch_assoc() ?: null;
    }
}