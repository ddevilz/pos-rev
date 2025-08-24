<?php

namespace App\Services;

use App\Config\Database;

class CustomerService
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getAll(array $params = []): array
    {
        $sql = "SELECT id, uuid, cname, mobile, email, add1, add2, city, state, pincode, 
                       rtype, is_active, total_orders, total_spent, created_at, updated_at 
                FROM customers";
        $conditions = [];
        $values = [];

        if (!empty($params['search'])) {
            $conditions[] = "(cname LIKE ? OR mobile LIKE ? OR email LIKE ?)";
            $search = '%' . $params['search'] . '%';
            $values[] = $search;
            $values[] = $search;
            $values[] = $search;
        }

        if (!empty($params['rtype'])) {
            $conditions[] = "rtype = ?";
            $values[] = $params['rtype'];
        }

        if (isset($params['is_active'])) {
            $conditions[] = "is_active = ?";
            $values[] = $params['is_active'] === 'true';
        }

        if (!empty($params['city'])) {
            $conditions[] = "city LIKE ?";
            $values[] = '%' . $params['city'] . '%';
        }

        if (!empty($params['state'])) {
            $conditions[] = "state LIKE ?";
            $values[] = '%' . $params['state'] . '%';
        }

        if (!empty($conditions)) {
            $sql .= " WHERE " . implode(" AND ", $conditions);
        }

        $sql .= " ORDER BY cname ASC";

        $stmt = $this->db->prepare($sql);
        foreach ($values as $index => $value) {
            $stmt->bindValue($index + 1, $value);
        }

        $result = $stmt->executeQuery();
        return $result->fetchAllAssociative();
    }

    public function getById(int $id): ?array
    {
        $sql = "SELECT id, uuid, cname, mobile, email, add1, add2, city, state, pincode, 
                       rtype, is_active, total_orders, total_spent, created_at, updated_at 
                FROM customers WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(1, $id);
        $result = $stmt->executeQuery();
        
        return $result->fetchAssociative() ?: null;
    }

    public function getStats(int $id): ?array
    {
        $customer = $this->getById($id);
        if (!$customer) {
            return null;
        }

        // Get detailed statistics from orders
        $sql = "SELECT 
                    COUNT(*) as total_orders,
                    COALESCE(SUM(total_amount), 0) as total_spent,
                    MAX(created_at) as last_order_date,
                    CASE 
                        WHEN COUNT(*) > 0 THEN COALESCE(SUM(total_amount), 0) / COUNT(*)
                        ELSE 0 
                    END as avg_order_value
                FROM orders 
                WHERE customer_id = ? AND status != 'cancelled'";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(1, $id);
        $result = $stmt->executeQuery();
        $stats = $result->fetchAssociative();

        // Update customer table with latest statistics
        $this->updateCustomerStats($id, $stats['total_orders'], $stats['total_spent']);

        return [
            'total_orders' => (int) $stats['total_orders'],
            'total_spent' => (float) $stats['total_spent'],
            'last_order_date' => $stats['last_order_date'],
            'avg_order_value' => (float) $stats['avg_order_value']
        ];
    }

    public function create(array $data): array
    {
        // Check if mobile already exists
        $checkSql = "SELECT id FROM customers WHERE mobile = ?";
        $checkStmt = $this->db->prepare($checkSql);
        $checkStmt->bindValue(1, $data['mobile']);
        $result = $checkStmt->executeQuery();
        
        if ($result->fetchOne()) {
            throw new \Exception('Mobile number already exists');
        }

        // Check if email exists (if provided)
        if (!empty($data['email'])) {
            $checkSql = "SELECT id FROM customers WHERE email = ?";
            $checkStmt = $this->db->prepare($checkSql);
            $checkStmt->bindValue(1, $data['email']);
            $result = $checkStmt->executeQuery();
            
            if ($result->fetchOne()) {
                throw new \Exception('Email already exists');
            }
        }

        $sql = "INSERT INTO customers (cname, mobile, email, add1, add2, city, state, pincode, rtype) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
                RETURNING id, uuid, cname, mobile, email, add1, add2, city, state, pincode, 
                         rtype, is_active, total_orders, total_spent, created_at";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(1, $data['cname']);
        $stmt->bindValue(2, $data['mobile']);
        $stmt->bindValue(3, $data['email'] ?? null);
        $stmt->bindValue(4, $data['add1'] ?? null);
        $stmt->bindValue(5, $data['add2'] ?? null);
        $stmt->bindValue(6, $data['city'] ?? null);
        $stmt->bindValue(7, $data['state'] ?? null);
        $stmt->bindValue(8, $data['pincode'] ?? null);
        $stmt->bindValue(9, $data['rtype'] ?? 'regular');
        
        $result = $stmt->executeQuery();
        $customer = $result->fetchAssociative();
        
        if (!$customer) {
            throw new \Exception('Failed to create customer');
        }
        
        return $customer;
    }

    public function update(int $id, array $data): ?array
    {
        // Check if customer exists
        $existing = $this->getById($id);
        if (!$existing) {
            return null;
        }

        // Check if mobile already exists (excluding current record)
        if (!empty($data['mobile']) && $data['mobile'] !== $existing['mobile']) {
            $checkSql = "SELECT id FROM customers WHERE mobile = ? AND id != ?";
            $checkStmt = $this->db->prepare($checkSql);
            $checkStmt->bindValue(1, $data['mobile']);
            $checkStmt->bindValue(2, $id);
            $result = $checkStmt->executeQuery();
            
            if ($result->fetchOne()) {
                throw new \Exception('Mobile number already exists');
            }
        }

        // Check if email already exists (excluding current record)
        if (!empty($data['email']) && $data['email'] !== $existing['email']) {
            $checkSql = "SELECT id FROM customers WHERE email = ? AND id != ?";
            $checkStmt = $this->db->prepare($checkSql);
            $checkStmt->bindValue(1, $data['email']);
            $checkStmt->bindValue(2, $id);
            $result = $checkStmt->executeQuery();
            
            if ($result->fetchOne()) {
                throw new \Exception('Email already exists');
            }
        }

        $fields = [];
        $values = [];

        $updateableFields = ['cname', 'mobile', 'email', 'add1', 'add2', 'city', 'state', 'pincode', 'rtype', 'is_active'];

        foreach ($updateableFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = ?";
                $values[] = $data[$field];
            }
        }

        if (empty($fields)) {
            return $existing;
        }

        $values[] = $id;
        $sql = "UPDATE customers SET " . implode(", ", $fields) . " WHERE id = ? 
                RETURNING id, uuid, cname, mobile, email, add1, add2, city, state, pincode, 
                         rtype, is_active, total_orders, total_spent, created_at, updated_at";

        $stmt = $this->db->prepare($sql);
        foreach ($values as $index => $value) {
            $stmt->bindValue($index + 1, $value);
        }

        $result = $stmt->executeQuery();
        return $result->fetchAssociative() ?: null;
    }

    public function toggleStatus(int $id): ?array
    {
        $existing = $this->getById($id);
        if (!$existing) {
            return null;
        }

        $newStatus = !$existing['is_active'];
        
        $sql = "UPDATE customers SET is_active = ? WHERE id = ? 
                RETURNING id, uuid, cname, mobile, email, add1, add2, city, state, pincode, 
                         rtype, is_active, total_orders, total_spent, created_at, updated_at";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(1, $newStatus);
        $stmt->bindValue(2, $id);
        
        $result = $stmt->executeQuery();
        return $result->fetchAssociative() ?: null;
    }

    public function delete(int $id): bool
    {
        // Check if customer has orders
        $checkSql = "SELECT COUNT(*) FROM orders WHERE customer_id = ?";
        $checkStmt = $this->db->prepare($checkSql);
        $checkStmt->bindValue(1, $id);
        $result = $checkStmt->executeQuery();
        
        if ($result->fetchOne() > 0) {
            throw new \Exception('Cannot delete customer that has orders. Deactivate instead.');
        }

        $sql = "DELETE FROM customers WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(1, $id);
        
        return $stmt->executeStatement() > 0;
    }

    public function search(string $query): array
    {
        $sql = "SELECT id, uuid, cname, mobile, email, city, state, rtype, is_active 
                FROM customers 
                WHERE (cname LIKE ? OR mobile LIKE ? OR email LIKE ?) 
                AND is_active = true
                ORDER BY cname ASC 
                LIMIT 20";
        
        $searchTerm = '%' . $query . '%';
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(1, $searchTerm);
        $stmt->bindValue(2, $searchTerm);
        $stmt->bindValue(3, $searchTerm);
        
        $result = $stmt->executeQuery();
        return $result->fetchAllAssociative();
    }

    private function updateCustomerStats(int $customerId, int $totalOrders, float $totalSpent): void
    {
        $sql = "UPDATE customers SET total_orders = ?, total_spent = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(1, $totalOrders);
        $stmt->bindValue(2, $totalSpent);
        $stmt->bindValue(3, $customerId);
        $stmt->executeStatement();
    }
}