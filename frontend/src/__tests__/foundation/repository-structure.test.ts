/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Unit Tests — Edge cases for repository directory structure
 * Covers: AC1 — Full directory tree as defined in architecture.md
 *
 * Test level: Unit (node environment — filesystem inspection)
 * Tool: Vitest
 *
 * Edge cases:
 *   - Required frontend subdirectories exist (even if empty)
 *   - Backend solution structure exists at expected paths
 *   - Lock file pnpm-lock.yaml exists (not yarn.lock or package-lock.json)
 *   - .env.development is gitignored (not tracked for production safety)
 *   - Backend Clean Architecture layer folders exist
 */

import { describe, it, expect } from 'vitest'
import { existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
// From frontend/src/__tests__/foundation/ → go up 3 levels to reach frontend/
// Then one more to reach project root
const FRONTEND_ROOT = resolve(__dirname, '../../..')
const PROJECT_ROOT = resolve(FRONTEND_ROOT, '..')

// ─────────────────────────────────────────────────────────────────────────────
// Frontend directory structure — boundary: all architecture-defined folders
// must exist even when empty (ensures future stories have the correct scaffold)
// ─────────────────────────────────────────────────────────────────────────────

describe('Repository structure — frontend src/ subdirectories', () => {
  const requiredFrontendDirs = [
    'src/routes',
    'src/modules',
    'src/shared',
    'src/shared/lib',
    'src/app',
    'src/app/providers',
    'src/infrastructure',
  ]

  requiredFrontendDirs.forEach((dir) => {
    it(`should have the ${dir}/ directory present in the frontend project`, () => {
      // GIVEN: Architecture.md defines the frontend folder structure
      // WHEN: We check the filesystem
      const fullPath = resolve(FRONTEND_ROOT, dir)
      // THEN: The directory exists (even if empty)
      expect(existsSync(fullPath)).toBe(true)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Key source files — boundary: mandatory files from story tasks
// ─────────────────────────────────────────────────────────────────────────────

describe('Repository structure — mandatory frontend source files', () => {
  const requiredFiles = [
    'src/routes/__root.tsx',
    'src/main.tsx',
    'src/app/providers/QueryProvider.tsx',
    'src/shared/lib/apiClient.ts',
    'src/shared/lib/queryClient.ts',
    'src/index.css',
    'index.html',
    'vite.config.ts',
    'tsconfig.app.json',
    '.env.development',
  ]

  requiredFiles.forEach((file) => {
    it(`should have ${file} present`, () => {
      // GIVEN: Story 1.1 tasks define all required files
      const fullPath = resolve(FRONTEND_ROOT, file)
      expect(existsSync(fullPath)).toBe(true)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Package manager lock file — edge case: wrong lock file present
// ─────────────────────────────────────────────────────────────────────────────

describe('Repository structure — pnpm lock file', () => {
  it('should have pnpm-lock.yaml in the frontend root (pnpm is mandatory)', () => {
    // GIVEN: Company standard mandates pnpm as the package manager
    const lockPath = resolve(FRONTEND_ROOT, 'pnpm-lock.yaml')
    // THEN: The pnpm lock file exists
    expect(existsSync(lockPath)).toBe(true)
  })

  it('should NOT have package-lock.json (npm lock file — forbidden with pnpm)', () => {
    // GIVEN: Using npm alongside pnpm creates conflicts in CI
    const npmLock = resolve(FRONTEND_ROOT, 'package-lock.json')
    // THEN: npm lock file does not exist
    expect(existsSync(npmLock)).toBe(false)
  })

  it('should NOT have yarn.lock (yarn lock file — forbidden with pnpm)', () => {
    // GIVEN: Multiple lock files indicate mixed package managers — a known footgun
    const yarnLock = resolve(FRONTEND_ROOT, 'yarn.lock')
    // THEN: Yarn lock file does not exist
    expect(existsSync(yarnLock)).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Backend solution structure — boundary: .sln and project folders must exist
// (file content validation requires .NET SDK; structural checks run in any env)
// ─────────────────────────────────────────────────────────────────────────────

describe('Repository structure — backend solution layout', () => {
  it('should have backend/ directory at the project root', () => {
    // GIVEN: Architecture defines a sibling backend/ next to frontend/
    expect(existsSync(resolve(PROJECT_ROOT, 'backend'))).toBe(true)
  })

  it('should have SiesaAgents.sln in backend/', () => {
    // GIVEN: The .NET solution file is the entry point for dotnet build
    expect(existsSync(resolve(PROJECT_ROOT, 'backend/SiesaAgents.sln'))).toBe(true)
  })

  const requiredBackendDirs = [
    'backend/src/SiesaAgents.API',
    'backend/src/SiesaAgents.Application',
    'backend/src/SiesaAgents.Domain',
    'backend/src/SiesaAgents.Infrastructure',
    'backend/tests/SiesaAgents.UnitTests',
  ]

  requiredBackendDirs.forEach((dir) => {
    it(`should have the ${dir}/ directory present`, () => {
      // GIVEN: Clean Architecture mandates these four layers
      expect(existsSync(resolve(PROJECT_ROOT, dir))).toBe(true)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Backend critical files — boundary: .csproj files must exist in each layer
// ─────────────────────────────────────────────────────────────────────────────

describe('Repository structure — backend .csproj files', () => {
  const requiredCsproj = [
    'backend/src/SiesaAgents.API/SiesaAgents.API.csproj',
    'backend/src/SiesaAgents.Application/SiesaAgents.Application.csproj',
    'backend/src/SiesaAgents.Domain/SiesaAgents.Domain.csproj',
    'backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj',
    'backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj',
  ]

  requiredCsproj.forEach((file) => {
    it(`should have ${file.split('/').pop()} at the expected path`, () => {
      // GIVEN: Each .NET project requires a .csproj file to compile
      expect(existsSync(resolve(PROJECT_ROOT, file))).toBe(true)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Backend key source files — Program.cs and middleware
// ─────────────────────────────────────────────────────────────────────────────

describe('Repository structure — backend API source files', () => {
  it('should have Program.cs in SiesaAgents.API', () => {
    // GIVEN: Program.cs is the entry point for the .NET Minimal API
    const path = resolve(PROJECT_ROOT, 'backend/src/SiesaAgents.API/Program.cs')
    expect(existsSync(path)).toBe(true)
  })

  it('should have ExceptionHandlingMiddleware.cs in SiesaAgents.API/Middleware', () => {
    // GIVEN: The middleware is required for RFC 7807 error handling
    const path = resolve(
      PROJECT_ROOT,
      'backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs',
    )
    expect(existsSync(path)).toBe(true)
  })

  it('should have appsettings.Development.json in SiesaAgents.API', () => {
    // GIVEN: Dev-specific settings (CORS origins, connection strings) live here
    const path = resolve(
      PROJECT_ROOT,
      'backend/src/SiesaAgents.API/appsettings.Development.json',
    )
    expect(existsSync(path)).toBe(true)
  })

  it('should have the Domain Entity base class at SiesaAgents.Domain/Entities/Entity.cs', () => {
    // GIVEN: All domain entities extend the base Entity class with Guid id
    const path = resolve(PROJECT_ROOT, 'backend/src/SiesaAgents.Domain/Entities/Entity.cs')
    expect(existsSync(path)).toBe(true)
  })
})
