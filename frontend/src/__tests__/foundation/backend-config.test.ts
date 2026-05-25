/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Unit Tests — Edge cases for backend configuration (static content inspection)
 * Covers: AC2, AC3, AC5 — backend config that can be validated without dotnet SDK
 *
 * Test level: Unit (node environment — file content inspection)
 * Tool: Vitest
 *
 * NOTE: These tests validate the static content of backend files.
 *       Runtime tests (dotnet run, dotnet build) require .NET 10 SDK
 *       and are covered in e2e/tests/api/backend-initialization.api.spec.ts.
 *
 * Edge cases:
 *   - Program.cs uses Scalar ONLY (no Swashbuckle/Swagger)
 *   - Program.cs registers ExceptionHandlingMiddleware BEFORE UseCors
 *   - Program.cs reads CORS origins from config (not hardcoded)
 *   - ExceptionHandlingMiddleware never exposes exception message in response
 *   - ExceptionHandlingMiddleware returns status 500 and application/problem+json
 *   - appsettings.Development.json has AllowedOrigins with localhost:5173
 *   - Domain Entity uses Guid primary key (not int or string)
 *   - Domain Entity uses DateTimeOffset (architecture mandate, if present)
 *   - SiesaAgents.sln references all four project layers
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const FRONTEND_ROOT = resolve(__dirname, '../../..')
const PROJECT_ROOT = resolve(FRONTEND_ROOT, '..')

const readBackend = (path: string) =>
  readFileSync(resolve(PROJECT_ROOT, path), 'utf-8')

// ─────────────────────────────────────────────────────────────────────────────
// Program.cs — API setup constraints
// ─────────────────────────────────────────────────────────────────────────────

describe('Program.cs — Scalar-only API documentation', () => {
  it('should call MapScalarApiReference() for API documentation', () => {
    // GIVEN: Architecture mandates Scalar ONLY for API docs
    const content = readBackend('backend/src/SiesaAgents.API/Program.cs')
    // THEN: MapScalarApiReference is present
    expect(content).toContain('MapScalarApiReference()')
  })

  it('should NOT use UseSwagger() (Swashbuckle is forbidden)', () => {
    // GIVEN: Architecture explicitly forbids Swashbuckle — ONLY Scalar is allowed
    const content = readBackend('backend/src/SiesaAgents.API/Program.cs')
    // THEN: UseSwagger is NOT present
    expect(content).not.toContain('UseSwagger(')
  })

  it('should NOT use AddSwaggerGen() (Swashbuckle setup is forbidden)', () => {
    // GIVEN: Architecture explicitly forbids Swashbuckle
    const content = readBackend('backend/src/SiesaAgents.API/Program.cs')
    // THEN: AddSwaggerGen is NOT present
    expect(content).not.toContain('AddSwaggerGen(')
  })
})

describe('Program.cs — CORS configuration', () => {
  it('should add a CORS policy named DevCors', () => {
    // GIVEN: The CORS policy name must match between AddCors and UseCors
    const content = readBackend('backend/src/SiesaAgents.API/Program.cs')
    // THEN: DevCors policy name is used
    expect(content).toContain('"DevCors"')
  })

  it('should call UseCors() to apply the CORS policy', () => {
    // GIVEN: CORS must be applied as middleware — AddCors alone is not enough
    const content = readBackend('backend/src/SiesaAgents.API/Program.cs')
    // THEN: UseCors is present
    expect(content).toContain('UseCors(')
  })

  it('should read allowed origins from configuration (not hardcoded)', () => {
    // GIVEN: CORS origins must come from appsettings to support different environments
    const content = readBackend('backend/src/SiesaAgents.API/Program.cs')
    // THEN: AllowedOrigins is read from Configuration
    expect(content).toContain('AllowedOrigins')
    expect(content).toContain('Configuration')
  })

  it('should register ExceptionHandlingMiddleware before UseCors (correct middleware order)', () => {
    // GIVEN: Middleware order matters — exception handler must wrap all other middleware
    const content = readBackend('backend/src/SiesaAgents.API/Program.cs')
    const exceptionIndex = content.indexOf('UseMiddleware<ExceptionHandlingMiddleware>')
    const corsIndex = content.indexOf('UseCors(')
    // THEN: Exception middleware is registered first (appears before UseCors in the file)
    expect(exceptionIndex).toBeGreaterThan(-1)
    expect(corsIndex).toBeGreaterThan(-1)
    expect(exceptionIndex).toBeLessThan(corsIndex)
  })
})

describe('Program.cs — Clean Minimal API constraints', () => {
  it('should NOT contain any WeatherForecast endpoint or mapping', () => {
    // GIVEN: The default .NET template adds WeatherForecast which must be removed
    const content = readBackend('backend/src/SiesaAgents.API/Program.cs')
    // THEN: No WeatherForecast code is present
    expect(content).not.toContain('WeatherForecast')
    expect(content).not.toContain('weatherforecast')
  })

  it('should use WebApplication.CreateBuilder (Minimal API pattern)', () => {
    // GIVEN: This is a Minimal API project — no MVC controllers
    const content = readBackend('backend/src/SiesaAgents.API/Program.cs')
    // THEN: WebApplication.CreateBuilder is used
    expect(content).toContain('WebApplication.CreateBuilder(')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ExceptionHandlingMiddleware.cs — RFC 7807 Problem Details
// ─────────────────────────────────────────────────────────────────────────────

describe('ExceptionHandlingMiddleware.cs — Problem Details RFC 7807', () => {
  it('should return HTTP 500 status code for unhandled exceptions', () => {
    // GIVEN: Unhandled exceptions should never return 200 or other non-error codes
    const content = readBackend(
      'backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs',
    )
    // THEN: StatusCode 500 is explicitly set
    expect(content).toContain('StatusCode = 500')
  })

  it('should set Content-Type to application/problem+json', () => {
    // GIVEN: RFC 7807 Problem Details requires application/problem+json content type
    const content = readBackend(
      'backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs',
    )
    // THEN: Content type is explicitly set to application/problem+json
    expect(content).toContain('application/problem+json')
  })

  it('should set Detail to null (never expose internal exception messages)', () => {
    // GIVEN: Exposing exception messages in responses is a security vulnerability
    // The architecture explicitly requires Detail = null
    const content = readBackend(
      'backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs',
    )
    // THEN: Detail is null (not ex.Message)
    expect(content).toContain('Detail = null')
    expect(content).not.toContain('ex.Message')
  })

  it('should use ProblemDetails response type (RFC 7807 contract)', () => {
    // GIVEN: Problem Details is the standard error format per architecture
    const content = readBackend(
      'backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs',
    )
    // THEN: ProblemDetails class is used for the response body
    expect(content).toContain('ProblemDetails')
  })

  it('should call await next(context) inside a try block', () => {
    // GIVEN: The middleware must forward the request and only catch exceptions
    const content = readBackend(
      'backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs',
    )
    // THEN: next(context) is called within a try/catch
    expect(content).toContain('await next(context)')
    expect(content).toContain('try')
    expect(content).toContain('catch')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// appsettings.Development.json — configuration values
// ─────────────────────────────────────────────────────────────────────────────

describe('appsettings.Development.json — development configuration', () => {
  it('should have AllowedOrigins array with http://localhost:5173', () => {
    // GIVEN: CORS policy reads origins from configuration
    const content = readBackend('backend/src/SiesaAgents.API/appsettings.Development.json')
    // THEN: The frontend development origin is configured
    expect(content).toContain('AllowedOrigins')
    expect(content).toContain('http://localhost:5173')
  })

  it('should have ConnectionStrings:DefaultConnection for PostgreSQL', () => {
    // GIVEN: Infrastructure layer requires a PostgreSQL connection string
    const content = readBackend('backend/src/SiesaAgents.API/appsettings.Development.json')
    // THEN: A connection string pointing to PostgreSQL is present
    expect(content).toContain('ConnectionStrings')
    expect(content).toContain('DefaultConnection')
    // Should reference the dev database
    expect(content).toContain('siesa_agents_db')
  })

  it('should be valid JSON (parseable without errors)', () => {
    // GIVEN: Invalid JSON in appsettings causes silent startup failures
    const content = readBackend('backend/src/SiesaAgents.API/appsettings.Development.json')
    // THEN: The file parses as valid JSON
    expect(() => JSON.parse(content)).not.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Domain Entity.cs — architecture constraints
// ─────────────────────────────────────────────────────────────────────────────

describe('SiesaAgents.Domain/Entities/Entity.cs — base entity constraints', () => {
  it('should use Guid for the Id primary key (not int or string)', () => {
    // GIVEN: Architecture mandates Guid (UUID) for all entity primary keys
    const content = readBackend('backend/src/SiesaAgents.Domain/Entities/Entity.cs')
    // THEN: Guid type is used for Id
    expect(content).toContain('Guid Id')
    expect(content).not.toMatch(/int\s+Id/)
    expect(content).not.toMatch(/string\s+Id/)
  })

  it('should initialize Id with Guid.NewGuid() by default', () => {
    // GIVEN: Architecture requires default value = Guid.NewGuid() for safety
    const content = readBackend('backend/src/SiesaAgents.Domain/Entities/Entity.cs')
    // THEN: Default value is set
    expect(content).toContain('Guid.NewGuid()')
  })

  it('should be declared as abstract (not instantiatable directly)', () => {
    // GIVEN: Entity is a base class — concrete domain objects extend it
    const content = readBackend('backend/src/SiesaAgents.Domain/Entities/Entity.cs')
    // THEN: The class is abstract
    expect(content).toContain('public abstract class Entity')
  })

  it('should be in the SiesaAgents.Domain.Entities namespace', () => {
    // GIVEN: Namespace must match the Clean Architecture project structure
    const content = readBackend('backend/src/SiesaAgents.Domain/Entities/Entity.cs')
    // THEN: Correct namespace is declared
    expect(content).toContain('namespace SiesaAgents.Domain.Entities')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SiesaAgents.sln — solution file references all five projects
// ─────────────────────────────────────────────────────────────────────────────

describe('SiesaAgents.sln — solution project references', () => {
  const projectNames = [
    'SiesaAgents.API',
    'SiesaAgents.Application',
    'SiesaAgents.Domain',
    'SiesaAgents.Infrastructure',
    'SiesaAgents.UnitTests',
  ]

  projectNames.forEach((project) => {
    it(`should reference ${project} in SiesaAgents.sln`, () => {
      // GIVEN: AC2 requires all four Clean Architecture projects in the solution
      const content = readBackend('backend/SiesaAgents.sln')
      // THEN: The project name appears in the solution file
      expect(content).toContain(project)
    })
  })
})
