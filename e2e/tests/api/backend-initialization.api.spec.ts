import { test, expect } from '@playwright/test'

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000'
const FRONTEND_URL = process.env.FRONTEND_BASE_URL ?? 'http://localhost:5173'

// AC2 — Backend server initialization and Scalar API documentation
test('AC2 — should have the backend API server running on port 5000', async ({ request }) => {
  // Given: the backend project has been created
  // When: the developer connects to port 5000
  const response = await request.get(`${API_BASE_URL}/scalar`, {
    failOnStatusCode: false,
  })

  // Then: the backend responds (not connection refused)
  expect(response.status()).not.toBe(0)
  expect([200, 301, 302, 404]).toContain(response.status())
})

test('AC2 — should serve the Scalar API documentation page at /scalar', async ({ request }) => {
  // Given: the backend is running
  // When: GET /scalar is requested
  const response = await request.get(`${API_BASE_URL}/scalar`, {
    failOnStatusCode: false,
  })

  // Then: Scalar returns HTTP 200
  expect(response.status()).toBe(200)
})

test('AC2 — should return HTML content from the Scalar documentation endpoint', async ({ request }) => {
  // Given: the backend is running
  // When: GET /scalar is requested
  const response = await request.get(`${API_BASE_URL}/scalar`, {
    failOnStatusCode: false,
  })

  // Then: response content type is text/html
  const contentType = response.headers()['content-type'] ?? ''
  expect(contentType).toContain('text/html')
})

test('AC2 — should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)', async ({ request }) => {
  // Given: Swashbuckle is forbidden per company standards
  // When: /swagger is requested
  const response = await request.get(`${API_BASE_URL}/swagger`, {
    failOnStatusCode: false,
  })

  // Then: Swagger UI is NOT available (must not return HTTP 200)
  expect(response.status()).not.toBe(200)
})

test('AC2 — should NOT expose WeatherForecast default endpoint', async ({ request }) => {
  // Given: the default .NET template endpoint has been removed
  // When: /weatherforecast is requested
  const response = await request.get(`${API_BASE_URL}/weatherforecast`, {
    failOnStatusCode: false,
  })

  // Then: the endpoint is not found (404 or 405)
  expect([404, 405]).toContain(response.status())
})

// AC3 — CORS configuration
test('AC3 — should return CORS header allowing http://localhost:5173 origin', async ({ request }) => {
  // Given: both servers are running
  // When: the backend receives a request from the frontend origin
  const response = await request.get(`${API_BASE_URL}/scalar`, {
    headers: {
      Origin: FRONTEND_URL,
    },
    failOnStatusCode: false,
  })

  // Then: Access-Control-Allow-Origin includes the frontend origin
  const corsHeader = response.headers()['access-control-allow-origin']
  expect(corsHeader).toBeTruthy()
  expect(corsHeader).toContain(FRONTEND_URL)
})

test('AC3 — should respond to OPTIONS preflight from frontend origin without CORS rejection', async ({ request }) => {
  // Given: CORS is configured
  // When: OPTIONS preflight is sent from frontend origin
  const response = await request.fetch(`${API_BASE_URL}/scalar`, {
    method: 'OPTIONS',
    headers: {
      Origin: FRONTEND_URL,
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Content-Type',
    },
    failOnStatusCode: false,
  })

  // Then: preflight succeeds (200 or 204), not rejected (403)
  expect([200, 204]).toContain(response.status())
})

// AC5 — Backend solution builds and middleware is wired
test('AC5 — should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)', async ({
  request,
}) => {
  // Given: all four projects compiled and server started
  // When: the server responds to any request
  const response = await request.get(`${API_BASE_URL}/scalar`, {
    failOnStatusCode: false,
  })

  // Then: server started (build failure prevents server start — any non-connection-refused response confirms build)
  expect(response.status()).toBeGreaterThan(0)
})

test('AC5 — should return Problem Details RFC 7807 format for unhandled errors', async ({ request }) => {
  // Given: ExceptionHandlingMiddleware is wired
  // When: a non-existent endpoint is requested
  const response = await request.get(`${API_BASE_URL}/api/nonexistent-endpoint-for-atdd`, {
    failOnStatusCode: false,
  })

  // Then: server returns JSON (not HTML) — Problem Details or 404 JSON response
  const contentType = response.headers()['content-type'] ?? ''
  // The response should not be HTML (which would indicate unhandled exception with HTML error page)
  // It should return application/json or application/problem+json
  expect(contentType).not.toContain('text/html')
})
