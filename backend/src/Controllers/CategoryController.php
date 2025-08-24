<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\CategoryService;
use App\Utils\ResponseHelper;

class CategoryController
{
    private CategoryService $categoryService;

    public function __construct(CategoryService $categoryService)
    {
        $this->categoryService = $categoryService;
    }

    public function index(Request $request, Response $response): Response
    {
        try {
            $params = $request->getQueryParams();
            $categories = $this->categoryService->getAll($params);
            
            return ResponseHelper::success($response, $categories);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 500);
        }
    }

    public function show(Request $request, Response $response, array $args): Response
    {
        try {
            $id = (int) $args['id'];
            $category = $this->categoryService->getById($id);
            
            if (!$category) {
                return ResponseHelper::error($response, 'Category not found', 404);
            }
            
            return ResponseHelper::success($response, $category);
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
            if (empty($data['catid']) || empty($data['category'])) {
                return ResponseHelper::error($response, 'Category ID and name are required', 400);
            }

            $data['created_by'] = $user['id'];
            $category = $this->categoryService->create($data);
            
            return ResponseHelper::success($response, $category, 201);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 400);
        }
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        try {
            $id = (int) $args['id'];
            $data = $request->getParsedBody();
            
            $category = $this->categoryService->update($id, $data);
            
            if (!$category) {
                return ResponseHelper::error($response, 'Category not found', 404);
            }
            
            return ResponseHelper::success($response, $category);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 400);
        }
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        try {
            $id = (int) $args['id'];
            $result = $this->categoryService->delete($id);
            
            if (!$result) {
                return ResponseHelper::error($response, 'Category not found', 404);
            }
            
            return ResponseHelper::success($response, ['message' => 'Category deleted successfully']);
        } catch (\Exception $e) {
            return ResponseHelper::error($response, $e->getMessage(), 400);
        }
    }
}