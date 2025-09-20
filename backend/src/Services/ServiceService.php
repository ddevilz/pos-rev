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
        $types = "";

        if (!empty($params['search'])) {
            $conditions[] = "(s.iname LIKE ? OR s.description LIKE ?)";
            $values[] = '%' . $params['search'] . '%';
            $values[] = '%' . $params['search'] . '%';
            $types .= "ss";
        }

        if (!empty($params['category_id'])) {
            $conditions[] = "s.category_id = ?";
            $values[] = $params['category_id'];
            $types .= "i";
        }

        if (!empty($params['itype'])) {
            $conditions[] = "s.itype = ?";
            $values[] = $params['itype'];
            $types .= "s";
        }

        if (isset($params['is_active'])) {
            $conditions[] = "s.is_active = ?";
            $values[] = $params['is_active'] === 'true';
            $types .= "i";
        }

        if (!empty($conditions)) {
            $sql .= " WHERE " . implode(" AND ", $conditions);
        }

        $sql .= " ORDER BY s.iname ASC";

        $stmt = $this->db->prepare($sql);
        if (!empty($values)) {
            $stmt->bind_param($types, ...$values);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        
        $services = [];
        while ($row = $result->fetch_assoc()) {
            $services[] = $row;
        }
        
        return $services;
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
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        return $result->fetch_assoc() ?: null;
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
        $stmt->bind_param("i", $categoryId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $services = [];
        while ($row = $result->fetch_assoc()) {
            $services[] = $row;
        }
        
        return $services;
    }

    public function create(array $data): array
    {
        // Check if ino already exists
        if (!empty($data['ino'])) {
            $checkSql = "SELECT id FROM services WHERE ino = ?";
            $checkStmt = $this->db->prepare($checkSql);
            $checkStmt->bind_param("s", $data['ino']);
            $checkStmt->execute();
            $result = $checkStmt->get_result();
            
            if ($result->fetch_assoc()) {
                throw new \Exception('Service number already exists');
            }
        }

        // Verify category exists
        if (!empty($data['category_id'])) {
            $categorySql = "SELECT id FROM categories WHERE id = ? AND is_active = true";
            $categoryStmt = $this->db->prepare($categorySql);
            $categoryStmt->bind_param("i", $data['category_id']);
            $categoryStmt->execute();
            $result = $categoryStmt->get_result();
            
            if (!$result->fetch_assoc()) {
                throw new \Exception('Invalid category');
            }
        }

        $sql = "INSERT INTO services (ino, iname, description, category_id, rate1, rate2, rate3, rate4, rate5, itype, created_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $this->db->prepare($sql);
        // Types mapping: ino(s), iname(s), description(s), category_id(i), rate1(d), rate2(d), rate3(d), rate4(d), rate5(d), itype(s), created_by(i)
        $ino = $data['ino'] ?? null;
        $iname = $data['iname'];
        $description = $data['description'] ?? null;
        $categoryId = $data['category_id'] ?? null;
        $rate1 = $data['rate1'] ?? 0;
        $rate2 = $data['rate2'] ?? 0;
        $rate3 = $data['rate3'] ?? 0;
        $rate4 = $data['rate4'] ?? 0;
        $rate5 = $data['rate5'] ?? 0;
        $itype = $data['itype'] ?? null;
        $createdBy = $data['created_by'] ?? null;
        $stmt->bind_param("sssidddddsi", 
            $ino,
            $iname,
            $description,
            $categoryId,
            $rate1,
            $rate2,
            $rate3,
            $rate4,
            $rate5,
            $itype,
            $createdBy
        );
        
        $stmt->execute();
        
        if ($stmt->affected_rows === 0) {
            throw new \Exception('Failed to create service');
        }
        
        // Get the inserted service
        $serviceId = $this->db->insert_id;
        $selectSql = "SELECT s.id, s.uuid, s.ino, s.iname, s.description, s.category_id, 
                         s.rate1, s.rate2, s.rate3, s.rate4, s.rate5, s.itype, s.is_active,
                         s.created_at, c.category as category_name
                      FROM services s 
                      LEFT JOIN categories c ON s.category_id = c.id 
                      WHERE s.id = ?";
        $selectStmt = $this->db->prepare($selectSql);
        $selectStmt->bind_param("i", $serviceId);
        $selectStmt->execute();
        $result = $selectStmt->get_result();
        $service = $result->fetch_assoc();
        
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
            $checkStmt->bind_param("si", $data['ino'], $id);
            $checkStmt->execute();
            $result = $checkStmt->get_result();
            
            if ($result->fetch_assoc()) {
                throw new \Exception('Service number already exists');
            }
        }

        // Verify category exists if provided
        if (!empty($data['category_id'])) {
            $categorySql = "SELECT id FROM categories WHERE id = ? AND is_active = true";
            $categoryStmt = $this->db->prepare($categorySql);
            $categoryStmt->bind_param("i", $data['category_id']);
            $categoryStmt->execute();
            $result = $categoryStmt->get_result();
            
            if (!$result->fetch_assoc()) {
                throw new \Exception('Invalid category');
            }
        }

        $fields = [];
        $values = [];
        $types = "";

        $allowedFields = ['ino', 'iname', 'description', 'category_id', 'rate1', 'rate2', 'rate3', 'rate4', 'rate5', 'itype', 'is_active'];
        
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = ?";
                $values[] = $data[$field];
                // Determine type (s for string, i for integer, d for double, b for boolean)
                if (in_array($field, ['rate1', 'rate2', 'rate3', 'rate4', 'rate5'])) {
                    $types .= "d";
                } elseif (in_array($field, ['category_id'])) {
                    $types .= "i";
                } elseif ($field === 'is_active') {
                    $types .= "i";
                } else {
                    $types .= "s";
                }
            }
        }

        if (empty($fields)) {
            return $existing;
        }

        $values[] = $id;
        $types .= "i";
        $sql = "UPDATE services SET " . implode(", ", $fields) . " WHERE id = ?";

        $stmt = $this->db->prepare($sql);
        $stmt->bind_param($types, ...$values);
        $stmt->execute();
        
        if ($stmt->affected_rows === 0) {
            // No rows were updated, return existing
            return $existing;
        }
        
        // Fetch the updated record
        $selectSql = "SELECT s.id, s.uuid, s.ino, s.iname, s.description, s.category_id, 
                         s.rate1, s.rate2, s.rate3, s.rate4, s.rate5, s.itype, s.is_active,
                         s.created_at, s.updated_at, c.category as category_name
                      FROM services s 
                      LEFT JOIN categories c ON s.category_id = c.id 
                      WHERE s.id = ?";
        $selectStmt = $this->db->prepare($selectSql);
        $selectStmt->bind_param("i", $id);
        $selectStmt->execute();
        $result = $selectStmt->get_result();
        return $result->fetch_assoc() ?: null;
    }

    public function delete(int $id): bool
    {
        // Check if service is used in orders
        $checkSql = "SELECT COUNT(*) as count FROM order_items WHERE service_id = ?";
        $checkStmt = $this->db->prepare($checkSql);
        $checkStmt->bind_param("i", $id);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        $row = $result->fetch_assoc();
        
        if ($row['count'] > 0) {
            throw new \Exception('Cannot delete service that is used in orders');
        }

        $sql = "DELETE FROM services WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        
        return $stmt->affected_rows > 0;
    }
}