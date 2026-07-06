using Xunit;

// All integration tests in this assembly exercise the SAME real PostgreSQL database via
// TestWebApplicationFactory/AppDbContext (Story 1.3's shared-instance convention). xUnit
// parallelizes different test classes by default; two classes touching the same table
// concurrently (e.g. one seeding rows another is deleting via a table-wide
// `DELETE FROM clientes`) causes non-deterministic `DbUpdateConcurrencyException` failures
// that have nothing to do with the tests' actual correctness — a shared external resource,
// not in-memory state, so disabling test-class parallelization here is the correct fix
// (matches the standard xUnit guidance for integration suites against a shared database).
[assembly: CollectionBehavior(DisableTestParallelization = true)]
