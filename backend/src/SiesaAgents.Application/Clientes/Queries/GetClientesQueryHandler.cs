using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

/// <summary>
/// Handler for <see cref="GetClientesQuery"/>. Direct DI per architecture
/// decisions — no MediatR. Returns a projection (camelCase on the wire).
/// </summary>
public class GetClientesQueryHandler
{
    private readonly IClienteRepository _repository;

    public GetClientesQueryHandler(IClienteRepository repository)
        => _repository = repository;

    public async Task<IReadOnlyList<ClienteDto>> Handle(GetClientesQuery query, CancellationToken ct)
    {
        var clientes = await _repository.GetAllAsync(ct);

        return clientes.Select(c => new ClienteDto
        {
            Id = c.Id,
            Nombre = c.Nombre,
            Nit = c.Nit,
            Telefono = c.Telefono,
            Ciudad = c.Ciudad,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt,
        }).ToList();
    }
}
