<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\ServiceService;
use App\Utils\ResponseHelper;

class ServiceController
{
    private ServiceService $serviceService;

    public function __construct(ServiceService $serviceService)
    {
        $this->serviceService = $serviceService;
    }

    public function index(Request $request, Response $response): Response
    {
        try {
            $params = $request->getQueryParams();
            $services = $this->serviceService->getAll($params);
            
            return ResponseHelper::success($response, $services);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 500);
        }
    }

    public function show(Request $request, Response $response, array $args): Response
    {
        try {
            $id = (int) $args['id'];
            $service = $this->serviceService->getById($id);
            
            if (!$service) {
                return ResponseHelper::error($response, 'Service not found', 404);
            }
            
            return ResponseHelper::success($response, $service);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 500);
        }
    }

    public function byCategory(Request $request, Response $response, array $args): Response
    {
        try {
            $categoryId = (int) $args['categoryId'];
            $services = $this->serviceService->getByCategory($categoryId);
            
            return ResponseHelper::success($response, $services);
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
            if (empty($data['iname'])) {
                return ResponseHelper::error($response, 'Service name is required', 400);
            }

            $data['created_by'] = $user['id'];
            $service = $this->serviceService->create($data);
            
            return ResponseHelper::success($response, $service, 201);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 400);
        }
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        try {
            $id = (int) $args['id'];
            $data = $request->getParsedBody();
            
            $service = $this->serviceService->update($id, $data);
            
            if (!$service) {
                return ResponseHelper::error($response, 'Service not found', 404);
            }
            
            return ResponseHelper::success($response, $service);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 400);
        }
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        try {
            $id = (int) $args['id'];
            $result = $this->serviceService->delete($id);
            
            if (!$result) {
                return ResponseHelper::error($response, 'Service not found', 404);
            }
            
            return ResponseHelper::success($response, ['message' => 'Service deleted successfully']);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 400);
        }
    }
}