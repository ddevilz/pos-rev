<?php

namespace App\Services;

use App\Config\Database;

class ServiceService
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getAll(array $params = []): array
    {
        $sql = "SELECT s.id, s.uuid, s.ino, s.iname, s.description, s.category_id, 
                       s.rate1, s.rate2, s.rate3, s.rate4, s.rate5, s.itype, s.is_active,
                       s.created_at, s.updated_at, c.category as category_name
                FROM services s 
                LEFT JOIN categories c ON s.category_id = c.id";
        
        $conditions = [];
        $values = [];

        if (!empty($params['search'])) {
            $conditions[] = "(s.iname LIKE ? OR s.description LIKE ?)";
            $values[] = '%' . $params['search'] . '%';
            $values[] = '%' . $params['search'] . '%';
        }

        if (!empty($params['category_id'])) {
            $conditions[] = "s.category_id = ?";
            $values[] = $params['category_id'];
        }

        if (!empty($params['itype'])) {
            $conditions[] = "s.itype = ?";
            $values[] = $params['itype'];
        }

        if (isset($params['is_active'])) {
            $conditions[] = "s.is_active = ?";
            $values[] = $params['is_active'] === 'true';
        }

        if (!empty($conditions)) {
            $sql .= " WHERE " . implode(" AND ", $conditions);
        }

        $sql .= " ORDER BY s.iname ASC";

        $stmt = $this->db->prepare($sql);
        foreach ($values as $index => $value) {
            $stmt->bindValue($index + 1, $value);
        }

        $result = $stmt->executeQuery();
        return $result->fetchAllAssociative();
    }

    public function getById(int $id): ?array
    {
        $sql = "SELECT s.id, s.uuid, s.ino, s.iname, s.description, s.category_id, 
                       s.rate1, s.rate2, s.rate3, s.rate4, s.rate5, s.itype, s.is_active,
                       s.created_at, s.updated_at, c.category as category_name
                FROM services s 
                LEFT JOIN categories c ON s.category_id = c.id 
                WHERE s.id = ?";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(1, $id);
        $result = $stmt->executeQuery();
        
        return $result->fetchAssociative() ?: null;
    }

    public function getByCategory(int $categoryId): array
    {
        $sql = "SELECT s.id, s.uuid, s.ino, s.iname, s.description, s.category_id, 
                       s.rate1, s.rate2, s.rate3, s.rate4, s.rate5, s.itype, s.is_active,
                       s.created_at, s.updated_at, c.category as category_name
                FROM services s 
                LEFT JOIN categories c ON s.category_id = c.id 
                WHERE s.category_id = ? AND s.is_active = true
                ORDER BY s.iname ASC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(1, $categoryId);
        $result = $stmt->executeQuery();
        
        return $result->fetchAllAssociative();
    }

    public function create(array $data): array
    {
        // Check if ino already exists
        if (!empty($data['ino'])) {
            $checkSql = "SELECT id FROM services WHERE ino = ?";
            $checkStmt = $this->db->prepare($checkSql);
            $checkStmt->bindValue(1, $data['ino']);
            $result = $checkStmt->executeQuery();
            
            if ($result->fetchOne()) {
                throw new \Exception('Service number already exists');
            }
        }

        // Verify category exists
        if (!empty($data['category_id'])) {
            $categorySql = "SELECT id FROM categories WHERE id = ? AND is_active = true";
            $categoryStmt = $this->db->prepare($categorySql);
            $categoryStmt->bindValue(1, $data['category_id']);
            $result = $categoryStmt->executeQuery();
            
            if (!$result->fetchOne()) {
                throw new \Exception('Invalid category');
            }
        }

        $sql = "INSERT INTO services (ino, iname, description, category_id, rate1, rate2, rate3, rate4, rate5, itype, created_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
                RETURNING id, uuid, ino, iname, description, category_id, rate1, rate2, rate3, rate4, rate5, itype, is_active, created_at";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(1, $data['ino'] ?? null);
        $stmt->bindValue(2, $data['iname']);
        $stmt->bindValue(3, $data['description'] ?? null);
        $stmt->bindValue(4, $data['category_id'] ?? null);
        $stmt->bindValue(5, $data['rate1'] ?? 0);
        $stmt->bindValue(6, $data['rate2'] ?? 0);
        $stmt->bindValue(7, $data['rate3'] ?? 0);
        $stmt->bindValue(8, $data['rate4'] ?? 0);
        $stmt->bindValue(9, $data['rate5'] ?? 0);
        $stmt->bindValue(10, $data['itype'] ?? null);
        $stmt->bindValue(11, $data['created_by'] ?? null);
        
        $result = $stmt->executeQuery();
        $service = $result->fetchAssociative();
        
        if (!$service) {
            throw new \Exception('Failed to create service');
        }
        
        return $service;
    }

    public function update(int $id, array $data): ?array
    {
        // Check if service exists
        $existing = $this->getById($id);
        if (!$existing) {
            return null;
        }

        // Check if ino already exists (excluding current record)
        if (!empty($data['ino']) && $data['ino'] !== $existing['ino']) {
            $checkSql = "SELECT id FROM services WHERE ino = ? AND id != ?";
            $checkStmt = $this->db->prepare($checkSql);
            $checkStmt->bindValue(1, $data['ino']);
            $checkStmt->bindValue(2, $id);
            $result = $checkStmt->executeQuery();
            
            if ($result->fetchOne()) {
                throw new \Exception('Service number already exists');
            }
        }

        // Verify category exists if provided
        if (!empty($data['category_id'])) {
            $categorySql = "SELECT id FROM categories WHERE id = ? AND is_active = true";
            $categoryStmt = $this->db->prepare($categorySql);
            $categoryStmt->bindValue(1, $data['category_id']);
            $result = $categoryStmt->executeQuery();
            
            if (!$result->fetchOne()) {
                throw new \Exception('Invalid category');
            }
        }

        $fields = [];
        $values = [];

        $allowedFields = ['ino', 'iname', 'description', 'category_id', 'rate1', 'rate2', 'rate3', 'rate4', 'rate5', 'itype', 'is_active'];
        
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = ?";
                $values[] = $data[$field];
            }
        }

        if (empty($fields)) {
            return $existing;
        }

        $values[] = $id;
        $sql = "UPDATE services SET " . implode(", ", $fields) . " WHERE id = ? 
                RETURNING id, uuid, ino, iname, description, category_id, rate1, rate2, rate3, rate4, rate5, itype, is_active, created_at, updated_at";

        $stmt = $this->db->prepare($sql);
        foreach ($values as $index => $value) {
            $stmt->bindValue($index + 1, $value);
        }

        $result = $stmt->executeQuery();
        return $result->fetchAssociative() ?: null;
    }

    public function delete(int $id): bool
    {
        // Check if service is used in orders
        $checkSql = "SELECT COUNT(*) FROM order_items WHERE service_id = ?";
        $checkStmt = $this->db->prepare($checkSql);
        $checkStmt->bindValue(1, $id);
        $result = $checkStmt->executeQuery();
        
        if ($result->fetchOne() > 0) {
            throw new \Exception('Cannot delete service that is used in orders');
        }

        $sql = "DELETE FROM services WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(1, $id);
        
        return $stmt->executeStatement() > 0;
    }
}