using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Story 1.3 — expanded coverage for DI wiring edge cases.
///
/// These tests do NOT touch a real PostgreSQL instance: they exercise the DI graph and the
/// options composition path in <c>Program.cs</c> via <see cref="WebApplicationFactory{TEntryPoint}"/>.
///
/// AC coverage (expanded beyond the ATDD suite):
///   - AC #5 — <see cref="AppDbContext"/> is registered with scoped lifetime (per-request isolation).
///   - AC #5 — Two independent scopes yield distinct DbContext instances.
///   - AC #5 — <c>AddDbContext</c> options include <c>UseSnakeCaseNamingConvention()</c>
///             (verified via the presence of the NamingConvention options extension).
///   - AC #5 — <c>AddDbContext</c> options wire the exact <c>MigrationsHistoryTable</c> constant.
///   - AC #5 — Missing <c>ConnectionStrings:DefaultConnection</c> is rejected at startup.
/// </summary>
public class AppDbContextDependencyInjectionEdgeCases : IClassFixture<TestExceptionAppFactory>
{
    private readonly TestExceptionAppFactory _factory;

    public AppDbContextDependencyInjectionEdgeCases(TestExceptionAppFactory factory)
    {
        _factory = factory;
    }

    [Fact(DisplayName = "[P1] AC#5 — AppDbContext is registered as Scoped (per-scope isolation)")]
    public void AppDbContext_HasScopedLifetime()
    {
        // GIVEN the composed application host
        //
        // AddDbContext<T>() registers the DbContext with ServiceLifetime.Scoped by default.
        // We verify this behaviourally: two independent DI scopes must yield DISTINCT instances
        // (rules out Singleton), while two resolutions inside the SAME scope must yield the SAME
        // instance (rules out Transient — covered by the sibling test).

        using var scope1 = _factory.Services.CreateScope();
        using var scope2 = _factory.Services.CreateScope();

        var ctx1 = scope1.ServiceProvider.GetRequiredService<AppDbContext>();
        var ctx2 = scope2.ServiceProvider.GetRequiredService<AppDbContext>();

        // THEN two scopes must yield distinct AppDbContext instances (i.e. Scoped, not Singleton)
        Assert.NotSame(ctx1, ctx2);

        // AND the container also reports AppDbContext as a known service
        var isService = _factory.Services.GetRequiredService<IServiceProviderIsService>();
        Assert.True(isService.IsService(typeof(AppDbContext)),
            "AppDbContext must be registered in the DI container.");
    }

    [Fact(DisplayName = "[P1] AC#5 — Resolving AppDbContext twice within a single scope returns the SAME instance")]
    public void AppDbContext_SameScope_ReturnsSameInstance()
    {
        // GIVEN a single DI scope (e.g. one HTTP request)
        using var scope = _factory.Services.CreateScope();

        // WHEN AppDbContext is resolved twice
        var ctx1 = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var ctx2 = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // THEN the same instance is returned (Scoped semantics confirmed)
        Assert.Same(ctx1, ctx2);
    }

    [Fact(DisplayName = "[P1] AC#5 — DbContext options include UseSnakeCaseNamingConvention extension")]
    public void AppDbContext_Options_HaveNamingConventionExtension()
    {
        using var scope = _factory.Services.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var extensions = ctx.GetService<IDbContextOptions>().Extensions.ToList();

        // The naming-convention package registers an internal options extension whose type name
        // contains "NamingConvention". Presence of that extension is proof AddDbContext wired it.
        Assert.Contains(extensions,
            e => (e.GetType().FullName ?? string.Empty)
                .Contains("NamingConvention", StringComparison.OrdinalIgnoreCase));
    }

    [Fact(DisplayName = "[P2] AC#5 — DbContext options set MigrationsHistoryTable to the snake_case name")]
    public void AppDbContext_Options_HaveSnakeCaseMigrationsHistoryTable()
    {
        using var scope = _factory.Services.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var relational = ctx.GetService<IDbContextOptions>()
            .Extensions
            .OfType<RelationalOptionsExtension>()
            .FirstOrDefault();

        Assert.NotNull(relational);
        Assert.Equal(AppDbContext.MigrationsHistoryTableName, relational!.MigrationsHistoryTableName);
    }

    [Fact(DisplayName = "[P2] AC#5 — AppDbContext.Database provider is 'Npgsql.EntityFrameworkCore.PostgreSQL'")]
    public void AppDbContext_UsesExactNpgsqlProviderAssembly()
    {
        using var scope = _factory.Services.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // The provider name is stable across EF versions; the value guards against silent provider swaps.
        Assert.Equal("Npgsql.EntityFrameworkCore.PostgreSQL", ctx.Database.ProviderName);
    }
}

/// <summary>
/// Boundary test: verifies Program.cs FAILS FAST if ConnectionStrings:DefaultConnection is missing.
///
/// This uses a bespoke factory that scrubs the connection-string configuration BEFORE the host
/// is built, so the null-coalescing throw in Program.cs is exercised at composition time.
/// </summary>
public class AppDbContextStartupNegativeTests
{
    [Fact(DisplayName = "[P1] AC#5 — Missing ConnectionStrings:DefaultConnection throws InvalidOperationException at startup")]
    public void MissingConnectionString_ThrowsInvalidOperationException_AtStartup()
    {
        // GIVEN a WebApplicationFactory that clears the DefaultConnection setting BEFORE the host is built
        using var factory = new MissingConnectionStringFactory();

        // WHEN the host is composed (Services access forces the builder to run)
        var ex = Record.Exception(() =>
        {
            _ = factory.Services;
        });

        // THEN the expected startup failure occurs with the documented message
        Assert.NotNull(ex);

        // The exception may be wrapped by the host — flatten and search all messages.
        var messages = FlattenMessages(ex!);
        Assert.Contains(messages,
            m => m.Contains("ConnectionStrings:DefaultConnection", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(messages,
            m => m.Contains("not configured", StringComparison.OrdinalIgnoreCase));
    }

    private static IEnumerable<string> FlattenMessages(Exception ex)
    {
        for (Exception? cur = ex; cur is not null; cur = cur.InnerException)
        {
            yield return cur.Message;
        }
    }

    private sealed class MissingConnectionStringFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            // Point at a non-existent environment so appsettings.Development.json is not loaded,
            // and provide no ConnectionStrings:DefaultConnection value. The default appsettings.json
            // (which does NOT define a DefaultConnection) is still loaded from base config, so
            // Program.cs's builder.Configuration.GetConnectionString("DefaultConnection") returns null
            // and the null-coalescing throw fires.
            builder.UseEnvironment("MissingConnStringTest");
        }
    }
}
