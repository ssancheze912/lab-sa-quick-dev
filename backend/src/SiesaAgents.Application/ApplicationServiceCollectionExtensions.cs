using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.Application;

/// <summary>
/// Composition root for the Application layer.
/// Registers CQRS handlers into the DI container.
/// </summary>
public static class ApplicationServiceCollectionExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<GetClientesQueryHandler>();
        services.AddScoped<GetClienteByIdQueryHandler>();

        return services;
    }
}
