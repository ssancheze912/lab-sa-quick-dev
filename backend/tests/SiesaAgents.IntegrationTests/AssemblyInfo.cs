using Xunit;

// Disable parallelism across the whole assembly. The database integration tests
// drop and recreate the shared `siesa_agents_db_test` database in their per-instance
// InitializeAsync — running them in parallel triggers "terminating connection due
// to administrator command" errors as pooled Npgsql connections get killed mid-flight
// by the FORCE drop. Serial execution avoids that class of flake.
[assembly: CollectionBehavior(DisableTestParallelization = true, MaxParallelThreads = 1)]
