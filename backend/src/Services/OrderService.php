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
        $types = "";

        if (!empty($params['search'])) {
            $conditions[] = "(o.order_number LIKE ? OR c.cname LIKE ? OR c.mobile LIKE ?)";
            $search = '%' . $params['search'] . '%';
            $values[] = $search;
            $values[] = $search;
            $values[] = $search;
            $types .= "sss";
        }

        if (!empty($params['status'])) {
            $conditions[] = "o.status = ?";
            $values[] = $params['status'];
            $types .= "s";
        }

        if (!empty($params['priority'])) {
            $conditions[] = "o.priority = ?";
            $values[] = $params['priority'];
            $types .= "s";
        }

        if (!empty($params['payment_status'])) {
            $conditions[] = "o.payment_status = ?";
            $values[] = $params['payment_status'];
            $types .= "s";
        }

        if (!empty($params['customer_id'])) {
            $conditions[] = "o.customer_id = ?";
            $values[] = $params['customer_id'];
            $types .= "i";
        }

        if (!empty($params['from_date'])) {
            $conditions[] = "o.created_at >= ?";
            $values[] = $params['from_date'] . ' 00:00:00';
            $types .= "s";
        }

        if (!empty($params['to_date'])) {
            $conditions[] = "o.created_at <= ?";
            $values[] = $params['to_date'] . ' 23:59:59';
            $types .= "s";
        }

        if (!empty($params['due_date'])) {
            $conditions[] = "o.due_date = ?";
            $values[] = $params['due_date'];
            $types .= "s";
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
        if (!empty($values)) {
            $stmt->bind_param($types, ...$values);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        
        $orders = [];
        while ($row = $result->fetch_assoc()) {
            $orders[] = $row;
        }
        
        return $orders;
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
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $order = $result->fetch_assoc();
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
        $itemsStmt->bind_param("i", $id);
        $itemsStmt->execute();
        $itemsResult = $itemsStmt->get_result();
        
        $order['items'] = [];
        while ($item = $itemsResult->fetch_assoc()) {
            $order['items'][] = $item;
        }
        
        return $order;
    }

    public function create(array $data): array
    {
        $this->db->begin_transaction();
        
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
                         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $orderStmt = $this->db->prepare($orderSql);
            $priority = $data['priority'] ?? 'normal';
            $dueDate = $data['due_date'] ?? null;
            $dueTime = $data['due_time'] ?? null;
            $pickupDate = $data['pickup_date'] ?? null;
            $deliveryDate = $data['delivery_date'] ?? null;
            $discountPercentage = $data['discount_percentage'] ?? 0;
            $taxPercentage = $data['tax_percentage'] ?? 0;
            $advancePaid = $data['advance_paid'] ?? 0;
            $paymentStatus = $this->determinePaymentStatus($calculations['total_amount'], $advancePaid);
            $notes = $data['notes'] ?? null;
            $createdBy = $data['created_by'];
            
            // Types mapping:
            // 1:s order_number, 2:i customer_id, 3:s due_date, 4:s due_time, 5:s pickup_date, 6:s delivery_date,
            // 7:s priority, 8:i total_quantity, 9:d subtotal, 10:d discount_amount, 11:d discount_percentage,
            // 12:d tax_amount, 13:d tax_percentage, 14:d total_amount, 15:d advance_paid, 16:d remaining_amount,
            // 17:s payment_status, 18:s notes, 19:i created_by
            $orderStmt->bind_param("sisssssiddddddddssi", 
                $orderNumber,
                $data['customer_id'],
                $dueDate,
                $dueTime,
                $pickupDate,
                $deliveryDate,
                $priority,
                $calculations['total_quantity'],
                $calculations['subtotal'],
                $calculations['discount_amount'],
                $discountPercentage,
                $calculations['tax_amount'],
                $taxPercentage,
                $calculations['total_amount'],
                $advancePaid,
                $calculations['remaining_amount'],
                $paymentStatus,
                $notes,
                $createdBy
            );
            
            $orderStmt->execute();
            
            if ($orderStmt->affected_rows === 0) {
                throw new \Exception('Failed to create order');
            }
            
            $orderId = $this->db->insert_id;
            
            // Insert order items
            $this->insertOrderItems($orderId, $data['items']);
            
            // Update customer statistics
            $this->updateCustomerStats($data['customer_id']);
            
            $this->db->commit();
            
            // Return full order with items
            return $this->getById($orderId);
            
        } catch (\Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    public function update(int $id, array $data): ?array
    {
        $existing = $this->getById($id);
        if (!$existing) {
            return null;
        }

        $this->db->begin_transaction();
        
        try {
            $fields = [];
            $values = [];
            $types = "";

            $updateableFields = [
                'due_date', 'due_time', 'pickup_date', 'delivery_date', 
                'status', 'priority', 'discount_percentage', 'tax_percentage', 
                'advance_paid', 'notes'
            ];

            foreach ($updateableFields as $field) {
                if (array_key_exists($field, $data)) {
                    $fields[] = "$field = ?";
                    $values[] = $data[$field];
                    // Determine type (s for string, i for integer, d for double)
                    if (in_array($field, ['discount_percentage', 'tax_percentage', 'advance_paid'])) {
                        $types .= "d";
                    } else {
                        $types .= "s";
                    }
                }
            }

            // If items are being updated, recalculate everything
            if (!empty($data['items'])) {
                // Delete existing items
                $deleteItemsSql = "DELETE FROM order_items WHERE order_id = ?";
                $deleteStmt = $this->db->prepare($deleteItemsSql);
                $deleteStmt->bind_param("i", $id);
                $deleteStmt->execute();
                
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
                
                // Added fields types: total_quantity (i), subtotal (d), discount_amount (d), tax_amount (d),
                // total_amount (d), remaining_amount (d), payment_status (s)
                $types .= "iddddds";
                
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
                    
                    $types .= "ds";
                }
            }

            if (empty($fields)) {
                $this->db->rollback();
                return $existing;
            }

            $values[] = $id;
            $types .= "i";
            $sql = "UPDATE orders SET " . implode(", ", $fields) . " WHERE id = ?";

            $stmt = $this->db->prepare($sql);
            $stmt->bind_param($types, ...$values);
            $stmt->execute();
            
            if ($stmt->affected_rows === 0) {
                $this->db->rollback();
                return $existing;
            }
            
            // Update customer statistics
            $this->updateCustomerStats($existing['customer_id']);
            
            $this->db->commit();
            
            return $this->getById($id);
            
        } catch (\Exception $e) {
            $this->db->rollback();
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
        $stmt->bind_param("si", $status, $id);
        $stmt->execute();
        
        if ($stmt->affected_rows === 0) {
            return null;
        }
        
        return $this->getById($id);
    }

    public function delete(int $id): bool
    {
        $existing = $this->getById($id);
        if (!$existing) {
            return false;
        }

        // Check if order has invoices
        $checkSql = "SELECT COUNT(*) as count FROM invoices WHERE order_id = ?";
        $checkStmt = $this->db->prepare($checkSql);
        $checkStmt->bind_param("i", $id);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        $row = $result->fetch_assoc();
        
        if ($row['count'] > 0) {
            throw new \Exception('Cannot delete order that has invoices. Cancel the order instead.');
        }

        $this->db->begin_transaction();
        
        try {
            // Delete order items first (cascade should handle this, but being explicit)
            $deleteItemsSql = "DELETE FROM order_items WHERE order_id = ?";
            $deleteItemsStmt = $this->db->prepare($deleteItemsSql);
            $deleteItemsStmt->bind_param("i", $id);
            $deleteItemsStmt->execute();
            
            // Delete order
            $sql = "DELETE FROM orders WHERE id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            
            $result = $stmt->affected_rows > 0;
            
            if ($result) {
                // Update customer statistics
                $this->updateCustomerStats($existing['customer_id']);
            }
            
            $this->db->commit();
            
            return $result;
            
        } catch (\Exception $e) {
            $this->db->rollback();
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
        $stmt->bind_param("sss", $searchTerm, $searchTerm, $searchTerm);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $orders = [];
        while ($row = $result->fetch_assoc()) {
            $orders[] = $row;
        }
        
        return $orders;
    }

    private function generateOrderNumber(): string
    {
        $prefix = 'ORD';
        $year = date('Y');
        $month = date('m');
        
        // Get next sequence number for this month
        $sql = "SELECT COUNT(*) + 1 as next_seq FROM orders 
                WHERE order_number LIKE ? AND YEAR(created_at) = ? AND MONTH(created_at) = ?";
        $stmt = $this->db->prepare($sql);
        $pattern = $prefix . $year . $month . '%';
        $stmt->bind_param("sii", $pattern, $year, $month);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $row = $result->fetch_assoc();
        $nextSeq = $row['next_seq'];
        
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
            $serviceId = $item['service_id'];
            $serviceStmt->bind_param("i", $serviceId);
            $serviceStmt->execute();
            $serviceResult = $serviceStmt->get_result();
            $serviceRow = $serviceResult->fetch_assoc();
            $serviceName = $serviceRow ? $serviceRow['iname'] : 'Unknown Service';
            
            $quantity = $item['quantity'];
            $rate = $item['rate'];
            $amount = $quantity * $rate;
            $notes = $item['notes'] ?? null;
            
            $stmt->bind_param("iisidds", 
                $orderId,
                $serviceId,
                $serviceName,
                $quantity,
                $rate,
                $amount,
                $notes
            );
            
            $stmt->execute();
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
        $stmt->bind_param("iii", $customerId, $customerId, $customerId);
        $stmt->execute();
    }
}