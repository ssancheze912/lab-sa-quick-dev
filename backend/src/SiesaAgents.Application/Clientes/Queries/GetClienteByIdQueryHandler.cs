using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

public interface IGetClienteByIdQueryHandler
{
    Task<ClienteDto?> HandleAsync(GetClienteByIdQuery query, CancellationToken ct);
}

public sealed class GetClienteByIdQueryHandler : IGetClienteByIdQueryHandler
{
    private readonly IClienteRepository _repository;

    public GetClienteByIdQueryHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

    public async Task<ClienteDto?> HandleAsync(GetClienteByIdQuery query, CancellationToken ct)
    {
        var cliente = await _repository.GetByIdAsync(query.Id, ct);
        if (cliente is null)
            return null;

        return new ClienteDto(
            cliente.Id,
            cliente.Nombre,
            cliente.NIT,
            cliente.Telefono,
            cliente.Ciudad,
            cliente.CreatedAt,
            cliente.UpdatedAt);
    }
}
