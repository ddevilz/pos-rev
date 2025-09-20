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
        $types = "";

        if (!empty($params['search'])) {
            $conditions[] = "(category LIKE ? OR description LIKE ?)";
            $values[] = '%' . $params['search'] . '%';
            $values[] = '%' . $params['search'] . '%';
            $types .= "ss";
        }

        if (isset($params['is_active'])) {
            $conditions[] = "is_active = ?";
            $values[] = $params['is_active'] === 'true';
            $types .= "i";
        }

        if (!empty($conditions)) {
            $sql .= " WHERE " . implode(" AND ", $conditions);
        }

        $sql .= " ORDER BY category ASC";

        $stmt = $this->db->prepare($sql);
        if (!empty($values)) {
            $stmt->bind_param($types, ...$values);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        
        $categories = [];
        while ($row = $result->fetch_assoc()) {
            $categories[] = $row;
        }
        
        return $categories;
    }

    public function getById(int $id): ?array
    {
        $sql = "SELECT id, uuid, catid, category, description, is_active, created_at, updated_at FROM categories WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        return $result->fetch_assoc() ?: null;
    }

    public function create(array $data): array
    {
        // Check if catid already exists
        $checkSql = "SELECT id FROM categories WHERE catid = ?";
        $checkStmt = $this->db->prepare($checkSql);
        $checkStmt->bind_param("s", $data['catid']);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        
        if ($result->fetch_assoc()) {
            throw new \Exception('Category ID already exists');
        }

        $sql = "INSERT INTO categories (catid, category, description, created_by) 
                VALUES (?, ?, ?, ?)";
        
        $stmt = $this->db->prepare($sql);
        $description = $data['description'] ?? null;
        $createdBy = $data['created_by'] ?? null;
        $stmt->bind_param("sssi", 
            $data['catid'],
            $data['category'],
            $description,
            $createdBy
        );
        
        $stmt->execute();
        
        if ($stmt->affected_rows === 0) {
            throw new \Exception('Failed to create category');
        }
        
        $insertId = $this->db->insert_id;
        
        // Fetch the inserted record
        $selectSql = "SELECT id, uuid, catid, category, description, is_active, created_at FROM categories WHERE id = ?";
        $selectStmt = $this->db->prepare($selectSql);
        $selectStmt->bind_param("i", $insertId);
        $selectStmt->execute();
        $result = $selectStmt->get_result();
        $category = $result->fetch_assoc();
        
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
            $checkStmt->bind_param("si", $data['catid'], $id);
            $checkStmt->execute();
            $result = $checkStmt->get_result();
            
            if ($result->fetch_assoc()) {
                throw new \Exception('Category ID already exists');
            }
        }

        $fields = [];
        $values = [];
        $types = "";

        if (isset($data['catid'])) {
            $fields[] = "catid = ?";
            $values[] = $data['catid'];
            $types .= "s";
        }

        if (isset($data['category'])) {
            $fields[] = "category = ?";
            $values[] = $data['category'];
            $types .= "s";
        }

        if (isset($data['description'])) {
            $fields[] = "description = ?";
            $values[] = $data['description'];
            $types .= "s";
        }

        if (isset($data['is_active'])) {
            $fields[] = "is_active = ?";
            $values[] = $data['is_active'];
            $types .= "i";
        }

        if (empty($fields)) {
            return $existing;
        }

        $values[] = $id;
        $types .= "i";
        $sql = "UPDATE categories SET " . implode(", ", $fields) . " WHERE id = ?";

        $stmt = $this->db->prepare($sql);
        $stmt->bind_param($types, ...$values);
        $stmt->execute();
        
        if ($stmt->affected_rows === 0) {
            // No rows were updated, return existing
            return $existing;
        }
        
        // Fetch the updated record
        $selectSql = "SELECT id, uuid, catid, category, description, is_active, created_at, updated_at FROM categories WHERE id = ?";
        $selectStmt = $this->db->prepare($selectSql);
        $selectStmt->bind_param("i", $id);
        $selectStmt->execute();
        $result = $selectStmt->get_result();
        return $result->fetch_assoc() ?: null;
    }

    public function delete(int $id): bool
    {
        // Check if category is used in services
        $checkSql = "SELECT COUNT(*) as count FROM services WHERE category_id = ?";
        $checkStmt = $this->db->prepare($checkSql);
        $checkStmt->bind_param("i", $id);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        $row = $result->fetch_assoc();
        
        if ($row['count'] > 0) {
            throw new \Exception('Cannot delete category that is used by services');
        }

        $sql = "DELETE FROM categories WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        
        return $stmt->affected_rows > 0;
    }
}