<?php

namespace App\Services;

use App\Config\Database;

class OrderService
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getAll(array $params = []): array
    {
        $sql = "SELECT o.id, o.uuid, o.order_number, o.customer_id, o.due_date, o.due_time, 
                       o.pickup_date, o.delivery_date, o.status, o.priority, o.total_quantity, 
                       o.subtotal, o.discount_amount, o.discount_percentage, o.tax_amount, 
                       o.tax_percentage, o.total_amount, o.advance_paid, o.remaining_amount, 
                       o.payment_status, o.notes, o.created_by, o.created_at, o.updated_at,
                       c.cname as customer_name, c.mobile as customer_mobile, c.rtype as customer_type
                FROM orders o 
                LEFT JOIN customers c ON o.customer_id = c.id";
        
        $conditions = [];
        $values = [];

        if (!empty($params['search'])) {
            $conditions[] = "(o.order_number LIKE ? OR c.cname LIKE ? OR c.mobile LIKE ?)";
            $search = '%' . $params['search'] . '%';
            $values[] = $search;
            $values[] = $search;
            $values[] = $search;
        }

        if (!empty($params['status'])) {
            $conditions[] = "o.status = ?";
            $values[] = $params['status'];
        }

        if (!empty($params['priority'])) {
            $conditions[] = "o.priority = ?";
            $values[] = $params['priority'];
        }

        if (!empty($params['payment_status'])) {
            $conditions[] = "o.payment_status = ?";
            $values[] = $params['payment_status'];
        }

        if (!empty($params['customer_id'])) {
            $conditions[] = "o.customer_id = ?";
            $values[] = $params['customer_id'];
        }

        if (!empty($params['from_date'])) {
            $conditions[] = "o.created_at >= ?";
            $values[] = $params['from_date'] . ' 00:00:00';
        }

        if (!empty($params['to_date'])) {
            $conditions[] = "o.created_at <= ?";
            $values[] = $params['to_date'] . ' 23:59:59';
        }

        if (!empty($params['due_date'])) {
            $conditions[] = "o.due_date = ?";
            $values[] = $params['due_date'];
        }

        if (!empty($conditions)) {
            $sql .= " WHERE " . implode(" AND ", $conditions);
        }

        $sql .= " ORDER BY o.created_at DESC";

        // Add limit for performance
        if (!empty($params['limit'])) {
            $sql .= " LIMIT " . (int)$params['limit'];
        } else {
            $sql .= " LIMIT 100";
        }

        $stmt = $this->db->prepare($sql);
        foreach ($values as $index => $value) {
            $stmt->bindValue($index + 1, $value);
        }

        $result = $stmt->executeQuery();
        return $result->fetchAllAssociative();
    }

    public function getById(int $id): ?array
    {
        $sql = "SELECT o.id, o.uuid, o.order_number, o.customer_id, o.due_date, o.due_time, 
                       o.pickup_date, o.delivery_date, o.status, o.priority, o.total_quantity, 
                       o.subtotal, o.discount_amount, o.discount_percentage, o.tax_amount, 
                       o.tax_percentage, o.total_amount, o.advance_paid, o.remaining_amount, 
                       o.payment_status, o.notes, o.created_by, o.created_at, o.updated_at,
                       c.cname as customer_name, c.mobile as customer_mobile, c.email as customer_email,
                       c.add1 as customer_address1, c.add2 as customer_address2, c.city as customer_city,
                       c.state as customer_state, c.pincode as customer_pincode, c.rtype as customer_type
                FROM orders o 
                LEFT JOIN customers c ON o.customer_id = c.id 
                WHERE o.id = ?";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(1, $id);
        $result = $stmt->executeQuery();
        
        $order = $result->fetchAssociative();
        if (!$order) {
            return null;
        }

        // Get order items
        $itemsSql = "SELECT oi.id, oi.service_id, oi.service_name, oi.quantity, oi.rate, 
                            oi.amount, oi.notes, oi.created_at,
                            s.iname as service_iname, s.category_id, s.itype
                     FROM order_items oi
                     LEFT JOIN services s ON oi.service_id = s.id
                     WHERE oi.order_id = ?
                     ORDER BY oi.id";
        
        $itemsStmt = $this->db->prepare($itemsSql);
        $itemsStmt->bindValue(1, $id);
        $itemsResult = $itemsStmt->executeQuery();
        
        $order['items'] = $itemsResult->fetchAllAssociative();
        
        return $order;
    }

    public function create(array $data): array
    {
        $this->db->beginTransaction();
        
        try {
            // Generate order number
            $orderNumber = $this->generateOrderNumber();
            
            // Calculate totals
            $calculations = $this->calculateOrderTotals($data['items'], $data);
            
            // Insert order
            $orderSql = "INSERT INTO orders (
                            order_number, customer_id, due_date, due_time, pickup_date, 
                            delivery_date, priority, total_quantity, subtotal, discount_amount, 
                            discount_percentage, tax_amount, tax_percentage, total_amount, 
                            advance_paid, remaining_amount, payment_status, notes, created_by
                         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
                         RETURNING id, uuid, order_number, customer_id, due_date, due_time, 
                                  pickup_date, delivery_date, status, priority, total_quantity, 
                                  subtotal, discount_amount, discount_percentage, tax_amount, 
                                  tax_percentage, total_amount, advance_paid, remaining_amount, 
                                  payment_status, notes, created_by, created_at, updated_at";
            
            $orderStmt = $this->db->prepare($orderSql);
            $orderStmt->bindValue(1, $orderNumber);
            $orderStmt->bindValue(2, $data['customer_id']);
            $orderStmt->bindValue(3, $data['due_date'] ?? null);
            $orderStmt->bindValue(4, $data['due_time'] ?? null);
            $orderStmt->bindValue(5, $data['pickup_date'] ?? null);
            $orderStmt->bindValue(6, $data['delivery_date'] ?? null);
            $orderStmt->bindValue(7, $data['priority'] ?? 'normal');
            $orderStmt->bindValue(8, $calculations['total_quantity']);
            $orderStmt->bindValue(9, $calculations['subtotal']);
            $orderStmt->bindValue(10, $calculations['discount_amount']);
            $orderStmt->bindValue(11, $data['discount_percentage'] ?? 0);
            $orderStmt->bindValue(12, $calculations['tax_amount']);
            $orderStmt->bindValue(13, $data['tax_percentage'] ?? 0);
            $orderStmt->bindValue(14, $calculations['total_amount']);
            $orderStmt->bindValue(15, $data['advance_paid'] ?? 0);
            $orderStmt->bindValue(16, $calculations['remaining_amount']);
            $orderStmt->bindValue(17, $this->determinePaymentStatus($calculations['total_amount'], $data['advance_paid'] ?? 0));
            $orderStmt->bindValue(18, $data['notes'] ?? null);
            $orderStmt->bindValue(19, $data['created_by']);
            
            $result = $orderStmt->executeQuery();
            $order = $result->fetchAssociative();
            
            if (!$order) {
                throw new \Exception('Failed to create order');
            }
            
            // Insert order items
            $this->insertOrderItems($order['id'], $data['items']);
            
            // Update customer statistics
            $this->updateCustomerStats($data['customer_id']);
            
            $this->db->commit();
            
            // Return full order with items
            return $this->getById($order['id']);
            
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function update(int $id, array $data): ?array
    {
        $existing = $this->getById($id);
        if (!$existing) {
            return null;
        }

        $this->db->beginTransaction();
        
        try {
            $fields = [];
            $values = [];

            $updateableFields = [
                'due_date', 'due_time', 'pickup_date', 'delivery_date', 
                'status', 'priority', 'discount_percentage', 'tax_percentage', 
                'advance_paid', 'notes'
            ];

            foreach ($updateableFields as $field) {
                if (array_key_exists($field, $data)) {
                    $fields[] = "$field = ?";
                    $values[] = $data[$field];
                }
            }

            // If items are being updated, recalculate everything
            if (!empty($data['items'])) {
                // Delete existing items
                $deleteItemsSql = "DELETE FROM order_items WHERE order_id = ?";
                $deleteStmt = $this->db->prepare($deleteItemsSql);
                $deleteStmt->bindValue(1, $id);
                $deleteStmt->executeStatement();
                
                // Calculate new totals
                $calculations = $this->calculateOrderTotals($data['items'], $data);
                
                // Add calculated fields to update
                $fields[] = "total_quantity = ?";
                $values[] = $calculations['total_quantity'];
                $fields[] = "subtotal = ?";
                $values[] = $calculations['subtotal'];
                $fields[] = "discount_amount = ?";
                $values[] = $calculations['discount_amount'];
                $fields[] = "tax_amount = ?";
                $values[] = $calculations['tax_amount'];
                $fields[] = "total_amount = ?";
                $values[] = $calculations['total_amount'];
                $fields[] = "remaining_amount = ?";
                $values[] = $calculations['remaining_amount'];
                $fields[] = "payment_status = ?";
                $values[] = $this->determinePaymentStatus($calculations['total_amount'], $data['advance_paid'] ?? $existing['advance_paid']);
                
                // Insert new items
                $this->insertOrderItems($id, $data['items']);
            } else {
                // If only advance_paid is updated, recalculate payment status and remaining amount
                if (array_key_exists('advance_paid', $data)) {
                    $totalAmount = $existing['total_amount'];
                    $advancePaid = $data['advance_paid'];
                    $remainingAmount = $totalAmount - $advancePaid;
                    
                    $fields[] = "remaining_amount = ?";
                    $values[] = $remainingAmount;
                    $fields[] = "payment_status = ?";
                    $values[] = $this->determinePaymentStatus($totalAmount, $advancePaid);
                }
            }

            if (empty($fields)) {
                $this->db->rollBack();
                return $existing;
            }

            $values[] = $id;
            $sql = "UPDATE orders SET " . implode(", ", $fields) . " WHERE id = ?";

            $stmt = $this->db->prepare($sql);
            foreach ($values as $index => $value) {
                $stmt->bindValue($index + 1, $value);
            }

            $stmt->executeStatement();
            
            // Update customer statistics
            $this->updateCustomerStats($existing['customer_id']);
            
            $this->db->commit();
            
            return $this->getById($id);
            
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function updateStatus(int $id, string $status): ?array
    {
        $existing = $this->getById($id);
        if (!$existing) {
            return null;
        }

        $sql = "UPDATE orders SET status = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(1, $status);
        $stmt->bindValue(2, $id);
        
        $stmt->executeStatement();
        
        return $this->getById($id);
    }

    public function delete(int $id): bool
    {
        $existing = $this->getById($id);
        if (!$existing) {
            return false;
        }

        // Check if order has invoices
        $checkSql = "SELECT COUNT(*) FROM invoices WHERE order_id = ?";
        $checkStmt = $this->db->prepare($checkSql);
        $checkStmt->bindValue(1, $id);
        $result = $checkStmt->executeQuery();
        
        if ($result->fetchOne() > 0) {
            throw new \Exception('Cannot delete order that has invoices. Cancel the order instead.');
        }

        $this->db->beginTransaction();
        
        try {
            // Delete order items first (cascade should handle this, but being explicit)
            $deleteItemsSql = "DELETE FROM order_items WHERE order_id = ?";
            $deleteItemsStmt = $this->db->prepare($deleteItemsSql);
            $deleteItemsStmt->bindValue(1, $id);
            $deleteItemsStmt->executeStatement();
            
            // Delete order
            $sql = "DELETE FROM orders WHERE id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(1, $id);
            
            $result = $stmt->executeStatement() > 0;
            
            if ($result) {
                // Update customer statistics
                $this->updateCustomerStats($existing['customer_id']);
            }
            
            $this->db->commit();
            
            return $result;
            
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function search(string $query): array
    {
        $sql = "SELECT o.id, o.uuid, o.order_number, o.customer_id, o.status, o.priority, 
                       o.total_amount, o.created_at,
                       c.cname as customer_name, c.mobile as customer_mobile
                FROM orders o 
                LEFT JOIN customers c ON o.customer_id = c.id
                WHERE (o.order_number LIKE ? OR c.cname LIKE ? OR c.mobile LIKE ?)
                ORDER BY o.created_at DESC 
                LIMIT 20";
        
        $searchTerm = '%' . $query . '%';
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(1, $searchTerm);
        $stmt->bindValue(2, $searchTerm);
        $stmt->bindValue(3, $searchTerm);
        
        $result = $stmt->executeQuery();
        return $result->fetchAllAssociative();
    }

    private function generateOrderNumber(): string
    {
        $prefix = 'ORD';
        $year = date('Y');
        $month = date('m');
        
        // Get next sequence number for this month
        $sql = "SELECT COUNT(*) + 1 as next_seq FROM orders 
                WHERE order_number LIKE ? AND EXTRACT(YEAR FROM created_at) = ? AND EXTRACT(MONTH FROM created_at) = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(1, $prefix . $year . $month . '%');
        $stmt->bindValue(2, $year);
        $stmt->bindValue(3, $month);
        $result = $stmt->executeQuery();
        
        $nextSeq = $result->fetchOne();
        
        return $prefix . $year . $month . str_pad($nextSeq, 4, '0', STR_PAD_LEFT);
    }

    private function calculateOrderTotals(array $items, array $orderData): array
    {
        $totalQuantity = 0;
        $subtotal = 0;
        
        foreach ($items as $item) {
            $totalQuantity += $item['quantity'];
            $subtotal += $item['quantity'] * $item['rate'];
        }
        
        $discountPercentage = $orderData['discount_percentage'] ?? 0;
        $taxPercentage = $orderData['tax_percentage'] ?? 0;
        $advancePaid = $orderData['advance_paid'] ?? 0;
        
        $discountAmount = ($subtotal * $discountPercentage) / 100;
        $afterDiscount = $subtotal - $discountAmount;
        $taxAmount = ($afterDiscount * $taxPercentage) / 100;
        $totalAmount = $afterDiscount + $taxAmount;
        $remainingAmount = $totalAmount - $advancePaid;
        
        return [
            'total_quantity' => $totalQuantity,
            'subtotal' => $subtotal,
            'discount_amount' => $discountAmount,
            'tax_amount' => $taxAmount,
            'total_amount' => $totalAmount,
            'remaining_amount' => $remainingAmount
        ];
    }

    private function insertOrderItems(int $orderId, array $items): void
    {
        $sql = "INSERT INTO order_items (order_id, service_id, service_name, quantity, rate, amount, notes) 
                VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        
        foreach ($items as $item) {
            // Get service name
            $serviceSql = "SELECT iname FROM services WHERE id = ?";
            $serviceStmt = $this->db->prepare($serviceSql);
            $serviceStmt->bindValue(1, $item['service_id']);
            $serviceResult = $serviceStmt->executeQuery();
            $serviceName = $serviceResult->fetchOne() ?: 'Unknown Service';
            
            $amount = $item['quantity'] * $item['rate'];
            
            $stmt->bindValue(1, $orderId);
            $stmt->bindValue(2, $item['service_id']);
            $stmt->bindValue(3, $serviceName);
            $stmt->bindValue(4, $item['quantity']);
            $stmt->bindValue(5, $item['rate']);
            $stmt->bindValue(6, $amount);
            $stmt->bindValue(7, $item['notes'] ?? null);
            
            $stmt->executeStatement();
        }
    }

    private function determinePaymentStatus(float $totalAmount, float $advancePaid): string
    {
        if ($advancePaid <= 0) {
            return 'pending';
        } elseif ($advancePaid >= $totalAmount) {
            return 'paid';
        } else {
            return 'partial';
        }
    }

    private function updateCustomerStats(int $customerId): void
    {
        $sql = "UPDATE customers SET 
                    total_orders = (
                        SELECT COUNT(*) FROM orders 
                        WHERE customer_id = ? AND status != 'cancelled'
                    ),
                    total_spent = (
                        SELECT COALESCE(SUM(total_amount), 0) FROM orders 
                        WHERE customer_id = ? AND status != 'cancelled'
                    )
                WHERE id = ?";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(1, $customerId);
        $stmt->bindValue(2, $customerId);
        $stmt->bindValue(3, $customerId);
        $stmt->executeStatement();
    }
}