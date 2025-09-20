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
        $types = "";

        if (!empty($params['search'])) {
            $conditions[] = "(cname LIKE ? OR mobile LIKE ? OR email LIKE ?)";
            $search = '%' . $params['search'] . '%';
            $values[] = $search;
            $values[] = $search;
            $values[] = $search;
            $types .= "sss";
        }

        if (!empty($params['rtype'])) {
            $conditions[] = "rtype = ?";
            $values[] = $params['rtype'];
            $types .= "s";
        }

        if (isset($params['is_active'])) {
            $conditions[] = "is_active = ?";
            $values[] = $params['is_active'] === 'true';
            $types .= "i";
        }

        if (!empty($params['city'])) {
            $conditions[] = "city LIKE ?";
            $values[] = '%' . $params['city'] . '%';
            $types .= "s";
        }

        if (!empty($params['state'])) {
            $conditions[] = "state LIKE ?";
            $values[] = '%' . $params['state'] . '%';
            $types .= "s";
        }

        if (!empty($conditions)) {
            $sql .= " WHERE " . implode(" AND ", $conditions);
        }

        $sql .= " ORDER BY cname ASC";

        $stmt = $this->db->prepare($sql);
        
        if (!empty($values)) {
            $stmt->bind_param($types, ...$values);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        $customers = [];
        while ($row = $result->fetch_assoc()) {
            $customers[] = $row;
        }
        
        return $customers;
    }

    public function getById(int $id): ?array
    {
        $sql = "SELECT id, uuid, cname, mobile, email, add1, add2, city, state, pincode, 
                       rtype, is_active, total_orders, total_spent, created_at, updated_at 
                FROM customers WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        return $result->fetch_assoc() ?: null;
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
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $stats = $result->fetch_assoc();

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
        $checkStmt->bind_param("s", $data['mobile']);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        
        if ($result->fetch_assoc()) {
            throw new \Exception('Mobile number already exists');
        }

        // Check if email exists (if provided)
        if (!empty($data['email'])) {
            $checkSql = "SELECT id FROM customers WHERE email = ?";
            $checkStmt = $this->db->prepare($checkSql);
            $checkStmt->bind_param("s", $data['email']);
            $checkStmt->execute();
            $result = $checkStmt->get_result();
            
            if ($result->fetch_assoc()) {
                throw new \Exception('Email already exists');
            }
        }

        $sql = "INSERT INTO customers (cname, mobile, email, add1, add2, city, state, pincode, rtype) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $this->db->prepare($sql);
        $rtype = $data['rtype'] ?? 'regular';
        $email = $data['email'] ?? null;
        $add1 = $data['add1'] ?? null;
        $add2 = $data['add2'] ?? null;
        $city = $data['city'] ?? null;
        $state = $data['state'] ?? null;
        $pincode = $data['pincode'] ?? null;
        $cname = $data['cname'];
        $mobile = $data['mobile'];
        $stmt->bind_param("sssssssss", 
            $cname,
            $mobile,
            $email,
            $add1,
            $add2,
            $city,
            $state,
            $pincode,
            $rtype
        );
        
        $stmt->execute();
        
        if ($stmt->affected_rows === 0) {
            throw new \Exception('Failed to create customer');
        }
        
        // Get the inserted customer
        $customerId = $this->db->insert_id;
        $selectSql = "SELECT id, uuid, cname, mobile, email, add1, add2, city, state, pincode, 
                         rtype, is_active, total_orders, total_spent, created_at 
                      FROM customers WHERE id = ?";
        $selectStmt = $this->db->prepare($selectSql);
        $selectStmt->bind_param("i", $customerId);
        $selectStmt->execute();
        $result = $selectStmt->get_result();
        $customer = $result->fetch_assoc();
        
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
            $checkStmt->bind_param("si", $data['mobile'], $id);
            $checkStmt->execute();
            $result = $checkStmt->get_result();
            
            if ($result->fetch_assoc()) {
                throw new \Exception('Mobile number already exists');
            }
        }

        // Check if email already exists (excluding current record)
        if (!empty($data['email']) && $data['email'] !== $existing['email']) {
            $checkSql = "SELECT id FROM customers WHERE email = ? AND id != ?";
            $checkStmt = $this->db->prepare($checkSql);
            $checkStmt->bind_param("si", $data['email'], $id);
            $checkStmt->execute();
            $result = $checkStmt->get_result();
            
            if ($result->fetch_assoc()) {
                throw new \Exception('Email already exists');
            }
        }

        $fields = [];
        $values = [];
        $types = "";

        $updateableFields = ['cname', 'mobile', 'email', 'add1', 'add2', 'city', 'state', 'pincode', 'rtype', 'is_active'];

        foreach ($updateableFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = ?";
                $values[] = $data[$field];
                // Determine type (s for string, i for integer/boolean)
                $types .= (is_bool($data[$field]) || ($field === 'is_active')) ? "i" : "s";
            }
        }

        if (empty($fields)) {
            return $existing;
        }

        $values[] = $id;
        $types .= "i";
        $sql = "UPDATE customers SET " . implode(", ", $fields) . " WHERE id = ?";

        $stmt = $this->db->prepare($sql);
        $stmt->bind_param($types, ...$values);
        $stmt->execute();
        
        if ($stmt->affected_rows === 0) {
            // No rows were updated, return existing
            return $existing;
        }
        
        // Fetch the updated record
        $selectSql = "SELECT id, uuid, cname, mobile, email, add1, add2, city, state, pincode, 
                         rtype, is_active, total_orders, total_spent, created_at, updated_at 
                      FROM customers WHERE id = ?";
        $selectStmt = $this->db->prepare($selectSql);
        $selectStmt->bind_param("i", $id);
        $selectStmt->execute();
        $result = $selectStmt->get_result();
        return $result->fetch_assoc() ?: null;
    }

    public function toggleStatus(int $id): ?array
    {
        $existing = $this->getById($id);
        if (!$existing) {
            return null;
        }

        $newStatus = !$existing['is_active'];
        
        $sql = "UPDATE customers SET is_active = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("ii", $newStatus, $id);
        $stmt->execute();
        
        if ($stmt->affected_rows === 0) {
            return null;
        }
        
        // Fetch the updated record
        $selectSql = "SELECT id, uuid, cname, mobile, email, add1, add2, city, state, pincode, 
                         rtype, is_active, total_orders, total_spent, created_at, updated_at 
                      FROM customers WHERE id = ?";
        $selectStmt = $this->db->prepare($selectSql);
        $selectStmt->bind_param("i", $id);
        $selectStmt->execute();
        $result = $selectStmt->get_result();
        return $result->fetch_assoc() ?: null;
    }

    public function delete(int $id): bool
    {
        // Check if customer has orders
        $checkSql = "SELECT COUNT(*) as count FROM orders WHERE customer_id = ?";
        $checkStmt = $this->db->prepare($checkSql);
        $checkStmt->bind_param("i", $id);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        $row = $result->fetch_assoc();
        
        if ($row['count'] > 0) {
            throw new \Exception('Cannot delete customer that has orders. Deactivate instead.');
        }

        $sql = "DELETE FROM customers WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        
        return $stmt->affected_rows > 0;
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
        $stmt->bind_param("sss", $searchTerm, $searchTerm, $searchTerm);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $customers = [];
        while ($row = $result->fetch_assoc()) {
            $customers[] = $row;
        }
        
        return $customers;
    }

    private function updateCustomerStats(int $customerId, int $totalOrders, float $totalSpent): void
    {
        $sql = "UPDATE customers SET total_orders = ?, total_spent = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("idi", $totalOrders, $totalSpent, $customerId);
        $stmt->execute();
    }
}