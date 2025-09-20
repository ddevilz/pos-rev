<?php

namespace App\Config;

class Database
{
    private static ?\mysqli $connection = null;

    public static function getConnection(): \mysqli
    {
        if (self::$connection === null) {
            $host = $_ENV['DB_HOST'];
            $username = $_ENV['DB_USERNAME'];
            $password = $_ENV['DB_PASSWORD'];
            $database = $_ENV['DB_DATABASE'];
            $port = $_ENV['DB_PORT'] ?? 3306;

            self::$connection = new \mysqli($host, $username, $password, $database, $port);

            // Check for connection errors
            if (self::$connection->connect_error) {
                throw new \Exception('Database connection failed: ' . self::$connection->connect_error);
            }

            // Set charset
            self::$connection->set_charset('utf8mb4');
        }

        return self::$connection;
    }
    
    // Optional: Method to close connection
    public static function closeConnection(): void
    {
        if (self::$connection !== null) {
            self::$connection->close();
            self::$connection = null;
        }
    }
}