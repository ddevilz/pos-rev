<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\OrderService;
use App\Utils\ResponseHelper;

class OrderController
{
    private OrderService $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    public function index(Request $request, Response $response): Response
    {
        try {
            $params = $request->getQueryParams();
            $orders = $this->orderService->getAll($params);
            
            return ResponseHelper::success($response, $orders);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 500);
        }
    }

    public function show(Request $request, Response $response, array $args): Response
    {
        try {
            $id = (int) $args['id'];
            $order = $this->orderService->getById($id);
            
            if (!$order) {
                return ResponseHelper::error($response, 'Order not found', 404);
            }
            
            return ResponseHelper::success($response, $order);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 500);
        }
    }

    public function store(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            $user = $request->getAttribute('user');
            
            // Validation
            if (empty($data['customer_id'])) {
                return ResponseHelper::error($response, 'Customer ID is required', 400);
            }

            if (empty($data['items']) || !is_array($data['items'])) {
                return ResponseHelper::error($response, 'Order items are required', 400);
            }

            // Validate each order item
            foreach ($data['items'] as $item) {
                if (empty($item['service_id'])) {
                    return ResponseHelper::error($response, 'Service ID is required for all items', 400);
                }
                if (empty($item['quantity']) || $item['quantity'] <= 0) {
                    return ResponseHelper::error($response, 'Valid quantity is required for all items', 400);
                }
                if (empty($item['rate']) || $item['rate'] <= 0) {
                    return ResponseHelper::error($response, 'Valid rate is required for all items', 400);
                }
            }

            // Validate priority
            if (!empty($data['priority']) && !in_array($data['priority'], ['low', 'normal', 'high', 'urgent'])) {
                return ResponseHelper::error($response, 'Invalid priority value', 400);
            }

            // Validate date formats
            if (!empty($data['due_date']) && !$this->isValidDate($data['due_date'])) {
                return ResponseHelper::error($response, 'Invalid due date format', 400);
            }

            if (!empty($data['pickup_date']) && !$this->isValidDate($data['pickup_date'])) {
                return ResponseHelper::error($response, 'Invalid pickup date format', 400);
            }

            if (!empty($data['delivery_date']) && !$this->isValidDate($data['delivery_date'])) {
                return ResponseHelper::error($response, 'Invalid delivery date format', 400);
            }

            // Validate percentages
            if (!empty($data['discount_percentage']) && ($data['discount_percentage'] < 0 || $data['discount_percentage'] > 100)) {
                return ResponseHelper::error($response, 'Discount percentage must be between 0 and 100', 400);
            }

            if (!empty($data['tax_percentage']) && ($data['tax_percentage'] < 0 || $data['tax_percentage'] > 100)) {
                return ResponseHelper::error($response, 'Tax percentage must be between 0 and 100', 400);
            }

            $data['created_by'] = $user['id'];
            $order = $this->orderService->create($data);
            
            return ResponseHelper::success($response, $order, 201);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 400);
        }
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        try {
            $id = (int) $args['id'];
            $data = $request->getParsedBody();
            
            // Validate priority if provided
            if (!empty($data['priority']) && !in_array($data['priority'], ['low', 'normal', 'high', 'urgent'])) {
                return ResponseHelper::error($response, 'Invalid priority value', 400);
            }

            // Validate status if provided
            if (!empty($data['status']) && !in_array($data['status'], ['pending', 'in_progress', 'completed', 'delivered', 'cancelled'])) {
                return ResponseHelper::error($response, 'Invalid status value', 400);
            }

            // Validate date formats if provided
            if (!empty($data['due_date']) && !$this->isValidDate($data['due_date'])) {
                return ResponseHelper::error($response, 'Invalid due date format', 400);
            }

            if (!empty($data['pickup_date']) && !$this->isValidDate($data['pickup_date'])) {
                return ResponseHelper::error($response, 'Invalid pickup date format', 400);
            }

            if (!empty($data['delivery_date']) && !$this->isValidDate($data['delivery_date'])) {
                return ResponseHelper::error($response, 'Invalid delivery date format', 400);
            }

            // Validate percentages if provided
            if (isset($data['discount_percentage']) && ($data['discount_percentage'] < 0 || $data['discount_percentage'] > 100)) {
                return ResponseHelper::error($response, 'Discount percentage must be between 0 and 100', 400);
            }

            if (isset($data['tax_percentage']) && ($data['tax_percentage'] < 0 || $data['tax_percentage'] > 100)) {
                return ResponseHelper::error($response, 'Tax percentage must be between 0 and 100', 400);
            }

            // Validate items if provided
            if (!empty($data['items'])) {
                if (!is_array($data['items'])) {
                    return ResponseHelper::error($response, 'Items must be an array', 400);
                }
                
                foreach ($data['items'] as $item) {
                    if (empty($item['service_id'])) {
                        return ResponseHelper::error($response, 'Service ID is required for all items', 400);
                    }
                    if (empty($item['quantity']) || $item['quantity'] <= 0) {
                        return ResponseHelper::error($response, 'Valid quantity is required for all items', 400);
                    }
                    if (empty($item['rate']) || $item['rate'] <= 0) {
                        return ResponseHelper::error($response, 'Valid rate is required for all items', 400);
                    }
                }
            }
            
            $order = $this->orderService->update($id, $data);
            
            if (!$order) {
                return ResponseHelper::error($response, 'Order not found', 404);
            }
            
            return ResponseHelper::success($response, $order);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 400);
        }
    }

    public function updateStatus(Request $request, Response $response, array $args): Response
    {
        try {
            $id = (int) $args['id'];
            $data = $request->getParsedBody();
            
            if (empty($data['status'])) {
                return ResponseHelper::error($response, 'Status is required', 400);
            }

            if (!in_array($data['status'], ['pending', 'in_progress', 'completed', 'delivered', 'cancelled'])) {
                return ResponseHelper::error($response, 'Invalid status value', 400);
            }
            
            $order = $this->orderService->updateStatus($id, $data['status']);
            
            if (!$order) {
                return ResponseHelper::error($response, 'Order not found', 404);
            }
            
            return ResponseHelper::success($response, $order);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 400);
        }
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        try {
            $id = (int) $args['id'];
            $result = $this->orderService->delete($id);
            
            if (!$result) {
                return ResponseHelper::error($response, 'Order not found', 404);
            }
            
            return ResponseHelper::success($response, ['message' => 'Order deleted successfully']);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 400);
        }
    }

    public function search(Request $request, Response $response): Response
    {
        try {
            $params = $request->getQueryParams();
            
            if (empty($params['q'])) {
                return ResponseHelper::error($response, 'Search query is required', 400);
            }

            $orders = $this->orderService->search($params['q']);
            
            return ResponseHelper::success($response, $orders);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 500);
        }
    }

    private function isValidDate(string $date): bool
    {
        $d = \DateTime::createFromFormat('Y-m-d', $date);
        return $d && $d->format('Y-m-d') === $date;
    }
}