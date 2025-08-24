<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\CustomerService;
use App\Utils\ResponseHelper;

class CustomerController
{
    private CustomerService $customerService;

    public function __construct(CustomerService $customerService)
    {
        $this->customerService = $customerService;
    }

    public function index(Request $request, Response $response): Response
    {
        try {
            $params = $request->getQueryParams();
            $customers = $this->customerService->getAll($params);
            
            return ResponseHelper::success($response, $customers);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 500);
        }
    }

    public function show(Request $request, Response $response, array $args): Response
    {
        try {
            $id = (int) $args['id'];
            $customer = $this->customerService->getById($id);
            
            if (!$customer) {
                return ResponseHelper::error($response, 'Customer not found', 404);
            }
            
            return ResponseHelper::success($response, $customer);
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
            if (empty($data['cname'])) {
                return ResponseHelper::error($response, 'Customer name is required', 400);
            }

            if (empty($data['mobile'])) {
                return ResponseHelper::error($response, 'Mobile number is required', 400);
            }

            // Validate mobile number format (10 digits starting with 6-9)
            if (!preg_match('/^[6-9]\d{9}$/', $data['mobile'])) {
                return ResponseHelper::error($response, 'Invalid mobile number format', 400);
            }

            // Validate email format if provided
            if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                return ResponseHelper::error($response, 'Invalid email format', 400);
            }

            // Validate customer type
            if (!empty($data['rtype']) && !in_array($data['rtype'], ['regular', 'premium', 'vip'])) {
                return ResponseHelper::error($response, 'Invalid customer type', 400);
            }

            // Validate pincode format if provided
            if (!empty($data['pincode']) && !preg_match('/^\d{6}$/', $data['pincode'])) {
                return ResponseHelper::error($response, 'Invalid pincode format', 400);
            }

            $customer = $this->customerService->create($data);
            
            return ResponseHelper::success($response, $customer, 201);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 400);
        }
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        try {
            $id = (int) $args['id'];
            $data = $request->getParsedBody();
            
            // Validate mobile number format if provided
            if (!empty($data['mobile']) && !preg_match('/^[6-9]\d{9}$/', $data['mobile'])) {
                return ResponseHelper::error($response, 'Invalid mobile number format', 400);
            }

            // Validate email format if provided
            if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                return ResponseHelper::error($response, 'Invalid email format', 400);
            }

            // Validate customer type if provided
            if (!empty($data['rtype']) && !in_array($data['rtype'], ['regular', 'premium', 'vip'])) {
                return ResponseHelper::error($response, 'Invalid customer type', 400);
            }

            // Validate pincode format if provided
            if (!empty($data['pincode']) && !preg_match('/^\d{6}$/', $data['pincode'])) {
                return ResponseHelper::error($response, 'Invalid pincode format', 400);
            }
            
            $customer = $this->customerService->update($id, $data);
            
            if (!$customer) {
                return ResponseHelper::error($response, 'Customer not found', 404);
            }
            
            return ResponseHelper::success($response, $customer);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 400);
        }
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        try {
            $id = (int) $args['id'];
            $result = $this->customerService->delete($id);
            
            if (!$result) {
                return ResponseHelper::error($response, 'Customer not found', 404);
            }
            
            return ResponseHelper::success($response, ['message' => 'Customer deleted successfully']);
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

            $customers = $this->customerService->search($params['q']);
            
            return ResponseHelper::success($response, $customers);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 500);
        }
    }

    public function stats(Request $request, Response $response, array $args): Response
    {
        try {
            $id = (int) $args['id'];
            $stats = $this->customerService->getStats($id);
            
            if (!$stats) {
                return ResponseHelper::error($response, 'Customer not found', 404);
            }
            
            return ResponseHelper::success($response, $stats);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 500);
        }
    }

    public function toggleStatus(Request $request, Response $response, array $args): Response
    {
        try {
            $id = (int) $args['id'];
            $customer = $this->customerService->toggleStatus($id);
            
            if (!$customer) {
                return ResponseHelper::error($response, 'Customer not found', 404);
            }
            
            return ResponseHelper::success($response, $customer);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 400);
        }
    }
}