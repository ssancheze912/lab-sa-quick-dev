/**
 * API Integration Edge-Case Tests — DELETE /api/v1/clientes/{id}
 * Story 2.5 — Delete Client (Automation Expansion — BMad-Integrated)
 *
 * Covers edge cases NOT in ATDD integration tests:
 *   - Deleting two clients: each 204, no cross-contamination
 *   - Seeding multiple clients and verifying only the targeted one is deleted
 *   - DELETE with an invalid (non-Guid) route param — 400 or 404 (route constraint)
 *
 * Stack: xUnit 2 + WebApplicationFactory<Program> + EF Core InMemory
 * Given-When-Then format per test method.
 */

using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests.Clientes;

/// <summary>
/// Isolated WebApplicationFactory for Story 2.5 edge-case delete tests.
/// Each test class instance gets a unique in-memory database name.
/// </summary>
public sealed class DeleteClienteEdgeWebApplicationFactory : WebApplicationFactory<Program>
{
    public string DatabaseName { get; init; } = $"DeleteClienteEdgeTestDb_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            var dbContextOptionsConfigType = typeof(Microsoft.EntityFrameworkCore.Infrastructure.IDbContextOptionsConfiguration<AppDbContext>);
            var toRemove = services
                .Where(d =>
                    d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                    d.ServiceType == typeof(AppDbContext) ||
                    dbContextOptionsConfigType.IsAssignableFrom(d.ServiceType))
                .ToList();

            foreach (var d in toRemove)
                services.Remove(d);

            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(DatabaseName));
        });
    }
}

/// <summary>
/// Edge-case integration tests for DELETE /api/v1/clientes/{id} endpoint.
/// Expands coverage beyond ATDD with boundary and error-path scenarios.
/// </summary>
public sealed class DeleteClienteEndpointEdgeTests
{
    // -------------------------------------------------------------------------
    // Helper: seed a ClienteEntity directly into the in-memory DB
    // -------------------------------------------------------------------------

    private static async Task<Guid> SeedClienteAsync(
        DeleteClienteEdgeWebApplicationFactory factory,
        string nombre = "Empresa Edge Delete",
        string nit = "900003003-3",
        string telefono = "3003003003",
        string ciudad = "Cali")
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var entity = ClienteEntity.Create(nombre, nit, telefono, ciudad);
        db.Clientes.Add(entity);
        await db.SaveChangesAsync();

        return entity.Id;
    }

    // -------------------------------------------------------------------------
    // Edge: Delete two clients sequentially — no cross-contamination
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given two clients seeded in the database,
    /// When DELETE is called for each independently,
    /// Then each returns 204 and a follow-up GET for each returns 404.
    /// Verifies isolation — deleting one does not affect the other's deletion behavior.
    /// </summary>
    [Fact]
    public async Task DeleteTwoClients_EachReturns204_NoContamination()
    {
        // GIVEN: Two clients seeded in the same database
        using var factory = new DeleteClienteEdgeWebApplicationFactory();
        var clienteAId = await SeedClienteAsync(factory, nombre: "Empresa Alpha", nit: "900001111-1");
        var clienteBId = await SeedClienteAsync(factory, nombre: "Empresa Beta", nit: "900002222-2");
        var httpClient = factory.CreateClient();

        // WHEN: DELETE is called for client A
        var deleteA = await httpClient.DeleteAsync($"/api/v1/clientes/{clienteAId}");

        // THEN: Returns 204 No Content for A
        Assert.Equal(HttpStatusCode.NoContent, deleteA.StatusCode);

        // WHEN: DELETE is called for client B
        var deleteB = await httpClient.DeleteAsync($"/api/v1/clientes/{clienteBId}");

        // THEN: Returns 204 No Content for B (not affected by A's deletion)
        Assert.Equal(HttpStatusCode.NoContent, deleteB.StatusCode);

        // AND: Follow-up GET for both returns 404 (both are gone)
        var getA = await httpClient.GetAsync($"/api/v1/clientes/{clienteAId}");
        Assert.Equal(HttpStatusCode.NotFound, getA.StatusCode);

        var getB = await httpClient.GetAsync($"/api/v1/clientes/{clienteBId}");
        Assert.Equal(HttpStatusCode.NotFound, getB.StatusCode);
    }

    // -------------------------------------------------------------------------
    // Edge: Delete one of multiple clients — others remain intact
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given three clients seeded in the database,
    /// When DELETE is called for only the middle one,
    /// Then only the targeted client is removed; the other two remain in the list.
    /// </summary>
    [Fact]
    public async Task DeleteOneOfMultipleClients_OthersRemainInList()
    {
        // GIVEN: Three clients seeded
        using var factory = new DeleteClienteEdgeWebApplicationFactory();
        var idToDelete = await SeedClienteAsync(factory, nombre: "Empresa Eliminar", nit: "900005555-5");
        var idToKeepA = await SeedClienteAsync(factory, nombre: "Empresa Mantener A", nit: "900006666-6");
        var idToKeepB = await SeedClienteAsync(factory, nombre: "Empresa Mantener B", nit: "900007777-7");
        var httpClient = factory.CreateClient();

        // Verify all three are in the list before deletion
        var listBefore = await httpClient.GetAsync("/api/v1/clientes");
        Assert.Equal(HttpStatusCode.OK, listBefore.StatusCode);
        var listBeforeJson = await listBefore.Content.ReadAsStringAsync();
        Assert.Contains(idToDelete.ToString(), listBeforeJson);
        Assert.Contains(idToKeepA.ToString(), listBeforeJson);
        Assert.Contains(idToKeepB.ToString(), listBeforeJson);

        // WHEN: Only the targeted client is deleted
        var deleteResponse = await httpClient.DeleteAsync($"/api/v1/clientes/{idToDelete}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // THEN: The deleted client is gone from the list
        var listAfter = await httpClient.GetAsync("/api/v1/clientes");
        Assert.Equal(HttpStatusCode.OK, listAfter.StatusCode);
        var listAfterJson = await listAfter.Content.ReadAsStringAsync();

        Assert.DoesNotContain(idToDelete.ToString(), listAfterJson);

        // AND: The other two clients are still present
        Assert.Contains(idToKeepA.ToString(), listAfterJson);
        Assert.Contains(idToKeepB.ToString(), listAfterJson);
    }

    // -------------------------------------------------------------------------
    // Edge: DELETE with invalid (non-Guid) route param — route constraint rejects it
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given an invalid route parameter (not a valid Guid),
    /// When DELETE /api/v1/clientes/{invalidId} is called,
    /// Then the framework returns 400 Bad Request or 404 Not Found
    /// (route constraint on {id:guid} rejects the request before the handler fires).
    /// No 500 Internal Server Error should be returned — this verifies the route
    /// constraint prevents handler execution with an unparseable id.
    /// </summary>
    [Fact]
    public async Task DeleteWithInvalidGuidRouteParam_RejectsRequest_NoServerError()
    {
        // GIVEN: An invalid Guid string that does not match the {id:guid} route constraint
        using var factory = new DeleteClienteEdgeWebApplicationFactory();
        var httpClient = factory.CreateClient();
        var invalidId = "not-a-valid-guid";

        // WHEN: DELETE /api/v1/clientes/{invalidId} is called
        var response = await httpClient.DeleteAsync($"/api/v1/clientes/{invalidId}");

        // THEN: Response is NOT 500 Internal Server Error
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);

        // AND: Response is either 400 Bad Request or 404 Not Found
        // (ASP.NET Core minimal API with {id:guid} constraint returns 404 when constraint fails)
        var is400Or404 =
            response.StatusCode == HttpStatusCode.BadRequest ||
            response.StatusCode == HttpStatusCode.NotFound;

        Assert.True(is400Or404,
            $"Expected 400 or 404 for invalid Guid route param but got {(int)response.StatusCode} {response.StatusCode}");
    }
}
