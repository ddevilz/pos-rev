<?php

namespace App\Utils;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JwtHelper
{
    private static function getSecretKey(): string
    {
        return $_ENV['JWT_SECRET'] ?? 'default-secret-key';
    }

    private static function getAlgorithm(): string
    {
        return 'HS256';
    }

    public static function generateToken(array $payload): string
    {
        $issuedAt = time();
        $expirationTime = $issuedAt + ($_ENV['JWT_EXPIRY'] ?? 3600);

        $token = [
            'iat' => $issuedAt,
            'exp' => $expirationTime,
            'data' => $payload
        ];

        return JWT::encode($token, self::getSecretKey(), self::getAlgorithm());
    }

    public static function generateRefreshToken(array $payload): string
    {
        $issuedAt = time();
        $expirationTime = $issuedAt + ($_ENV['JWT_REFRESH_EXPIRY'] ?? 604800);

        $token = [
            'iat' => $issuedAt,
            'exp' => $expirationTime,
            'type' => 'refresh',
            'data' => $payload
        ];

        return JWT::encode($token, self::getSecretKey(), self::getAlgorithm());
    }

    public static function validateToken(string $token): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key(self::getSecretKey(), self::getAlgorithm()));
            return (array) $decoded->data;
        } catch (\Exception $e) {
            return null;
        }
    }

    public static function isTokenExpired(string $token): bool
    {
        try {
            JWT::decode($token, new Key(self::getSecretKey(), self::getAlgorithm()));
            return false;
        } catch (\Firebase\JWT\ExpiredException $e) {
            return true;
        } catch (\Exception $e) {
            return true;
        }
    }

    public static function getTokenPayload(string $token): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key(self::getSecretKey(), self::getAlgorithm()));
            return (array) $decoded;
        } catch (\Exception $e) {
            return null;
        }
    }
}