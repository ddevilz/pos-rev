<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\ServiceName;
use App\Utils\ResponseHelper;

class ControllerName
{
    private ServiceName $service;

    public function __construct(ServiceName $service)
    {
        $this->service = $service;
    }

    /**
     * Get all resources
     */
    public function index(Request $request, Response $response): Response
    {
        try {
            $params = $request->getQueryParams();
            $data = $this->service->getAll($params);
            
            return ResponseHelper::success($response, $data);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 500);
        }
    }

    /**
     * Get single resource
     */
    public function show(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $data = $this->service->getById($id);
            
            if (!$data) {
                return ResponseHelper::error($response, 'Resource not found', 404);
            }
            
            return ResponseHelper::success($response, $data);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 500);
        }
    }

    /**
     * Create new resource
     */
    public function store(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            $result = $this->service->create($data);
            
            return ResponseHelper::success($response, $result, 201);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 400);
        }
    }

    /**
     * Update resource
     */
    public function update(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $data = $request->getParsedBody();
            $result = $this->service->update($id, $data);
            
            if (!$result) {
                return ResponseHelper::error($response, 'Resource not found', 404);
            }
            
            return ResponseHelper::success($response, $result);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 400);
        }
    }

    /**
     * Delete resource
     */
    public function delete(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $result = $this->service->delete($id);
            
            if (!$result) {
                return ResponseHelper::error($response, 'Resource not found', 404);
            }
            
            return ResponseHelper::success($response, ['message' => 'Resource deleted successfully']);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 400);
        }
    }
}