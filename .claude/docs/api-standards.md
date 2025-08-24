# API Standards & Guidelines

## Overview
This document defines the API standards for the Laundry Management System backend.

## RESTful Conventions

### HTTP Methods
- `GET` - Retrieve resources
- `POST` - Create new resources
- `PUT` - Update entire resource
- `PATCH` - Partial resource update
- `DELETE` - Remove resource

### URL Structure
```
/api/{version}/{resource}
/api/{version}/{resource}/{id}
/api/{version}/{resource}/{id}/{sub-resource}
```

### Examples
```
GET    /api/v1/categories          # List all categories
GET    /api/v1/categories/1        # Get category by ID
POST   /api/v1/categories          # Create new category
PUT    /api/v1/categories/1        # Update category
DELETE /api/v1/categories/1        # Delete category

GET    /api/v1/services/category/1 # Get services by category
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Success message",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      // Additional error details
    }
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

## HTTP Status Codes

### Success Codes
- `200 OK` - Successful GET, PUT, PATCH requests
- `201 Created` - Successful POST request
- `204 No Content` - Successful DELETE request

### Client Error Codes
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `422 Unprocessable Entity` - Validation errors

### Server Error Codes
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

## Authentication

### JWT Token Format
```
Authorization: Bearer <token>
```

### Token Response
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin"
    }
  }
}
```

## Validation

### Validation Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "name": ["The name field is required"],
      "email": ["The email format is invalid"]
    }
  }
}
```

### Common Validation Rules
- **Required fields**: Must be present and not empty
- **Email format**: Must be valid email address
- **Phone format**: Must match phone number pattern
- **Date format**: Must be valid ISO 8601 date
- **Numeric values**: Must be valid numbers within range

## Filtering & Searching

### Query Parameters
```
GET /api/v1/orders?status=pending&customer_id=123&created_after=2024-01-01
```

### Common Filters
- `search` - Text search across multiple fields
- `status` - Filter by status
- `created_after` - Filter by creation date
- `created_before` - Filter by creation date
- `sort` - Sort field (prefix with `-` for descending)
- `limit` - Limit number of results
- `offset` - Offset for pagination

## Rate Limiting

### Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

### Rate Limit Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retry_after": 60
    }
  }
}
```

## Error Codes

### Authentication Errors
- `AUTH_REQUIRED` - Authentication required
- `INVALID_TOKEN` - Invalid or expired token
- `TOKEN_EXPIRED` - Token has expired
- `INVALID_CREDENTIALS` - Invalid login credentials

### Authorization Errors
- `ACCESS_DENIED` - Insufficient permissions
- `ROLE_REQUIRED` - Specific role required

### Validation Errors
- `VALIDATION_ERROR` - Request validation failed
- `REQUIRED_FIELD` - Required field missing
- `INVALID_FORMAT` - Invalid field format
- `DUPLICATE_ENTRY` - Duplicate resource

### Resource Errors
- `NOT_FOUND` - Resource not found
- `ALREADY_EXISTS` - Resource already exists
- `CANNOT_DELETE` - Resource cannot be deleted

## Security Headers

### Required Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### CORS Headers
```
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
```

## Documentation

### OpenAPI/Swagger
- Document all endpoints
- Include request/response examples
- Specify authentication requirements
- Define data models

### Example Endpoint Documentation
```yaml
/api/v1/categories:
  get:
    summary: List all categories
    parameters:
      - name: search
        in: query
        description: Search term
        schema:
          type: string
    responses:
      200:
        description: Success
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CategoryList'
```

## Testing

### Test Coverage
- Unit tests for all endpoints
- Integration tests for complete workflows
- Performance tests for high-load scenarios
- Security tests for authentication/authorization

### Test Data
- Use factories for consistent test data
- Mock external dependencies
- Clean up test data after tests
- Use separate test database

This API standard ensures consistency, reliability, and maintainability across the entire backend system.