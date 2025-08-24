<?php

namespace App\Services;

use App\Config\Database;

class CategoryService
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getAll(array $params = []): array
    {
        $sql = "SELECT id, uuid, catid, category, description, is_active, created_at, updated_at FROM categories";
        $conditions = [];
        $values = [];

        if (!empty($params['search'])) {
            $conditions[] = "(category LIKE ? OR description LIKE ?)";
            $values[] = '%' . $params['search'] . '%';
            $values[] = '%' . $params['search'] . '%';
        }

        if (isset($params['is_active'])) {
            $conditions[] = "is_active = ?";
            $values[] = $params['is_active'] === 'true';
        }

        if (!empty($conditions)) {
            $sql .= " WHERE " . implode(" AND ", $conditions);
        }

        $sql .= " ORDER BY category ASC";

        $stmt = $this->db->prepare($sql);
        foreach ($values as $index => $value) {
            $stmt->bindValue($index + 1, $value);
        }

        $result = $stmt->executeQuery();
        return $result->fetchAllAssociative();
    }

    public function getById(int $id): ?array
    {
        $sql = "SELECT id, uuid, catid, category, description, is_active, created_at, updated_at FROM categories WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(1, $id);
        $result = $stmt->executeQuery();
        
        return $result->fetchAssociative() ?: null;
    }

    public function create(array $data): array
    {
        // Check if catid already exists
        $checkSql = "SELECT id FROM categories WHERE catid = ?";
        $checkStmt = $this->db->prepare($checkSql);
        $checkStmt->bindValue(1, $data['catid']);
        $result = $checkStmt->executeQuery();
        
        if ($result->fetchOne()) {
            throw new \Exception('Category ID already exists');
        }

        $sql = "INSERT INTO categories (catid, category, description, created_by) 
                VALUES (?, ?, ?, ?)";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(1, $data['catid']);
        $stmt->bindValue(2, $data['category']);
        $stmt->bindValue(3, $data['description'] ?? null);
        $stmt->bindValue(4, $data['created_by'] ?? null);
        
        $stmt->executeStatement();
        $insertId = $this->db->lastInsertId();
        
        // Fetch the inserted record
        $selectSql = "SELECT id, uuid, catid, category, description, is_active, created_at FROM categories WHERE id = ?";
        $selectStmt = $this->db->prepare($selectSql);
        $selectStmt->bindValue(1, $insertId);
        $result = $selectStmt->executeQuery();
        $category = $result->fetchAssociative();
        
        if (!$category) {
            throw new \Exception('Failed to create category');
        }
        
        return $category;
    }

    public function update(int $id, array $data): ?array
    {
        // Check if category exists
        $existing = $this->getById($id);
        if (!$existing) {
            return null;
        }

        // Check if catid already exists (excluding current record)
        if (!empty($data['catid']) && $data['catid'] !== $existing['catid']) {
            $checkSql = "SELECT id FROM categories WHERE catid = ? AND id != ?";
            $checkStmt = $this->db->prepare($checkSql);
            $checkStmt->bindValue(1, $data['catid']);
            $checkStmt->bindValue(2, $id);
            $result = $checkStmt->executeQuery();
            
            if ($result->fetchOne()) {
                throw new \Exception('Category ID already exists');
            }
        }

        $fields = [];
        $values = [];

        if (isset($data['catid'])) {
            $fields[] = "catid = ?";
            $values[] = $data['catid'];
        }

        if (isset($data['category'])) {
            $fields[] = "category = ?";
            $values[] = $data['category'];
        }

        if (isset($data['description'])) {
            $fields[] = "description = ?";
            $values[] = $data['description'];
        }

        if (isset($data['is_active'])) {
            $fields[] = "is_active = ?";
            $values[] = $data['is_active'];
        }

        if (empty($fields)) {
            return $existing;
        }

        $values[] = $id;
        $sql = "UPDATE categories SET " . implode(", ", $fields) . " WHERE id = ?";

        $stmt = $this->db->prepare($sql);
        foreach ($values as $index => $value) {
            $stmt->bindValue($index + 1, $value);
        }

        $stmt->executeStatement();
        
        // Fetch the updated record
        $selectSql = "SELECT id, uuid, catid, category, description, is_active, created_at, updated_at FROM categories WHERE id = ?";
        $selectStmt = $this->db->prepare($selectSql);
        $selectStmt->bindValue(1, $id);
        $result = $selectStmt->executeQuery();
        return $result->fetchAssociative() ?: null;
    }

    public function delete(int $id): bool
    {
        // Check if category is used in services
        $checkSql = "SELECT COUNT(*) FROM services WHERE category_id = ?";
        $checkStmt = $this->db->prepare($checkSql);
        $checkStmt->bindValue(1, $id);
        $result = $checkStmt->executeQuery();
        
        if ($result->fetchOne() > 0) {
            throw new \Exception('Cannot delete category that is used by services');
        }

        $sql = "DELETE FROM categories WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(1, $id);
        
        return $stmt->executeStatement() > 0;
    }
}