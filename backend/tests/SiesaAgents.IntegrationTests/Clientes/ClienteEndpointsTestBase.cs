using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests.Clientes;

/// <summary>
/// Shared fixture/helpers for the Cliente endpoints integration test suite, extracted from
/// <see cref="ClienteEndpointsTests"/> and <see cref="ClienteEndpointsEdgeCasesTests"/> — Story
/// 2.4 Task 3, paying down the test-infrastructure debt flagged as a Medium finding in Story
/// 2.3's code review (both files independently duplicated <c>UniqueNit()</c>,
/// <c>SeedClientesAsync</c>, <c>DeleteClientesAsync</c>, <c>DeleteClienteByNitAsync</c>,
/// <c>ClearClientesTableAsync</c>, <c>GetClientesAsync</c> and the <c>ClienteApiResponse</c>
/// record). Pure refactor: no assertion/behavior changes.
/// </summary>
public abstract class ClienteEndpointsTestBase : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    protected HttpClient Client { get; }

    protected ClienteEndpointsTestBase(TestWebApplicationFactory factory)
    {
        _factory = factory;
        Client = factory.CreateClient();
    }

    protected static string UniqueNit() =>
        $"9{DateTimeOffset.UtcNow.Ticks % 100_000_000:D8}";

    protected async Task SeedClientesAsync(params ClienteEntity[] clientes)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        dbContext.Clientes.AddRange(clientes);
        await dbContext.SaveChangesAsync();
    }

    protected async Task DeleteClientesAsync(params Guid[] ids)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var toRemove = await dbContext.Clientes.Where(c => ids.Contains(c.Id)).ToListAsync();
        dbContext.Clientes.RemoveRange(toRemove);
        await dbContext.SaveChangesAsync();
    }

    protected async Task DeleteClienteByNitAsync(string nit)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var toRemove = await dbContext.Clientes.Where(c => c.Nit == nit).ToListAsync();
        dbContext.Clientes.RemoveRange(toRemove);
        await dbContext.SaveChangesAsync();
    }

    protected async Task ClearClientesTableAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.ExecuteSqlRawAsync("DELETE FROM clientes");
    }

    protected async Task<List<ClienteApiResponse>> GetClientesAsync()
    {
        var response = await Client.GetAsync("/api/v1/clientes");
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<List<ClienteApiResponse>>(
                   json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
               ?? [];
    }

    protected sealed record ClienteApiResponse(
        Guid Id,
        string Nombre,
        string Nit,
        string Telefono,
        string Ciudad,
        DateTimeOffset CreatedAt);
}
